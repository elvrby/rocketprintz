import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { useAuth } from "../contexts/AuthContext";

const DESKTOP_WIDTH = 768;

export default function ProfilePage() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= DESKTOP_WIDTH;

  const { user, profile, logout } = useAuth();

  const [logoutModalVisible, setLogoutModalVisible] =
    useState(false);

  const [logoutLoading, setLogoutLoading] =
    useState(false);

  const displayName =
    profile?.name ||
    user?.displayName ||
    "Pengguna RocketPrintz";

  const email =
    profile?.email ||
    user?.email ||
    "-";

  const role =
    profile?.role ||
    "user";

  const formattedRole =
    role.charAt(0).toUpperCase() +
    role.slice(1);

  const initial =
    displayName
      .trim()
      .charAt(0)
      .toUpperCase() || "U";

  /* =========================
     EDIT PROFILE
  ========================= */

  const handleEditProfile = () => {
    router.push("/edit-profile");
  };

  /* =========================
     OPEN LOGOUT MODAL
  ========================= */

  const handleLogoutPress = () => {
    setLogoutModalVisible(true);
  };

  /* =========================
     CANCEL LOGOUT
  ========================= */

  const handleCancelLogout = () => {
    if (logoutLoading) {
      return;
    }

    setLogoutModalVisible(false);
  };

  /* =========================
     CONFIRM LOGOUT
  ========================= */

  const handleConfirmLogout = async () => {
    if (logoutLoading) {
      return;
    }

    try {
      setLogoutLoading(true);

      console.log(
        "Profile: mulai logout..."
      );

      await logout();

      console.log(
        "Profile: logout berhasil"
      );

      setLogoutModalVisible(false);

      router.replace("/(auth)/login");
    } catch (error) {
      console.error(
        "Profile logout error:",
        error
      );

      setLogoutLoading(false);

      setLogoutModalVisible(false);
    }
  };

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.content,
          isDesktop &&
            styles.contentDesktop,
        ]}
        showsVerticalScrollIndicator={
          false
        }
      >
        <View style={styles.wrapper}>
          {/* =========================
              HEADER
          ========================= */}

          <View style={styles.pageHeader}>
            <View>
              <Text style={styles.title}>
                Profile
              </Text>

              <Text style={styles.subtitle}>
                Kelola informasi akun RocketPrintz
              </Text>
            </View>
          </View>

          {/* =========================
              PROFILE CARD
          ========================= */}

          <View style={styles.profileCard}>
            <View style={styles.profileTop}>
              {/* AVATAR */}

              <View style={styles.avatar}>
                <Text
                  style={styles.avatarText}
                >
                  {initial}
                </Text>
              </View>

              {/* USER INFO */}

              <View
                style={styles.profileInfo}
              >
                <Text style={styles.name}>
                  {displayName}
                </Text>

                <Text style={styles.email}>
                  {email}
                </Text>

                <View
                  style={styles.roleBadge}
                >
                  <Ionicons
                    name="shield-checkmark-outline"
                    size={14}
                    color="#111827"
                  />

                  <Text
                    style={styles.roleText}
                  >
                    {formattedRole}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* =========================
              ACCOUNT INFORMATION
          ========================= */}

          <View style={styles.section}>
            <Text
              style={styles.sectionTitle}
            >
              Account Information
            </Text>

            <View style={styles.infoCard}>
              <InfoRow
                icon="person-outline"
                label="Nama"
                value={displayName}
              />

              <View
                style={styles.divider}
              />

              <InfoRow
                icon="mail-outline"
                label="Email"
                value={email}
              />

              <View
                style={styles.divider}
              />

              <InfoRow
                icon="shield-outline"
                label="Role"
                value={formattedRole}
              />
            </View>
          </View>

          {/* =========================
              ACTIONS
          ========================= */}

          <View style={styles.section}>
            <Text
              style={styles.sectionTitle}
            >
              Account
            </Text>

            <View style={styles.actionCard}>
              {/* EDIT PROFILE */}

              <Pressable
                style={({ pressed }) => [
                  styles.actionButton,
                  pressed &&
                    styles.actionButtonPressed,
                ]}
                onPress={
                  handleEditProfile
                }
              >
                <View
                  style={styles.actionIcon}
                >
                  <Ionicons
                    name="create-outline"
                    size={19}
                    color="#374151"
                  />
                </View>

                <View
                  style={
                    styles.actionTextContainer
                  }
                >
                  <Text
                    style={
                      styles.actionTitle
                    }
                  >
                    Edit Profile
                  </Text>

                  <Text
                    style={
                      styles.actionDescription
                    }
                  >
                    Ubah informasi profile kamu
                  </Text>
                </View>

                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color="#9ca3af"
                />
              </Pressable>

              <View
                style={styles.divider}
              />

              {/* LOGOUT */}

              <Pressable
                style={({ pressed }) => [
                  styles.actionButton,
                  pressed &&
                    styles.logoutPressed,
                ]}
                onPress={
                  handleLogoutPress
                }
                disabled={logoutLoading}
              >
                <View
                  style={styles.logoutIcon}
                >
                  <Ionicons
                    name="log-out-outline"
                    size={19}
                    color="#dc2626"
                  />
                </View>

                <View
                  style={
                    styles.actionTextContainer
                  }
                >
                  <Text
                    style={
                      styles.logoutTitle
                    }
                  >
                    Logout
                  </Text>

                  <Text
                    style={
                      styles.actionDescription
                    }
                  >
                    Keluar dari akun RocketPrintz
                  </Text>
                </View>

                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color="#9ca3af"
                />
              </Pressable>
            </View>
          </View>

          {/* =========================
              APP INFO
          ========================= */}

          <View style={styles.appInfo}>
            <Text style={styles.appName}>
              ROCKETPRINTZ
            </Text>

            <Text style={styles.version}>
              Print Shop Management System
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* =========================
          LOGOUT MODAL
      ========================= */}

      <Modal
        visible={logoutModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={
          handleCancelLogout
        }
      >
        <View style={styles.modalOverlay}>
          <View style={styles.logoutModal}>
            {/* ICON */}

            <View style={styles.modalIcon}>
              <Ionicons
                name="log-out-outline"
                size={28}
                color="#dc2626"
              />
            </View>

            {/* TITLE */}

            <Text style={styles.modalTitle}>
              Logout
            </Text>

            {/* DESCRIPTION */}

            <Text
              style={styles.modalDescription}
            >
              Apakah kamu yakin ingin keluar
              dari akun RocketPrintz?
            </Text>

            {/* BUTTONS */}

            <View
              style={styles.modalButtons}
            >
              {/* CANCEL */}

              <Pressable
                style={({ pressed }) => [
                  styles.cancelButton,
                  pressed &&
                    styles.cancelButtonPressed,
                ]}
                onPress={
                  handleCancelLogout
                }
                disabled={logoutLoading}
              >
                <Text
                  style={styles.cancelText}
                >
                  Batal
                </Text>
              </Pressable>

              {/* LOGOUT */}

              <Pressable
                style={({ pressed }) => [
                  styles.confirmLogoutButton,
                  pressed &&
                    styles.confirmLogoutPressed,
                ]}
                onPress={
                  handleConfirmLogout
                }
                disabled={logoutLoading}
              >
                {logoutLoading ? (
                  <Text
                    style={
                      styles.confirmLogoutText
                    }
                  >
                    Keluar...
                  </Text>
                ) : (
                  <Text
                    style={
                      styles.confirmLogoutText
                    }
                  >
                    Logout
                  </Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

/* =========================
   INFO ROW
========================= */

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIcon}>
        <Ionicons
          name={icon}
          size={19}
          color="#374151"
        />
      </View>

      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>
          {label}
        </Text>

        <Text style={styles.infoValue}>
          {value}
        </Text>
      </View>
    </View>
  );
}

/* =========================
   STYLES
========================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fb",
  },

  content: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 110,
  },

  contentDesktop: {
    paddingHorizontal: 32,
  },

  wrapper: {
    width: "100%",
    maxWidth: 1100,
    alignSelf: "center",
  },

  /* HEADER */

  pageHeader: {
    marginBottom: 24,
  },

  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#111827",
    letterSpacing: -0.5,
  },

  subtitle: {
    marginTop: 5,
    fontSize: 14,
    color: "#6b7280",
  },

  /* PROFILE */

  profileCard: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e7e9ed",
    borderRadius: 20,
    padding: 24,
    marginBottom: 28,
  },

  profileTop: {
    flexDirection: "row",
    alignItems: "center",
  },

  avatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: "#111827",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 18,
  },

  avatarText: {
    color: "#ffffff",
    fontSize: 28,
    fontWeight: "800",
  },

  profileInfo: {
    flex: 1,
  },

  name: {
    fontSize: 22,
    fontWeight: "800",
    color: "#111827",
  },

  email: {
    marginTop: 4,
    fontSize: 14,
    color: "#6b7280",
  },

  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
    marginTop: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#f3f4f6",
  },

  roleText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#111827",
  },

  /* SECTION */

  section: {
    marginBottom: 24,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 10,
  },

  /* INFO CARD */

  infoCard: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e7e9ed",
    borderRadius: 18,
    paddingHorizontal: 18,
  },

  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 17,
  },

  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },

  infoContent: {
    flex: 1,
  },

  infoLabel: {
    fontSize: 12,
    color: "#9ca3af",
    marginBottom: 3,
  },

  infoValue: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
  },

  divider: {
    height: 1,
    backgroundColor: "#eef0f2",
  },

  /* ACTION */

  actionCard: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e7e9ed",
    borderRadius: 18,
    paddingHorizontal: 18,
  },

  actionButton: {
    minHeight: 72,
    flexDirection: "row",
    alignItems: "center",
  },

  actionButtonPressed: {
    opacity: 0.6,
  },

  actionTextContainer: {
    flex: 1,
    marginHorizontal: 14,
  },

  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
  },

  actionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
  },

  actionDescription: {
    marginTop: 3,
    fontSize: 12,
    color: "#9ca3af",
  },

  logoutIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#fef2f2",
    alignItems: "center",
    justifyContent: "center",
  },

  logoutTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#dc2626",
  },

  logoutPressed: {
    opacity: 0.6,
    backgroundColor: "#fff7f7",
  },

  /* APP INFO */

  appInfo: {
    alignItems: "center",
    marginTop: 16,
    marginBottom: 20,
  },

  appName: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.5,
    color: "#9ca3af",
  },

  version: {
    marginTop: 4,
    fontSize: 11,
    color: "#c0c4ca",
  },

  /* =========================
     LOGOUT MODAL
  ========================= */

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },

  logoutModal: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.15,
    shadowRadius: 20,

    elevation: 10,
  },

  modalIcon: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#fef2f2",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },

  modalTitle: {
    fontSize: 21,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 8,
  },

  modalDescription: {
    fontSize: 14,
    lineHeight: 21,
    color: "#6b7280",
    textAlign: "center",
    maxWidth: 330,
  },

  modalButtons: {
    width: "100%",
    flexDirection: "row",
    gap: 10,
    marginTop: 24,
  },

  cancelButton: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
  },

  cancelButtonPressed: {
    backgroundColor: "#f9fafb",
    opacity: 0.8,
  },

  cancelText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#374151",
  },

  confirmLogoutButton: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#dc2626",
  },

  confirmLogoutPressed: {
    backgroundColor: "#b91c1c",
  },

  confirmLogoutText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#ffffff",
  },
});
