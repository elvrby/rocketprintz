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

type Planning = {
  id: string;
  orderId: string;
  machine: string;
  operatorId: string;
  operatorName: string;
  scheduledDate: string;
  status: string;
};

type Order = {
  id: string;
  customerName: string;
  product: string;
  quantity: number;
};

export default function SupervisorPlanning() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const [planning, setPlanning] = useState<Planning[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const planningQuery = query(
      collection(db, "planning"),
      orderBy("scheduledDate", "asc")
    );

    const unsubPlanning = onSnapshot(
      planningQuery,
      (snapshot) => {
        setPlanning(
          snapshot.docs.map((doc) => ({
            id: doc.id,
            ...(doc.data() as Omit<Planning, "id">),
          }))
        );

        setLoading(false);
      },
      (error) => {
        console.error("Planning error:", error);
        setLoading(false);
      }
    );

    const unsubOrders = onSnapshot(
      collection(db, "orders"),
      (snapshot) => {
        setOrders(
          snapshot.docs.map((doc) => ({
            id: doc.id,
            ...(doc.data() as Omit<Order, "id">),
          }))
        );
      }
    );

    return () => {
      unsubPlanning();
      unsubOrders();
    };
  }, []);

  const getOrder = (orderId: string) => {
    return orders.find((order) => order.id === orderId);
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "running":
        return {
          backgroundColor: "#dbeafe",
          color: "#2563eb",
        };

      case "completed":
        return {
          backgroundColor: "#dcfce7",
          color: "#15803d",
        };

      case "cancelled":
        return {
          backgroundColor: "#fee2e2",
          color: "#dc2626",
        };

      default:
        return {
          backgroundColor: "#fef3c7",
          color: "#b45309",
        };
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>
          Memuat planning...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Planning</Text>
          <Text style={styles.subtitle}>
            Jadwal dan aktivitas produksi
          </Text>
        </View>

        <View style={styles.countBox}>
          <Text style={styles.countNumber}>
            {planning.length}
          </Text>
          <Text style={styles.countLabel}>Schedule</Text>
        </View>
      </View>

      {planning.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>
            Belum ada planning
          </Text>
          <Text style={styles.emptyText}>
            Jadwal produksi belum tersedia.
          </Text>
        </View>
      ) : (
        <View
          style={[
            styles.list,
            isDesktop && styles.desktopList,
          ]}
        >
          {planning.map((item) => {
            const order = getOrder(item.orderId);
            const status = getStatusStyle(item.status);

            return (
              <View
                key={item.id}
                style={[
                  styles.card,
                  isDesktop && styles.desktopCard,
                ]}
              >
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={styles.machine}>
                      {item.machine}
                    </Text>

                    <Text style={styles.schedule}>
                      {item.scheduledDate || "-"}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.status,
                      {
                        backgroundColor:
                          status.backgroundColor,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        { color: status.color },
                      ]}
                    >
                      {item.status}
                    </Text>
                  </View>
                </View>

                <View style={styles.orderSection}>
                  <Text style={styles.sectionLabel}>
                    ORDER
                  </Text>

                  <Text style={styles.customer}>
                    {order?.customerName || "Unknown customer"}
                  </Text>

                  <Text style={styles.product}>
                    {order?.product || "-"}
                  </Text>
                </View>

                <View style={styles.divider} />

                <View style={styles.bottomRow}>
                  <View>
                    <Text style={styles.label}>Operator</Text>
                    <Text style={styles.value}>
                      {item.operatorName || "-"}
                    </Text>
                  </View>

                  <View>
                    <Text style={styles.label}>Quantity</Text>
                    <Text style={styles.value}>
                      {order?.quantity ?? "-"}
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

  countBox: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 10,
    alignItems: "center",
  },

  countNumber: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
  },

  countLabel: {
    fontSize: 11,
    color: "#9ca3af",
  },

  list: {
    gap: 14,
  },

  desktopList: {
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

  desktopCard: {
    width: "48.5%",
  },

  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },

  machine: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111827",
  },

  schedule: {
    marginTop: 5,
    fontSize: 13,
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

  orderSection: {
    marginTop: 20,
  },

  sectionLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#9ca3af",
    letterSpacing: 1,
    marginBottom: 7,
  },

  customer: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },

  product: {
    marginTop: 3,
    fontSize: 13,
    color: "#6b7280",
  },

  divider: {
    height: 1,
    backgroundColor: "#f0f0f0",
    marginVertical: 16,
  },

  bottomRow: {
    flexDirection: "row",
    gap: 60,
  },

  label: {
    fontSize: 11,
    color: "#9ca3af",
    marginBottom: 4,
  },

  value: {
    fontSize: 13,
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