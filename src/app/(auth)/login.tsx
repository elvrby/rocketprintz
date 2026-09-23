import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { login } from "../../firebase/auth";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    // Validasi input
    if (!email.trim() || !password) {
      Alert.alert(
        "Login",
        "Email dan password wajib diisi."
      );
      return;
    }

    try {
      setLoading(true);

      // Login ke Firebase Authentication
      await login(email.trim(), password);

      // Kembali ke root.
      // index.tsx akan menentukan halaman berdasarkan role.
      router.replace("/");
    } catch (error: any) {
      console.error("Login error:", error);

      let message = "Email atau password salah.";

      switch (error?.code) {
        case "auth/invalid-credential":
          message = "Email atau password salah.";
          break;

        case "auth/user-not-found":
          message = "Akun tidak ditemukan.";
          break;

        case "auth/wrong-password":
          message = "Password salah.";
          break;

        case "auth/invalid-email":
          message = "Format email tidak valid.";
          break;

        case "auth/user-disabled":
          message = "Akun ini telah dinonaktifkan.";
          break;

        case "auth/too-many-requests":
          message =
            "Terlalu banyak percobaan login. Silakan coba lagi nanti.";
          break;

        case "auth/network-request-failed":
          message =
            "Tidak dapat terhubung ke internet. Periksa koneksi Anda.";
          break;
      }

      Alert.alert("Login gagal", message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>
        ROCKETPRINTZ
      </Text>

      <Text style={styles.subtitle}>
        Print Shop Management System
      </Text>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#999"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          editable={!loading}
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#999"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          editable={!loading}
          onSubmitEditing={handleLogin}
        />

        <Pressable
          style={[
            styles.button,
            loading && styles.buttonDisabled,
          ]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>
              Login
            </Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: "#fff",
  },

  logo: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: 1,
    color: "#111",
  },

  subtitle: {
    marginTop: 8,
    marginBottom: 32,
    fontSize: 14,
    color: "#666",
  },

  form: {
    width: "100%",
    maxWidth: 400,
  },

  input: {
    height: 52,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    paddingHorizontal: 16,
    marginBottom: 14,
    fontSize: 16,
    backgroundColor: "#fafafa",
    color: "#111",
  },

  button: {
    height: 52,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#111",
    marginTop: 4,
  },

  buttonDisabled: {
    opacity: 0.6,
  },

  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
