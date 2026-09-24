import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
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

const MACHINES = [
  "Printer A",
  "Printer B",
  "Printer C",
  "Cutting A",
  "Finishing A",
];

const STATUS_OPTIONS = [
  { value: "planned", label: "Direncanakan" },
  { value: "running", label: "Sedang Berjalan" },
  { value: "completed", label: "Selesai" },
  { value: "cancelled", label: "Dibatalkan" },
];

export default function PlanningPage() {
  const [planning, setPlanning] = useState<Planning[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [operators, setOperators] = useState<User[]>([]);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [orderId, setOrderId] = useState("");
  const [machine, setMachine] = useState("");
  const [operatorId, setOperatorId] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [status, setStatus] =
    useState<Planning["status"]>("planned");

  const [showOrderPicker, setShowOrderPicker] = useState(false);
  const [showMachinePicker, setShowMachinePicker] = useState(false);
  const [showOperatorPicker, setShowOperatorPicker] = useState(false);
  const [showStatusPicker, setShowStatusPicker] = useState(false);

  // =========================
  // FIRESTORE DATA
  // =========================

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "planning"),
      (snapshot) => {
        const data: Planning[] = snapshot.docs.map((item) => ({
          id: item.id,
          ...(item.data() as Omit<Planning, "id">),
        }));

        setPlanning(data);
      }
    );

    return unsubscribe;
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "orders"),
      (snapshot) => {
        const data: Order[] = snapshot.docs.map((item) => ({
          id: item.id,
          ...(item.data() as Omit<Order, "id">),
        }));

        setOrders(data);
      }
    );

    return unsubscribe;
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "users"),
      (snapshot) => {
        const data: User[] = snapshot.docs
          .map((item) => ({
            id: item.id,
            ...(item.data() as Omit<User, "id">),
          }))
          .filter((user) => user.role === "operator");

        setOperators(data);
      }
    );

    return unsubscribe;
  }, []);

  // =========================
  // HELPERS
  // =========================

  const selectedOrder = useMemo(
    () => orders.find((item) => item.id === orderId),
    [orders, orderId]
  );

  const selectedOperator = useMemo(
    () => operators.find((item) => item.id === operatorId),
    [operators, operatorId]
  );

  const getStatusLabel = (value: string) => {
    return (
      STATUS_OPTIONS.find((item) => item.value === value)?.label ??
      value
    );
  };

  const resetForm = () => {
    setEditingId(null);
    setOrderId("");
    setMachine("");
    setOperatorId("");
    setScheduledDate("");
    setStatus("planned");

    setShowOrderPicker(false);
    setShowMachinePicker(false);
    setShowOperatorPicker(false);
    setShowStatusPicker(false);
  };

  // =========================
  // ADD / UPDATE
  // =========================

  const savePlanning = async () => {
    if (!orderId) {
      Alert.alert("Validasi", "Silakan pilih order.");
      return;
    }

    if (!machine) {
      Alert.alert("Validasi", "Silakan pilih mesin.");
      return;
    }

    if (!operatorId) {
      Alert.alert("Validasi", "Silakan pilih operator.");
      return;
    }

    if (!scheduledDate.trim()) {
      Alert.alert(
        "Validasi",
        "Silakan masukkan tanggal produksi."
      );
      return;
    }

    try {
      const data = {
        orderId,
        machine,
        operatorId,
        operatorName: selectedOperator?.name ?? "",
        scheduledDate: scheduledDate.trim(),
        status,
        updatedAt: serverTimestamp(),
      };

      if (editingId) {
        await updateDoc(
          doc(db, "planning", editingId),
          data
        );
      } else {
        await addDoc(collection(db, "planning"), {
          ...data,
          createdAt: serverTimestamp(),
        });
      }

      resetForm();
      setModalVisible(false);
    } catch (error) {
      console.error(error);
      Alert.alert(
        "Error",
        "Planning gagal disimpan."
      );
    }
  };

  // =========================
  // EDIT
  // =========================

  const editPlanning = (item: Planning) => {
    setEditingId(item.id);
    setOrderId(item.orderId);
    setMachine(item.machine);
    setOperatorId(item.operatorId);
    setScheduledDate(item.scheduledDate);
    setStatus(item.status);

    setModalVisible(true);
  };

  // =========================
  // DELETE
  // =========================

  const deletePlanning = (id: string) => {
    const remove = async () => {
      try {
        await deleteDoc(doc(db, "planning", id));
      } catch (error) {
        console.error(error);
        Alert.alert(
          "Error",
          "Planning gagal dihapus."
        );
      }
    };

    if (Platform.OS === "web") {
      if (window.confirm("Hapus planning ini?")) {
        remove();
      }
    } else {
      Alert.alert(
        "Hapus Planning",
        "Apakah kamu yakin ingin menghapus planning ini?",
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

  // =========================
  // RENDER
  // =========================

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Planning Produksi</Text>
          <Text style={styles.subtitle}>
            Atur jadwal produksi, mesin, dan operator
          </Text>
        </View>

        <Pressable
          style={styles.addButton}
          onPress={() => {
            resetForm();
            setModalVisible(true);
          }}
        >
          <Text style={styles.addButtonText}>
            + Planning
          </Text>
        </Pressable>
      </View>

      <FlatList
        data={planning}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>
              Belum ada planning
            </Text>

            <Text style={styles.emptyText}>
              Buat planning produksi pertama.
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const order = orders.find(
            (order) => order.id === item.orderId
          );

          return (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.product}>
                    {order?.product ?? "Order tidak ditemukan"}
                  </Text>

                  <Text style={styles.customer}>
                    {order?.customerName ?? "-"}
                  </Text>
                </View>

                <View
                  style={[
                    styles.statusBadge,
                    item.status === "completed" &&
                      styles.statusCompleted,
                    item.status === "running" &&
                      styles.statusRunning,
                    item.status === "cancelled" &&
                      styles.statusCancelled,
                  ]}
                >
                  <Text style={styles.statusText}>
                    {getStatusLabel(item.status)}
                  </Text>
                </View>
              </View>

              <View style={styles.infoGrid}>
                <Info
                  label="Tanggal"
                  value={item.scheduledDate}
                />

                <Info
                  label="Mesin"
                  value={item.machine}
                />

                <Info
                  label="Operator"
                  value={item.operatorName || "-"}
                />

                <Info
                  label="Jumlah"
                  value={
                    order
                      ? `${order.quantity} pcs`
                      : "-"
                  }
                />
              </View>

              <View style={styles.actions}>
                <Pressable
                  style={styles.editButton}
                  onPress={() => editPlanning(item)}
                >
                  <Text style={styles.editText}>
                    Edit
                  </Text>
                </Pressable>

                <Pressable
                  style={styles.deleteButton}
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

      {/* =========================
          MODAL
      ========================= */}

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => {
          resetForm();
          setModalVisible(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
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
              >
                <Text style={styles.close}>
                  ×
                </Text>
              </Pressable>
            </View>

            {/* ORDER */}

            <Text style={styles.label}>
              Order
            </Text>

            <Pressable
              style={styles.select}
              onPress={() =>
                setShowOrderPicker(
                  !showOrderPicker
                )
              }
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.selectText}>
                  {selectedOrder
                    ? selectedOrder.product
                    : "Pilih order"}
                </Text>

                {selectedOrder && (
                  <Text style={styles.selectSubtext}>
                    {selectedOrder.customerName} •{" "}
                    {selectedOrder.quantity} pcs
                  </Text>
                )}
              </View>

              <Text>⌄</Text>
            </Pressable>

            {showOrderPicker && (
              <View style={styles.dropdown}>
                {orders.length === 0 ? (
                  <Text style={styles.noData}>
                    Belum ada order.
                  </Text>
                ) : (
                  orders.map((order) => (
                    <Pressable
                      key={order.id}
                      style={styles.option}
                      onPress={() => {
                        setOrderId(order.id);
                        setShowOrderPicker(false);
                      }}
                    >
                      <Text style={styles.optionTitle}>
                        {order.product}
                      </Text>

                      <Text style={styles.optionSubtext}>
                        {order.customerName} •{" "}
                        {order.quantity} pcs
                      </Text>
                    </Pressable>
                  ))
                )}
              </View>
            )}

            {/* MACHINE */}

            <Text style={styles.label}>
              Mesin
            </Text>

            <Pressable
              style={styles.select}
              onPress={() =>
                setShowMachinePicker(
                  !showMachinePicker
                )
              }
            >
              <Text style={styles.selectText}>
                {machine || "Pilih mesin"}
              </Text>

              <Text>⌄</Text>
            </Pressable>

            {showMachinePicker && (
              <View style={styles.dropdown}>
                {MACHINES.map((item) => (
                  <Pressable
                    key={item}
                    style={styles.option}
                    onPress={() => {
                      setMachine(item);
                      setShowMachinePicker(false);
                    }}
                  >
                    <Text style={styles.optionTitle}>
                      {item}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}

            {/* OPERATOR */}

            <Text style={styles.label}>
              Operator
            </Text>

            <Pressable
              style={styles.select}
              onPress={() =>
                setShowOperatorPicker(
                  !showOperatorPicker
                )
              }
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.selectText}>
                  {selectedOperator?.name ||
                    "Pilih operator"}
                </Text>

                {selectedOperator && (
                  <Text style={styles.selectSubtext}>
                    {selectedOperator.email}
                  </Text>
                )}
              </View>

              <Text>⌄</Text>
            </Pressable>

            {showOperatorPicker && (
              <View style={styles.dropdown}>
                {operators.length === 0 ? (
                  <Text style={styles.noData}>
                    Belum ada operator.
                  </Text>
                ) : (
                  operators.map((operator) => (
                    <Pressable
                      key={operator.id}
                      style={styles.option}
                      onPress={() => {
                        setOperatorId(operator.id);
                        setShowOperatorPicker(false);
                      }}
                    >
                      <Text style={styles.optionTitle}>
                        {operator.name}
                      </Text>

                      <Text style={styles.optionSubtext}>
                        {operator.email}
                      </Text>
                    </Pressable>
                  ))
                )}
              </View>
            )}

            {/* DATE */}

            <Text style={styles.label}>
              Tanggal Produksi
            </Text>

            <TextInput
              style={styles.input}
              value={scheduledDate}
              onChangeText={setScheduledDate}
              placeholder="Contoh: 2026-09-25"
              placeholderTextColor="#999"
            />

            {/* STATUS */}

            <Text style={styles.label}>
              Status
            </Text>

            <Pressable
              style={styles.select}
              onPress={() =>
                setShowStatusPicker(
                  !showStatusPicker
                )
              }
            >
              <Text style={styles.selectText}>
                {getStatusLabel(status)}
              </Text>

              <Text>⌄</Text>
            </Pressable>

            {showStatusPicker && (
              <View style={styles.dropdown}>
                {STATUS_OPTIONS.map((item) => (
                  <Pressable
                    key={item.value}
                    style={styles.option}
                    onPress={() => {
                      setStatus(
                        item.value as Planning["status"]
                      );

                      setShowStatusPicker(false);
                    }}
                  >
                    <Text style={styles.optionTitle}>
                      {item.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}

            {/* SAVE */}

            <Pressable
              style={styles.saveButton}
              onPress={savePlanning}
            >
              <Text style={styles.saveText}>
                {editingId
                  ? "Simpan Perubahan"
                  : "Buat Planning"}
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// =========================
// INFO COMPONENT
// =========================

function Info({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View style={styles.info}>
      <Text style={styles.infoLabel}>
        {label}
      </Text>

      <Text style={styles.infoValue}>
        {value}
      </Text>
    </View>
  );
}

// =========================
// STYLES
// =========================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f7fa",
  },

  header: {
    padding: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 15,
  },

  title: {
    fontSize: 26,
    fontWeight: "700",
    color: "#111827",
  },

  subtitle: {
    marginTop: 4,
    color: "#6b7280",
    fontSize: 14,
  },

  addButton: {
    backgroundColor: "#111827",
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 10,
  },

  addButtonText: {
    color: "#fff",
    fontWeight: "700",
  },

  list: {
    padding: 20,
    paddingTop: 0,
    gap: 14,
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },

  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
  },

  product: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },

  customer: {
    marginTop: 4,
    color: "#6b7280",
  },

  statusBadge: {
    backgroundColor: "#e5e7eb",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },

  statusCompleted: {
    backgroundColor: "#dcfce7",
  },

  statusRunning: {
    backgroundColor: "#dbeafe",
  },

  statusCancelled: {
    backgroundColor: "#fee2e2",
  },

  statusText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#374151",
  },

  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 18,
    gap: 14,
  },

  info: {
    minWidth: 130,
    flex: 1,
  },

  infoLabel: {
    fontSize: 12,
    color: "#9ca3af",
    marginBottom: 3,
  },

  infoValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },

  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 18,
  },

  editButton: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 8,
    backgroundColor: "#f3f4f6",
  },

  editText: {
    fontWeight: "600",
    color: "#374151",
  },

  deleteButton: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 8,
    backgroundColor: "#fee2e2",
  },

  deleteText: {
    fontWeight: "600",
    color: "#dc2626",
  },

  empty: {
    alignItems: "center",
    padding: 50,
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
  },

  emptyText: {
    color: "#6b7280",
    marginTop: 5,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    padding: 20,
  },

  modal: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 22,
    maxWidth: 700,
    width: "100%",
    alignSelf: "center",
    maxHeight: "90%",
  },

  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },

  modalTitle: {
    fontSize: 22,
    fontWeight: "700",
  },

  close: {
    fontSize: 30,
    color: "#6b7280",
  },

  label: {
    fontSize: 13,
    fontWeight: "700",
    color: "#374151",
    marginTop: 12,
    marginBottom: 6,
  },

  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: "#111827",
  },

  select: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 10,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  selectText: {
    fontSize: 15,
    color: "#111827",
  },

  selectSubtext: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 2,
  },

  dropdown: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    marginTop: 5,
    backgroundColor: "#fff",
    maxHeight: 180,
    overflow: "scroll",
  },

  option: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },

  optionTitle: {
    fontWeight: "600",
    color: "#111827",
  },

  optionSubtext: {
    color: "#6b7280",
    fontSize: 12,
    marginTop: 3,
  },

  noData: {
    padding: 15,
    color: "#6b7280",
  },

  saveButton: {
    backgroundColor: "#111827",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
  },

  saveText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
});