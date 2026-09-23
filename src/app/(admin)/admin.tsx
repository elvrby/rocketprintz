import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  router,
} from "expo-router";

import {
  useAuth,
} from "../../contexts/AuthContext";

export default function AdminDashboard() {

  const {
    profile,
    logout,
  } = useAuth();

  const handleLogout = async () => {

    await logout();

    router.replace(
      "/(auth)/login"
    );
  };

  return (
    <View style={styles.container}>

      <Text style={styles.title}>
        RocketPrintz
      </Text>

      <Text style={styles.role}>
        ADMIN DASHBOARD
      </Text>

      <Text style={styles.welcome}>
        Halo, {profile?.name}
      </Text>

      <View style={styles.menu}>

        <Pressable
          style={styles.card}
          onPress={() =>
            router.push(
              "/(admin)/orders"
            )
          }
        >

          <Text style={styles.cardTitle}>
            Orders
          </Text>

          <Text style={styles.cardDescription}>
            Kelola pesanan customer
          </Text>
        </Pressable>

        <Pressable
          style={styles.card}
          onPress={() =>
            router.push(
              "/(admin)/planning"
            )
          }
        >

          <Text style={styles.cardTitle}>
            Planning
          </Text>

          <Text style={styles.cardDescription}>
            Atur jadwal produksi
          </Text>
        </Pressable>

        <Pressable
          style={styles.card}
          onPress={() =>
            router.push(
              "/(admin)/materials"
            )
          }
        >

          <Text style={styles.cardTitle}>
            Materials
          </Text>

          <Text style={styles.cardDescription}>
            Kelola bahan
          </Text>
        </Pressable>

        <Pressable
          style={styles.card}
          onPress={() =>
            router.push(
              "/(admin)/users"
            )
          }
        >

          <Text style={styles.cardTitle}>
            Users
          </Text>

          <Text style={styles.cardDescription}>
            Kelola pengguna
          </Text>
        </Pressable>

      </View>

      <Pressable
        style={styles.logout}
        onPress={handleLogout}
      >
        <Text style={styles.logoutText}>
          Logout
        </Text>
      </Pressable>

    </View>
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    padding: 24,
    paddingTop: 60,
    backgroundColor: "#fff",
  },

  title: {
    fontSize: 30,
    fontWeight: "900",
  },

  role: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: "700",
    color: "#666",
  },

  welcome: {
    marginTop: 24,
    fontSize: 18,
  },

  menu: {
    marginTop: 30,
    gap: 12,
  },

  card: {
    borderWidth: 1,
    borderColor: "#e5e5e5",
    borderRadius: 14,
    padding: 18,
  },

  icon: {
    fontSize: 25,
  },

  cardTitle: {
    fontSize: 18,
    fontWeight: "800",
    marginTop: 8,
  },

  cardDescription: {
    color: "#666",
    marginTop: 4,
  },

  logout: {
    marginTop: 30,
    backgroundColor: "#111",
    borderRadius: 12,
    padding: 15,
    alignItems: "center",
  },

  logoutText: {
    color: "#fff",
    fontWeight: "700",
  },

});