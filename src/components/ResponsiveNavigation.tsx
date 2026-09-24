import { Ionicons } from "@expo/vector-icons";
import { router, usePathname } from "expo-router";
import {
    Pressable,
    StyleSheet,
    Text,
    View,
    useWindowDimensions,
} from "react-native";

const DESKTOP_WIDTH = 768;

export default function ResponsiveNavigation() {
  const { width } = useWindowDimensions();
  const pathname = usePathname();

  const isDesktop = width >= DESKTOP_WIDTH;

  if (isDesktop) {
    return <DesktopHeader pathname={pathname} />;
  }

  return <MobileFooter pathname={pathname} />;
}

/* =====================================================
   DESKTOP HEADER
===================================================== */

function DesktopHeader({
  pathname,
}: {
  pathname: string;
}) {
  return (
    <View style={styles.desktopHeader}>
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
              color="#fff"
            />
          </View>

          <Text style={styles.logoText}>
            RocketPrintz
          </Text>
        </Pressable>

        {/* MENU */}
        <View style={styles.desktopMenu}>
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
          onPress={() =>
            router.push("/profile")
          }
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
        styles.headerItem,
        active && styles.headerItemActive,
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
          styles.headerItemText,
          active &&
            styles.headerItemTextActive,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

/* =====================================================
   MOBILE FOOTER
===================================================== */

function MobileFooter({
  pathname,
}: {
  pathname: string;
}) {
  return (
    <View style={styles.mobileFooter}>
      <MobileFooterItem
        label="Home"
        icon="home-outline"
        active={
          pathname === "/" ||
          pathname.includes("/index")
        }
        onPress={() => router.push("/")}
      />

      <MobileFooterItem
        label="Camera"
        icon="camera-outline"
        active={pathname.includes("camera")}
        onPress={() =>
          router.push("/camera")
        }
        center
      />

      <MobileFooterItem
        label="Profile"
        icon="person-outline"
        active={pathname.includes("profile")}
        onPress={() =>
          router.push("/profile")
        }
      />
    </View>
  );
}

/* =====================================================
   MOBILE FOOTER ITEM
===================================================== */

function MobileFooterItem({
  label,
  icon,
  active,
  onPress,
  center = false,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  active: boolean;
  onPress: () => void;
  center?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={styles.mobileFooterItem}
    >
      <View
        style={[
          center && styles.cameraButton,
          active &&
            !center &&
            styles.mobileActiveIcon,
        ]}
      >
        <Ionicons
          name={icon}
          size={center ? 27 : 24}
          color={
            center
              ? "#fff"
              : active
              ? "#111827"
              : "#9ca3af"
          }
        />
      </View>

      <Text
        style={[
          styles.mobileFooterText,
          active &&
            styles.mobileFooterTextActive,
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
  /* ===============================
     DESKTOP HEADER
  =============================== */

  desktopHeader: {
    height: 72,
    width: "100%",

    backgroundColor: "#ffffff",

    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",

    // PENTING:
    // Header berada di atas
    position: "relative",

    zIndex: 100,
  },

  headerContent: {
    height: "100%",
    width: "100%",
    maxWidth: 1400,

    alignSelf: "center",

    flexDirection: "row",
    alignItems: "center",

    paddingHorizontal: 28,
  },

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

  desktopMenu: {
    flex: 1,

    flexDirection: "row",
    alignItems: "center",

    gap: 6,
  },

  headerItem: {
    flexDirection: "row",
    alignItems: "center",

    paddingHorizontal: 14,
    paddingVertical: 10,

    borderRadius: 9,

    gap: 7,
  },

  headerItemActive: {
    backgroundColor: "#f3f4f6",
  },

  headerItemText: {
    fontSize: 14,

    color: "#6b7280",

    fontWeight: "500",
  },

  headerItemTextActive: {
    color: "#111827",

    fontWeight: "700",
  },

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

  /* ===============================
     MOBILE FOOTER
  =============================== */

  mobileFooter: {
    height: 72,

    width: "100%",

    backgroundColor: "#ffffff",

    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",

    paddingHorizontal: 20,

    // PENTING:
    // Footer selalu di bawah
    position: "absolute",

    bottom: 0,
    left: 0,
    right: 0,

    zIndex: 100,
  },

  mobileFooterItem: {
    flex: 1,

    alignItems: "center",
    justifyContent: "center",
  },

  mobileFooterText: {
    fontSize: 11,

    color: "#9ca3af",

    marginTop: 3,
  },

  mobileFooterTextActive: {
    color: "#111827",

    fontWeight: "700",
  },

  mobileActiveIcon: {
    alignItems: "center",
    justifyContent: "center",
  },

  cameraButton: {
    width: 50,
    height: 50,

    borderRadius: 25,

    backgroundColor: "#111827",

    alignItems: "center",
    justifyContent: "center",

    marginTop: -22,

    borderWidth: 4,
    borderColor: "#ffffff",
  },
});