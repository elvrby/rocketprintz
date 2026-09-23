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

export default function OperatorDashboard() {

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
        OPERATOR
      </Text>

      <Text style={styles.welcome}>
        Halo, {profile?.name}
      </Text>

      <View style={styles.menu}>

        <Pressable
          style={styles.card}
          onPress={() =>
            router.push(
              "/(operator)/planning"
            )
          }
        >

          <Text style={styles.cardTitle}>
            Planning
          </Text>

          <Text style={styles.description}>
            Lihat planning produksi
          </Text>
        </Pressable>

        <Pressable
          style={styles.card}
          onPress={() =>
            router.push(
              "/(operator)/materials"
            )
          }
        >

          <Text style={styles.cardTitle}>
            Materials
          </Text>

          <Text style={styles.description}>
            Lihat bahan produksi
          </Text>
        </Pressable>

        <Pressable
          style={styles.card}
          onPress={() =>
            router.push(
              "/(operator)/running"
            )
          }
        >

          <Text style={styles.cardTitle}>
            Running
          </Text>

          <Text style={styles.description}>
            Jalankan produksi
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
  },

  title: {
    fontSize: 30,
    fontWeight: "900",
  },

  role: {
    fontSize: 13,
    fontWeight: "700",
    color: "#666",
    marginTop: 4,
  },

  welcome: {
    fontSize: 18,
    marginTop: 24,
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

  description: {
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