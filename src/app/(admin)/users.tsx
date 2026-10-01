// src/app/(admin)/users.tsx

import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
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

const roles = ["admin", "operator", "supervisor"] as const;

export default function AdminUsers() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);

  const [name, setName] = useState("");
  const [role, setRole] =
    useState<"admin" | "operator" | "supervisor">("operator");

  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  /* =====================================================
     GET USERS
  ===================================================== */

  useEffect(() => {
    const usersRef = collection(db, "users");

    const unsubscribe = onSnapshot(
      usersRef,
      (snapshot) => {
        const data: UserProfile[] = snapshot.docs.map((item) => {
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
        console.error("Get users error:", error);

        setLoading(false);

        if (Platform.OS === "web") {
          window.alert("Gagal mengambil data user.");
        } else {
          Alert.alert("Error", "Gagal mengambil data user.");
        }
      }
    );

    return unsubscribe;
  }, []);

  /* =====================================================
     OPEN EDIT
  ===================================================== */

  const openEdit = (user: UserProfile) => {
    setSelectedUser(user);
    setName(user.name);
    setRole(user.role);
    setModalVisible(true);
  };

  /* =====================================================
     CLOSE MODAL
  ===================================================== */

  const closeModal = () => {
    if (saving) return;

    setModalVisible(false);
    setSelectedUser(null);
    setName("");
    setRole("operator");
  };

  /* =====================================================
     SAVE USER
  ===================================================== */

  const saveUser = async () => {
    if (!selectedUser) return;

    if (!name.trim()) {
      if (Platform.OS === "web") {
        window.alert("Nama wajib diisi.");
      } else {
        Alert.alert("Error", "Nama wajib diisi.");
      }

      return;
    }

    try {
      setSaving(true);

      await updateDoc(doc(db, "users", selectedUser.id), {
        name: name.trim(),
        role,
      });

      closeModal();
    } catch (error) {
      console.error("Update user error:", error);

      if (Platform.OS === "web") {
        window.alert("Gagal mengubah user.");
      } else {
        Alert.alert("Error", "Gagal mengubah user.");
      }
    } finally {
      setSaving(false);
    }
  };

  /* =====================================================
     DELETE USER - WEB + MOBILE
  ===================================================== */

  const deleteUserProfile = (user: UserProfile) => {
    // Jangan izinkan delete ketika proses delete sedang berjalan
    if (deletingId) return;

    /*
     * ===================================================
     * WEB
     * ===================================================
     *
     * React Native Web lebih aman menggunakan
     * window.confirm() daripada Alert.alert().
     */
    if (Platform.OS === "web") {
      const confirmed = window.confirm(
        `Apakah Anda yakin ingin menghapus profile "${user.name}"?\n\nEmail: ${user.email}`
      );

      if (!confirmed) {
        return;
      }

      handleDeleteUser(user);
      return;
    }

    /*
     * ===================================================
     * MOBILE
     * ===================================================
     */

    Alert.alert(
      "Hapus User",
      `Apakah Anda yakin ingin menghapus profile ${user.name}?`,
      [
        {
          text: "Batal",
          style: "cancel",
        },
        {
          text: "Hapus",
          style: "destructive",
          onPress: () => {
            handleDeleteUser(user);
          },
        },
      ]
    );
  };

  /* =====================================================
     ACTUAL DELETE FIRESTORE
  ===================================================== */

  const handleDeleteUser = async (user: UserProfile) => {
    if (deletingId) return;

    try {
      setDeletingId(user.id);

      console.log("Menghapus user:", user.id);

      await deleteDoc(doc(db, "users", user.id));

      console.log("User berhasil dihapus:", user.id);

      /*
       * Tidak perlu setUsers secara manual.
       *
       * Karena kita menggunakan onSnapshot(),
       * Firestore akan otomatis mengirim data terbaru
       * dan user yang dihapus akan hilang dari list.
       */

      if (Platform.OS === "web") {
        window.alert(`User "${user.name}" berhasil dihapus.`);
      } else {
        Alert.alert("Berhasil", `User "${user.name}" berhasil dihapus.`);
      }
    } catch (error: any) {
      console.error("Delete user error:", error);

      let message = "Gagal menghapus user.";

      if (error?.code === "permission-denied") {
        message =
          "Anda tidak memiliki izin untuk menghapus user dari Firestore.";
      }

      if (Platform.OS === "web") {
        window.alert(message);
      } else {
        Alert.alert("Error", message);
      }
    } finally {
      setDeletingId(null);
    }
  };

  /* =====================================================
     ROLE BADGE
  ===================================================== */

  const getRoleBadgeStyle = (userRole: string) => {
    switch (userRole) {
      case "admin":
        return {
          bg: "#0f172a",
          text: "#ffffff",
        };

      case "supervisor":
        return {
          bg: "#fef3c7",
          text: "#b45309",
        };

      default:
        return {
          bg: "#e0f2fe",
          text: "#0369a1",
        };
    }
  };

  /* =====================================================
     LOADING
  ===================================================== */

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0f172a" />
      </View>
    );
  }

  /* =====================================================
     UI
  ===================================================== */

  return (
    <View style={styles.container}>
      {/* HEADER */}

      <View style={styles.header}>
        <Text style={styles.title}>Pengelola User</Text>

        <Text style={styles.subtitle}>
          Kelola hak akses dan peran pengguna sistem
        </Text>
      </View>

      {/* USER LIST */}

      <FlatList
        data={users}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons
              name="people-outline"
              size={48}
              color="#cbd5e1"
            />

            <Text style={styles.emptyText}>
              Belum ada pengguna terdaftar.
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const badgeStyle = getRoleBadgeStyle(item.role);

          const initials = item.name
            ? item.name.charAt(0).toUpperCase()
            : "U";

          const isDeleting = deletingId === item.id;

          return (
            <View style={styles.card}>
              {/* CARD HEADER */}

              <View style={styles.cardHeader}>
                {/* AVATAR */}

                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {initials}
                  </Text>
                </View>

                {/* USER INFO */}

                <View style={styles.userInfo}>
                  <Text
                    style={styles.name}
                    numberOfLines={1}
                  >
                    {item.name || "Tanpa Nama"}
                  </Text>

                  <Text
                    style={styles.email}
                    numberOfLines={1}
                  >
                    {item.email || "-"}
                  </Text>
                </View>

                {/* ROLE */}

                <View
                  style={[
                    styles.roleBadge,
                    {
                      backgroundColor: badgeStyle.bg,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.roleText,
                      {
                        color: badgeStyle.text,
                      },
                    ]}
                  >
                    {item.role}
                  </Text>
                </View>
              </View>

              {/* DIVIDER */}

              <View style={styles.divider} />

              {/* ACTIONS */}

              <View style={styles.actions}>
                {/* EDIT */}

                <Pressable
                  style={({ pressed }) => [
                    styles.actionButton,
                    styles.editButton,
                    pressed && styles.pressedState,
                  ]}
                  onPress={() => openEdit(item)}
                  disabled={!!deletingId}
                >
                  <Ionicons
                    name="create-outline"
                    size={16}
                    color="#334155"
                  />

                  <Text style={styles.actionText}>
                    Edit Role
                  </Text>
                </Pressable>

                {/* DELETE */}

                <Pressable
                  style={({ pressed }) => [
                    styles.actionButton,
                    styles.deleteButton,
                    isDeleting && styles.buttonDisabled,
                    pressed &&
                      !isDeleting &&
                      styles.pressedState,
                  ]}
                  onPress={() => deleteUserProfile(item)}
                  disabled={!!deletingId}
                >
                  {isDeleting ? (
                    <ActivityIndicator
                      size="small"
                      color="#ef4444"
                    />
                  ) : (
                    <Ionicons
                      name="trash-outline"
                      size={16}
                      color="#ef4444"
                    />
                  )}

                  <Text
                    style={[
                      styles.actionText,
                      styles.deleteText,
                    ]}
                  >
                    {isDeleting ? "Menghapus..." : "Hapus"}
                  </Text>
                </Pressable>
              </View>
            </View>
          );
        }}
      />

      {/* =================================================
          EDIT USER MODAL
      ================================================= */}

      <Modal
        visible={modalVisible}
        animationType="fade"
        transparent
        onRequestClose={closeModal}
      >
        <View style={styles.modalBackground}>
          <View style={styles.modalCard}>
            {/* MODAL HEADER */}

            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Edit Profile User
              </Text>

              <Pressable
                onPress={closeModal}
                hitSlop={8}
                disabled={saving}
              >
                <Ionicons
                  name="close"
                  size={20}
                  color="#64748b"
                />
              </Pressable>
            </View>

            {/* NAME */}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Nama Pengguna
              </Text>

              <TextInput
                style={styles.input}
                placeholder="Masukkan nama"
                placeholderTextColor="#94a3b8"
                value={name}
                onChangeText={setName}
                editable={!saving}
              />
            </View>

            {/* ROLE */}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Pilih Role / Akses
              </Text>

              <View style={styles.roleOptions}>
                {roles.map((item) => {
                  const isSelected = role === item;

                  return (
                    <Pressable
                      key={item}
                      style={[
                        styles.roleOption,
                        isSelected &&
                          styles.roleOptionSelected,
                      ]}
                      onPress={() => setRole(item)}
                      disabled={saving}
                    >
                      <View style={styles.radioContainer}>
                        <View
                          style={[
                            styles.radioOuter,
                            isSelected &&
                              styles.radioOuterSelected,
                          ]}
                        >
                          {isSelected && (
                            <View
                              style={styles.radioInner}
                            />
                          )}
                        </View>

                        <Text
                          style={[
                            styles.roleOptionText,
                            isSelected &&
                              styles.roleOptionTextSelected,
                          ]}
                        >
                          {item.charAt(0).toUpperCase() +
                            item.slice(1)}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* MODAL ACTIONS */}

            <View style={styles.modalActions}>
              {/* CANCEL */}

              <Pressable
                style={({ pressed }) => [
                  styles.modalCancelButton,
                  pressed && styles.pressedState,
                ]}
                onPress={closeModal}
                disabled={saving}
              >
                <Text style={styles.modalCancelText}>
                  Batal
                </Text>
              </Pressable>

              {/* SAVE */}

              <Pressable
                style={({ pressed }) => [
                  styles.modalSaveButton,
                  saving && styles.buttonDisabled,
                  pressed &&
                    !saving &&
                    styles.pressedState,
                ]}
                onPress={saveUser}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator
                    color="#ffffff"
                    size="small"
                  />
                ) : (
                  <Text style={styles.modalSaveText}>
                    Simpan Perubahan
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

  /* =================================================
     CARD
  ================================================= */

  card: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#f1f5f9",

    shadowColor: "#0f172a",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.03,
    shadowRadius: 10,

    elevation: 2,
  },

  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
  },

  avatarText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#334155",
  },

  userInfo: {
    flex: 1,
    minWidth: 0,
  },

  name: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0f172a",
  },

  email: {
    fontSize: 12.5,
    color: "#64748b",
    marginTop: 2,
  },

  roleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },

  roleText: {
    fontSize: 11.5,
    fontWeight: "600",
    textTransform: "capitalize",
  },

  divider: {
    height: 1,
    backgroundColor: "#f8fafc",
    marginVertical: 12,
  },

  /* =================================================
     ACTIONS
  ================================================= */

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

  /* =================================================
     MODAL
  ================================================= */

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
    gap: 20,

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 10,
    },
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
    gap: 8,
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

  /* =================================================
     ROLE OPTIONS
  ================================================= */

  roleOptions: {
    gap: 8,
  },

  roleOption: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 12,
    borderRadius: 10,
    backgroundColor: "#f8fafc",
  },

  roleOptionSelected: {
    borderColor: "#0f172a",
    backgroundColor: "#ffffff",
  },

  radioContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  radioOuter: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: "#94a3b8",
    alignItems: "center",
    justifyContent: "center",
  },

  radioOuterSelected: {
    borderColor: "#0f172a",
  },

  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#0f172a",
  },

  roleOptionText: {
    fontSize: 13.5,
    color: "#64748b",
    fontWeight: "500",
  },

  roleOptionTextSelected: {
    color: "#0f172a",
    fontWeight: "600",
  },

  /* =================================================
     MODAL ACTIONS
  ================================================= */

  modalActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
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