import { Ionicons } from "@expo/vector-icons";
import { router, usePathname } from "expo-router";
import {
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";

export default function Footer() {
  const pathname = usePathname();

  return (
    <View style={styles.footer}>

      {/* HOME */}

      <FooterItem
        label="Home"
        icon="home-outline"
        active={
          pathname === "/" ||
          pathname.includes("/index")
        }
        onPress={() => router.push("/")}
      />

      {/* CAMERA */}

      <FooterItem
        label="Camera"
        icon="camera-outline"
        active={pathname.includes("camera")}
        onPress={() =>
          router.push("/camera")
        }
        center
      />

      {/* PROFILE */}

      <FooterItem
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
   FOOTER ITEM
===================================================== */

function FooterItem({
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
      style={styles.footerItem}
    >
      <View
        style={[
          center && styles.cameraButton,
          active &&
            !center &&
            styles.activeIcon,
        ]}
      >
        <Ionicons
          name={icon}
          size={center ? 27 : 24}
          color={
            center
              ? "#ffffff"
              : active
              ? "#111827"
              : "#9ca3af"
          }
        />
      </View>

      <Text
        style={[
          styles.footerText,
          active &&
            styles.footerTextActive,
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
  footer: {
    height: 72,
    width: "100%",

    backgroundColor: "#ffffff",

    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",

    paddingHorizontal: 20,

    position: "absolute",

    bottom: 0,
    left: 0,
    right: 0,

    zIndex: 100,
  },

  footerItem: {
    flex: 1,

    alignItems: "center",
    justifyContent: "center",
  },

  footerText: {
    fontSize: 11,

    color: "#9ca3af",

    marginTop: 3,
  },

  footerTextActive: {
    color: "#111827",

    fontWeight: "700",
  },

  activeIcon: {
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