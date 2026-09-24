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
  const [materials, setMaterials] =
    useState<Material[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [modalVisible, setModalVisible] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [editingId, setEditingId] =
    useState<string | null>(null);

  const [form, setForm] =
    useState(initialForm);

  useEffect(() => {
    const materialsRef =
      collection(db, "materials");

    const unsubscribe = onSnapshot(
      materialsRef,
      (snapshot) => {
        const data: Material[] =
          snapshot.docs.map((item) => {
            const value = item.data();

            return {
              id: item.id,
              name: value.name ?? "",
              stock: value.stock ?? 0,
              unit: value.unit ?? "",
              minimumStock:
                value.minimumStock ?? 0,
            };
          });

        setMaterials(data);
        setLoading(false);
      },
      (error) => {
        console.error(error);

        setLoading(false);

        Alert.alert(
          "Error",
          "Gagal mengambil data bahan."
        );
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
      minimumStock:
        String(material.minimumStock),
    });

    setModalVisible(true);
  };

  const saveMaterial = async () => {
    if (
      !form.name.trim() ||
      !form.stock.trim() ||
      !form.unit.trim()
    ) {
      Alert.alert(
        "Data belum lengkap",
        "Nama, stok, dan satuan wajib diisi."
      );

      return;
    }

    try {
      setSaving(true);

      const data = {
        name: form.name.trim(),
        stock: Number(form.stock),
        unit: form.unit.trim(),
        minimumStock:
          Number(form.minimumStock) || 0,
        updatedAt: serverTimestamp(),
      };

      if (editingId) {
        await updateDoc(
          doc(db, "materials", editingId),
          data
        );
      } else {
        await addDoc(
          collection(db, "materials"),
          {
            ...data,
            createdAt: serverTimestamp(),
          }
        );
      }

      setModalVisible(false);
      setEditingId(null);
      setForm(initialForm);
    } catch (error) {
      console.error(error);

      Alert.alert(
        "Error",
        "Gagal menyimpan bahan."
      );
    } finally {
      setSaving(false);
    }
  };

  const deleteMaterial = (id: string) => {
    Alert.alert(
      "Hapus Bahan",
      "Bahan ini akan dihapus.",
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
                doc(db, "materials", id)
              );
            } catch (error) {
              console.error(error);

              Alert.alert(
                "Error",
                "Gagal menghapus bahan."
              );
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>
            Materials
          </Text>

          <Text style={styles.subtitle}>
            Stok bahan produksi
          </Text>
        </View>

        <Pressable
          style={styles.addButton}
          onPress={openAdd}
        >
          <Text style={styles.addText}>
            + Bahan
          </Text>
        </Pressable>
      </View>

      <FlatList
        data={materials}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.empty}>
            Belum ada bahan.
          </Text>
        }
        renderItem={({ item }) => {
          const lowStock =
            item.stock <= item.minimumStock;

          return (
            <View style={styles.card}>
              <View style={styles.row}>
                <Text style={styles.name}>
                  {item.name}
                </Text>

                {lowStock && (
                  <Text style={styles.warning}>
                    Stok rendah
                  </Text>
                )}
              </View>

              <Text style={styles.stock}>
                {item.stock} {item.unit}
              </Text>

              <Text style={styles.minimum}>
                Minimum: {item.minimumStock}{" "}
                {item.unit}
              </Text>

              <View style={styles.actions}>
                <Pressable
                  style={styles.editButton}
                  onPress={() =>
                    openEdit(item)
                  }
                >
                  <Text>Edit</Text>
                </Pressable>

                <Pressable
                  style={styles.deleteButton}
                  onPress={() =>
                    deleteMaterial(item.id)
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
                ? "Edit Bahan"
                : "Tambah Bahan"}
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Nama bahan"
              value={form.name}
              onChangeText={(value) =>
                setForm({
                  ...form,
                  name: value,
                })
              }
            />

            <TextInput
              style={styles.input}
              placeholder="Stok"
              keyboardType="numeric"
              value={form.stock}
              onChangeText={(value) =>
                setForm({
                  ...form,
                  stock: value,
                })
              }
            />

            <TextInput
              style={styles.input}
              placeholder="Satuan, contoh: lembar / meter / kg"
              value={form.unit}
              onChangeText={(value) =>
                setForm({
                  ...form,
                  unit: value,
                })
              }
            />

            <TextInput
              style={styles.input}
              placeholder="Minimum stok"
              keyboardType="numeric"
              value={form.minimumStock}
              onChangeText={(value) =>
                setForm({
                  ...form,
                  minimumStock: value,
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
                <Text>Batal</Text>
              </Pressable>

              <Pressable
                style={styles.saveButton}
                onPress={saveMaterial}
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
  },

  addButton: {
    backgroundColor: "#111",
    padding: 12,
    borderRadius: 10,
  },

  addText: {
    color: "#fff",
    fontWeight: "700",
  },

  list: {
    gap: 12,
    paddingBottom: 30,
  },

  empty: {
    textAlign: "center",
    marginTop: 40,
    color: "#777",
  },

  card: {
    borderWidth: 1,
    borderColor: "#e5e5e5",
    borderRadius: 14,
    padding: 16,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  name: {
    fontSize: 18,
    fontWeight: "800",
  },

  warning: {
    color: "#b91c1c",
    fontWeight: "700",
  },

  stock: {
    fontSize: 24,
    fontWeight: "800",
    marginTop: 10,
  },

  minimum: {
    color: "#666",
    marginTop: 4,
  },

  actions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },

  editButton: {
    backgroundColor: "#eee",
    padding: 10,
    borderRadius: 8,
  },

  deleteButton: {
    backgroundColor: "#fee2e2",
    padding: 10,
    borderRadius: 8,
  },

  deleteText: {
    color: "#b91c1c",
    fontWeight: "700",
  },

  modalBackground: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,.45)",
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