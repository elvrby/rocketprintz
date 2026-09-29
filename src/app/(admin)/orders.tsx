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
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

import { db } from "../../firebase/config";

// --- TYPES ---
export type OrderStatus = "pending" | "processing" | "completed";

interface Order {
  id: string;
  customerName: string;
  product: string;
  quantity: number;
  deadline: string; // ISO string atau YYYY-MM-DD
  status: OrderStatus;
}

const STATUS_OPTIONS: { label: string; value: OrderStatus; color: string; bg: string }[] = [
  { label: "Pending", value: "pending", color: "#D97706", bg: "#FEF3C7" },
  { label: "Processing", value: "processing", color: "#2563EB", bg: "#DBEAFE" },
  { label: "Completed", value: "completed", color: "#059669", bg: "#D1FAE5" },
];

const initialForm = {
  customerName: "",
  product: "",
  quantity: "",
  deadline: new Date(),
  status: "pending" as OrderStatus,
};

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalVisible, setModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [form, setForm] = useState(initialForm);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [statusPickerVisible, setStatusPickerVisible] = useState(false);

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
            deadline: value.deadline ?? new Date().toISOString().split("T")[0],
            status: (value.status as OrderStatus) ?? "pending",
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

    // Parsing string deadline ke Date object
    const parsedDate = order.deadline ? new Date(order.deadline) : new Date();

    setForm({
      customerName: order.customerName,
      product: order.product,
      quantity: String(order.quantity),
      deadline: isNaN(parsedDate.getTime()) ? new Date() : parsedDate,
      status: order.status,
    });

    setModalVisible(true);
  };

  const saveOrder = async () => {
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

    try {
      setSaving(true);

      const formattedDeadline = form.deadline.toISOString().split("T")[0];

      const orderData = {
        customerName: form.customerName.trim(),
        product: form.product.trim(),
        quantity: Number(form.quantity),
        deadline: formattedDeadline,
        status: form.status,
        updatedAt: serverTimestamp(),
      };

      if (editingId) {
        await updateDoc(doc(db, "orders", editingId), orderData);
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
      Alert.alert("Error", "Gagal menyimpan order.");
    } finally {
      setSaving(false);
    }
  };

  const deleteOrder = (id: string) => {
    Alert.alert(
      "Hapus Order",
      "Apakah kamu yakin ingin menghapus order ini?",
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Hapus",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDoc(doc(db, "orders", id));
            } catch (error) {
              console.error(error);
              Alert.alert("Error", "Gagal menghapus order.");
            }
          },
        },
      ]
    );
  };

  const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === "ios");
    if (selectedDate) {
      setForm((prev) => ({ ...prev, deadline: selectedDate }));
    }
  };

  const formatDateLabel = (dateString: string) => {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const renderStatusBadge = (status: OrderStatus) => {
    const config =
      STATUS_OPTIONS.find((s) => s.value === status) || STATUS_OPTIONS[0];

    return (
      <View style={[styles.badge, { backgroundColor: config.bg }]}>
        <Text style={[styles.badgeText, { color: config.color }]}>
          {config.label}
        </Text>
      </View>
    );
  };

  const renderOrder = ({ item }: { item: Order }) => {
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.customer}>{item.customerName}</Text>
          {renderStatusBadge(item.status)}
        </View>

        <Text style={styles.product}>{item.product}</Text>

        <View style={styles.detailsRow}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Jumlah</Text>
            <Text style={styles.detailValue}>{item.quantity} pcs</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Deadline</Text>
            <Text style={styles.detailValue}>
              {formatDateLabel(item.deadline)}
            </Text>
          </View>
        </View>

        <View style={styles.actions}>
          <Pressable
            style={[styles.actionBtn, styles.editButton]}
            onPress={() => openEditModal(item)}
          >
            <Text style={styles.editText}>Edit</Text>
          </Pressable>

          <Pressable
            style={[styles.actionBtn, styles.deleteButton]}
            onPress={() => deleteOrder(item.id)}
          >
            <Text style={styles.deleteText}>Hapus</Text>
          </Pressable>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Orders</Text>
          <Text style={styles.subtitle}>Kelola order RocketPrintz</Text>
        </View>

        <Pressable style={styles.addButton} onPress={openAddModal}>
          <Text style={styles.addText}>+ Tambah</Text>
        </Pressable>
      </View>

      {/* List Orders */}
      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        renderItem={renderOrder}
        contentContainerStyle={
          orders.length === 0 ? styles.emptyContainer : styles.list
        }
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyTitle}>Belum Ada Order</Text>
            <Text style={styles.emptySubtitle}>
              Klik tombol "+ Tambah" untuk memasukkan orderan baru.
            </Text>
          </View>
        }
      />

      {/* Modal Form Tambah/Edit */}
      <Modal
        visible={modalVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalBackground}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>
              {editingId ? "Edit Order" : "Tambah Order"}
            </Text>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Input Customer */}
              <Text style={styles.inputLabel}>Nama Customer</Text>
              <TextInput
                style={styles.input}
                placeholder="Contoh: Budi Santoso"
                placeholderTextColor="#9CA3AF"
                value={form.customerName}
                onChangeText={(value) =>
                  setForm({ ...form, customerName: value })
                }
              />

              {/* Input Produk */}
              <Text style={styles.inputLabel}>Produk / Jenis Cetakan</Text>
              <TextInput
                style={styles.input}
                placeholder="Contoh: Banner 3x1 m"
                placeholderTextColor="#9CA3AF"
                value={form.product}
                onChangeText={(value) => setForm({ ...form, product: value })}
              />

              {/* Input Quantity */}
              <Text style={styles.inputLabel}>Quantity</Text>
              <TextInput
                style={styles.input}
                placeholder="0"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
                value={form.quantity}
                onChangeText={(value) => setForm({ ...form, quantity: value })}
              />

              {/* Input Deadline Date Picker */}
              <Text style={styles.inputLabel}>Deadline</Text>
              <Pressable
                style={styles.pickerSelector}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={styles.pickerSelectorText}>
                  {form.deadline.toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </Text>
              </Pressable>

              {showDatePicker && (
                <DateTimePicker
                  value={form.deadline}
                  mode="date"
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  onChange={handleDateChange}
                  minimumDate={new Date()}
                />
              )}

              {/* Picker Choice Status */}
              <Text style={styles.inputLabel}>Status Order</Text>
              <Pressable
                style={styles.pickerSelector}
                onPress={() => setStatusPickerVisible(!statusPickerVisible)}
              >
                <Text style={styles.pickerSelectorText}>
                  {STATUS_OPTIONS.find((s) => s.value === form.status)?.label}
                </Text>
              </Pressable>

              {/* List Pilihan Status */}
              {statusPickerVisible && (
                <View style={styles.statusOptionsContainer}>
                  {STATUS_OPTIONS.map((opt) => (
                    <Pressable
                      key={opt.value}
                      style={[
                        styles.statusOptionItem,
                        form.status === opt.value && styles.statusOptionActive,
                      ]}
                      onPress={() => {
                        setForm({ ...form, status: opt.value });
                        setStatusPickerVisible(false);
                      }}
                    >
                      <View
                        style={[
                          styles.statusDot,
                          { backgroundColor: opt.color },
                        ]}
                      />
                      <Text
                        style={[
                          styles.statusOptionText,
                          form.status === opt.value && styles.statusOptionTextActive,
                        ]}
                      >
                        {opt.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </ScrollView>

            {/* Modal Buttons */}
            <View style={styles.modalActions}>
              <Pressable
                style={styles.cancelButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelText}>Batal</Text>
              </Pressable>

              <Pressable
                style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                onPress={saveOrder}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.saveText}>Simpan</Text>
                )}
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
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  addText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 14,
  },
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

  // Card Styles
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  customer: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "700",
  },
  product: {
    fontSize: 15,
    fontWeight: "500",
    color: "#4B5563",
    marginVertical: 10,
  },
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

  // Modal Styles
  modalBackground: {
    flex: 1,
    backgroundColor: "rgba(17, 24, 39, 0.6)",
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
});