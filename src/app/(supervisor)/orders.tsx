// src/app/(supervisor)/orders.tsx

import {
  collection,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";
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
  orderCode?: string;
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
        const data: Order[] = snapshot.docs.map((document) => {
          const orderData = document.data();

          return {
            id: document.id,
            ...(orderData as Omit<Order, "id">),
          };
        });

        setOrders(data);
        setLoading(false);
      },
      (error) => {
        console.error("Load supervisor orders error:", error);
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

      case "processing":
        return styles.statusProcessing;

      case "pending":
      default:
        return styles.statusPending;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "completed":
        return "Completed";

      case "running":
        return "Running";

      case "processing":
        return "Processing";

      case "cancelled":
        return "Cancelled";

      case "pending":
      default:
        return "Pending";
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>
          Memuat order...
        </Text>
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
      showsVerticalScrollIndicator={false}
    >
      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Orders</Text>

          <Text style={styles.subtitle}>
            Monitoring seluruh pesanan produksi
          </Text>
        </View>

        <View style={styles.totalBox}>
          <Text style={styles.totalNumber}>
            {orders.length}
          </Text>

          <Text style={styles.totalLabel}>
            Total Order
          </Text>
        </View>
      </View>

      {/* EMPTY */}
      {orders.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>
            Belum ada order
          </Text>

          <Text style={styles.emptyText}>
            Data order akan muncul di halaman ini.
          </Text>
        </View>
      ) : (
        /* ORDER LIST */
        <View
          style={[
            styles.grid,
            isDesktop && styles.gridDesktop,
          ]}
        >
          {orders.map((order) => {
            const displayOrderCode =
              order.orderCode ||
              `SO-${order.id.slice(0, 6).toUpperCase()}`;

            return (
              <View
                key={order.id}
                style={[
                  styles.card,
                  isDesktop && styles.cardDesktop,
                ]}
              >
                {/* TOP */}
                <View style={styles.cardTop}>
                  <View style={styles.orderCodeBox}>
                    <Text style={styles.orderCodeLabel}>
                      ORDER CODE
                    </Text>

                    <Text style={styles.orderCode}>
                      {displayOrderCode}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.status,
                      getStatusStyle(order.status),
                    ]}
                  >
                    <Text style={styles.statusText}>
                      {getStatusLabel(order.status)}
                    </Text>
                  </View>
                </View>

                {/* CUSTOMER */}
                <Text style={styles.customer}>
                  {order.customerName || "-"}
                </Text>

                {/* PRODUCT */}
                <Text style={styles.product}>
                  {order.product || "-"}
                </Text>

                {/* DIVIDER */}
                <View style={styles.divider} />

                {/* INFO */}
                <View style={styles.infoRow}>
                  <View style={styles.infoItem}>
                    <Text style={styles.label}>
                      Quantity
                    </Text>

                    <Text style={styles.value}>
                      {order.quantity ?? 0}
                    </Text>
                  </View>

                  <View style={styles.infoItem}>
                    <Text style={styles.label}>
                      Deadline
                    </Text>

                    <Text style={styles.value}>
                      {order.deadline || "-"}
                    </Text>
                  </View>
                </View>
              </View>
            );
          })}
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

  /* HEADER */

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },

  headerLeft: {
    flex: 1,
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

  /* TOTAL */

  totalBox: {
    minWidth: 90,
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

  /* GRID */

  grid: {
    gap: 14,
  },

  gridDesktop: {
    flexDirection: "row",
    flexWrap: "wrap",
  },

  /* CARD */

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

  /* CARD TOP */

  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },

  /* ORDER CODE */

  orderCodeBox: {
    backgroundColor: "#f3f4f6",
    borderRadius: 9,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },

  orderCodeLabel: {
    fontSize: 8,
    fontWeight: "600",
    color: "#9ca3af",
    letterSpacing: 0.6,
    marginBottom: 2,
  },

  orderCode: {
    fontSize: 13,
    fontWeight: "700",
    color: "#111827",
  },

  /* STATUS */

  status: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },

  statusText: {
    fontSize: 11,
    fontWeight: "600",
  },

  statusCompleted: {
    backgroundColor: "#dcfce7",
  },

  statusRunning: {
    backgroundColor: "#dbeafe",
  },

  statusProcessing: {
    backgroundColor: "#e0e7ff",
  },

  statusCancelled: {
    backgroundColor: "#fee2e2",
  },

  statusPending: {
    backgroundColor: "#fef3c7",
  },

  /* CUSTOMER */

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

  /* DIVIDER */

  divider: {
    height: 1,
    backgroundColor: "#f0f0f0",
    marginVertical: 16,
  },

  /* INFORMATION */

  infoRow: {
    flexDirection: "row",
    gap: 50,
  },

  infoItem: {
    minWidth: 90,
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

  /* LOADING */

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

  /* EMPTY */

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
