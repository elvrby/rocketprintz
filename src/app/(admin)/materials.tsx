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

import { Ionicons } from "@expo/vector-icons";
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

interface Material {
  id: string;
  name: string;
  stock: number;
  unit: string;
  minimumStock: number;
}

const initialForm = {
  name: "",
  stock: "",
  unit: "",
  minimumStock: "",
};

export default function AdminMaterials() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    const materialsRef = collection(db, "materials");

    const unsubscribe = onSnapshot(
      materialsRef,
      (snapshot) => {
        const data: Material[] = snapshot.docs.map((item) => {
          const value = item.data();

          return {
            id: item.id,
            name: value.name ?? "",
            stock: value.stock ?? 0,
            unit: value.unit ?? "",
            minimumStock: value.minimumStock ?? 0,
          };
        });

        setMaterials(data);
        setLoading(false);
      },
      (error) => {
        console.error(error);
        setLoading(false);
        Alert.alert("Error", "Gagal mengambil data bahan.");
      }
    );

    return unsubscribe;
  }, []);

  const openAdd = () => {
    setEditingId(null);
    setForm(initialForm);
    setModalVisible(true);
  };

  const openEdit = (material: Material) => {
    setEditingId(material.id);
    setForm({
      name: material.name,
      stock: String(material.stock),
      unit: material.unit,
      minimumStock: String(material.minimumStock),
    });
    setModalVisible(true);
  };

  const saveMaterial = async () => {
    if (!form.name.trim() || !form.stock.trim() || !form.unit.trim()) {
      Alert.alert("Data belum lengkap", "Nama, stok, dan satuan wajib diisi.");
      return;
    }

    try {
      setSaving(true);

      const data = {
        name: form.name.trim(),
        stock: Number(form.stock),
        unit: form.unit.trim(),
        minimumStock: Number(form.minimumStock) || 0,
        updatedAt: serverTimestamp(),
      };

      if (editingId) {
        await updateDoc(doc(db, "materials", editingId), data);
      } else {
        await addDoc(collection(db, "materials"), {
          ...data,
          createdAt: serverTimestamp(),
        });
      }

      setModalVisible(false);
      setEditingId(null);
      setForm(initialForm);
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Gagal menyimpan bahan.");
    } finally {
      setSaving(false);
    }
  };

  const deleteMaterial = (id: string) => {
    Alert.alert("Hapus Bahan", "Bahan ini akan dihapus dari sistem.", [
      { text: "Batal", style: "cancel" },
      {
        text: "Hapus",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteDoc(doc(db, "materials", id));
          } catch (error) {
            console.error(error);
            Alert.alert("Error", "Gagal menghapus bahan.");
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0f172a" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* HEADER SECTION */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Bahan Produksi</Text>
          <Text style={styles.subtitle}>Kelola persediaan dan batas minimum stok</Text>
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.addButton,
            pressed && styles.pressedState,
          ]}
          onPress={openAdd}
        >
          <Ionicons name="add" size={18} color="#ffffff" />
          <Text style={styles.addText}>Bahan</Text>
        </Pressable>
      </View>

      {/* MATERIALS LIST */}
      <FlatList
        data={materials}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="cube-outline" size={48} color="#cbd5e1" />
            <Text style={styles.emptyText}>Belum ada data bahan produksi.</Text>
          </View>
        }
        renderItem={({ item }) => {
          const lowStock = item.stock <= item.minimumStock;

          return (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.iconContainer}>
                  <Ionicons name="cube-outline" size={20} color="#334155" />
                </View>

                <View style={styles.materialInfo}>
                  <Text style={styles.name}>{item.name}</Text>
                </View>

                {/* STATUS BADGE */}
                <View
                  style={[
                    styles.statusBadge,
                    lowStock ? styles.warningBadge : styles.safeBadge,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      lowStock ? styles.warningText : styles.safeText,
                    ]}
                  >
                    {lowStock ? "Stok Rendah" : "Aman"}
                  </Text>
                </View>
              </View>

              {/* STOCK METRICS */}
              <View style={styles.metricsContainer}>
                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel}>Stok Saat Ini</Text>
                  <Text style={[styles.stockValue, lowStock && styles.stockValueWarning]}>
                    {item.stock} <Text style={styles.unitText}>{item.unit}</Text>
                  </Text>
                </View>

                <View style={styles.metricDivider} />

                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel}>Minimum Stok</Text>
                  <Text style={styles.minimumValue}>
                    {item.minimumStock} <Text style={styles.unitText}>{item.unit}</Text>
                  </Text>
                </View>
              </View>

              <View style={styles.divider} />

              {/* ACTIONS */}
              <View style={styles.actions}>
                <Pressable
                  style={({ pressed }) => [
                    styles.actionButton,
                    styles.editButton,
                    pressed && styles.pressedState,
                  ]}
                  onPress={() => openEdit(item)}
                >
                  <Ionicons name="create-outline" size={16} color="#334155" />
                  <Text style={styles.actionText}>Edit</Text>
                </Pressable>

                <Pressable
                  style={({ pressed }) => [
                    styles.actionButton,
                    styles.deleteButton,
                    pressed && styles.pressedState,
                  ]}
                  onPress={() => deleteMaterial(item.id)}
                >
                  <Ionicons name="trash-outline" size={16} color="#ef4444" />
                  <Text style={[styles.actionText, styles.deleteText]}>
                    Hapus
                  </Text>
                </Pressable>
              </View>
            </View>
          );
        }}
      />

      {/* MODAL FORM */}
      <Modal
        visible={modalVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalBackground}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingId ? "Edit Bahan" : "Tambah Bahan"}
              </Text>
              <Pressable
                onPress={() => setModalVisible(false)}
                hitSlop={8}
              >
                <Ionicons name="close" size={20} color="#64748b" />
              </Pressable>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nama Bahan</Text>
              <TextInput
                style={styles.input}
                placeholder="Contoh: Kertas A4 / Tinta Hitam"
                placeholderTextColor="#94a3b8"
                value={form.name}
                onChangeText={(value) =>
                  setForm({ ...form, name: value })
                }
              />
            </View>

            <View style={styles.inputRow}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Jumlah Stok</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0"
                  placeholderTextColor="#94a3b8"
                  keyboardType="numeric"
                  value={form.stock}
                  onChangeText={(value) =>
                    setForm({ ...form, stock: value })
                  }
                />
              </View>

              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Satuan</Text>
                <TextInput
                  style={styles.input}
                  placeholder="lembar/kg/meter"
                  placeholderTextColor="#94a3b8"
                  value={form.unit}
                  onChangeText={(value) =>
                    setForm({ ...form, unit: value })
                  }
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Minimum Stok</Text>
              <TextInput
                style={styles.input}
                placeholder="0"
                placeholderTextColor="#94a3b8"
                keyboardType="numeric"
                value={form.minimumStock}
                onChangeText={(value) =>
                  setForm({ ...form, minimumStock: value })
                }
              />
            </View>

            <View style={styles.modalActions}>
              <Pressable
                style={({ pressed }) => [
                  styles.modalCancelButton,
                  pressed && styles.pressedState,
                ]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Batal</Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.modalSaveButton,
                  saving && styles.buttonDisabled,
                  pressed && !saving && styles.pressedState,
                ]}
                onPress={saveMaterial}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <Text style={styles.modalSaveText}>
                    {editingId ? "Simpan Perubahan" : "Tambah Bahan"}
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

/* =====================================================
   STYLES
===================================================== */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
    paddingHorizontal: 20,
    paddingTop: 40,
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8fafc",
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },

  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#0f172a",
    letterSpacing: -0.5,
  },

  subtitle: {
    fontSize: 13,
    color: "#64748b",
    marginTop: 4,
  },

  addButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0f172a",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 4,
  },

  addText: {
    color: "#ffffff",
    fontWeight: "600",
    fontSize: 13.5,
  },

  list: {
    gap: 12,
    paddingBottom: 32,
  },

  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
    gap: 10,
  },

  emptyText: {
    fontSize: 14,
    color: "#94a3b8",
  },

  pressedState: {
    opacity: 0.75,
  },

  /* CARD STYLES */

  card: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#f1f5f9",
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },

  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  iconContainer: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
  },

  materialInfo: {
    flex: 1,
  },

  name: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0f172a",
  },

  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },

  warningBadge: {
    backgroundColor: "#fef2f2",
  },

  safeBadge: {
    backgroundColor: "#f0fdf4",
  },

  statusText: {
    fontSize: 11.5,
    fontWeight: "600",
  },

  warningText: {
    color: "#ef4444",
  },

  safeText: {
    color: "#16a34a",
  },

  /* METRICS */

  metricsContainer: {
    flexDirection: "row",
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    padding: 12,
    marginTop: 14,
    alignItems: "center",
  },

  metricItem: {
    flex: 1,
  },

  metricDivider: {
    width: 1,
    height: "80%",
    backgroundColor: "#e2e8f0",
    marginHorizontal: 12,
  },

  metricLabel: {
    fontSize: 11.5,
    color: "#64748b",
    marginBottom: 2,
  },

  stockValue: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0f172a",
  },

  stockValueWarning: {
    color: "#ef4444",
  },

  minimumValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#475569",
  },

  unitText: {
    fontSize: 12,
    fontWeight: "400",
    color: "#64748b",
  },

  divider: {
    height: 1,
    backgroundColor: "#f8fafc",
    marginVertical: 12,
  },

  /* CARD ACTIONS */

  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
  },

  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },

  editButton: {
    backgroundColor: "#f1f5f9",
  },

  deleteButton: {
    backgroundColor: "#fef2f2",
  },

  actionText: {
    fontSize: 12.5,
    fontWeight: "600",
    color: "#334155",
  },

  deleteText: {
    color: "#ef4444",
  },

  /* MODAL STYLES */

  modalBackground: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },

  modalCard: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 24,
    gap: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
  },

  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0f172a",
  },

  inputGroup: {
    gap: 6,
  },

  inputRow: {
    flexDirection: "row",
    gap: 12,
  },

  label: {
    fontSize: 12.5,
    fontWeight: "600",
    color: "#334155",
  },

  input: {
    height: 44,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 14,
    color: "#0f172a",
    backgroundColor: "#f8fafc",
  },

  modalActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 8,
  },

  modalCancelButton: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
  },

  modalCancelText: {
    fontSize: 13.5,
    fontWeight: "600",
    color: "#475569",
  },

  modalSaveButton: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    backgroundColor: "#0f172a",
    alignItems: "center",
    justifyContent: "center",
  },

  modalSaveText: {
    fontSize: 13.5,
    fontWeight: "600",
    color: "#ffffff",
  },

  buttonDisabled: {
    opacity: 0.6,
  },
});