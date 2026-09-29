// src/app/edit-profile.tsx

import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
    EmailAuthProvider,
    reauthenticateWithCredential,
    updatePassword,
} from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
    useWindowDimensions,
} from "react-native";

import { useAuth } from "../contexts/AuthContext";
import { db } from "../firebase/config";

const DESKTOP_WIDTH = 768;

export default function EditProfilePage() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= DESKTOP_WIDTH;

  const { user, profile } = useAuth();

  // =========================
  // NAME
  // =========================

  const [name, setName] = useState("");
  const [savingName, setSavingName] = useState(false);

  // =========================
  // PASSWORD
  // =========================

  const [currentPassword, setCurrentPassword] =
    useState("");

  const [newPassword, setNewPassword] =
    useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [showCurrentPassword, setShowCurrentPassword] =
    useState(false);

  const [showNewPassword, setShowNewPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [savingPassword, setSavingPassword] =
    useState(false);

  // =========================
  // LOAD PROFILE
  // =========================

  useEffect(() => {
    if (profile?.name) {
      setName(profile.name);
    }
  }, [profile]);

  // =========================
  // SAVE NAME
  // =========================

  const handleSaveName = async () => {
    if (!user) {
      Alert.alert(
        "Error",
        "User belum login."
      );

      return;
    }

    const trimmedName = name.trim();

    if (!trimmedName) {
      Alert.alert(
        "Nama kosong",
        "Nama tidak boleh kosong."
      );

      return;
    }

    if (trimmedName.length < 2) {
      Alert.alert(
        "Nama terlalu pendek",
        "Nama minimal terdiri dari 2 karakter."
      );

      return;
    }

    try {
      setSavingName(true);

      const userRef = doc(
        db,
        "users",
        user.uid
      );

      await updateDoc(userRef, {
        name: trimmedName,
      });

      setSavingName(false);

      Alert.alert(
        "Berhasil",
        "Profile berhasil diperbarui.",
        [
          {
            text: "OK",
            onPress: () => {
              router.replace("/profile");
            },
          },
        ]
      );
    } catch (error) {
      console.error(
        "Update name error:",
        error
      );

      setSavingName(false);

      Alert.alert(
        "Gagal",
        "Profile tidak dapat diperbarui. Silakan coba lagi."
      );
    }
  };

  // =========================
  // CHANGE PASSWORD
  // =========================

  const handleChangePassword = async () => {
    if (!user) {
      Alert.alert(
        "Error",
        "User belum login."
      );

      return;
    }

    if (!user.email) {
      Alert.alert(
        "Error",
        "Email akun tidak ditemukan."
      );

      return;
    }

    if (!currentPassword) {
      Alert.alert(
        "Password lama",
        "Masukkan password lama terlebih dahulu."
      );

      return;
    }

    if (!newPassword) {
      Alert.alert(
        "Password baru",
        "Masukkan password baru."
      );

      return;
    }

    if (newPassword.length < 6) {
      Alert.alert(
        "Password terlalu pendek",
        "Password baru minimal 6 karakter."
      );

      return;
    }

    if (!confirmPassword) {
      Alert.alert(
        "Konfirmasi password",
        "Masukkan kembali password baru."
      );

      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert(
        "Password tidak cocok",
        "Konfirmasi password baru tidak sama."
      );

      return;
    }

    if (currentPassword === newPassword) {
      Alert.alert(
        "Password sama",
        "Password baru harus berbeda dari password lama."
      );

      return;
    }

    try {
      setSavingPassword(true);

      // =========================
      // RE-AUTHENTICATION
      // =========================

      const credential =
        EmailAuthProvider.credential(
          user.email,
          currentPassword
        );

      await reauthenticateWithCredential(
        user,
        credential
      );

      // =========================
      // UPDATE PASSWORD
      // =========================

      await updatePassword(
        user,
        newPassword
      );

      // Clear input
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      setSavingPassword(false);

      Alert.alert(
        "Berhasil",
        "Password berhasil diperbarui.",
        [
          {
            text: "OK",
            onPress: () => {
              router.replace("/profile");
            },
          },
        ]
      );
    } catch (error: any) {
      console.error(
        "Change password error:",
        error
      );

      setSavingPassword(false);

      // =========================
      // FIREBASE ERROR
      // =========================

      if (
        error?.code ===
        "auth/invalid-credential"
      ) {
        Alert.alert(
          "Password salah",
          "Password lama yang kamu masukkan tidak benar."
        );

        return;
      }

      if (
        error?.code ===
        "auth/wrong-password"
      ) {
        Alert.alert(
          "Password salah",
          "Password lama yang kamu masukkan tidak benar."
        );

        return;
      }

      if (
        error?.code ===
        "auth/weak-password"
      ) {
        Alert.alert(
          "Password terlalu lemah",
          "Gunakan password minimal 6 karakter."
        );

        return;
      }

      if (
        error?.code ===
        "auth/requires-recent-login"
      ) {
        Alert.alert(
          "Login diperlukan",
          "Silakan login kembali sebelum mengganti password."
        );

        return;
      }

      Alert.alert(
        "Gagal",
        "Password tidak dapat diperbarui. Silakan coba lagi."
      );
    }
  };

  // =========================
  // PASSWORD INPUT
  // =========================

  const PasswordInput = ({
    value,
    onChangeText,
    placeholder,
    visible,
    onToggle,
  }: {
    value: string;
    onChangeText: (value: string) => void;
    placeholder: string;
    visible: boolean;
    onToggle: () => void;
  }) => {
    return (
      <View style={styles.passwordContainer}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#9ca3af"
          secureTextEntry={!visible}
          autoCapitalize="none"
          autoCorrect={false}
          style={styles.passwordInput}
        />

        <Pressable
          onPress={onToggle}
          style={styles.eyeButton}
        >
          <Ionicons
            name={
              visible
                ? "eye-off-outline"
                : "eye-outline"
            }
            size={20}
            color="#6b7280"
          />
        </Pressable>
      </View>
    );
  };

  // =========================
  // UI
  // =========================

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        isDesktop && styles.contentDesktop,
      ]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.wrapper}>

        {/* =========================
            HEADER
        ========================= */}

        <View style={styles.header}>
          <Pressable
            onPress={() => router.replace("/profile")}
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.pressed,
            ]}
          >
            <Ionicons
              name="arrow-back"
              size={21}
              color="#111827"
            />
          </Pressable>

          <View>
            <Text style={styles.title}>
              Edit Profile
            </Text>

            <Text style={styles.subtitle}>
              Ubah informasi akun kamu
            </Text>
          </View>
        </View>

        {/* =========================
            PERSONAL INFORMATION
        ========================= */}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Personal Information
          </Text>

          <View style={styles.card}>

            <View style={styles.inputHeader}>
              <View style={styles.inputIcon}>
                <Ionicons
                  name="person-outline"
                  size={18}
                  color="#374151"
                />
              </View>

              <View>
                <Text style={styles.inputLabel}>
                  Nama
                </Text>

                <Text style={styles.inputHint}>
                  Nama yang ditampilkan di RocketPrintz
                </Text>
              </View>
            </View>

            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Masukkan nama"
              placeholderTextColor="#9ca3af"
              autoCapitalize="words"
              autoCorrect={false}
              style={styles.input}
            />

            <Pressable
              onPress={handleSaveName}
              disabled={savingName}
              style={({ pressed }) => [
                styles.primaryButton,
                pressed &&
                  !savingName &&
                  styles.primaryButtonPressed,
                savingName &&
                  styles.primaryButtonDisabled,
              ]}
            >
              {savingName ? (
                <ActivityIndicator
                  color="#ffffff"
                  size="small"
                />
              ) : (
                <>
                  <Ionicons
                    name="checkmark"
                    size={18}
                    color="#ffffff"
                  />

                  <Text style={styles.primaryButtonText}>
                    Simpan Nama
                  </Text>
                </>
              )}
            </Pressable>
          </View>
        </View>

        {/* =========================
            CHANGE PASSWORD
        ========================= */}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Change Password
          </Text>

          <View style={styles.card}>

            <View style={styles.passwordHeader}>
              <View style={styles.passwordHeaderIcon}>
                <Ionicons
                  name="lock-closed-outline"
                  size={19}
                  color="#374151"
                />
              </View>

              <View style={styles.passwordHeaderContent}>
                <Text style={styles.inputLabel}>
                  Password
                </Text>

                <Text style={styles.inputHint}>
                  Ubah password untuk menjaga keamanan akun
                </Text>
              </View>
            </View>

            {/* CURRENT PASSWORD */}

            <Text style={styles.fieldLabel}>
              Password Lama
            </Text>

            <PasswordInput
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder="Masukkan password lama"
              visible={showCurrentPassword}
              onToggle={() =>
                setShowCurrentPassword(
                  !showCurrentPassword
                )
              }
            />

            {/* NEW PASSWORD */}

            <Text style={styles.fieldLabel}>
              Password Baru
            </Text>

            <PasswordInput
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="Masukkan password baru"
              visible={showNewPassword}
              onToggle={() =>
                setShowNewPassword(
                  !showNewPassword
                )
              }
            />

            {/* CONFIRM PASSWORD */}

            <Text style={styles.fieldLabel}>
              Konfirmasi Password Baru
            </Text>

            <PasswordInput
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Ulangi password baru"
              visible={showConfirmPassword}
              onToggle={() =>
                setShowConfirmPassword(
                  !showConfirmPassword
                )
              }
            />

            {/* REQUIREMENT */}

            <View style={styles.passwordRequirement}>
              <Ionicons
                name="information-circle-outline"
                size={16}
                color="#6b7280"
              />

              <Text style={styles.requirementText}>
                Password minimal 6 karakter.
              </Text>
            </View>

            {/* CHANGE PASSWORD BUTTON */}

            <Pressable
              onPress={handleChangePassword}
              disabled={savingPassword}
              style={({ pressed }) => [
                styles.primaryButton,
                pressed &&
                  !savingPassword &&
                  styles.primaryButtonPressed,
                savingPassword &&
                  styles.primaryButtonDisabled,
              ]}
            >
              {savingPassword ? (
                <ActivityIndicator
                  color="#ffffff"
                  size="small"
                />
              ) : (
                <>
                  <Ionicons
                    name="key-outline"
                    size={18}
                    color="#ffffff"
                  />

                  <Text style={styles.primaryButtonText}>
                    Ubah Password
                  </Text>
                </>
              )}
            </Pressable>
          </View>
        </View>

        {/* =========================
            SECURITY NOTE
        ========================= */}

        <View style={styles.securityNote}>
          <View style={styles.securityIcon}>
            <Ionicons
              name="shield-checkmark-outline"
              size={18}
              color="#374151"
            />
          </View>

          <View style={styles.securityContent}>
            <Text style={styles.securityTitle}>
              Keamanan akun
            </Text>

            <Text style={styles.securityText}>
              Untuk mengganti password, kamu harus
              memasukkan password lama sebagai
              verifikasi keamanan.
            </Text>
          </View>
        </View>

      </View>
    </ScrollView>
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
    maxWidth: 900,
    alignSelf: "center",
  },

  /* HEADER */

  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 28,
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e7e9ed",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },

  pressed: {
    opacity: 0.6,
  },

  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#111827",
    letterSpacing: -0.5,
  },

  subtitle: {
    marginTop: 4,
    fontSize: 14,
    color: "#6b7280",
  },

  /* SECTION */

  section: {
    marginBottom: 26,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 10,
  },

  /* CARD */

  card: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e7e9ed",
    borderRadius: 18,
    padding: 20,
  },

  /* INPUT HEADER */

  inputHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
  },

  inputIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  inputLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
  },

  inputHint: {
    marginTop: 3,
    fontSize: 12,
    color: "#9ca3af",
  },

  /* INPUT */

  input: {
    height: 48,
    borderWidth: 1,
    borderColor: "#dfe2e6",
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 14,
    color: "#111827",
    backgroundColor: "#ffffff",
  },

  /* BUTTON */

  primaryButton: {
    height: 48,
    borderRadius: 12,
    backgroundColor: "#111827",
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  primaryButtonPressed: {
    backgroundColor: "#374151",
  },

  primaryButtonDisabled: {
    opacity: 0.55,
  },

  primaryButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
  },

  /* PASSWORD */

  passwordHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 22,
  },

  passwordHeaderIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  passwordHeaderContent: {
    flex: 1,
  },

  fieldLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#374151",
    marginBottom: 7,
    marginTop: 14,
  },

  passwordContainer: {
    height: 48,
    borderWidth: 1,
    borderColor: "#dfe2e6",
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
  },

  passwordInput: {
    flex: 1,
    height: "100%",
    paddingHorizontal: 14,
    fontSize: 14,
    color: "#111827",
  },

  eyeButton: {
    width: 46,
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },

  passwordRequirement: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 14,
    gap: 6,
  },

  requirementText: {
    fontSize: 12,
    color: "#6b7280",
  },

  /* SECURITY */

  securityNote: {
    flexDirection: "row",
    backgroundColor: "#f3f4f6",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },

  securityIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  securityContent: {
    flex: 1,
  },

  securityTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 4,
  },

  securityText: {
    fontSize: 12,
    lineHeight: 18,
    color: "#6b7280",
  },
});