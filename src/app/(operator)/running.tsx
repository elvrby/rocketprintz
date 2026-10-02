// src/app/(operator)/running.tsx

import { useEffect, useMemo, useState } from "react";

import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";

import { Pressable } from "react-native";

import {
  collection,
  doc,
  onSnapshot,
  updateDoc,
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
};

type Order = {
  id: string;
  orderCode?: string;
  customerName?: string;
  product?: string;
  quantity?: number;
  deadline?: string;
};

export default function OperatorRunning() {
  const { profile } = useAuth();

  const { width } = useWindowDimensions();

  const isDesktop = width >= 768;

  const [plannings, setPlannings] = useState<
    Planning[]
  >([]);

  const [orders, setOrders] = useState<
    Record<string, Order>
  >({});

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [processingId, setProcessingId] =
    useState<string | null>(null);

  /**
   * =====================================================
   * AMBIL DATA PLANNING
   * =====================================================
   */

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "planning"),
      (snapshot) => {
        const data: Planning[] =
          snapshot.docs.map((item) => {
            const value = item.data();

            return {
              id: item.id,

              orderId:
                value.orderId || "",

              machine:
                value.machine || "-",

              operatorId:
                value.operatorId || "",

              operatorName:
                value.operatorName || "-",

              scheduledDate:
                value.scheduledDate || "",

              status:
                value.status || "planned",
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

  /**
   * =====================================================
   * AMBIL DATA ORDER
   * =====================================================
   */

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "orders"),
      (snapshot) => {
        const data: Record<
          string,
          Order
        > = {};

        snapshot.docs.forEach((item) => {
          const value = item.data();

          data[item.id] = {
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
              typeof value.quantity ===
              "number"
                ? value.quantity
                : 0,

            deadline:
              value.deadline ||
              "",
          };
        });

        setOrders(data);
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

  /**
   * =====================================================
   * CEK PLANNING MILIK OPERATOR
   * =====================================================
   */

  const myPlannings = useMemo(() => {
    if (!profile) {
      return [];
    }

    return plannings.filter((item) => {
      return (
        item.operatorId ===
          profile.uid ||
        item.operatorId ===
          profile.email ||
        item.operatorName ===
          profile.name
      );
    });
  }, [plannings, profile]);

  /**
   * =====================================================
   * PLANNING YANG BELUM DIMULAI
   * =====================================================
   */

  const plannedPlannings = useMemo(() => {
    return myPlannings.filter(
      (item) =>
        item.status === "planned"
    );
  }, [myPlannings]);

  /**
   * =====================================================
   * PLANNING YANG SEDANG RUNNING
   * =====================================================
   */

  const runningPlannings = useMemo(() => {
    return myPlannings.filter(
      (item) =>
        item.status === "running"
    );
  }, [myPlannings]);

  /**
   * =====================================================
   * FORMAT TANGGAL
   * =====================================================
   */

  const formatDate = (
    date: string
  ) => {
    if (!date) {
      return "-";
    }

    const parsedDate =
      new Date(date);

    if (
      Number.isNaN(
        parsedDate.getTime()
      )
    ) {
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

  /**
   * =====================================================
   * MULAI PRODUKSI
   * planned -> running
   * =====================================================
   */

  const startProduction = async (
    planning: Planning
  ) => {
    if (processingId) {
      return;
    }

    try {
      setProcessingId(planning.id);

      await updateDoc(
        doc(
          db,
          "planning",
          planning.id
        ),
        {
          status: "running",
        }
      );

      if (Platform.OS === "web") {
        window.alert(
          "Produksi berhasil dimulai."
        );
      } else {
        Alert.alert(
          "Berhasil",
          "Produksi berhasil dimulai."
        );
      }
    } catch (error) {
      console.error(
        "Gagal memulai produksi:",
        error
      );

      if (Platform.OS === "web") {
        window.alert(
          "Gagal memulai produksi."
        );
      } else {
        Alert.alert(
          "Error",
          "Gagal memulai produksi."
        );
      }
    } finally {
      setProcessingId(null);
    }
  };

  /**
   * =====================================================
   * SELESAIKAN PRODUKSI
   * running -> completed
   * =====================================================
   */

  const finishProduction = async (
    planning: Planning
  ) => {
    if (processingId) {
      return;
    }

    const executeFinish =
      async () => {
        try {
          setProcessingId(
            planning.id
          );

          await updateDoc(
            doc(
              db,
              "planning",
              planning.id
            ),
            {
              status: "completed",
            }
          );

          if (
            Platform.OS === "web"
          ) {
            window.alert(
              "Produksi berhasil diselesaikan."
            );
          } else {
            Alert.alert(
              "Berhasil",
              "Produksi berhasil diselesaikan."
            );
          }
        } catch (error) {
          console.error(
            "Gagal menyelesaikan produksi:",
            error
          );

          if (
            Platform.OS === "web"
          ) {
            window.alert(
              "Gagal menyelesaikan produksi."
            );
          } else {
            Alert.alert(
              "Error",
              "Gagal menyelesaikan produksi."
            );
          }
        } finally {
          setProcessingId(null);
        }
      };

    if (Platform.OS === "web") {
      const confirmed =
        window.confirm(
          `Selesaikan produksi ${
            orders[
              planning.orderId
            ]?.orderCode ||
            planning.orderId
          }?`
        );

      if (!confirmed) {
        return;
      }

      await executeFinish();

      return;
    }

    Alert.alert(
      "Selesaikan Produksi",
      `Apakah produksi ${
        orders[
          planning.orderId
        ]?.orderCode ||
        planning.orderId
      } sudah selesai?`,
      [
        {
          text: "Batal",
          style: "cancel",
        },
        {
          text: "Selesai",
          onPress: executeFinish,
        },
      ]
    );
  };

  /**
   * =====================================================
   * REFRESH
   * =====================================================
   */

  const handleRefresh = () => {
    setRefreshing(true);

    setTimeout(() => {
      setRefreshing(false);
    }, 500);
  };

  /**
   * =====================================================
   * CARD PLANNING
   * =====================================================
   */

  const renderPlanningCard = (
    planning: Planning,
    mode: "planned" | "running"
  ) => {
    const order =
      orders[planning.orderId];

    const isProcessing =
      processingId ===
      planning.id;

    return (
      <View
        style={[
          styles.card,
          isDesktop &&
            styles.cardDesktop,
        ]}
      >
        {/* HEADER */}

        <View
          style={styles.cardHeader}
        >
          <View
            style={styles.orderInfo}
          >
            <Text
              style={styles.orderCode}
            >
              {order?.orderCode ||
                planning.orderId}
            </Text>

            <Text
              style={
                styles.customerName
              }
            >
              {order?.customerName ||
                "-"}
            </Text>
          </View>

          {mode === "planned" ? (
            <View
              style={
                styles.plannedBadge
              }
            >
              <Text
                style={
                  styles.plannedBadgeText
                }
              >
                Planned
              </Text>
            </View>
          ) : (
            <View
              style={
                styles.runningBadge
              }
            >
              <View
                style={
                  styles.runningDot
                }
              />

              <Text
                style={
                  styles.runningText
                }
              >
                Running
              </Text>
            </View>
          )}
        </View>

        {/* DIVIDER */}

        <View
          style={styles.divider}
        />

        {/* INFORMATION */}

        <View
          style={styles.infoGrid}
        >
          <View
            style={styles.infoItem}
          >
            <Text
              style={styles.infoLabel}
            >
              Produk
            </Text>

            <Text
              style={styles.infoValue}
            >
              {order?.product ||
                "-"}
            </Text>
          </View>

          <View
            style={styles.infoItem}
          >
            <Text
              style={styles.infoLabel}
            >
              Quantity
            </Text>

            <Text
              style={styles.infoValue}
            >
              {order?.quantity ||
                0}
            </Text>
          </View>

          <View
            style={styles.infoItem}
          >
            <Text
              style={styles.infoLabel}
            >
              Mesin
            </Text>

            <Text
              style={styles.infoValue}
            >
              {planning.machine}
            </Text>
          </View>

          <View
            style={styles.infoItem}
          >
            <Text
              style={styles.infoLabel}
            >
              Jadwal
            </Text>

            <Text
              style={styles.infoValue}
            >
              {formatDate(
                planning.scheduledDate
              )}
            </Text>
          </View>

          <View
            style={styles.infoItem}
          >
            <Text
              style={styles.infoLabel}
            >
              Deadline
            </Text>

            <Text
              style={styles.infoValue}
            >
              {formatDate(
                order?.deadline ||
                  ""
              )}
            </Text>
          </View>
        </View>

        {/* OPERATOR */}

        <View
          style={
            styles.operatorContainer
          }
        >
          <View>
            <Text
              style={
                styles.operatorLabel
              }
            >
              Operator
            </Text>

            <Text
              style={
                styles.operatorValue
              }
            >
              {
                planning.operatorName
              }
            </Text>
          </View>
        </View>

        {/* ACTION */}

        {mode === "planned" ? (
          <Pressable
            disabled={isProcessing}
            onPress={() =>
              startProduction(
                planning
              )
            }
            style={({ pressed }) => [
              styles.startButton,

              pressed &&
                styles.buttonPressed,

              isProcessing &&
                styles.buttonDisabled,
            ]}
          >
            {isProcessing ? (
              <ActivityIndicator
                color="#fff"
                size="small"
              />
            ) : (
              <Text
                style={
                  styles.startButtonText
                }
              >
                Mulai Produksi
              </Text>
            )}
          </Pressable>
        ) : (
          <Pressable
            disabled={isProcessing}
            onPress={() =>
              finishProduction(
                planning
              )
            }
            style={({ pressed }) => [
              styles.finishButton,

              pressed &&
                styles.buttonPressed,

              isProcessing &&
                styles.buttonDisabled,
            ]}
          >
            {isProcessing ? (
              <ActivityIndicator
                color="#fff"
                size="small"
              />
            ) : (
              <Text
                style={
                  styles.finishButtonText
                }
              >
                Selesai
              </Text>
            )}
          </Pressable>
        )}
      </View>
    );
  };

  /**
   * =====================================================
   * LOADING
   * =====================================================
   */

  if (loading) {
    return (
      <SafeAreaView
        style={styles.safeArea}
      >
        <View
          style={
            styles.loadingContainer
          }
        >
          <ActivityIndicator
            size="large"
          />

          <Text
            style={styles.loadingText}
          >
            Memuat pekerjaan...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  /**
   * =====================================================
   * PAGE
   * =====================================================
   */

  return (
    <SafeAreaView
      style={styles.safeArea}
    >
      <View
        style={[
          styles.container,
          isDesktop &&
            styles.containerDesktop,
        ]}
      >
        {/* HEADER */}

        <View
          style={styles.header}
        >
          <View>
            <Text
              style={styles.title}
            >
              Running
            </Text>

            <Text
              style={styles.subtitle}
            >
              Kelola pekerjaan produksi
              Anda
            </Text>
          </View>

          <View
            style={styles.totalBadge}
          >
            <Text
              style={styles.totalNumber}
            >
              {runningPlannings.length}
            </Text>

            <Text
              style={styles.totalLabel}
            >
              Running
            </Text>
          </View>
        </View>

        {/* =================================================
            PLANNING SIAP DIMULAI
        ================================================= */}

        {plannedPlannings.length >
          0 && (
          <View
            style={
              styles.sectionContainer
            }
          >
            <View
              style={
                styles.sectionHeader
              }
            >
              <View>
                <Text
                  style={
                    styles.sectionTitle
                  }
                >
                  Planning
                </Text>

                <Text
                  style={
                    styles.sectionSubtitle
                  }
                >
                  Pilih pekerjaan untuk
                  mulai diproduksi
                </Text>
              </View>

              <View
                style={
                  styles.countBadge
                }
              >
                <Text
                  style={
                    styles.countBadgeText
                  }
                >
                  {
                    plannedPlannings.length
                  }
                </Text>
              </View>
            </View>

            {plannedPlannings.map(
              (planning) => (
                <View
                  key={planning.id}
                >
                  {renderPlanningCard(
                    planning,
                    "planned"
                  )}
                </View>
              )
            )}
          </View>
        )}

        {/* =================================================
            SEDANG BERJALAN
        ================================================= */}

        {runningPlannings.length >
          0 && (
          <View
            style={
              styles.sectionContainer
            }
          >
            <View
              style={
                styles.sectionHeader
              }
            >
              <View>
                <Text
                  style={
                    styles.sectionTitle
                  }
                >
                  Sedang Berjalan
                </Text>

                <Text
                  style={
                    styles.sectionSubtitle
                  }
                >
                  Pekerjaan yang sedang
                  diproduksi
                </Text>
              </View>

              <View
                style={
                  styles.runningCountBadge
                }
              >
                <Text
                  style={
                    styles.runningCountText
                  }
                >
                  {
                    runningPlannings.length
                  }
                </Text>
              </View>
            </View>

            {runningPlannings.map(
              (planning) => (
                <View
                  key={planning.id}
                >
                  {renderPlanningCard(
                    planning,
                    "running"
                  )}
                </View>
              )
            )}
          </View>
        )}

        {/* =================================================
            EMPTY
        ================================================= */}

        {plannedPlannings.length ===
          0 &&
          runningPlannings.length ===
            0 && (
            <View
              style={
                styles.emptyContainer
              }
            >
              <Text
                style={
                  styles.emptyIcon
                }
              >
                ✓
              </Text>

              <Text
                style={
                  styles.emptyTitle
                }
              >
                Tidak ada pekerjaan
              </Text>

              <Text
                style={
                  styles.emptyText
                }
              >
                Belum ada planning yang
                ditugaskan kepada Anda.
              </Text>
            </View>
          )}

        {/* Hidden FlatList hanya untuk
            refresh gesture pada mobile */}

        <FlatList
          data={[]}
          keyExtractor={() => ""}
          renderItem={() => null}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={
                handleRefresh
              }
            />
          }
        />
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent:
      "space-between",
    marginBottom: 24,
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

  totalBadge: {
    minWidth: 75,
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e5e5",
    borderRadius: 12,
    paddingVertical: 9,
    paddingHorizontal: 12,
  },

  totalNumber: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111",
  },

  totalLabel: {
    marginTop: 2,
    fontSize: 11,
    color: "#777",
  },

  sectionContainer: {
    marginBottom: 24,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent:
      "space-between",
    marginBottom: 12,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111",
  },

  sectionSubtitle: {
    marginTop: 3,
    fontSize: 12,
    color: "#888",
  },

  countBadge: {
    minWidth: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#eaeaea",
  },

  countBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#111",
  },

  runningCountBadge: {
    minWidth: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#111",
  },

  runningCountText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#fff",
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
    justifyContent:
      "space-between",
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

  plannedBadge: {
    backgroundColor: "#f0f0f0",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },

  plannedBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#555",
  },

  runningBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#111",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },

  runningDot: {
    width: 7,
    height: 7,
    borderRadius: 10,
    backgroundColor: "#fff",
    marginRight: 6,
  },

  runningText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#fff",
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

  operatorContainer: {
    marginTop: 18,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: "#eeeeee",
  },

  operatorLabel: {
    fontSize: 11,
    color: "#999",
    marginBottom: 4,
  },

  operatorValue: {
    fontSize: 13,
    fontWeight: "600",
    color: "#222",
  },

  startButton: {
    marginTop: 18,
    minHeight: 44,
    borderRadius: 10,
    backgroundColor: "#111",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },

  startButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },

  finishButton: {
    marginTop: 18,
    minHeight: 44,
    borderRadius: 10,
    backgroundColor: "#111",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },

  finishButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },

  buttonPressed: {
    opacity: 0.75,
  },

  buttonDisabled: {
    opacity: 0.5,
  },

  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
  },

  emptyIcon: {
    width: 55,
    height: 55,
    borderRadius: 30,
    backgroundColor: "#111",
    color: "#fff",
    textAlign: "center",
    lineHeight: 55,
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 15,
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111",
  },

  emptyText: {
    marginTop: 7,
    fontSize: 13,
    color: "#888",
    textAlign: "center",
    lineHeight: 20,
    maxWidth: 400,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#777",
  },
});