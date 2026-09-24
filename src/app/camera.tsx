import { StyleSheet, Text, View } from "react-native";

export default function CameraPage() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Camera</Text>
      <Text>Halaman scan / kamera RocketPrintz</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 8,
  },
});