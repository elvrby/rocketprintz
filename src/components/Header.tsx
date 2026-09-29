import { Ionicons } from "@expo/vector-icons";
import { router, usePathname } from "expo-router";
import { useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useAuth } from "../contexts/AuthContext";

export default function Header() {
  const pathname = usePathname();
  const { profile, logout } = useAuth();

  const [showProfilePopup, setShowProfilePopup] =
    useState(false);

  const userName = profile?.name || "User";

  const userRole = profile?.role || "user";

  // ==========================================
  // ROLE LABEL
  // ==========================================

  const roleLabel =
    userRole === "admin"
      ? "Administrator"
      : userRole === "operator"
      ? "Operator"
      : userRole === "supervisor"
      ? "Supervisor"
      : "User";

  // ==========================================
  // HOVER TIMEOUT
  // ==========================================

  let hoverTimeout: ReturnType<typeof setTimeout> | null =
    null;

  const showPopup = () => {
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
      hoverTimeout = null;
    }

    setShowProfilePopup(true);
  };

  const hidePopup = () => {
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
    }

    hoverTimeout = setTimeout(() => {
      setShowProfilePopup(false);
    }, 150);
  };

  // ==========================================
  // LOGOUT
  // ==========================================

  const handleLogout = async () => {
    try {
      setShowProfilePopup(false);

      await logout();

      router.replace("/(auth)/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // ==========================================
  // ACTIVE MENU
  // ==========================================

  const isActive = (keyword: string) => {
    return pathname.includes(keyword);
  };

  return (
    <View style={styles.header}>
      <View style={styles.headerContent}>

        {/* =================================================
            LOGO
        ================================================= */}

        <Pressable
          style={({ pressed }) => [
            styles.logoContainer,
            pressed && styles.pressedState,
          ]}
          onPress={() => router.push("/")}
        >
          <View style={styles.logoBox}>
            <Ionicons
              name="print"
              size={20}
              color="#ffffff"
            />
          </View>

          <Text style={styles.logoText}>
            Rocket
            <Text style={styles.logoTextAccent}>
              Printz
            </Text>
          </Text>
        </Pressable>

        {/* =================================================
            MENU
        ================================================= */}

        <View style={styles.menu}>

          {/* HOME */}

          <HeaderItem
            label="Home"
            icon="grid-outline"
            activeIcon="grid"
            active={pathname === "/"}
            onPress={() => router.push("/")}
          />

          {/* ORDERS */}

          <HeaderItem
            label="Orders"
            icon="receipt-outline"
            activeIcon="receipt"
            active={isActive("orders")}
            onPress={() => {
              if (userRole === "supervisor") {
                router.push("/(supervisor)/orders");
              } else if (userRole === "operator") {
                router.push("/(operator)/running");
              } else {
                router.push("/(admin)/orders");
              }
            }}
          />

          {/* PLANNING */}

          <HeaderItem
            label="Planning"
            icon="calendar-clear-outline"
            activeIcon="calendar-clear"
            active={isActive("planning")}
            onPress={() => {
              if (userRole === "supervisor") {
                router.push("/(supervisor)/planning");
              } else if (userRole === "operator") {
                router.push("/(operator)/planning");
              } else {
                router.push("/(admin)/planning");
              }
            }}
          />

          {/* =================================================
              MATERIALS
              HANYA ADMIN & OPERATOR
          ================================================= */}

          {userRole !== "supervisor" && (
            <HeaderItem
              label="Materials"
              icon="cube-outline"
              activeIcon="cube"
              active={isActive("materials")}
              onPress={() => {
                if (userRole === "operator") {
                  router.push("/(operator)/materials");
                } else {
                  router.push("/(admin)/materials");
                }
              }}
            />
          )}

          {/* =================================================
              RUNNING
              KHUSUS SUPERVISOR
          ================================================= */}

          {userRole === "supervisor" && (
            <HeaderItem
              label="Running"
              icon="play-circle-outline"
              activeIcon="play-circle"
              active={isActive("running")}
              onPress={() => {
                router.push("/(operator)/running");
              }}
            />
          )}

        </View>

        {/* =================================================
            PROFILE
        ================================================= */}

        <View style={styles.profileWrapper}>

          {/* PROFILE BUTTON */}

          <Pressable
            style={({ pressed }) => [
              styles.profileButton,
              pressed && styles.pressedState,
            ]}
            onPress={() => router.push("/profile")}
          >
            <View style={styles.profileAvatar}>
              <Ionicons
                name="person"
                size={16}
                color="#374151"
              />
            </View>

            <View style={styles.profileInfo}>
              <Text
                style={styles.profileName}
                numberOfLines={1}
              >
                {userName}
              </Text>

              <Text style={styles.profileRole}>
                {roleLabel}
              </Text>
            </View>

            <Ionicons
              name="chevron-forward"
              size={14}
              color="#9ca3af"
              style={{ marginLeft: 2 }}
            />
          </Pressable>

          {/* =================================================
              FLOATING POPUP
          ================================================= */}

          {showProfilePopup && (
            <View
              style={styles.profilePopup}
              onStartShouldSetResponder={() => true}
            >

              {/* USER */}

              <View style={styles.popupUser}>

                <View style={styles.popupAvatar}>
                  <Ionicons
                    name="person"
                    size={16}
                    color="#374151"
                  />
                </View>

                <View style={styles.popupUserInfo}>
                  <Text
                    style={styles.popupName}
                    numberOfLines={1}
                  >
                    {userName}
                  </Text>

                  <Text style={styles.popupRole}>
                    {roleLabel}
                  </Text>

                  {profile?.email && (
                    <Text
                      style={styles.popupEmail}
                      numberOfLines={1}
                    >
                      {profile.email}
                    </Text>
                  )}
                </View>

              </View>

              {/* DIVIDER */}

              <View style={styles.popupDivider} />

              {/* PROFILE */}

              <Pressable
                style={({ pressed }) => [
                  styles.popupItem,
                  pressed &&
                    styles.popupItemPressed,
                ]}
                onHoverIn={showPopup}
                onHoverOut={hidePopup}
                onPress={() => {
                  setShowProfilePopup(false);
                  router.push("/profile");
                }}
              >
                <Ionicons
                  name="person-outline"
                  size={18}
                  color="#475569"
                />

                <Text style={styles.popupItemText}>
                  Profile
                </Text>
              </Pressable>

              {/* LOGOUT */}

              <Pressable
                style={({ pressed }) => [
                  styles.logoutButton,
                  pressed && styles.logoutPressed,
                ]}
                onHoverIn={showPopup}
                onHoverOut={hidePopup}
                onPress={handleLogout}
              >
                <Ionicons
                  name="log-out-outline"
                  size={18}
                  color="#dc2626"
                />

                <Text style={styles.logoutText}>
                  Logout
                </Text>
              </Pressable>

            </View>
          )}

        </View>

      </View>
    </View>
  );
}

/* =====================================================
   HEADER ITEM
===================================================== */

interface HeaderItemProps {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  activeIcon: keyof typeof Ionicons.glyphMap;
  active: boolean;
  onPress: () => void;
}

function HeaderItem({
  label,
  icon,
  activeIcon,
  active,
  onPress,
}: HeaderItemProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.menuItem,
        active && styles.menuItemActive,
        pressed && styles.pressedState,
      ]}
    >
      <Ionicons
        name={active ? activeIcon : icon}
        size={18}
        color={
          active
            ? "#0f172a"
            : "#64748b"
        }
      />

      <Text
        style={[
          styles.menuText,
          active &&
            styles.menuTextActive,
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

  /* =====================================================
     HEADER
  ===================================================== */

  header: {
    height: 68,
    width: "100%",

    backgroundColor: "#ffffff",

    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",

    zIndex: 100,
  },

  headerContent: {
    width: "100%",
    maxWidth: 1320,

    height: "100%",

    alignSelf: "center",

    flexDirection: "row",
    alignItems: "center",

    justifyContent: "space-between",

    paddingHorizontal: 24,
  },

  pressedState: {
    opacity: 0.7,
  },

  /* =====================================================
     LOGO
  ===================================================== */

  logoContainer: {
    flexDirection: "row",
    alignItems: "center",

    gap: 12,
  },

  logoBox: {
    width: 36,
    height: 36,

    borderRadius: 10,

    backgroundColor: "#0f172a",

    alignItems: "center",
    justifyContent: "center",

    shadowColor: "#0f172a",

    shadowOffset: {
      width: 0,
      height: 4,
    },

    shadowOpacity: 0.15,
    shadowRadius: 8,

    elevation: 3,
  },

  logoText: {
    fontSize: 18,

    fontWeight: "700",

    color: "#0f172a",

    letterSpacing: -0.4,
  },

  logoTextAccent: {
    fontWeight: "400",

    color: "#64748b",
  },

  /* =====================================================
     MENU
  ===================================================== */

  menu: {
    flexDirection: "row",
    alignItems: "center",

    gap: 4,

    backgroundColor: "#f8fafc",

    padding: 4,

    borderRadius: 12,

    borderWidth: 1,
    borderColor: "#f1f5f9",
  },

  menuItem: {
    flexDirection: "row",
    alignItems: "center",

    paddingHorizontal: 14,
    paddingVertical: 8,

    borderRadius: 8,

    gap: 8,
  },

  menuItemActive: {
    backgroundColor: "#ffffff",

    shadowColor: "#000",

    shadowOffset: {
      width: 0,
      height: 1,
    },

    shadowOpacity: 0.05,

    shadowRadius: 2,

    elevation: 1,
  },

  menuText: {
    fontSize: 13.5,

    color: "#64748b",

    fontWeight: "500",

    letterSpacing: -0.2,
  },

  menuTextActive: {
    color: "#0f172a",

    fontWeight: "600",
  },

  /* =====================================================
     PROFILE
  ===================================================== */

  profileWrapper: {
    position: "relative",

    zIndex: 200,
  },

  profileButton: {
    flexDirection: "row",

    alignItems: "center",

    paddingHorizontal: 10,
    paddingVertical: 6,

    borderRadius: 20,

    backgroundColor: "#ffffff",

    borderWidth: 1,
    borderColor: "#f1f5f9",

    gap: 10,
  },

  profileAvatar: {
    width: 32,
    height: 32,

    borderRadius: 16,

    backgroundColor: "#f1f5f9",

    alignItems: "center",
    justifyContent: "center",
  },

  profileInfo: {
    justifyContent: "center",

    minWidth: 80,

    maxWidth: 130,
  },

  profileName: {
    fontSize: 13,

    fontWeight: "600",

    color: "#0f172a",

    lineHeight: 16,
  },

  profileRole: {
    fontSize: 10.5,

    color: "#94a3b8",

    fontWeight: "500",
  },

  /* =====================================================
     POPUP
  ===================================================== */

  profilePopup: {
    position: "absolute",

    top: 48,
    right: 0,

    width: 230,

    backgroundColor: "#ffffff",

    borderRadius: 12,

    borderWidth: 1,
    borderColor: "#e5e7eb",

    padding: 8,

    shadowColor: "#000",

    shadowOffset: {
      width: 0,
      height: 8,
    },

    shadowOpacity: 0.12,

    shadowRadius: 18,

    elevation: 8,

    zIndex: 999,
  },

  popupUser: {
    flexDirection: "row",

    alignItems: "center",

    padding: 10,

    gap: 10,
  },

  popupUserInfo: {
    flex: 1,

    minWidth: 0,
  },

  popupAvatar: {
    width: 34,
    height: 34,

    borderRadius: 17,

    backgroundColor: "#f1f5f9",

    alignItems: "center",
    justifyContent: "center",
  },

  popupName: {
    fontSize: 13,

    fontWeight: "600",

    color: "#0f172a",
  },

  popupRole: {
    fontSize: 11,

    color: "#64748b",

    marginTop: 2,
  },

  popupEmail: {
    fontSize: 10,

    color: "#94a3b8",

    marginTop: 2,
  },

  popupDivider: {
    height: 1,

    backgroundColor: "#f1f5f9",

    marginVertical: 4,
  },

  /* =====================================================
     POPUP ITEM
  ===================================================== */

  popupItem: {
    flexDirection: "row",

    alignItems: "center",

    gap: 10,

    paddingHorizontal: 10,
    paddingVertical: 10,

    borderRadius: 8,
  },

  popupItemPressed: {
    backgroundColor: "#f8fafc",
  },

  popupItemText: {
    fontSize: 13,

    fontWeight: "500",

    color: "#475569",
  },

  /* =====================================================
     LOGOUT
  ===================================================== */

  logoutButton: {
    flexDirection: "row",

    alignItems: "center",

    gap: 10,

    paddingHorizontal: 10,
    paddingVertical: 10,

    borderRadius: 8,

    marginTop: 2,
  },

  logoutPressed: {
    backgroundColor: "#fef2f2",
  },

  logoutText: {
    fontSize: 13,

    fontWeight: "600",

    color: "#dc2626",
  },
});

