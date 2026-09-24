import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
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

interface Order {
  id: string;
  customerName: string;
  product: string;
  quantity: number;
  deadline: string;
  status: string;
}

const initialForm = {
  customerName: "",
  product: "",
  quantity: "",
  deadline: "",
  status: "pending",
};

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalVisible, setModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    const ordersRef = collection(db, "orders");

    const unsubscribe = onSnapshot(
      ordersRef,
      (snapshot) => {
        const data: Order[] = snapshot.docs.map((item) => {
          const value = item.data();

          return {
            id: item.id,
            customerName: value.customerName ?? "",
            product: value.product ?? "",
            quantity: value.quantity ?? 0,
            deadline: value.deadline ?? "",
            status: value.status ?? "pending",
          };
        });

        setOrders(data);
        setLoading(false);
      },
      (error) => {
        console.error(error);
        setLoading(false);
        Alert.alert("Error", "Gagal mengambil data order.");
      }
    );

    return unsubscribe;
  }, []);

  const openAddModal = () => {
    setEditingId(null);
    setForm(initialForm);
    setModalVisible(true);
  };

  const openEditModal = (order: Order) => {
    setEditingId(order.id);

    setForm({
      customerName: order.customerName,
      product: order.product,
      quantity: String(order.quantity),
      deadline: order.deadline,
      status: order.status,
    });

    setModalVisible(true);
  };

  const saveOrder = async () => {
    if (
      !form.customerName.trim() ||
      !form.product.trim() ||
      !form.quantity.trim() ||
      !form.deadline.trim()
    ) {
      Alert.alert(
        "Data belum lengkap",
        "Customer, produk, quantity, dan deadline wajib diisi."
      );

      return;
    }

    try {
      setSaving(true);

      const orderData = {
        customerName: form.customerName.trim(),
        product: form.product.trim(),
        quantity: Number(form.quantity),
        deadline: form.deadline.trim(),
        status: form.status,
        updatedAt: serverTimestamp(),
      };

      if (editingId) {
        await updateDoc(
          doc(db, "orders", editingId),
          orderData
        );
      } else {
        await addDoc(collection(db, "orders"), {
          ...orderData,
          createdAt: serverTimestamp(),
        });
      }

      setModalVisible(false);
      setForm(initialForm);
      setEditingId(null);
    } catch (error) {
      console.error(error);

      Alert.alert(
        "Error",
        "Gagal menyimpan order."
      );
    } finally {
      setSaving(false);
    }
  };

  const deleteOrder = (id: string) => {
    Alert.alert(
      "Hapus Order",
      "Apakah kamu yakin ingin menghapus order ini?",
      [
        {
          text: "Batal",
          style: "cancel",
        },
        {
          text: "Hapus",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDoc(
                doc(db, "orders", id)
              );
            } catch (error) {
              console.error(error);

              Alert.alert(
                "Error",
                "Gagal menghapus order."
              );
            }
          },
        },
      ]
    );
  };

  const renderOrder = ({
    item,
  }: {
    item: Order;
  }) => {
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.customer}>
            {item.customerName}
          </Text>

          <Text style={styles.status}>
            {item.status}
          </Text>
        </View>

        <Text style={styles.product}>
          {item.product}
        </Text>

        <Text>
          Quantity: {item.quantity}
        </Text>

        <Text>
          Deadline: {item.deadline}
        </Text>

        <View style={styles.actions}>
          <Pressable
            style={styles.editButton}
            onPress={() =>
              openEditModal(item)
            }
          >
            <Text style={styles.editText}>
              Edit
            </Text>
          </Pressable>

          <Pressable
            style={styles.deleteButton}
            onPress={() =>
              deleteOrder(item.id)
            }
          >
            <Text style={styles.deleteText}>
              Hapus
            </Text>
          </Pressable>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>
            Orders
          </Text>

          <Text style={styles.subtitle}>
            Kelola order RocketPrintz
          </Text>
        </View>

        <Pressable
          style={styles.addButton}
          onPress={openAddModal}
        >
          <Text style={styles.addText}>
            + Order
          </Text>
        </Pressable>
      </View>

      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        renderItem={renderOrder}
        contentContainerStyle={
          orders.length === 0
            ? styles.emptyContainer
            : styles.list
        }
        ListEmptyComponent={
          <Text style={styles.empty}>
            Belum ada order.
          </Text>
        }
      />

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() =>
          setModalVisible(false)
        }
      >
        <View style={styles.modalBackground}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>
              {editingId
                ? "Edit Order"
                : "Tambah Order"}
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Nama customer"
              value={form.customerName}
              onChangeText={(value) =>
                setForm({
                  ...form,
                  customerName: value,
                })
              }
            />

            <TextInput
              style={styles.input}
              placeholder="Produk / jenis cetakan"
              value={form.product}
              onChangeText={(value) =>
                setForm({
                  ...form,
                  product: value,
                })
              }
            />

            <TextInput
              style={styles.input}
              placeholder="Quantity"
              keyboardType="numeric"
              value={form.quantity}
              onChangeText={(value) =>
                setForm({
                  ...form,
                  quantity: value,
                })
              }
            />

            <TextInput
              style={styles.input}
              placeholder="Deadline, contoh: 25-09-2026"
              value={form.deadline}
              onChangeText={(value) =>
                setForm({
                  ...form,
                  deadline: value,
                })
              }
            />

            <TextInput
              style={styles.input}
              placeholder="Status"
              value={form.status}
              onChangeText={(value) =>
                setForm({
                  ...form,
                  status: value,
                })
              }
            />

            <View style={styles.modalActions}>
              <Pressable
                style={styles.cancelButton}
                onPress={() =>
                  setModalVisible(false)
                }
              >
                <Text>
                  Batal
                </Text>
              </Pressable>

              <Pressable
                style={styles.saveButton}
                onPress={saveOrder}
                disabled={saving}
              >
                <Text style={styles.saveText}>
                  {saving
                    ? "Menyimpan..."
                    : "Simpan"}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 55,
    backgroundColor: "#fff",
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },

  title: {
    fontSize: 28,
    fontWeight: "900",
  },

  subtitle: {
    color: "#666",
    marginTop: 4,
  },

  addButton: {
    backgroundColor: "#111",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
  },

  addText: {
    color: "#fff",
    fontWeight: "700",
  },

  list: {
    paddingBottom: 30,
    gap: 12,
  },

  emptyContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  empty: {
    color: "#777",
  },

  card: {
    borderWidth: 1,
    borderColor: "#e5e5e5",
    borderRadius: 14,
    padding: 16,
  },

  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  customer: {
    fontSize: 18,
    fontWeight: "800",
  },

  status: {
    fontSize: 12,
    fontWeight: "700",
    color: "#666",
  },

  product: {
    fontSize: 16,
    marginVertical: 8,
  },

  actions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },

  editButton: {
    padding: 10,
    backgroundColor: "#eee",
    borderRadius: 8,
  },

  editText: {
    fontWeight: "700",
  },

  deleteButton: {
    padding: 10,
    backgroundColor: "#fee2e2",
    borderRadius: 8,
  },

  deleteText: {
    color: "#b91c1c",
    fontWeight: "700",
  },

  modalBackground: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    padding: 20,
  },

  modal: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 20,
  },

  modalTitle: {
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 20,
  },

  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 13,
    marginBottom: 12,
  },

  modalActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 8,
  },

  cancelButton: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    backgroundColor: "#eee",
  },

  saveButton: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    backgroundColor: "#111",
  },

  saveText: {
    color: "#fff",
    fontWeight: "700",
  },
});