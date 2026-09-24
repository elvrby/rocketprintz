
import { useState } from "react";

import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { router } from "expo-router";

import { useAuth } from "../../contexts/AuthContext";

export default function LoginScreen() {
  const { login } = useAuth();

  const [identifier, setIdentifier] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const handleLogin = async () => {
    setError("");

    if (!identifier.trim()) {
      setError(
        "Masukkan email atau nama pengguna."
      );
      return;
    }

    if (!password) {
      setError("Masukkan password.");
      return;
    }

    try {
      setLoading(true);

      /**
       * identifier bisa berupa:
       *
       * email
       * atau
       * name
       */
      await login(
        identifier,
        password
      );

      /**
       * Root index akan menentukan
       * dashboard berdasarkan role.
       */
      router.replace("/");
    } catch (error: any) {
      console.error(
        "Login error:",
        error
      );

      let message =
        "Email/nama atau password salah.";

      if (
        error?.code ===
        "auth/invalid-credential"
      ) {
        message =
          "Email/nama atau password salah.";
      }

      if (
        error?.code ===
        "auth/user-not-found"
      ) {
        message =
          "User tidak ditemukan.";
      }

      if (
        error?.code ===
        "auth/wrong-password"
      ) {
        message =
          "Password salah.";
      }

      if (
        error?.message ===
        "Nama pengguna tidak ditemukan."
      ) {
        message =
          "Nama pengguna tidak ditemukan.";
      }

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.logo}>
          ROCKETPRINTZ
        </Text>

        <Text style={styles.title}>
          Login
        </Text>

        <Text style={styles.subtitle}>
          Print Shop Management System
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Email atau nama pengguna"
          value={identifier}
          onChangeText={setIdentifier}
          autoCapitalize="none"
          autoCorrect={false}
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        {error ? (
          <Text style={styles.error}>
            {error}
          </Text>
        ) : null}

        <TouchableOpacity
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
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    padding: 20,
  },

  card: {
    width: "100%",
    maxWidth: 420,
    padding: 30,
    borderRadius: 12,
    backgroundColor: "#fff",
  },

  logo: {
    textAlign: "center",
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 10,
  },

  title: {
    textAlign: "center",
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 5,
  },

  subtitle: {
    textAlign: "center",
    color: "#777",
    marginBottom: 25,
  },

  input: {
    height: 48,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 14,
    marginBottom: 12,
    backgroundColor: "#fff",
  },

  error: {
    color: "#d32f2f",
    marginBottom: 12,
  },

  button: {
    height: 48,
    borderRadius: 8,
    backgroundColor: "#111",
    justifyContent: "center",
    alignItems: "center",
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
