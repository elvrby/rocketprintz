import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { useAuth } from "../../contexts/AuthContext";

export default function LoginScreen() {
  const { login } = useAuth();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [focusedInput, setFocusedInput] = useState<"identifier" | "password" | null>(null);

  const handleLogin = async () => {
    setError("");

    if (!identifier.trim()) {
      setError("Masukkan email atau nama pengguna.");
      return;
    }

    if (!password) {
      setError("Masukkan password.");
      return;
    }

    try {
      setLoading(true);

      await login(identifier, password);
      router.replace("/");
    } catch (err: any) {
      console.error("Login error:", err);

      let message = "Email/nama atau password salah.";

      if (err?.code === "auth/invalid-credential") {
        message = "Email/nama atau password salah.";
      } else if (err?.code === "auth/user-not-found") {
        message = "User tidak ditemukan.";
      } else if (err?.code === "auth/wrong-password") {
        message = "Password salah.";
      } else if (err?.message === "Nama pengguna tidak ditemukan.") {
        message = "Nama pengguna tidak ditemukan.";
      }

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {/* LOGO & BRAND */}
        <View style={styles.header}>
          <View style={styles.logoBox}>
            <Ionicons name="print" size={22} color="#ffffff" />
          </View>
          <Text style={styles.brandName}>ROCKETPRINTZ</Text>
          <Text style={styles.subtitle}>Print Shop Management System</Text>
        </View>

        {/* ERROR BANNER */}
        {error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={18} color="#ef4444" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* FORM INPUTS */}
        <View style={styles.form}>
          <View style={styles.inputWrapper}>
            <Text style={styles.label}>Email / Username</Text>
            <View
              style={[
                styles.inputContainer,
                focusedInput === "identifier" && styles.inputFocused,
              ]}
            >
              <Ionicons
                name="person-outline"
                size={18}
                color={focusedInput === "identifier" ? "#0f172a" : "#94a3b8"}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="nama@email.com atau username"
                placeholderTextColor="#94a3b8"
                value={identifier}
                onChangeText={setIdentifier}
                autoCapitalize="none"
                autoCorrect={false}
                onFocus={() => setFocusedInput("identifier")}
                onBlur={() => setFocusedInput(null)}
              />
            </View>
          </View>

          <View style={styles.inputWrapper}>
            <Text style={styles.label}>Password</Text>
            <View
              style={[
                styles.inputContainer,
                focusedInput === "password" && styles.inputFocused,
              ]}
            >
              <Ionicons
                name="lock-closed-outline"
                size={18}
                color={focusedInput === "password" ? "#0f172a" : "#94a3b8"}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor="#94a3b8"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                onFocus={() => setFocusedInput("password")}
                onBlur={() => setFocusedInput(null)}
              />
              <Pressable
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeIcon}
                hitSlop={8}
              >
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={18}
                  color="#94a3b8"
                />
              </Pressable>
            </View>
          </View>

          {/* SUBMIT BUTTON */}
          <Pressable
            style={({ pressed }) => [
              styles.button,
              loading && styles.buttonDisabled,
              pressed && !loading && styles.buttonPressed,
            ]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <Text style={styles.buttonText}>Masuk ke Akun</Text>
            )}
          </Pressable>
        </View>
      </View>
    </View>
  );
}

/* =====================================================
   STYLES
===================================================== */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    padding: 20,
  },

  card: {
    width: "100%",
    maxWidth: 400,
    padding: 32,
    borderRadius: 20,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#f1f5f9",
    // Shadow lembut
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 3,
  },

  header: {
    alignItems: "center",
    marginBottom: 28,
  },

  logoBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#0f172a",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 2,
  },

  brandName: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0f172a",
    letterSpacing: -0.5,
  },

  subtitle: {
    fontSize: 13,
    color: "#64748b",
    marginTop: 4,
    fontWeight: "500",
  },

  /* FORM STYLES */

  form: {
    gap: 18,
  },

  inputWrapper: {
    gap: 6,
  },

  label: {
    fontSize: 12.5,
    fontWeight: "600",
    color: "#334155",
  },

  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    height: 46,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 10,
    paddingHorizontal: 12,
    backgroundColor: "#f8fafc",
  },

  inputFocused: {
    borderColor: "#0f172a",
    backgroundColor: "#ffffff",
  },

  inputIcon: {
    marginRight: 10,
  },

  input: {
    flex: 1,
    height: "100%",
    fontSize: 14,
    color: "#0f172a",
  },

  eyeIcon: {
    padding: 4,
  },

  /* ERROR ALERT */

  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fecaca",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    gap: 8,
    marginBottom: 16,
  },

  errorText: {
    color: "#b91c1c",
    fontSize: 13,
    fontWeight: "500",
    flex: 1,
  },

  /* BUTTON STYLES */

  button: {
    height: 46,
    borderRadius: 10,
    backgroundColor: "#0f172a",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 6,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },

  buttonPressed: {
    opacity: 0.85,
  },

  buttonDisabled: {
    opacity: 0.6,
  },

  buttonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: -0.2,
  },
});