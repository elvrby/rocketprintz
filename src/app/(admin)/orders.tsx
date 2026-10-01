// src/app/(admin)/orders.tsx
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";

import { useEffect, useState } from "react";

import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import {
  addDoc,
  collection,
  doc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch
} from "firebase/firestore";

import { db } from "../../firebase/config";

// ======================================================
// TYPES
// ======================================================

export type OrderStatus =
  | "pending"
  | "processing"
  | "completed";

interface Order {
  id: string;
  orderCode: string;
  customerName: string;
  product: string;
  quantity: number;
  deadline: string;
  status: OrderStatus;
}

// ======================================================
// STATUS OPTIONS
// ======================================================

const STATUS_OPTIONS: {
  label: string;
  value: OrderStatus;
  color: string;
  bg: string;
}[] = [
  {
    label: "Pending",
    value: "pending",
    color: "#D97706",
    bg: "#FEF3C7",
  },
  {
    label: "Processing",
    value: "processing",
    color: "#2563EB",
    bg: "#DBEAFE",
  },
  {
    label: "Completed",
    value: "completed",
    color: "#059669",
    bg: "#D1FAE5",
  },
];

// ======================================================
// INITIAL FORM
// ======================================================

const initialForm = {
  customerName: "",
  product: "",
  quantity: "",
  deadline: new Date(),
  status: "pending" as OrderStatus,
};

// ======================================================
// GENERATE ORDER CODE
// ======================================================

const generateOrderCode = () => {
  const randomNumber = Math.floor(
    100000 + Math.random() * 900000
  );

  return `SO-${randomNumber}`;
};

// ======================================================
// GENERATE UNIQUE ORDER CODE
// ======================================================

const generateUniqueOrderCode = async () => {
  let orderCode = "";
  let exists = true;

  while (exists) {
    orderCode = generateOrderCode();

    const ordersRef = collection(db, "orders");

    const q = query(
      ordersRef,
      where("orderCode", "==", orderCode)
    );

    const snapshot = await getDocs(q);

    exists = !snapshot.empty;
  }

  return orderCode;
};

// ======================================================
// DATE HELPERS
// ======================================================

const formatDateForInput = (date: Date) => {
  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const parseInputDate = (value: string) => {
  const [year, month, day] = value
    .split("-")
    .map(Number);

  if (
    !year ||
    !month ||
    !day
  ) {
    return new Date();
  }

  const date = new Date(
    year,
    month - 1,
    day
  );

  return isNaN(date.getTime())
    ? new Date()
    : date;
};

// ======================================================
// MAIN COMPONENT
// ======================================================

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalVisible, setModalVisible] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [editingId, setEditingId] =
    useState<string | null>(null);

  // ====================================================
  // DELETE CONFIRMATION STATE
  // ====================================================

  const [deleteModalVisible, setDeleteModalVisible] =
    useState(false);

  const [deleteTarget, setDeleteTarget] =
    useState<Order | null>(null);

  const [deleting, setDeleting] =
    useState(false);

  // ====================================================
  // FORM STATE
  // ====================================================

  const [form, setForm] =
    useState(initialForm);

  const [showDatePicker, setShowDatePicker] =
    useState(false);

  const [statusPickerVisible, setStatusPickerVisible] =
    useState(false);

  // ====================================================
  // FIRESTORE LISTENER
  // ====================================================

  useEffect(() => {
    const ordersRef = collection(
      db,
      "orders"
    );

    const unsubscribe = onSnapshot(
      ordersRef,
      (snapshot) => {
        const data: Order[] =
          snapshot.docs.map((item) => {
            const value = item.data();

            return {
              id: item.id,

              orderCode:
                value.orderCode ?? "",

              customerName:
                value.customerName ?? "",

              product:
                value.product ?? "",

              quantity:
                value.quantity ?? 0,

              deadline:
                value.deadline ??
                new Date()
                  .toISOString()
                  .split("T")[0],

              status:
                (value.status as OrderStatus) ??
                "pending",
            };
          });

        setOrders(data);
        setLoading(false);
      },
      (error) => {
        console.error(
          "Firestore orders error:",
          error
        );

        setLoading(false);

        Alert.alert(
          "Error",
          "Gagal mengambil data order."
        );
      }
    );

    return unsubscribe;
  }, []);

  // ====================================================
  // OPEN ADD MODAL
  // ====================================================

  const openAddModal = () => {
    setEditingId(null);

    setForm({
      ...initialForm,
      deadline: new Date(),
    });

    setStatusPickerVisible(false);
    setShowDatePicker(false);

    setModalVisible(true);
  };

  // ====================================================
  // OPEN EDIT MODAL
  // ====================================================

  const openEditModal = (order: Order) => {
    setEditingId(order.id);

    const parsedDate = order.deadline
      ? parseInputDate(order.deadline)
      : new Date();

    setForm({
      customerName:
        order.customerName,

      product:
        order.product,

      quantity:
        String(order.quantity),

      deadline:
        isNaN(parsedDate.getTime())
          ? new Date()
          : parsedDate,

      status:
        order.status,
    });

    setStatusPickerVisible(false);
    setShowDatePicker(false);

    setModalVisible(true);
  };

  // ====================================================
  // CLOSE MODAL
  // ====================================================

  const closeModal = () => {
    if (saving) return;

    setModalVisible(false);

    setForm({
      ...initialForm,
      deadline: new Date(),
    });

    setEditingId(null);
    setShowDatePicker(false);
    setStatusPickerVisible(false);
  };

  // ====================================================
  // SAVE ORDER
  // ====================================================

  const saveOrder = async () => {
    // ----------------------------------------------
    // VALIDATION
    // ----------------------------------------------

    if (
      !form.customerName.trim() ||
      !form.product.trim() ||
      !form.quantity.trim()
    ) {
      Alert.alert(
        "Data belum lengkap",
        "Nama customer, produk, dan quantity wajib diisi."
      );

      return;
    }

    const quantityNumber =
      Number(form.quantity);

    if (
      isNaN(quantityNumber) ||
      quantityNumber <= 0
    ) {
      Alert.alert(
        "Quantity tidak valid",
        "Quantity harus berupa angka lebih dari 0."
      );

      return;
    }

    try {
      setSaving(true);

      // --------------------------------------------
      // FORMAT DEADLINE
      // --------------------------------------------

      const formattedDeadline =
        formatDateForInput(
          form.deadline
        );

      // --------------------------------------------
      // COMMON ORDER DATA
      // --------------------------------------------

      const orderData = {
        customerName:
          form.customerName.trim(),

        product:
          form.product.trim(),

        quantity:
          quantityNumber,

        deadline:
          formattedDeadline,

        status:
          form.status,

        updatedAt:
          serverTimestamp(),
      };

      // ============================================
      // EDIT EXISTING ORDER
      // ============================================

      if (editingId) {
        await updateDoc(
          doc(
            db,
            "orders",
            editingId
          ),
          orderData
        );
      }

      // ============================================
      // CREATE NEW ORDER
      // ============================================

      else {
        const orderCode =
          await generateUniqueOrderCode();

        await addDoc(
          collection(
            db,
            "orders"
          ),
          {
            ...orderData,

            orderCode,

            createdAt:
              serverTimestamp(),
          }
        );

        console.log(
          "Order created:",
          orderCode
        );
      }

      // --------------------------------------------
      // CLOSE
      // --------------------------------------------

      setModalVisible(false);

      setForm({
        ...initialForm,
        deadline: new Date(),
      });

      setEditingId(null);
      setShowDatePicker(false);
      setStatusPickerVisible(false);
    } catch (error) {
      console.error(
        "Save order error:",
        error
      );

      Alert.alert(
        "Error",
        "Gagal menyimpan order."
      );
    } finally {
      setSaving(false);
    }
  };

  // ====================================================
  // DELETE ORDER
  // ====================================================

  const executeDeleteOrder = async (
    id: string
  ) => {
    if (deleting) return;

    try {
      setDeleting(true);

      // ============================================
      // CARI PLANNING YANG TERKAIT DENGAN ORDER
      // ============================================

      const planningRef =
        collection(
          db,
          "planning"
        );

      const planningQuery =
        query(
          planningRef,
          where(
            "orderId",
            "==",
            id
          )
        );

      const planningSnapshot =
        await getDocs(
          planningQuery
        );

      // ============================================
      // BATCH DELETE
      // ============================================

      const batch =
        writeBatch(db);

      // Hapus semua planning terkait
      planningSnapshot.docs.forEach(
        (planningDoc) => {
          batch.delete(
            doc(
              db,
              "planning",
              planningDoc.id
            )
          );
        }
      );

      // Hapus order
      batch.delete(
        doc(
          db,
          "orders",
          id
        )
      );

      // Jalankan semua penghapusan
      await batch.commit();

      console.log(
        "Order dan planning terkait berhasil dihapus"
      );

      // Tutup modal web
      setDeleteModalVisible(false);
      setDeleteTarget(null);
    } catch (error) {
      console.error(
        "Delete order and planning error:",
        error
      );

      Alert.alert(
        "Error",
        "Gagal menghapus order dan planning terkait."
      );
    } finally {
      setDeleting(false);
    }
  };

  // ====================================================
  // REQUEST DELETE
  // ====================================================

  const deleteOrder = (
    order: Order
  ) => {
    // ============================================
    // WEB
    // ============================================

    if (Platform.OS === "web") {
      setDeleteTarget(order);
      setDeleteModalVisible(true);

      return;
    }

    // ============================================
    // MOBILE
    // ============================================

    Alert.alert(
      "Hapus Order",
      "Order ini dan planning yang terkait akan ikut dihapus. Apakah kamu yakin?",
      [
        {
          text: "Batal",
          style: "cancel",
        },

        {
          text: "Hapus",
          style: "destructive",

          onPress: async () => {
            await executeDeleteOrder(
              order.id
            );
          },
        },
      ]
    );
  };

  // ====================================================
  // CANCEL DELETE
  // ====================================================

  const cancelDelete = () => {
    if (deleting) return;

    setDeleteModalVisible(false);
    setDeleteTarget(null);
  };

  // ====================================================
  // DATE CHANGE MOBILE
  // ====================================================

  const handleDateChange = (
    event: DateTimePickerEvent,
    selectedDate?: Date
  ) => {
    if (
      Platform.OS === "android"
    ) {
      setShowDatePicker(false);
    }

    if (selectedDate) {
      setForm((prev) => ({
        ...prev,
        deadline:
          selectedDate,
      }));
    }
  };

  // ====================================================
  // WEB DATE CHANGE
  // ====================================================

  const handleWebDateChange = (
    value: string
  ) => {
    const selectedDate =
      parseInputDate(value);

    setForm((prev) => ({
      ...prev,
      deadline:
        selectedDate,
    }));
  };

  // ====================================================
  // FORMAT DATE
  // ====================================================

  const formatDateLabel = (
    dateString: string
  ) => {
    const d =
      parseInputDate(
        dateString
      );

    if (
      isNaN(
        d.getTime()
      )
    ) {
      return dateString;
    }

    return d.toLocaleDateString(
      "id-ID",
      {
        day: "numeric",
        month: "short",
        year: "numeric",
      }
    );
  };

  // ====================================================
  // STATUS BADGE
  // ====================================================

  const renderStatusBadge = (
    status: OrderStatus
  ) => {
    const config =
      STATUS_OPTIONS.find(
        (s) =>
          s.value === status
      ) ||
      STATUS_OPTIONS[0];

    return (
      <View
        style={[
          styles.badge,
          {
            backgroundColor:
              config.bg,
          },
        ]}
      >
        <Text
          style={[
            styles.badgeText,
            {
              color:
                config.color,
            },
          ]}
        >
          {config.label}
        </Text>
      </View>
    );
  };

  // ====================================================
  // RENDER ORDER
  // ====================================================

  const renderOrder = ({
    item,
  }: {
    item: Order;
  }) => {
    return (
      <View
        style={styles.card}
      >
        {/* ============================================
            CARD HEADER
        ============================================ */}

        <View
          style={
            styles.cardHeader
          }
        >
          <View
            style={{
              flex: 1,
              paddingRight: 10,
            }}
          >
            {/* ORDER CODE */}

            <Text
              style={
                styles.orderCode
              }
            >
              {item.orderCode ||
                "SO-------"}
            </Text>

            {/* CUSTOMER */}

            <Text
              style={
                styles.customer
              }
            >
              {item.customerName}
            </Text>
          </View>

          {renderStatusBadge(
            item.status
          )}
        </View>

        {/* ============================================
            PRODUCT
        ============================================ */}

        <Text
          style={
            styles.product
          }
        >
          {item.product}
        </Text>

        {/* ============================================
            DETAILS
        ============================================ */}

        <View
          style={
            styles.detailsRow
          }
        >
          <View
            style={
              styles.detailItem
            }
          >
            <Text
              style={
                styles.detailLabel
              }
            >
              Jumlah
            </Text>

            <Text
              style={
                styles.detailValue
              }
            >
              {item.quantity} pcs
            </Text>
          </View>

          <View
            style={
              styles.detailItem
            }
          >
            <Text
              style={
                styles.detailLabel
              }
            >
              Deadline
            </Text>

            <Text
              style={
                styles.detailValue
              }
            >
              {formatDateLabel(
                item.deadline
              )}
            </Text>
          </View>
        </View>

        {/* ============================================
            ACTIONS
        ============================================ */}

        <View
          style={
            styles.actions
          }
        >
          <Pressable
            style={[
              styles.actionBtn,
              styles.editButton,
            ]}
            onPress={() =>
              openEditModal(
                item
              )
            }
          >
            <Text
              style={
                styles.editText
              }
            >
              Edit
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.actionBtn,
              styles.deleteButton,
            ]}
            onPress={() =>
              deleteOrder(item)
            }
          >
            <Text
              style={
                styles.deleteText
              }
            >
              Hapus
            </Text>
          </Pressable>
        </View>
      </View>
    );
  };

  // ====================================================
  // LOADING
  // ====================================================

  if (loading) {
    return (
      <View
        style={styles.center}
      >
        <ActivityIndicator
          size="large"
          color="#4F46E5"
        />
      </View>
    );
  }

  // ====================================================
  // MAIN RETURN
  // ====================================================

  return (
    <View
      style={styles.container}
    >
      {/* ================================================
          HEADER
      ================================================ */}

      <View
        style={styles.header}
      >
        <View>
          <Text
            style={styles.title}
          >
            Orders
          </Text>

          <Text
            style={
              styles.subtitle
            }
          >
            Kelola order RocketPrintz
          </Text>
        </View>

        <Pressable
          style={
            styles.addButton
          }
          onPress={
            openAddModal
          }
        >
          <Text
            style={
              styles.addText
            }
          >
            + Tambah
          </Text>
        </Pressable>
      </View>

      {/* ================================================
          LIST ORDERS
      ================================================ */}

      <FlatList
        data={orders}
        keyExtractor={(item) =>
          item.id
        }
        renderItem={
          renderOrder
        }
        contentContainerStyle={
          orders.length === 0
            ? styles.emptyContainer
            : styles.list
        }
        showsVerticalScrollIndicator={
          false
        }
        ListEmptyComponent={
          <View
            style={
              styles.emptyBox
            }
          >
            <Text
              style={
                styles.emptyTitle
              }
            >
              Belum Ada Order
            </Text>

            <Text
              style={
                styles.emptySubtitle
              }
            >
              Klik tombol "+ Tambah"
              untuk memasukkan
              orderan baru.
            </Text>
          </View>
        }
      />

      {/* ================================================
          ADD / EDIT MODAL
      ================================================ */}

      <Modal
        visible={
          modalVisible
        }
        animationType="fade"
        transparent
        onRequestClose={
          closeModal
        }
      >
        <View
          style={
            styles.modalBackground
          }
        >
          <View
            style={styles.modal}
          >
            {/* MODAL TITLE */}

            <Text
              style={
                styles.modalTitle
              }
            >
              {editingId
                ? "Edit Order"
                : "Tambah Order"}
            </Text>

            <ScrollView
              showsVerticalScrollIndicator={
                false
              }
            >
              {/* ==========================================
                  CUSTOMER
              ========================================== */}

              <Text
                style={
                  styles.inputLabel
                }
              >
                Nama Customer
              </Text>

              <TextInput
                style={
                  styles.input
                }
                placeholder="Contoh: Budi Santoso"
                placeholderTextColor="#9CA3AF"
                value={
                  form.customerName
                }
                onChangeText={(
                  value
                ) =>
                  setForm({
                    ...form,
                    customerName:
                      value,
                  })
                }
              />

              {/* ==========================================
                  PRODUCT
              ========================================== */}

              <Text
                style={
                  styles.inputLabel
                }
              >
                Produk / Jenis Cetakan
              </Text>

              <TextInput
                style={
                  styles.input
                }
                placeholder="Contoh: Banner 3x1 m"
                placeholderTextColor="#9CA3AF"
                value={
                  form.product
                }
                onChangeText={(
                  value
                ) =>
                  setForm({
                    ...form,
                    product:
                      value,
                  })
                }
              />

              {/* ==========================================
                  QUANTITY
              ========================================== */}

              <Text
                style={
                  styles.inputLabel
                }
              >
                Quantity
              </Text>

              <TextInput
                style={
                  styles.input
                }
                placeholder="0"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
                value={
                  form.quantity
                }
                onChangeText={(
                  value
                ) =>
                  setForm({
                    ...form,
                    quantity:
                      value,
                  })
                }
              />

              {/* ==========================================
                  DEADLINE
              ========================================== */}

              <Text
                style={
                  styles.inputLabel
                }
              >
                Deadline
              </Text>

              {/* ==========================================
                  WEB DATE PICKER
              ========================================== */}

              {Platform.OS ===
                "web" ? (
                <View
                  style={
                    styles.webDateContainer
                  }
                >
                  <input
                    type="date"
                    value={formatDateForInput(
                      form.deadline
                    )}
                    min={formatDateForInput(
                      new Date()
                    )}
                    onChange={(
                      event
                    ) =>
                      handleWebDateChange(
                        event
                          .target
                          .value
                      )
                    }
                    style={
                      styles.webDateInput
                    }
                  />
                </View>
              ) : (
                <>
                  {/* ==========================================
                      MOBILE DATE SELECTOR
                  ========================================== */}

                  <Pressable
                    style={
                      styles.pickerSelector
                    }
                    onPress={() =>
                      setShowDatePicker(
                        true
                      )
                    }
                  >
                    <Text
                      style={
                        styles.pickerSelectorText
                      }
                    >
                      {form.deadline.toLocaleDateString(
                        "id-ID",
                        {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        }
                      )}
                    </Text>
                  </Pressable>

                  {showDatePicker && (
                    <DateTimePicker
                      value={
                        form.deadline
                      }
                      mode="date"
                      display={
                        Platform.OS ===
                        "ios"
                          ? "spinner"
                          : "default"
                      }
                      onChange={
                        handleDateChange
                      }
                      minimumDate={
                        new Date()
                      }
                    />
                  )}
                </>
              )}

              {/* ==========================================
                  STATUS
              ========================================== */}

              <Text
                style={
                  styles.inputLabel
                }
              >
                Status Order
              </Text>

              <Pressable
                style={
                  styles.pickerSelector
                }
                onPress={() =>
                  setStatusPickerVisible(
                    !statusPickerVisible
                  )
                }
              >
                <Text
                  style={
                    styles.pickerSelectorText
                  }
                >
                  {
                    STATUS_OPTIONS.find(
                      (s) =>
                        s.value ===
                        form.status
                    )?.label
                  }
                </Text>
              </Pressable>

              {/* STATUS OPTIONS */}

              {statusPickerVisible && (
                <View
                  style={
                    styles.statusOptionsContainer
                  }
                >
                  {STATUS_OPTIONS.map(
                    (opt) => (
                      <Pressable
                        key={
                          opt.value
                        }
                        style={[
                          styles.statusOptionItem,
                          form.status ===
                            opt.value &&
                            styles.statusOptionActive,
                        ]}
                        onPress={() => {
                          setForm({
                            ...form,
                            status:
                              opt.value,
                          });

                          setStatusPickerVisible(
                            false
                          );
                        }}
                      >
                        <View
                          style={[
                            styles.statusDot,
                            {
                              backgroundColor:
                                opt.color,
                            },
                          ]}
                        />

                        <Text
                          style={[
                            styles.statusOptionText,
                            form.status ===
                              opt.value &&
                              styles.statusOptionTextActive,
                          ]}
                        >
                          {
                            opt.label
                          }
                        </Text>
                      </Pressable>
                    )
                  )}
                </View>
              )}
            </ScrollView>

            {/* ==========================================
                MODAL BUTTONS
            ========================================== */}

            <View
              style={
                styles.modalActions
              }
            >
              <Pressable
                style={
                  styles.cancelButton
                }
                onPress={
                  closeModal
                }
                disabled={
                  saving
                }
              >
                <Text
                  style={
                    styles.cancelText
                  }
                >
                  Batal
                </Text>
              </Pressable>

              <Pressable
                style={[
                  styles.saveButton,
                  saving &&
                    styles.saveButtonDisabled,
                ]}
                onPress={
                  saveOrder
                }
                disabled={
                  saving
                }
              >
                {saving ? (
                  <ActivityIndicator
                    size="small"
                    color="#fff"
                  />
                ) : (
                  <Text
                    style={
                      styles.saveText
                    }
                  >
                    Simpan
                  </Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* ================================================
          WEB DELETE CONFIRMATION MODAL
      ================================================ */}

      <Modal
        visible={
          deleteModalVisible
        }
        animationType="fade"
        transparent
        onRequestClose={
          cancelDelete
        }
      >
        <View
          style={
            styles.deleteModalBackground
          }
        >
          <View
            style={
              styles.deleteModal
            }
          >
            {/* ICON */}

            <View
              style={
                styles.deleteIconCircle
              }
            >
              <Text
                style={
                  styles.deleteIconText
                }
              >
                !
              </Text>
            </View>

            {/* TITLE */}

            <Text
              style={
                styles.deleteModalTitle
              }
            >
              Hapus Order?
            </Text>

            {/* DESCRIPTION */}

            <Text
              style={
                styles.deleteModalMessage
              }
            >
              Order ini dan planning
              yang terkait akan ikut
              dihapus. Apakah kamu
              yakin?
            </Text>

            {/* ORDER INFO */}

            {deleteTarget && (
              <View
                style={
                  styles.deleteOrderInfo
                }
              >
                <Text
                  style={
                    styles.deleteOrderCode
                  }
                >
                  {
                    deleteTarget.orderCode
                  }
                </Text>

                <Text
                  style={
                    styles.deleteCustomer
                  }
                >
                  {
                    deleteTarget.customerName
                  }
                </Text>
              </View>
            )}

            {/* BUTTONS */}

            <View
              style={
                styles.deleteModalActions
              }
            >
              <Pressable
                style={
                  styles.deleteCancelButton
                }
                onPress={
                  cancelDelete
                }
                disabled={
                  deleting
                }
              >
                <Text
                  style={
                    styles.deleteCancelText
                  }
                >
                  Batal
                </Text>
              </Pressable>

              <Pressable
                style={[
                  styles.deleteConfirmButton,
                  deleting &&
                    styles.deleteConfirmButtonDisabled,
                ]}
                onPress={() => {
                  if (
                    deleteTarget
                  ) {
                    executeDeleteOrder(
                      deleteTarget.id
                    );
                  }
                }}
                disabled={
                  deleting
                }
              >
                {deleting ? (
                  <ActivityIndicator
                    size="small"
                    color="#FFFFFF"
                  />
                ) : (
                  <Text
                    style={
                      styles.deleteConfirmText
                    }
                  >
                    Hapus
                  </Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ======================================================
// STYLES
// ======================================================

const styles = StyleSheet.create({
  // ====================================================
  // CONTAINER
  // ====================================================

  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 55,
    backgroundColor: "#F9FAFB",
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
  },

  // ====================================================
  // HEADER
  // ====================================================

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },

  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#111827",
  },

  subtitle: {
    color: "#6B7280",
    marginTop: 2,
    fontSize: 14,
  },

  addButton: {
    backgroundColor: "#4F46E5",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,

    shadowColor: "#4F46E5",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },

  addText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 14,
  },

  // ====================================================
  // LIST
  // ====================================================

  list: {
    paddingBottom: 30,
    gap: 14,
  },

  emptyContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  emptyBox: {
    alignItems: "center",
    padding: 20,
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#374151",
    marginBottom: 6,
  },

  emptySubtitle: {
    color: "#9CA3AF",
    textAlign: "center",
    fontSize: 14,
  },

  // ====================================================
  // CARD
  // ====================================================

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,

    borderWidth: 1,
    borderColor: "#F3F4F6",

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },

  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  // ====================================================
  // ORDER CODE
  // ====================================================

  orderCode: {
    fontSize: 12,
    fontWeight: "800",
    color: "#4F46E5",
    marginBottom: 3,
    letterSpacing: 0.5,
  },

  // ====================================================
  // CUSTOMER
  // ====================================================

  customer: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },

  // ====================================================
  // BADGE
  // ====================================================

  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },

  badgeText: {
    fontSize: 12,
    fontWeight: "700",
  },

  // ====================================================
  // PRODUCT
  // ====================================================

  product: {
    fontSize: 15,
    fontWeight: "500",
    color: "#4B5563",
    marginVertical: 10,
  },

  // ====================================================
  // DETAILS
  // ====================================================

  detailsRow: {
    flexDirection: "row",
    backgroundColor: "#F9FAFB",
    padding: 10,
    borderRadius: 10,
    gap: 20,
    marginBottom: 12,
  },

  detailItem: {
    flex: 1,
  },

  detailLabel: {
    fontSize: 11,
    color: "#9CA3AF",
    fontWeight: "600",
    textTransform: "uppercase",
  },

  detailValue: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
    marginTop: 2,
  },

  // ====================================================
  // ACTIONS
  // ====================================================

  actions: {
    flexDirection: "row",
    gap: 10,
  },

  actionBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
  },

  editButton: {
    backgroundColor: "#EEF2FF",
  },

  editText: {
    color: "#4F46E5",
    fontWeight: "700",
    fontSize: 13,
  },

  deleteButton: {
    backgroundColor: "#FEF2F2",
  },

  deleteText: {
    color: "#EF4444",
    fontWeight: "700",
    fontSize: 13,
  },

  // ====================================================
  // MODAL
  // ====================================================

  modalBackground: {
    flex: 1,
    backgroundColor:
      "rgba(17, 24, 39, 0.6)",
    justifyContent: "center",
    padding: 20,
  },

  modal: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    maxHeight: "85%",
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 16,
  },

  // ====================================================
  // INPUT
  // ====================================================

  inputLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 6,
    marginTop: 10,
  },

  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: "#111827",
    backgroundColor: "#F9FAFB",
  },

  // ====================================================
  // WEB DATE INPUT
  // ====================================================

  webDateContainer: {
    width: "100%",
  },

  webDateInput: {
    width: "100%",
    height: 44,
    boxSizing: "border-box",
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: "#E5E7EB",
    borderRadius: 10,
    paddingLeft: 14,
    paddingRight: 14,
    fontSize: 14,
    color: "#111827",
    backgroundColor: "#F9FAFB",
    outlineStyle: "none",
  } as any,

  // ====================================================
  // PICKER
  // ====================================================

  pickerSelector: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: "#F9FAFB",
  },

  pickerSelectorText: {
    fontSize: 14,
    color: "#111827",
    fontWeight: "500",
  },

  // ====================================================
  // STATUS PICKER
  // ====================================================

  statusOptionsContainer: {
    marginTop: 6,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    overflow: "hidden",
  },

  statusOptionItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },

  statusOptionActive: {
    backgroundColor: "#EEF2FF",
  },

  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  statusOptionText: {
    fontSize: 14,
    color: "#4B5563",
  },

  statusOptionTextActive: {
    fontWeight: "700",
    color: "#4F46E5",
  },

  // ====================================================
  // MODAL ACTIONS
  // ====================================================

  modalActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 20,
  },

  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    backgroundColor: "#F3F4F6",
  },

  cancelText: {
    color: "#4B5563",
    fontWeight: "700",
  },

  saveButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    backgroundColor: "#4F46E5",
  },

  saveButtonDisabled: {
    opacity: 0.6,
  },

  saveText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },

  // ====================================================
  // DELETE WEB MODAL
  // ====================================================

  deleteModalBackground: {
    flex: 1,
    backgroundColor:
      "rgba(17, 24, 39, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },

  deleteModal: {
    width: "100%",
    maxWidth: 440,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },

  deleteIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#FEF2F2",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },

  deleteIconText: {
    color: "#EF4444",
    fontSize: 26,
    fontWeight: "800",
  },

  deleteModalTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 8,
  },

  deleteModalMessage: {
    fontSize: 14,
    lineHeight: 21,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 16,
  },

  deleteOrderInfo: {
    width: "100%",
    backgroundColor: "#F9FAFB",
    borderRadius: 10,
    padding: 12,
    marginBottom: 20,
  },

  deleteOrderCode: {
    fontSize: 12,
    fontWeight: "800",
    color: "#4F46E5",
    marginBottom: 3,
  },

  deleteCustomer: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
  },

  deleteModalActions: {
    width: "100%",
    flexDirection: "row",
    gap: 10,
  },

  deleteCancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    backgroundColor: "#F3F4F6",
  },

  deleteCancelText: {
    color: "#4B5563",
    fontWeight: "700",
  },

  deleteConfirmButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    backgroundColor: "#EF4444",
  },

  deleteConfirmButtonDisabled: {
    opacity: 0.6,
  },

  deleteConfirmText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
});