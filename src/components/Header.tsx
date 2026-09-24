import { Ionicons } from "@expo/vector-icons";
import { router, usePathname } from "expo-router";
import {
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";

export default function Header() {
  const pathname = usePathname();

  return (
    <View style={styles.header}>
      <View style={styles.headerContent}>

        {/* LOGO */}
        <Pressable
          style={styles.logoContainer}
          onPress={() => router.push("/")}
        >
          <View style={styles.logoBox}>
            <Ionicons
              name="print-outline"
              size={23}
              color="#ffffff"
            />
          </View>

          <Text style={styles.logoText}>
            RocketPrintz
          </Text>
        </Pressable>

        {/* MENU */}
        <View style={styles.menu}>

          <HeaderItem
            label="Home"
            icon="home-outline"
            active={pathname === "/"}
            onPress={() => router.push("/")}
          />

          <HeaderItem
            label="Orders"
            icon="receipt-outline"
            active={pathname.includes("orders")}
            onPress={() =>
              router.push("/(admin)/orders")
            }
          />

          <HeaderItem
            label="Planning"
            icon="calendar-outline"
            active={pathname.includes("planning")}
            onPress={() =>
              router.push("/(admin)/planning")
            }
          />

          <HeaderItem
            label="Materials"
            icon="cube-outline"
            active={pathname.includes("materials")}
            onPress={() =>
              router.push("/(admin)/materials")
            }
          />

        </View>

        {/* PROFILE */}
        <Pressable
          style={styles.profileButton}
          onPress={() => router.push("/profile")}
        >
          <View style={styles.profileIcon}>
            <Ionicons
              name="person-outline"
              size={19}
              color="#374151"
            />
          </View>

          <View>
            <Text style={styles.profileName}>
              Admin
            </Text>

            <Text style={styles.profileRole}>
              Administrator
            </Text>
          </View>
        </Pressable>

      </View>
    </View>
  );
}

/* =====================================================
   HEADER ITEM
===================================================== */

function HeaderItem({
  label,
  icon,
  active,
  onPress,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.menuItem,
        active && styles.menuItemActive,
      ]}
    >
      <Ionicons
        name={icon}
        size={19}
        color={
          active
            ? "#111827"
            : "#6b7280"
        }
      />

      <Text
        style={[
          styles.menuText,
          active && styles.menuTextActive,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

/* =====================================================
   STYLES
===================================================== */

const styles = StyleSheet.create({
  header: {
    height: 72,
    width: "100%",

    backgroundColor: "#ffffff",

    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",

    zIndex: 100,
  },

  headerContent: {
    width: "100%",
    maxWidth: 1400,
    height: "100%",

    alignSelf: "center",

    flexDirection: "row",
    alignItems: "center",

    paddingHorizontal: 28,
  },

  /* LOGO */

  logoContainer: {
    width: 210,

    flexDirection: "row",
    alignItems: "center",
  },

  logoBox: {
    width: 40,
    height: 40,

    borderRadius: 10,

    backgroundColor: "#111827",

    alignItems: "center",
    justifyContent: "center",
  },

  logoText: {
    marginLeft: 10,

    fontSize: 19,
    fontWeight: "800",

    color: "#111827",
  },

  /* MENU */

  menu: {
    flex: 1,

    flexDirection: "row",
    alignItems: "center",

    gap: 6,
  },

  menuItem: {
    flexDirection: "row",
    alignItems: "center",

    paddingHorizontal: 14,
    paddingVertical: 10,

    borderRadius: 9,

    gap: 7,
  },

  menuItemActive: {
    backgroundColor: "#f3f4f6",
  },

  menuText: {
    fontSize: 14,

    color: "#6b7280",

    fontWeight: "500",
  },

  menuTextActive: {
    color: "#111827",

    fontWeight: "700",
  },

  /* PROFILE */

  profileButton: {
    flexDirection: "row",
    alignItems: "center",

    gap: 10,
  },

  profileIcon: {
    width: 38,
    height: 38,

    borderRadius: 19,

    backgroundColor: "#f3f4f6",

    alignItems: "center",
    justifyContent: "center",
  },

  profileName: {
    fontSize: 14,

    fontWeight: "700",

    color: "#111827",
  },

  profileRole: {
    fontSize: 11,

    color: "#9ca3af",

    marginTop: 2,
  },
});