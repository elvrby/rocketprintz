import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { db } from "../../firebase/config";

type Order = {
  id: string;
  customerName: string;
  product: string;
  quantity: number;
  deadline: string;
  status: string;
  createdAt?: any;
};

export default function SupervisorOrders() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, "orders"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data: Order[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<Order, "id">),
        }));

        setOrders(data);
        setLoading(false);
      },
      (error) => {
        console.error("Load orders error:", error);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "completed":
        return styles.statusCompleted;

      case "running":
        return styles.statusRunning;

      case "cancelled":
        return styles.statusCancelled;

      default:
        return styles.statusPending;
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Memuat order...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        isDesktop && styles.desktopContent,
      ]}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Orders</Text>
          <Text style={styles.subtitle}>
            Monitoring seluruh pesanan produksi
          </Text>
        </View>

        <View style={styles.totalBox}>
          <Text style={styles.totalNumber}>{orders.length}</Text>
          <Text style={styles.totalLabel}>Total Order</Text>
        </View>
      </View>

      {orders.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>Belum ada order</Text>
          <Text style={styles.emptyText}>
            Data order akan muncul di halaman ini.
          </Text>
        </View>
      ) : (
        <View
          style={[
            styles.grid,
            isDesktop && styles.gridDesktop,
          ]}
        >
          {orders.map((order) => (
            <View
              key={order.id}
              style={[
                styles.card,
                isDesktop && styles.cardDesktop,
              ]}
            >
              <View style={styles.cardTop}>
                <View style={styles.orderNumber}>
                  <Text style={styles.orderNumberText}>
                    #{order.id.slice(0, 6).toUpperCase()}
                  </Text>
                </View>

                <View
                  style={[
                    styles.status,
                    getStatusStyle(order.status),
                  ]}
                >
                  <Text style={styles.statusText}>
                    {order.status || "pending"}
                  </Text>
                </View>
              </View>

              <Text style={styles.customer}>
                {order.customerName}
              </Text>

              <Text style={styles.product}>
                {order.product}
              </Text>

              <View style={styles.divider} />

              <View style={styles.infoRow}>
                <View>
                  <Text style={styles.label}>Quantity</Text>
                  <Text style={styles.value}>
                    {order.quantity}
                  </Text>
                </View>

                <View>
                  <Text style={styles.label}>Deadline</Text>
                  <Text style={styles.value}>
                    {order.deadline || "-"}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f6f7f9",
  },

  content: {
    padding: 20,
    paddingBottom: 100,
  },

  desktopContent: {
    maxWidth: 1200,
    width: "100%",
    alignSelf: "center",
    paddingHorizontal: 32,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },

  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111827",
  },

  subtitle: {
    marginTop: 5,
    fontSize: 14,
    color: "#6b7280",
  },

  totalBox: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    alignItems: "center",
  },

  totalNumber: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
  },

  totalLabel: {
    fontSize: 11,
    color: "#6b7280",
    marginTop: 2,
  },

  grid: {
    gap: 14,
  },

  gridDesktop: {
    flexDirection: "row",
    flexWrap: "wrap",
  },

  card: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },

  cardDesktop: {
    width: "48.5%",
  },

  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  orderNumber: {
    backgroundColor: "#f3f4f6",
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
  },

  orderNumberText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#6b7280",
  },

  status: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },

  statusText: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "capitalize",
  },

  statusCompleted: {
    backgroundColor: "#dcfce7",
  },

  statusRunning: {
    backgroundColor: "#dbeafe",
  },

  statusCancelled: {
    backgroundColor: "#fee2e2",
  },

  statusPending: {
    backgroundColor: "#fef3c7",
  },

  customer: {
    marginTop: 18,
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },

  product: {
    marginTop: 4,
    fontSize: 14,
    color: "#6b7280",
  },

  divider: {
    height: 1,
    backgroundColor: "#f0f0f0",
    marginVertical: 16,
  },

  infoRow: {
    flexDirection: "row",
    gap: 50,
  },

  label: {
    fontSize: 11,
    color: "#9ca3af",
    marginBottom: 4,
  },

  value: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f6f7f9",
  },

  loadingText: {
    marginTop: 10,
    color: "#6b7280",
  },

  empty: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 40,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },

  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },

  emptyText: {
    marginTop: 6,
    fontSize: 13,
    color: "#9ca3af",
  },
});