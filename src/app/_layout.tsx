import { Stack, usePathname } from "expo-router";
import {
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";

import Footer from "../components/Footer";
import Header from "../components/Header";
import { AuthProvider } from "../contexts/AuthContext";

const DESKTOP_WIDTH = 768;

export default function RootLayout() {
  const { width } = useWindowDimensions();
  const pathname = usePathname();

  const isDesktop = width >= DESKTOP_WIDTH;

  // Jangan tampilkan Header/Footer di halaman login
  const isAuthPage = pathname.includes("/login");

  return (
    <AuthProvider>
      <View style={styles.container}>
        {/* HEADER DESKTOP */}
        {isDesktop && !isAuthPage && <Header />}

        {/* CONTENT */}
        <View style={styles.content}>
          <Stack
            screenOptions={{
              headerShown: false,
            }}
          />
        </View>

        {/* FOOTER MOBILE */}
        {!isDesktop && !isAuthPage && <Footer />}
      </View>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f7fa",
  },

  content: {
    flex: 1,
  },
});