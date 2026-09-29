import {
  collection,
  onSnapshot,
  query,
  where,
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

type RunningItem = {
  id: string;
  orderId: string;
  machine: string;
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

export default function SupervisorRunning() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const [running, setRunning] = useState<RunningItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const runningQuery = query(
      collection(db, "planning"),
      where("status", "==", "running")
    );

    const unsubRunning = onSnapshot(
      runningQuery,
      (snapshot) => {
        setRunning(
          snapshot.docs.map((doc) => ({
            id: doc.id,
            ...(doc.data() as Omit<RunningItem, "id">),
          }))
        );

        setLoading(false);
      },
      (error) => {
        console.error("Running error:", error);
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
      unsubRunning();
      unsubOrders();
    };
  }, []);

  const getOrder = (orderId: string) => {
    return orders.find((item) => item.id === orderId);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>
          Memuat produksi...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      {/* HEADER */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Running</Text>
          <Text style={styles.subtitle}>
            Monitoring produksi yang sedang berjalan
          </Text>
        </View>

        <View style={styles.runningBadge}>
          <View style={styles.dot} />

          <Text style={styles.runningNumber}>
            {running.length}
          </Text>

          <Text style={styles.runningLabel}>
            Active
          </Text>
        </View>
      </View>

      {/* ACTIVE PRODUCTION */}
      {running.length === 0 ? (
        <View style={styles.empty}>
          <View style={styles.emptyCircle}>
            <Text style={styles.emptyIcon}>✓</Text>
          </View>

          <Text style={styles.emptyTitle}>
            Tidak ada produksi berjalan
          </Text>

          <Text style={styles.emptyText}>
            Semua pekerjaan sedang tidak aktif.
          </Text>
        </View>
      ) : (
        <View
          style={[
            styles.grid,
            isDesktop && styles.desktopGrid,
          ]}
        >
          {running.map((item) => {
            const order = getOrder(item.orderId);

            return (
              <View
                key={item.id}
                style={[
                  styles.card,
                  isDesktop && styles.desktopCard,
                ]}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.liveBadge}>
                    <View style={styles.liveDot} />

                    <Text style={styles.liveText}>
                      RUNNING
                    </Text>
                  </View>

                  <Text style={styles.machine}>
                    {item.machine}
                  </Text>
                </View>

                <Text style={styles.customer}>
                  {order?.customerName ||
                    "Unknown customer"}
                </Text>

                <Text style={styles.product}>
                  {order?.product || "-"}
                </Text>

                <View style={styles.progressContainer}>
                  <View style={styles.progressHeader}>
                    <Text style={styles.progressLabel}>
                      Production
                    </Text>

                    <Text style={styles.progressValue}>
                      Active
                    </Text>
                  </View>

                  <View style={styles.progressBackground}>
                    <View style={styles.progressBar} />
                  </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.infoGrid}>
                  <View>
                    <Text style={styles.label}>
                      Operator
                    </Text>

                    <Text style={styles.value}>
                      {item.operatorName || "-"}
                    </Text>
                  </View>

                  <View>
                    <Text style={styles.label}>
                      Quantity
                    </Text>

                    <Text style={styles.value}>
                      {order?.quantity ?? "-"}
                    </Text>
                  </View>

                  <View>
                    <Text style={styles.label}>
                      Schedule
                    </Text>

                    <Text style={styles.value}>
                      {item.scheduledDate || "-"}
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

  runningBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 6,
  },

  dot: {
    width: 7,
    height: 7,
    borderRadius: 10,
    backgroundColor: "#22c55e",
  },

  runningNumber: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },

  runningLabel: {
    fontSize: 11,
    color: "#6b7280",
  },

  grid: {
    gap: 14,
  },

  desktopGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },

  card: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },

  desktopCard: {
    width: "48.5%",
  },

  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#ecfdf5",
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 20,
  },

  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 10,
    backgroundColor: "#22c55e",
  },

  liveText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#15803d",
  },

  machine: {
    fontSize: 12,
    color: "#6b7280",
    fontWeight: "600",
  },

  customer: {
    marginTop: 20,
    fontSize: 19,
    fontWeight: "700",
    color: "#111827",
  },

  product: {
    marginTop: 4,
    fontSize: 14,
    color: "#6b7280",
  },

  progressContainer: {
    marginTop: 22,
  },

  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },

  progressLabel: {
    fontSize: 11,
    color: "#9ca3af",
  },

  progressValue: {
    fontSize: 11,
    fontWeight: "600",
    color: "#16a34a",
  },

  progressBackground: {
    height: 7,
    backgroundColor: "#e5e7eb",
    borderRadius: 10,
    overflow: "hidden",
  },

  progressBar: {
    width: "65%",
    height: "100%",
    backgroundColor: "#22c55e",
    borderRadius: 10,
  },

  divider: {
    height: 1,
    backgroundColor: "#f0f0f0",
    marginVertical: 18,
  },

  infoGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 15,
  },

  label: {
    fontSize: 10,
    color: "#9ca3af",
    marginBottom: 5,
  },

  value: {
    fontSize: 12,
    fontWeight: "600",
    color: "#374151",
  },

  empty: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 45,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },

  emptyCircle: {
    width: 50,
    height: 50,
    borderRadius: 30,
    backgroundColor: "#ecfdf5",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },

  emptyIcon: {
    fontSize: 22,
    color: "#16a34a",
    fontWeight: "700",
  },

  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },

  emptyText: {
    marginTop: 5,
    fontSize: 13,
    color: "#9ca3af",
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
});