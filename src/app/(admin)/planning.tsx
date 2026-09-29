import DateTimePicker from "@react-native-community/datetimepicker";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

import { db } from "../../firebase/config";

// ======================================================
// TYPES
// ======================================================

type Order = {
  id: string;
  customerName: string;
  product: string;
  quantity: number;
  deadline: string;
  status: string;
};

type User = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "operator" | "supervisor";
};

type Planning = {
  id: string;
  orderId: string;
  machine: string;
  operatorId: string;
  operatorName: string;
  scheduledDate: string;
  status: "planned" | "running" | "completed" | "cancelled";
};

// ======================================================
// CONSTANTS
// ======================================================

const MACHINES = [
  "Printer A",
  "Printer B",
  "Printer C",
  "Cutting A",
  "Finishing A",
];

const STATUS_OPTIONS: {
  value: Planning["status"];
  label: string;
  color: string;
  bg: string;
}[] = [
  {
    value: "planned",
    label: "Direncanakan",
    color: "#6366f1",
    bg: "#eef2ff",
  },
  {
    value: "running",
    label: "Sedang Berjalan",
    color: "#0284c7",
    bg: "#e0f2fe",
  },
  {
    value: "completed",
    label: "Selesai",
    color: "#16a34a",
    bg: "#dcfce7",
  },
  {
    value: "cancelled",
    label: "Dibatalkan",
    color: "#dc2626",
    bg: "#fee2e2",
  },
];

// ======================================================
// MAIN PAGE
// ======================================================

export default function PlanningPage() {
  const [planning, setPlanning] = useState<Planning[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [operators, setOperators] = useState<User[]>([]);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // ======================================================
  // FORM STATES
  // ======================================================

  const [orderId, setOrderId] = useState("");
  const [machine, setMachine] = useState("");
  const [operatorId, setOperatorId] = useState("");
  const [scheduledDate, setScheduledDate] = useState<Date>(new Date());
  const [status, setStatus] =
    useState<Planning["status"]>("planned");

  // ======================================================
  // PICKER STATES
  // ======================================================

  const [showDatePicker, setShowDatePicker] = useState(false);

  const [activePicker, setActivePicker] = useState<
    "order" | "machine" | "operator" | "status" | null
  >(null);

  // ======================================================
  // FIRESTORE LISTENERS
  // ======================================================

  useEffect(() => {
    const unsubPlanning = onSnapshot(
      collection(db, "planning"),
      (snapshot) => {
        setPlanning(
          snapshot.docs.map((item) => ({
            id: item.id,
            ...(item.data() as Omit<Planning, "id">),
          }))
        );
      }
    );

    const unsubOrders = onSnapshot(
      collection(db, "orders"),
      (snapshot) => {
        setOrders(
          snapshot.docs.map((item) => ({
            id: item.id,
            ...(item.data() as Omit<Order, "id">),
          }))
        );
      }
    );

    const unsubOperators = onSnapshot(
      collection(db, "users"),
      (snapshot) => {
        const filtered = snapshot.docs
          .map((item) => ({
            id: item.id,
            ...(item.data() as Omit<User, "id">),
          }))
          .filter((user) => user.role === "operator");

        setOperators(filtered);
      }
    );

    return () => {
      unsubPlanning();
      unsubOrders();
      unsubOperators();
    };
  }, []);

  // ======================================================
  // SELECTED DATA
  // ======================================================

  const selectedOrder = useMemo(
    () => orders.find((item) => item.id === orderId),
    [orders, orderId]
  );

  const selectedOperator = useMemo(
    () => operators.find((item) => item.id === operatorId),
    [operators, operatorId]
  );

  // ======================================================
  // AVAILABLE ORDERS
  // ======================================================
  //
  // Order yang sudah mempunyai planning tidak ditampilkan
  // ketika membuat planning baru.
  //
  // Tetapi ketika EDIT, order yang sedang diedit tetap
  // ditampilkan agar tidak kehilangan order tersebut.
  //

  const availableOrders = useMemo(() => {
    return orders.filter((order) => {
      // Jika sedang edit, order yang digunakan
      // oleh planning yang sedang diedit tetap boleh dipilih.
      if (editingId) {
        const currentPlanning = planning.find(
          (item) => item.id === editingId
        );

        if (currentPlanning?.orderId === order.id) {
          return true;
        }
      }

      // Cek apakah order sudah memiliki planning.
      const alreadyPlanned = planning.some(
        (item) => item.orderId === order.id
      );

      // Jika sudah ada planning, jangan tampilkan.
      return !alreadyPlanned;
    });
  }, [orders, planning, editingId]);

  // ======================================================
  // HELPERS
  // ======================================================

  const formatDate = (date: Date) => {
    return date.toISOString().split("T")[0];
  };

  const getStatusConfig = (value: string) => {
    return (
      STATUS_OPTIONS.find((item) => item.value === value) ?? {
        label: value,
        color: "#4b5563",
        bg: "#f3f4f6",
      }
    );
  };

  // ======================================================
  // RESET FORM
  // ======================================================

  const resetForm = () => {
    setEditingId(null);
    setOrderId("");
    setMachine("");
    setOperatorId("");
    setScheduledDate(new Date());
    setStatus("planned");
    setActivePicker(null);
    setShowDatePicker(false);
  };

  // ======================================================
  // SAVE PLANNING
  // ======================================================

  const savePlanning = async () => {
    if (!orderId) {
      Alert.alert(
        "Validasi",
        "Silakan pilih order."
      );
      return;
    }

    if (!machine) {
      Alert.alert(
        "Validasi",
        "Silakan pilih mesin."
      );
      return;
    }

    if (!operatorId) {
      Alert.alert(
        "Validasi",
        "Silakan pilih operator."
      );
      return;
    }

    try {
      // ==================================================
      // CEGAH DUPLIKASI ORDER
      // ==================================================

      if (!editingId) {
        const alreadyExists = planning.some(
          (item) => item.orderId === orderId
        );

        if (alreadyExists) {
          Alert.alert(
            "Planning Sudah Ada",
            "Order ini sudah memiliki planning dan tidak dapat ditambahkan lagi."
          );

          return;
        }
      }

      // ==================================================
      // DATA PLANNING
      // ==================================================

      const data = {
        orderId,
        machine,
        operatorId,
        operatorName: selectedOperator?.name ?? "",
        scheduledDate: formatDate(scheduledDate),
        status,
        updatedAt: serverTimestamp(),
      };

      // ==================================================
      // EDIT
      // ==================================================

      if (editingId) {
        await updateDoc(
          doc(db, "planning", editingId),
          data
        );
      }

      // ==================================================
      // CREATE
      // ==================================================

      else {
        await addDoc(
          collection(db, "planning"),
          {
            ...data,
            createdAt: serverTimestamp(),
          }
        );
      }

      // ==================================================
      // RESET
      // ==================================================

      resetForm();
      setModalVisible(false);

    } catch (error) {
      console.error(
        "Save planning error:",
        error
      );

      Alert.alert(
        "Error",
        "Gagal menyimpan data planning."
      );
    }
  };

  // ======================================================
  // EDIT PLANNING
  // ======================================================

  const editPlanning = (item: Planning) => {
    setEditingId(item.id);

    setOrderId(item.orderId);
    setMachine(item.machine);
    setOperatorId(item.operatorId);

    setScheduledDate(
      item.scheduledDate
        ? new Date(item.scheduledDate)
        : new Date()
    );

    setStatus(item.status);

    setActivePicker(null);
    setModalVisible(true);
  };

  // ======================================================
  // DELETE PLANNING
  // ======================================================

  const deletePlanning = (id: string) => {
    const remove = async () => {
      try {
        await deleteDoc(
          doc(db, "planning", id)
        );
      } catch (error) {
        console.error(
          "Delete planning error:",
          error
        );

        Alert.alert(
          "Error",
          "Gagal menghapus planning."
        );
      }
    };

    if (Platform.OS === "web") {
      if (
        window.confirm(
          "Hapus planning ini?"
        )
      ) {
        remove();
      }
    } else {
      Alert.alert(
        "Hapus Planning",
        "Apakah Anda yakin ingin menghapus jadwal produksi ini?",
        [
          {
            text: "Batal",
            style: "cancel",
          },
          {
            text: "Hapus",
            style: "destructive",
            onPress: remove,
          },
        ]
      );
    }
  };

  // ======================================================
  // RENDER
  // ======================================================

  return (
    <SafeAreaView style={styles.container}>

      {/* ==================================================
          HEADER
      ================================================== */}

      <View style={styles.header}>

        <View>
          <Text style={styles.title}>
            Planning Produksi
          </Text>

          <Text style={styles.subtitle}>
            Jadwal mesin & alokasi operator
          </Text>
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.addButton,
            pressed && styles.pressedOpacity,
          ]}
          onPress={() => {
            resetForm();
            setModalVisible(true);
          }}
        >
          <Text style={styles.addButtonText}>
            + Tambah
          </Text>
        </Pressable>

      </View>

      {/* ==================================================
          LIST CONTENT
      ================================================== */}

      <FlatList
        data={planning}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}

        ListEmptyComponent={
          <View style={styles.empty}>

            <View style={styles.emptyIconCircle}>
              <Text style={styles.emptyIcon}>
                📋
              </Text>
            </View>

            <Text style={styles.emptyTitle}>
              Belum ada planning
            </Text>

            <Text style={styles.emptyText}>
              Buat jadwal produksi pertama Anda
              untuk mulai mengelola antrean.
            </Text>

          </View>
        }

        renderItem={({ item }) => {

          const order = orders.find(
            (o) => o.id === item.orderId
          );

          const statusConfig =
            getStatusConfig(item.status);

          return (
            <View style={styles.card}>

              {/* CARD HEADER */}

              <View style={styles.cardHeader}>

                <View
                  style={{
                    flex: 1,
                    paddingRight: 10,
                  }}
                >
                  <Text style={styles.product}>
                    {order?.product ??
                      "Order tidak ditemukan"}
                  </Text>

                  <Text style={styles.customer}>
                    {order?.customerName ?? "-"}
                  </Text>
                </View>

                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor:
                        statusConfig.bg,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.statusDot,
                      {
                        backgroundColor:
                          statusConfig.color,
                      },
                    ]}
                  />

                  <Text
                    style={[
                      styles.statusText,
                      {
                        color:
                          statusConfig.color,
                      },
                    ]}
                  >
                    {statusConfig.label}
                  </Text>
                </View>

              </View>

              <View style={styles.divider} />

              {/* INFO */}

              <View style={styles.infoGrid}>

                <InfoItem
                  label="Tanggal"
                  value={item.scheduledDate}
                  icon="📅"
                />

                <InfoItem
                  label="Mesin"
                  value={item.machine}
                  icon="⚙️"
                />

                <InfoItem
                  label="Operator"
                  value={
                    item.operatorName || "-"
                  }
                  icon="👤"
                />

                <InfoItem
                  label="Kuantitas"
                  value={
                    order
                      ? `${order.quantity} pcs`
                      : "-"
                  }
                  icon="📦"
                />

              </View>

              {/* ACTIONS */}

              <View style={styles.cardFooter}>

                <Pressable
                  style={({ pressed }) => [
                    styles.actionButton,
                    styles.editButton,
                    pressed &&
                      styles.pressedOpacity,
                  ]}
                  onPress={() =>
                    editPlanning(item)
                  }
                >
                  <Text style={styles.editText}>
                    Edit
                  </Text>
                </Pressable>

                <Pressable
                  style={({ pressed }) => [
                    styles.actionButton,
                    styles.deleteButton,
                    pressed &&
                      styles.pressedOpacity,
                  ]}
                  onPress={() =>
                    deletePlanning(item.id)
                  }
                >
                  <Text style={styles.deleteText}>
                    Hapus
                  </Text>
                </Pressable>

              </View>

            </View>
          );
        }}
      />

      {/* ==================================================
          FORM MODAL
      ================================================== */}

      <Modal
        visible={modalVisible}
        animationType="fade"
        transparent
        onRequestClose={() => {
          resetForm();
          setModalVisible(false);
        }}
      >

        <View style={styles.modalOverlay}>

          <View style={styles.modal}>

            {/* MODAL HEADER */}

            <View style={styles.modalHeader}>

              <Text style={styles.modalTitle}>
                {editingId
                  ? "Edit Planning"
                  : "Planning Baru"}
              </Text>

              <Pressable
                onPress={() => {
                  resetForm();
                  setModalVisible(false);
                }}
                hitSlop={10}
              >
                <Text style={styles.close}>
                  ✕
                </Text>
              </Pressable>

            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={
                styles.formContainer
              }
            >

              {/* ==================================================
                  SELECT ORDER
              ================================================== */}

              <Text style={styles.label}>
                Pilih Order
              </Text>

              <Pressable
                style={[
                  styles.selectInput,
                  activePicker === "order" &&
                    styles.selectActive,
                ]}
                onPress={() =>
                  setActivePicker(
                    activePicker === "order"
                      ? null
                      : "order"
                  )
                }
              >

                <View style={{ flex: 1 }}>

                  <Text
                    style={
                      selectedOrder
                        ? styles.selectValue
                        : styles.placeholder
                    }
                  >
                    {selectedOrder
                      ? selectedOrder.product
                      : "Pilih order produksi..."}
                  </Text>

                  {selectedOrder && (
                    <Text
                      style={styles.selectSubtext}
                    >
                      {selectedOrder.customerName}
                      {" • "}
                      {selectedOrder.quantity} pcs
                    </Text>
                  )}

                </View>

                <Text style={styles.arrowIcon}>
                  {activePicker === "order"
                    ? "▲"
                    : "▼"}
                </Text>

              </Pressable>

              {/* ORDER DROPDOWN */}

              {activePicker === "order" && (
                <View
                  style={
                    styles.dropdownContainer
                  }
                >

                  {availableOrders.length === 0 ? (

                    <View
                      style={
                        styles.dropdownEmpty
                      }
                    >
                      <Text
                        style={
                          styles.dropdownEmptyTitle
                        }
                      >
                        Semua order sudah
                        memiliki planning
                      </Text>

                      <Text
                        style={
                          styles.dropdownEmptyText
                        }
                      >
                        Tidak ada order yang
                        bisa ditambahkan ke
                        planning baru.
                      </Text>
                    </View>

                  ) : (

                    availableOrders.map((o) => (

                      <Pressable
                        key={o.id}
                        style={
                          styles.dropdownOption
                        }
                        onPress={() => {
                          setOrderId(o.id);
                          setActivePicker(null);
                        }}
                      >

                        <Text
                          style={
                            styles.optionTitle
                          }
                        >
                          {o.product}
                        </Text>

                        <Text
                          style={
                            styles.optionSubtext
                          }
                        >
                          {o.customerName}
                          {" • "}
                          {o.quantity} pcs
                        </Text>

                      </Pressable>

                    ))

                  )}

                </View>
              )}

              {/* ==================================================
                  SELECT MACHINE
              ================================================== */}

              <Text style={styles.label}>
                Mesin
              </Text>

              <Pressable
                style={[
                  styles.selectInput,
                  activePicker === "machine" &&
                    styles.selectActive,
                ]}
                onPress={() =>
                  setActivePicker(
                    activePicker === "machine"
                      ? null
                      : "machine"
                  )
                }
              >

                <Text
                  style={
                    machine
                      ? styles.selectValue
                      : styles.placeholder
                  }
                >
                  {machine ||
                    "Pilih mesin..."}
                </Text>

                <Text style={styles.arrowIcon}>
                  {activePicker === "machine"
                    ? "▲"
                    : "▼"}
                </Text>

              </Pressable>

              {activePicker === "machine" && (
                <View
                  style={
                    styles.dropdownContainer
                  }
                >

                  {MACHINES.map((m) => (

                    <Pressable
                      key={m}
                      style={
                        styles.dropdownOption
                      }
                      onPress={() => {
                        setMachine(m);
                        setActivePicker(null);
                      }}
                    >

                      <Text
                        style={
                          styles.optionTitle
                        }
                      >
                        {m}
                      </Text>

                    </Pressable>

                  ))}

                </View>
              )}

              {/* ==================================================
                  SELECT OPERATOR
              ================================================== */}

              <Text style={styles.label}>
                Operator
              </Text>

              <Pressable
                style={[
                  styles.selectInput,
                  activePicker === "operator" &&
                    styles.selectActive,
                ]}
                onPress={() =>
                  setActivePicker(
                    activePicker === "operator"
                      ? null
                      : "operator"
                  )
                }
              >

                <View style={{ flex: 1 }}>

                  <Text
                    style={
                      selectedOperator
                        ? styles.selectValue
                        : styles.placeholder
                    }
                  >
                    {selectedOperator
                      ? selectedOperator.name
                      : "Pilih operator..."}
                  </Text>

                </View>

                <Text style={styles.arrowIcon}>
                  {activePicker === "operator"
                    ? "▲"
                    : "▼"}
                </Text>

              </Pressable>

              {activePicker === "operator" && (
                <View
                  style={
                    styles.dropdownContainer
                  }
                >

                  {operators.map((op) => (

                    <Pressable
                      key={op.id}
                      style={
                        styles.dropdownOption
                      }
                      onPress={() => {
                        setOperatorId(op.id);
                        setActivePicker(null);
                      }}
                    >

                      <Text
                        style={
                          styles.optionTitle
                        }
                      >
                        {op.name}
                      </Text>

                      <Text
                        style={
                          styles.optionSubtext
                        }
                      >
                        {op.email}
                      </Text>

                    </Pressable>

                  ))}

                </View>
              )}

              {/* ==================================================
                  DATE PICKER
              ================================================== */}

              <Text style={styles.label}>
                Tanggal Produksi
              </Text>

              <Pressable
                style={styles.selectInput}
                onPress={() =>
                  setShowDatePicker(true)
                }
              >

                <Text style={styles.selectValue}>
                  📅 {formatDate(scheduledDate)}
                </Text>

              </Pressable>

              {showDatePicker && (
                <DateTimePicker
                  value={scheduledDate}
                  mode="date"
                  display={
                    Platform.OS === "ios"
                      ? "spinner"
                      : "default"
                  }
                  onChange={(
                    event,
                    date
                  ) => {

                    setShowDatePicker(
                      Platform.OS === "ios"
                    );

                    if (date) {
                      setScheduledDate(date);
                    }

                  }}
                />
              )}

              {/* ==================================================
                  SELECT STATUS
              ================================================== */}

              <Text style={styles.label}>
                Status Produksi
              </Text>

              <Pressable
                style={[
                  styles.selectInput,
                  activePicker === "status" &&
                    styles.selectActive,
                ]}
                onPress={() =>
                  setActivePicker(
                    activePicker === "status"
                      ? null
                      : "status"
                  )
                }
              >

                <Text style={styles.selectValue}>
                  {getStatusConfig(status).label}
                </Text>

                <Text style={styles.arrowIcon}>
                  {activePicker === "status"
                    ? "▲"
                    : "▼"}
                </Text>

              </Pressable>

              {activePicker === "status" && (
                <View
                  style={
                    styles.dropdownContainer
                  }
                >

                  {STATUS_OPTIONS.map(
                    (opt) => (

                      <Pressable
                        key={opt.value}
                        style={
                          styles.dropdownOption
                        }
                        onPress={() => {
                          setStatus(opt.value);
                          setActivePicker(null);
                        }}
                      >

                        <Text
                          style={[
                            styles.optionTitle,
                            {
                              color:
                                opt.color,
                            },
                          ]}
                        >
                          {opt.label}
                        </Text>

                      </Pressable>

                    )
                  )}

                </View>
              )}

              {/* ==================================================
                  SAVE BUTTON
              ================================================== */}

              <Pressable
                style={({ pressed }) => [
                  styles.saveButton,
                  pressed &&
                    styles.pressedOpacity,
                ]}
                onPress={savePlanning}
              >

                <Text style={styles.saveText}>
                  {editingId
                    ? "Simpan Perubahan"
                    : "Buat Planning"}
                </Text>

              </Pressable>

            </ScrollView>

          </View>

        </View>

      </Modal>

    </SafeAreaView>
  );
}

// ======================================================
// INFO ITEM
// ======================================================

function InfoItem({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: string;
}) {
  return (
    <View style={styles.infoBox}>

      <Text style={styles.infoLabel}>
        {icon} {label}
      </Text>

      <Text
        style={styles.infoValue}
        numberOfLines={1}
      >
        {value}
      </Text>

    </View>
  );
}

// ======================================================
// STYLES
// ======================================================

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },

  // ====================================================
  // HEADER
  // ====================================================

  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#0f172a",
    letterSpacing: -0.5,
  },

  subtitle: {
    marginTop: 2,
    color: "#64748b",
    fontSize: 13,
  },

  addButton: {
    backgroundColor: "#0f172a",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },

  addButtonText: {
    color: "#ffffff",
    fontWeight: "600",
    fontSize: 14,
  },

  pressedOpacity: {
    opacity: 0.8,
  },

  // ====================================================
  // LIST
  // ====================================================

  list: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    gap: 16,
  },

  // ====================================================
  // CARD
  // ====================================================

  card: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#64748b",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },

  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },

  product: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1e293b",
  },

  customer: {
    marginTop: 2,
    color: "#64748b",
    fontSize: 13,
  },

  // ====================================================
  // STATUS
  // ====================================================

  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 6,
  },

  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },

  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },

  divider: {
    height: 1,
    backgroundColor: "#f1f5f9",
    marginVertical: 14,
  },

  // ====================================================
  // INFO
  // ====================================================

  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },

  infoBox: {
    width: "47%",
  },

  infoLabel: {
    fontSize: 11,
    color: "#94a3b8",
    fontWeight: "500",
    marginBottom: 2,
  },

  infoValue: {
    fontSize: 13,
    fontWeight: "600",
    color: "#334155",
  },

  // ====================================================
  // CARD FOOTER
  // ====================================================

  cardFooter: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
    marginTop: 16,
  },

  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },

  editButton: {
    backgroundColor: "#f1f5f9",
  },

  editText: {
    fontWeight: "600",
    fontSize: 12,
    color: "#475569",
  },

  deleteButton: {
    backgroundColor: "#fef2f2",
  },

  deleteText: {
    fontWeight: "600",
    fontSize: 12,
    color: "#ef4444",
  },

  // ====================================================
  // EMPTY
  // ====================================================

  empty: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },

  emptyIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },

  emptyIcon: {
    fontSize: 24,
  },

  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#334155",
  },

  emptyText: {
    color: "#94a3b8",
    fontSize: 13,
    textAlign: "center",
    marginTop: 4,
    maxWidth: 240,
  },

  // ====================================================
  // MODAL
  // ====================================================

  modalOverlay: {
    flex: 1,
    backgroundColor:
      "rgba(15, 23, 42, 0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },

  modal: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 20,
    maxWidth: 500,
    width: "100%",
    maxHeight: "85%",
  },

  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0f172a",
  },

  close: {
    fontSize: 16,
    color: "#94a3b8",
    fontWeight: "600",
  },

  formContainer: {
    paddingTop: 12,
  },

  // ====================================================
  // FORM
  // ====================================================

  label: {
    fontSize: 12,
    fontWeight: "600",
    color: "#475569",
    marginTop: 12,
    marginBottom: 6,
  },

  selectInput: {
    minHeight: 46,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 10,
    paddingHorizontal: 14,
    backgroundColor: "#f8fafc",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  selectActive: {
    borderColor: "#0f172a",
    backgroundColor: "#ffffff",
  },

  selectValue: {
    fontSize: 14,
    fontWeight: "500",
    color: "#0f172a",
  },

  placeholder: {
    fontSize: 14,
    color: "#94a3b8",
  },

  selectSubtext: {
    fontSize: 11,
    color: "#64748b",
    marginTop: 1,
  },

  arrowIcon: {
    fontSize: 10,
    color: "#94a3b8",
  },

  // ====================================================
  // DROPDOWN
  // ====================================================

  dropdownContainer: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 10,
    marginTop: 4,
    backgroundColor: "#ffffff",
    overflow: "hidden",
  },

  dropdownOption: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f8fafc",
  },

  optionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1e293b",
  },

  optionSubtext: {
    fontSize: 11,
    color: "#64748b",
    marginTop: 2,
  },

  dropdownEmpty: {
    padding: 16,
    alignItems: "center",
  },

  dropdownEmptyTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#475569",
    textAlign: "center",
  },

  dropdownEmptyText: {
    fontSize: 11,
    color: "#94a3b8",
    textAlign: "center",
    marginTop: 4,
  },

  // ====================================================
  // SAVE
  // ====================================================

  saveButton: {
    backgroundColor: "#0f172a",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 24,
  },

  saveText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 14,
  },

});