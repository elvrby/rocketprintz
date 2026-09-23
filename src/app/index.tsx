import { Redirect } from "expo-router";
import {
  ActivityIndicator,
  Text,
  View,
} from "react-native";

import { useAuth } from "../contexts/AuthContext";

export default function Index() {
  const {
    user,
    profile,
    loading,
  } = useAuth();

  // Tunggu Firebase Auth + profile Firestore selesai
  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
        <Text style={styles.text}>
          Memuat akun...
        </Text>
      </View>
    );
  }

  // Belum login
  if (!user) {
    return (
      <Redirect href="/login" />
    );
  }

  // User sudah login tetapi profile tidak ditemukan
  if (!profile) {
    return (
      <View style={styles.container}>
        <Text style={styles.error}>
          Profile pengguna tidak ditemukan.
        </Text>

        <Text style={styles.text}>
          Pastikan dokumen users/{user.uid} ada
          di Firestore dan memiliki field role.
        </Text>
      </View>
    );
  }

  // ADMIN
  if (profile.role === "admin") {
    return (
      <Redirect href="/admin" />
    );
  }

  // OPERATOR
  if (profile.role === "operator") {
    return (
      <Redirect href="/operator" />
    );
  }

  // SUPERVISOR
  if (profile.role === "supervisor") {
    return (
      <Redirect href="/supervisor" />
    );
  }

  // Role tidak dikenali
  return (
    <View style={styles.container}>
      <Text style={styles.error}>
        Role pengguna tidak dikenali.
      </Text>

      <Text style={styles.text}>
        Role saat ini: {String(profile.role)}
      </Text>
    </View>
  );
}

const styles = {
  container: {
    flex: 1,
    justifyContent: "center" as const,
    alignItems: "center" as const,
    padding: 24,
  },

  text: {
    marginTop: 12,
    textAlign: "center" as const,
    color: "#666",
  },

  error: {
    fontSize: 18,
    fontWeight: "700" as const,
    textAlign: "center" as const,
  },
};
