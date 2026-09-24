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
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  updateDoc,
} from "firebase/firestore";

import { db } from "../../firebase/config";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: "admin" | "operator" | "supervisor";
}

const roles = [
  "admin",
  "operator",
  "supervisor",
] as const;

export default function AdminUsers() {
  const [users, setUsers] =
    useState<UserProfile[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [modalVisible, setModalVisible] =
    useState(false);

  const [selectedUser, setSelectedUser] =
    useState<UserProfile | null>(null);

  const [name, setName] =
    useState("");

  const [role, setRole] =
    useState<
      "admin" | "operator" | "supervisor"
    >("operator");

  const [saving, setSaving] =
    useState(false);

  useEffect(() => {
    const usersRef =
      collection(db, "users");

    const unsubscribe = onSnapshot(
      usersRef,
      (snapshot) => {
        const data: UserProfile[] =
          snapshot.docs.map((item) => {
            const value = item.data();

            return {
              id: item.id,
              name: value.name ?? "",
              email: value.email ?? "",
              role: value.role ?? "operator",
            };
          });

        setUsers(data);
        setLoading(false);
      },
      (error) => {
        console.error(error);

        setLoading(false);

        Alert.alert(
          "Error",
          "Gagal mengambil data user."
        );
      }
    );

    return unsubscribe;
  }, []);

  const openEdit = (
    user: UserProfile
  ) => {
    setSelectedUser(user);
    setName(user.name);
    setRole(user.role);
    setModalVisible(true);
  };

  const saveUser = async () => {
    if (!selectedUser) {
      return;
    }

    if (!name.trim()) {
      Alert.alert(
        "Error",
        "Nama wajib diisi."
      );

      return;
    }

    try {
      setSaving(true);

      await updateDoc(
        doc(db, "users", selectedUser.id),
        {
          name: name.trim(),
          role,
        }
      );

      setModalVisible(false);
      setSelectedUser(null);
    } catch (error) {
      console.error(error);

      Alert.alert(
        "Error",
        "Gagal mengubah user."
      );
    } finally {
      setSaving(false);
    }
  };

  const deleteUserProfile = (
    user: UserProfile
  ) => {
    Alert.alert(
      "Hapus User",
      `Hapus profile ${user.name}?`,
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
                doc(db, "users", user.id)
              );

              Alert.alert(
                "Berhasil",
                "Profile Firestore telah dihapus."
              );
            } catch (error) {
              console.error(error);

              Alert.alert(
                "Error",
                "Gagal menghapus profile."
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
      <Text style={styles.title}>
        Users
      </Text>

      <Text style={styles.subtitle}>
        Kelola role pengguna RocketPrintz
      </Text>

      <FlatList
        data={users}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.empty}>
            Belum ada user.
          </Text>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.name}>
              {item.name}
            </Text>

            <Text style={styles.email}>
              {item.email}
            </Text>

            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>
                {item.role}
              </Text>
            </View>

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
                  deleteUserProfile(item)
                }
              >
                <Text style={styles.deleteText}>
                  Hapus Profile
                </Text>
              </Pressable>
            </View>
          </View>
        )}
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
              Edit User
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Nama"
              value={name}
              onChangeText={setName}
            />

            <Text style={styles.label}>
              Role
            </Text>

            <View style={styles.roleOptions}>
              {roles.map((item) => (
                <Pressable
                  key={item}
                  style={[
                    styles.roleOption,
                    role === item &&
                      styles.roleSelected,
                  ]}
                  onPress={() =>
                    setRole(item)
                  }
                >
                  <Text
                    style={
                      role === item
                        ? styles.roleSelectedText
                        : undefined
                    }
                  >
                    {item}
                  </Text>
                </Pressable>
              ))}
            </View>

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
                onPress={saveUser}
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
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  title: {
    fontSize: 28,
    fontWeight: "900",
  },

  subtitle: {
    color: "#666",
    marginTop: 4,
    marginBottom: 20,
  },

  list: {
    gap: 12,
    paddingBottom: 30,
  },

  empty: {
    textAlign: "center",
    color: "#777",
    marginTop: 40,
  },

  card: {
    borderWidth: 1,
    borderColor: "#e5e5e5",
    borderRadius: 14,
    padding: 16,
  },

  name: {
    fontSize: 18,
    fontWeight: "800",
  },

  email: {
    color: "#666",
    marginTop: 4,
  },

  roleBadge: {
    alignSelf: "flex-start",
    marginTop: 10,
    backgroundColor: "#eee",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },

  roleText: {
    fontWeight: "700",
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
    marginBottom: 18,
  },

  label: {
    fontWeight: "700",
    marginBottom: 10,
  },

  roleOptions: {
    gap: 8,
  },

  roleOption: {
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 12,
    borderRadius: 10,
  },

  roleSelected: {
    backgroundColor: "#111",
    borderColor: "#111",
  },

  roleSelectedText: {
    color: "#fff",
    fontWeight: "700",
  },

  modalActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 20,
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