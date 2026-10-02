import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { collection, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";

import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";

import { db } from "../../firebase/config";

type PlanningItem = {
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
  deadline: string;
  status: string;
};

export default function OperatorDashboard() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 900;

  const [orders, setOrders] = useState<Order[]>([]);
  const [planning, setPlanning] = useState<PlanningItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribeOrders = onSnapshot(
      collection(db, "orders"),
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<Order, "id">),
        }));

        setOrders(data);
        setLoading(false);
      },
      (error) => {
        console.error("Orders error:", error);
        setLoading(false);
      }
    );

    const unsubscribePlanning = onSnapshot(
      collection(db, "planning"),
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<PlanningItem, "id">),
        }));

        setPlanning(data);
      },
      (error) => {
        console.error("Planning error:", error);
      }
    );

    return () => {
      unsubscribeOrders();
      unsubscribePlanning();
    };
  }, []);

  const running = planning.filter(
    (item) => item.status === "running"
  );

  const completed = planning.filter(
    (item) => item.status === "completed"
  );

  const planned = planning.filter(
    (item) => item.status === "planned"
  );

  const getOrder = (orderId: string) => {
    return orders.find((order) => order.id === orderId);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" />

        <Text style={styles.loadingText}>
          Loading dashboard...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* HEADER */}

      <View
        style={[
          styles.header,
          isDesktop && styles.desktopHeader,
        ]}
      >
        <View>
          <Text style={styles.eyebrow}>
            ROCKETPRINTZ
          </Text>

          <Text style={styles.title}>
            Operator
          </Text>

          <Text style={styles.subtitle}>
            Production workspace & monitoring
          </Text>
        </View>

        <View style={styles.onlineBadge}>
          <View style={styles.onlineDot} />

          <Text style={styles.onlineText}>
            System Online
          </Text>
        </View>
      </View>

      {/* STATS */}

      <View
        style={[
          styles.statsContainer,
          isDesktop && styles.statsDesktop,
        ]}
      >
        <StatCard
          icon="calendar-outline"
          label="Planning"
          value={planning.length}
          description={`${planned.length} scheduled`}
          onPress={() =>
            router.push("/(operator)/planning")
          }
        />

        <StatCard
          icon="play-circle-outline"
          label="Running"
          value={running.length}
          description="Active production"
          onPress={() =>
            router.push("/(operator)/running")
          }
        />

        <StatCard
          icon="checkmark-circle-outline"
          label="Completed"
          value={completed.length}
          description="Finished production"
          onPress={() =>
            router.push("/(operator)/running")
          }
        />

        <StatCard
          icon="layers-outline"
          label="Materials"
          value={orders.length}
          description="Production resources"
          onPress={() =>
            router.push("/(operator)/materials")
          }
        />
      </View>

      {/* PRODUCTION */}

      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionTitle}>
            Production
          </Text>

          <Text style={styles.sectionSubtitle}>
            Currently assigned to production
          </Text>
        </View>

        <Pressable
          style={styles.viewButton}
          onPress={() =>
            router.push("/(operator)/running")
          }
        >
          <Text style={styles.viewButtonText}>
            View all
          </Text>

          <Ionicons
            name="arrow-forward"
            size={14}
            color="#374151"
          />
        </Pressable>
      </View>

      {running.length === 0 ? (
        <EmptyProduction />
      ) : (
        <View style={styles.productionList}>
          {running.slice(0, 4).map((item) => {
            const order = getOrder(item.orderId);

            return (
              <ProductionCard
                key={item.id}
                item={item}
                order={order}
              />
            );
          })}
        </View>
      )}

      {/* SUMMARY */}

      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionTitle}>
            Overview
          </Text>

          <Text style={styles.sectionSubtitle}>
            Your production status
          </Text>
        </View>
      </View>

      <View
        style={[
          styles.summaryCard,
          isDesktop && styles.summaryDesktop,
        ]}
      >
        <SummaryRow
          icon="time-outline"
          title="Scheduled"
          value={planned.length}
          description="Waiting for production"
        />

        <View style={styles.summaryDivider} />

        <SummaryRow
          icon="play-outline"
          title="In Production"
          value={running.length}
          description="Currently running"
        />

        <View style={styles.summaryDivider} />

        <SummaryRow
          icon="checkmark-outline"
          title="Completed"
          value={completed.length}
          description="Production finished"
        />
      </View>
    </ScrollView>
  );
}

/* =========================
   STAT CARD
========================= */

function StatCard({
  icon,
  label,
  value,
  description,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: number;
  description: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={({ hovered, pressed }) => [
        styles.statCard,

        hovered && styles.statCardHover,

        pressed && styles.statCardPressed,
      ]}
      onPress={onPress}
    >
      {({ hovered }) => (
        <>
          <View style={styles.statTop}>
            <View
              style={[
                styles.iconBox,
                hovered && styles.iconBoxHover,
              ]}
            >
              <Ionicons
                name={icon}
                size={19}
                color={
                  hovered
                    ? "#ffffff"
                    : "#374151"
                }
              />
            </View>

            <Ionicons
              name="chevron-forward"
              size={15}
              color="#9ca3af"
            />
          </View>

          <Text
            style={[
              styles.statValue,
              hovered && styles.statValueHover,
            ]}
          >
            {value}
          </Text>

          <Text
            style={[
              styles.statLabel,
              hovered && styles.statLabelHover,
            ]}
          >
            {label}
          </Text>

          <Text
            style={[
              styles.statDescription,
              hovered &&
                styles.statDescriptionHover,
            ]}
          >
            {description}
          </Text>
        </>
      )}
    </Pressable>
  );
}

/* =========================
   PRODUCTION CARD
========================= */

function ProductionCard({
  item,
  order,
}: {
  item: PlanningItem;
  order?: Order;
}) {
  return (
    <View style={styles.productionCard}>
      <View style={styles.productionTop}>
        <View style={styles.machineIcon}>
          <Ionicons
            name="print-outline"
            size={20}
            color="#374151"
          />
        </View>

        <View style={styles.productionMain}>
          <Text style={styles.customerName}>
            {order?.customerName || "Unknown Customer"}
          </Text>

          <Text style={styles.productName}>
            {order?.product || "-"}
          </Text>
        </View>

        <View style={styles.runningBadge}>
          <View style={styles.runningDot} />

          <Text style={styles.runningText}>
            Running
          </Text>
        </View>
      </View>

      <View style={styles.progressSection}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>
            Production progress
          </Text>

          <Text style={styles.progressPercent}>
            Active
          </Text>
        </View>

        <View style={styles.progressTrack}>
          <View style={styles.progressFill} />
        </View>
      </View>

      <View style={styles.productionInfo}>
        <InfoItem
          icon="hardware-chip-outline"
          label="Machine"
          value={item.machine || "-"}
        />

        <InfoItem
          icon="person-outline"
          label="Operator"
          value={item.operatorName || "-"}
        />

        <InfoItem
          icon="layers-outline"
          label="Quantity"
          value={String(order?.quantity ?? "-")}
        />
      </View>
    </View>
  );
}

/* =========================
   INFO ITEM
========================= */

function InfoItem({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.infoItem}>
      <Ionicons
        name={icon}
        size={14}
        color="#9ca3af"
      />

      <View style={{ flex: 1 }}>
        <Text style={styles.infoLabel}>
          {label}
        </Text>

        <Text
          style={styles.infoValue}
          numberOfLines={1}
        >
          {value}
        </Text>
      </View>
    </View>
  );
}

/* =========================
   SUMMARY ROW
========================= */

function SummaryRow({
  icon,
  title,
  value,
  description,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  value: number;
  description: string;
}) {
  return (
    <View style={styles.summaryRow}>
      <View style={styles.summaryIcon}>
        <Ionicons
          name={icon}
          size={18}
          color="#374151"
        />
      </View>

      <View style={styles.summaryText}>
        <Text style={styles.summaryTitle}>
          {title}
        </Text>

        <Text style={styles.summaryDescription}>
          {description}
        </Text>
      </View>

      <Text style={styles.summaryValue}>
        {value}
      </Text>
    </View>
  );
}

/* =========================
   EMPTY
========================= */

function EmptyProduction() {
  return (
    <View style={styles.emptyCard}>
      <View style={styles.emptyIcon}>
        <Ionicons
          name="checkmark"
          size={22}
          color="#16a34a"
        />
      </View>

      <Text style={styles.emptyTitle}>
        No active production
      </Text>

      <Text style={styles.emptyText}>
        There is currently no production running.
      </Text>
    </View>
  );
}

/* =========================
   STYLES
========================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fb",
  },

  content: {
    padding: 22,
    paddingBottom: 110,
    maxWidth: 1280,
    width: "100%",
    alignSelf: "center",
  },

  header: {
    marginBottom: 26,
  },

  desktopHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  eyebrow: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.8,
    color: "#9ca3af",
    marginBottom: 5,
  },

  title: {
    fontSize: 30,
    fontWeight: "700",
    color: "#111827",
    letterSpacing: -0.7,
  },

  subtitle: {
    marginTop: 5,
    fontSize: 14,
    color: "#6b7280",
  },

  onlineBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginTop: 15,
    alignSelf: "flex-start",
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },

  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 10,
    backgroundColor: "#22c55e",
  },

  onlineText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#4b5563",
  },

  statsContainer: {
    gap: 12,
    marginBottom: 32,
  },

  statsDesktop: {
    flexDirection: "row",
  },

  statCard: {
    flex: 1,
    minHeight: 150,
    padding: 18,
    backgroundColor: "#ffffff",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#e7e9ed",
  },

  statCardHover: {
    backgroundColor: "#111827",
    borderColor: "#111827",
  },

  statCardPressed: {
    backgroundColor: "#111827",
    borderColor: "#111827",
  },

  statTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
  },

  iconBoxHover: {
    backgroundColor: "#374151",
  },

  statValue: {
    marginTop: 18,
    fontSize: 28,
    fontWeight: "700",
    color: "#111827",
  },

  statValueHover: {
    color: "#ffffff",
  },

  statLabel: {
    marginTop: 2,
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
  },

  statLabelHover: {
    color: "#ffffff",
  },

  statDescription: {
    marginTop: 4,
    fontSize: 11,
    color: "#9ca3af",
  },

  statDescriptionHover: {
    color: "#9ca3af",
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 13,
    marginTop: 4,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },

  sectionSubtitle: {
    marginTop: 3,
    fontSize: 12,
    color: "#9ca3af",
  },

  viewButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },

  viewButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#374151",
  },

  productionList: {
    gap: 12,
    marginBottom: 32,
  },

  productionCard: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: "#e7e9ed",
  },

  productionTop: {
    flexDirection: "row",
    alignItems: "center",
  },

  machineIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
  },

  productionMain: {
    flex: 1,
    marginLeft: 12,
  },

  customerName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
  },

  productName: {
    marginTop: 3,
    fontSize: 12,
    color: "#6b7280",
  },

  runningBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#ecfdf5",
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 20,
  },

  runningDot: {
    width: 6,
    height: 6,
    borderRadius: 10,
    backgroundColor: "#22c55e",
  },

  runningText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#15803d",
  },

  progressSection: {
    marginTop: 20,
  },

  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 7,
  },

  progressLabel: {
    fontSize: 11,
    color: "#9ca3af",
  },

  progressPercent: {
    fontSize: 11,
    fontWeight: "600",
    color: "#374151",
  },

  progressTrack: {
    height: 6,
    borderRadius: 10,
    backgroundColor: "#eef0f2",
    overflow: "hidden",
  },

  progressFill: {
    width: "65%",
    height: "100%",
    backgroundColor: "#111827",
    borderRadius: 10,
  },

  productionInfo: {
    flexDirection: "row",
    gap: 20,
    marginTop: 18,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#f0f1f3",
  },

  infoItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  infoLabel: {
    fontSize: 9,
    color: "#9ca3af",
  },

  infoValue: {
    marginTop: 2,
    fontSize: 11,
    fontWeight: "600",
    color: "#374151",
  },

  summaryCard: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#e7e9ed",
    paddingHorizontal: 18,
  },

  summaryDesktop: {
    maxWidth: 650,
  },

  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
  },

  summaryIcon: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
  },

  summaryText: {
    flex: 1,
    marginLeft: 12,
  },

  summaryTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
  },

  summaryDescription: {
    marginTop: 2,
    fontSize: 10,
    color: "#9ca3af",
  },

  summaryValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },

  summaryDivider: {
    height: 1,
    backgroundColor: "#f0f1f3",
  },

  emptyCard: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#e7e9ed",
    paddingVertical: 38,
    alignItems: "center",
    marginBottom: 32,
  },

  emptyIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#ecfdf5",
    justifyContent: "center",
    alignItems: "center",
  },

  emptyTitle: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },

  emptyText: {
    marginTop: 4,
    fontSize: 11,
    color: "#9ca3af",
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fb",
  },

  loadingText: {
    marginTop: 10,
    fontSize: 12,
    color: "#6b7280",
  },
});
