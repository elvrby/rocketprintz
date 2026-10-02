// src/app/(operator)/planning.tsx

import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions
} from "react-native";

import {
  collection,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";

import { useAuth } from "../../contexts/AuthContext";
import { db } from "../../firebase/config";

type PlanningStatus =
  | "planned"
  | "running"
  | "completed";

type Planning = {
  id: string;
  orderId: string;
  machine: string;
  operatorId: string;
  operatorName: string;
  scheduledDate: string;
  status: PlanningStatus | string;
  createdAt?: any;
};

type Order = {
  id: string;
  orderCode?: string;
  customerName?: string;
  product?: string;
  quantity?: number;
  deadline?: string;
};

export default function OperatorPlanning() {
  const { profile } = useAuth();

  const { width } = useWindowDimensions();

  const isDesktop = width >= 768;

  const [plannings, setPlannings] = useState<Planning[]>([]);
  const [orders, setOrders] = useState<Record<string, Order>>({});

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const planningQuery = query(
      collection(db, "planning"),
      orderBy("scheduledDate", "asc")
    );

    const unsubscribe = onSnapshot(
      planningQuery,
      (snapshot) => {
        const data: Planning[] = snapshot.docs.map((item) => {
          const value = item.data();

          return {
            id: item.id,
            orderId: value.orderId || "",
            machine: value.machine || "-",
            operatorId: value.operatorId || "",
            operatorName: value.operatorName || "-",
            scheduledDate: value.scheduledDate || "",
            status: value.status || "planned",
            createdAt: value.createdAt,
          };
        });

        setPlannings(data);
        setLoading(false);
        setRefreshing(false);
      },
      (error) => {
        console.error(
          "Gagal mengambil planning:",
          error
        );

        setLoading(false);
        setRefreshing(false);
      }
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "orders"),
      (snapshot) => {
        const orderData: Record<string, Order> = {};

        snapshot.docs.forEach((item) => {
          const value = item.data();

          orderData[item.id] = {
            id: item.id,
            orderCode:
              value.orderCode ||
              value.code ||
              "-",
            customerName:
              value.customerName ||
              "-",
            product:
              value.product ||
              "-",
            quantity:
              typeof value.quantity === "number"
                ? value.quantity
                : 0,
            deadline:
              value.deadline ||
              "",
          };
        });

        setOrders(orderData);
      },
      (error) => {
        console.error(
          "Gagal mengambil orders:",
          error
        );
      }
    );

    return () => unsubscribe();
  }, []);

  const visiblePlannings = useMemo(() => {
    if (!profile) {
      return [];
    }

    /*
     * Operator hanya melihat planning miliknya.
     *
     * Jika ingin semua operator bisa melihat semua planning,
     * ubah bagian ini menjadi:
     *
     * return plannings;
     */

    return plannings.filter((item) => {
      return (
        item.operatorId === profile.uid ||
        item.operatorId === profile.email ||
        item.operatorName === profile.name
      );
    });
  }, [plannings, profile]);

  const statistics = useMemo(() => {
    return {
      total: visiblePlannings.length,

      planned: visiblePlannings.filter(
        (item) => item.status === "planned"
      ).length,

      running: visiblePlannings.filter(
        (item) => item.status === "running"
      ).length,

      completed: visiblePlannings.filter(
        (item) => item.status === "completed"
      ).length,
    };
  }, [visiblePlannings]);

  const handleRefresh = () => {
    setRefreshing(true);

    setTimeout(() => {
      setRefreshing(false);
    }, 500);
  };

  const formatDate = (date: string) => {
    if (!date) {
      return "-";
    }

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return date;
    }

    return parsedDate.toLocaleDateString(
      "id-ID",
      {
        day: "2-digit",
        month: "long",
        year: "numeric",
      }
    );
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "planned":
        return "Planned";

      case "running":
        return "Running";

      case "completed":
        return "Completed";

      default:
        return status;
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "planned":
        return styles.statusPlanned;

      case "running":
        return styles.statusRunning;

      case "completed":
        return styles.statusCompleted;

      default:
        return styles.statusDefault;
    }
  };

  const renderPlanning = ({
    item,
  }: {
    item: Planning;
  }) => {
    const order = orders[item.orderId];

    return (
      <View
        style={[
          styles.card,
          isDesktop && styles.cardDesktop,
        ]}
      >
        <View style={styles.cardHeader}>
          <View style={styles.orderInfo}>
            <Text style={styles.orderCode}>
              {order?.orderCode || item.orderId}
            </Text>

            <Text style={styles.customerName}>
              {order?.customerName || "-"}
            </Text>
          </View>

          <View
            style={[
              styles.statusBadge,
              getStatusStyle(item.status),
            ]}
          >
            <Text style={styles.statusText}>
              {getStatusLabel(item.status)}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.infoGrid}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>
              Produk
            </Text>

            <Text style={styles.infoValue}>
              {order?.product || "-"}
            </Text>
          </View>

          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>
              Quantity
            </Text>

            <Text style={styles.infoValue}>
              {order?.quantity || 0}
            </Text>
          </View>

          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>
              Mesin
            </Text>

            <Text style={styles.infoValue}>
              {item.machine}
            </Text>
          </View>

          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>
              Jadwal Produksi
            </Text>

            <Text style={styles.infoValue}>
              {formatDate(
                item.scheduledDate
              )}
            </Text>
          </View>

          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>
              Deadline
            </Text>

            <Text style={styles.infoValue}>
              {formatDate(
                order?.deadline || ""
              )}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />

          <Text style={styles.loadingText}>
            Memuat planning...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View
        style={[
          styles.container,
          isDesktop && styles.containerDesktop,
        ]}
      >
        {/* HEADER */}

        <View style={styles.header}>
          <View>
            <Text style={styles.title}>
              Planning
            </Text>

            <Text style={styles.subtitle}>
              Jadwal produksi Anda
            </Text>
          </View>
        </View>

        {/* STATISTICS */}

        <View
          style={[
            styles.statsContainer,
            isDesktop &&
              styles.statsContainerDesktop,
          ]}
        >
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>
              Total
            </Text>

            <Text style={styles.statValue}>
              {statistics.total}
            </Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statLabel}>
              Planned
            </Text>

            <Text style={styles.statValue}>
              {statistics.planned}
            </Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statLabel}>
              Running
            </Text>

            <Text style={styles.statValue}>
              {statistics.running}
            </Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statLabel}>
              Completed
            </Text>

            <Text style={styles.statValue}>
              {statistics.completed}
            </Text>
          </View>
        </View>

        {/* CONTENT */}

        {visiblePlannings.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>
              📋
            </Text>

            <Text style={styles.emptyTitle}>
              Belum ada planning
            </Text>

            <Text style={styles.emptyText}>
              Planning yang ditugaskan kepada
              Anda akan muncul di sini.
            </Text>
          </View>
        ) : (
          <FlatList
            data={visiblePlannings}
            keyExtractor={(item) => item.id}
            renderItem={renderPlanning}
            contentContainerStyle={
              styles.listContent
            }
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
              />
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },

  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },

  containerDesktop: {
    maxWidth: 1200,
    width: "100%",
    alignSelf: "center",
    paddingHorizontal: 28,
    paddingTop: 28,
  },

  header: {
    marginBottom: 20,
  },

  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111",
  },

  subtitle: {
    marginTop: 5,
    fontSize: 14,
    color: "#777",
  },

  statsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 20,
  },

  statsContainerDesktop: {
    gap: 14,
  },

  statCard: {
    flex: 1,
    minWidth: 130,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e5e5e5",
  },

  statLabel: {
    fontSize: 13,
    color: "#777",
    marginBottom: 6,
  },

  statValue: {
    fontSize: 25,
    fontWeight: "700",
    color: "#111",
  },

  listContent: {
    paddingBottom: 30,
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e5e5e5",
  },

  cardDesktop: {
    padding: 20,
  },

  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },

  orderInfo: {
    flex: 1,
  },

  orderCode: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111",
  },

  customerName: {
    marginTop: 4,
    fontSize: 13,
    color: "#777",
  },

  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },

  statusPlanned: {
    backgroundColor: "#f0f0f0",
  },

  statusRunning: {
    backgroundColor: "#e8e8e8",
  },

  statusCompleted: {
    backgroundColor: "#dcdcdc",
  },

  statusDefault: {
    backgroundColor: "#f0f0f0",
  },

  statusText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#111",
  },

  divider: {
    height: 1,
    backgroundColor: "#eeeeee",
    marginVertical: 15,
  },

  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 18,
  },

  infoItem: {
    minWidth: 130,
    flex: 1,
  },

  infoLabel: {
    fontSize: 11,
    color: "#999",
    marginBottom: 4,
  },

  infoValue: {
    fontSize: 14,
    fontWeight: "500",
    color: "#222",
  },

  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
  },

  emptyIcon: {
    fontSize: 40,
    marginBottom: 12,
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111",
  },

  emptyText: {
    marginTop: 6,
    fontSize: 13,
    color: "#888",
    textAlign: "center",
    lineHeight: 20,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  loadingText: {
    marginTop: 12,
    color: "#777",
    fontSize: 14,
  },
});