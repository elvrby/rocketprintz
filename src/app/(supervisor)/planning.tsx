// src/app/(supervisor)/planning.tsx

import {
  collection,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";
import { useEffect, useState } from "react";

import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";

import * as Print from "expo-print";

import { db } from "../../firebase/config";

import {
  generateWorkOrderHTML,
  WorkOrderOrder,
  WorkOrderPlanning,
} from "../../components/print/work-order-template";


// =====================================================
// TYPES
// =====================================================

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
  orderCode?: string;
  customerName: string;
  product: string;
  quantity: number;
  deadline?: string;
};


// =====================================================
// COMPONENT
// =====================================================

export default function SupervisorPlanning() {
  const { width } = useWindowDimensions();

  const isDesktop = width >= 768;

  const [planning, setPlanning] = useState<Planning[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // Menyimpan ID planning yang sedang diprint
  const [printingId, setPrintingId] = useState<string | null>(null);


  // ===================================================
  // LOAD FIRESTORE DATA
  // ===================================================

  useEffect(() => {
    const planningQuery = query(
      collection(db, "planning"),
      orderBy("scheduledDate", "asc")
    );

    const unsubPlanning = onSnapshot(
      planningQuery,
      (snapshot) => {
        const data: Planning[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<Planning, "id">),
        }));

        setPlanning(data);
        setLoading(false);
      },
      (error) => {
        console.error("Planning error:", error);

        setLoading(false);
      }
    );


    // -----------------------------------------------
    // LOAD ORDERS
    // -----------------------------------------------

    const unsubOrders = onSnapshot(
      collection(db, "orders"),
      (snapshot) => {
        const data: Order[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<Order, "id">),
        }));

        setOrders(data);
      },
      (error) => {
        console.error("Orders error:", error);
      }
    );


    return () => {
      unsubPlanning();
      unsubOrders();
    };
  }, []);


  // ===================================================
  // FIND ORDER
  // ===================================================

  const getOrder = (orderId: string) => {
    return orders.find(
      (order) => order.id === orderId
    );
  };


  // ===================================================
  // STATUS STYLE
  // ===================================================

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

      case "planned":
        return {
          backgroundColor: "#fef3c7",
          color: "#b45309",
        };

      default:
        return {
          backgroundColor: "#fef3c7",
          color: "#b45309",
        };
    }
  };


  // ===================================================
  // STATUS LABEL
  // ===================================================

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "running":
        return "Running";

      case "completed":
        return "Completed";

      case "cancelled":
        return "Cancelled";

      case "planned":
        return "Planned";

      case "pending":
        return "Pending";

      default:
        return status || "Pending";
    }
  };


  // ===================================================
  // PRINT WORK ORDER
  // ===================================================

  const handlePrintWorkOrder = async (
    item: Planning
  ) => {
    const order = getOrder(item.orderId);


    // -----------------------------------------------
    // CHECK ORDER
    // -----------------------------------------------

    if (!order) {
      Alert.alert(
        "Order tidak ditemukan",
        "Order yang terhubung dengan planning ini tidak ditemukan."
      );

      return;
    }


    try {
      setPrintingId(item.id);


      // ---------------------------------------------
      // PREPARE PLANNING DATA
      // ---------------------------------------------

      const planningData: WorkOrderPlanning = {
        id: item.id,

        orderId: item.orderId,

        machine: item.machine,

        operatorId: item.operatorId,

        operatorName: item.operatorName,

        scheduledDate: item.scheduledDate,

        status: item.status,
      };


      // ---------------------------------------------
      // PREPARE ORDER DATA
      // ---------------------------------------------

      const orderData: WorkOrderOrder = {
        id: order.id,

        orderCode: order.orderCode,

        customerName: order.customerName,

        product: order.product,

        quantity: order.quantity,

        deadline: order.deadline,
      };


      // ---------------------------------------------
      // GENERATE HTML
      // ---------------------------------------------

      const html = generateWorkOrderHTML({
        planning: planningData,
        order: orderData,
      });


      // =================================================
      // WEB PRINT
      // =================================================

      if (Platform.OS === "web") {

        const printWindow = window.open(
          "",
          "_blank",
          "width=900,height=700"
        );


        // Browser memblokir popup
        if (!printWindow) {
          Alert.alert(
            "Print gagal",
            "Browser memblokir popup. Silakan izinkan popup untuk website RocketPrintz."
          );

          return;
        }


        // ---------------------------------------------
        // WRITE HTML TO NEW WINDOW
        // ---------------------------------------------

        printWindow.document.open();

        printWindow.document.write(html);

        printWindow.document.close();


        // ---------------------------------------------
        // FOCUS WINDOW
        // ---------------------------------------------

        printWindow.focus();


        // ---------------------------------------------
        // WAIT FOR HTML TO LOAD
        // ---------------------------------------------

        setTimeout(() => {

          printWindow.print();

        }, 500);


        return;
      }


      // =================================================
      // ANDROID / IOS PRINT
      // =================================================

      await Print.printAsync({
        html,
      });

    } catch (error) {

      console.error(
        "Print Work Order error:",
        error
      );


      Alert.alert(
        "Print gagal",
        "Work Order tidak dapat dicetak."
      );

    } finally {

      setPrintingId(null);

    }
  };


  // ===================================================
  // LOADING
  // ===================================================

  if (loading) {
    return (
      <View style={styles.center}>

        <ActivityIndicator
          size="large"
        />

        <Text
          style={styles.loadingText}
        >
          Memuat planning...
        </Text>

      </View>
    );
  }


  // ===================================================
  // UI
  // ===================================================

  return (
    <ScrollView
      style={styles.container}

      contentContainerStyle={[
        styles.content,
        isDesktop &&
          styles.desktopContent,
      ]}

      showsVerticalScrollIndicator={false}
    >

      {/* =================================================
          HEADER
      ================================================= */}

      <View style={styles.header}>

        <View>

          <Text style={styles.title}>
            Planning
          </Text>

          <Text style={styles.subtitle}>
            Jadwal dan aktivitas produksi
          </Text>

        </View>


        <View style={styles.countBox}>

          <Text
            style={styles.countNumber}
          >
            {planning.length}
          </Text>

          <Text
            style={styles.countLabel}
          >
            Schedule
          </Text>

        </View>

      </View>


      {/* =================================================
          EMPTY
      ================================================= */}

      {planning.length === 0 ? (

        <View style={styles.empty}>

          <Text
            style={styles.emptyTitle}
          >
            Belum ada planning
          </Text>

          <Text
            style={styles.emptyText}
          >
            Jadwal produksi belum tersedia.
          </Text>

        </View>

      ) : (

        /* =================================================
           LIST
        ================================================= */

        <View
          style={[
            styles.list,
            isDesktop &&
              styles.desktopList,
          ]}
        >

          {planning.map((item) => {

            const order =
              getOrder(item.orderId);


            const status =
              getStatusStyle(
                item.status
              );


            // -------------------------------------------
            // ORDER CODE
            // -------------------------------------------

            const orderCode =
              order?.orderCode ||
              `SO-${item.orderId
                .slice(0, 6)
                .toUpperCase()}`;


            const isPrinting =
              printingId === item.id;


            return (

              <View
                key={item.id}

                style={[
                  styles.card,

                  isDesktop &&
                    styles.desktopCard,
                ]}
              >

                {/* ======================================
                    CARD HEADER
                ====================================== */}

                <View
                  style={
                    styles.cardHeader
                  }
                >

                  {/* ORDER CODE */}

                  <View
                    style={
                      styles.orderCodeBox
                    }
                  >

                    <Text
                      style={
                        styles.orderCodeLabel
                      }
                    >
                      ORDER CODE
                    </Text>


                    <Text
                      style={
                        styles.orderCode
                      }
                    >
                      {orderCode}
                    </Text>

                  </View>


                  {/* STATUS */}

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

                        {
                          color:
                            status.color,
                        },
                      ]}
                    >
                      {getStatusLabel(
                        item.status
                      )}
                    </Text>

                  </View>

                </View>


                {/* ======================================
                    MACHINE + SCHEDULE
                ====================================== */}

                <View
                  style={
                    styles.productionInfo
                  }
                >

                  {/* MACHINE */}

                  <View
                    style={
                      styles.infoBox
                    }
                  >

                    <Text
                      style={
                        styles.infoLabel
                      }
                    >
                      MESIN
                    </Text>


                    <Text
                      style={
                        styles.infoValue
                      }
                    >
                      {item.machine ||
                        "-"}
                    </Text>

                  </View>


                  {/* SCHEDULE DATE */}

                  <View
                    style={
                      styles.infoBox
                    }
                  >

                    <Text
                      style={
                        styles.infoLabel
                      }
                    >
                      SCHEDULE DATE
                    </Text>


                    <Text
                      style={
                        styles.infoValue
                      }
                    >
                      {item.scheduledDate ||
                        "-"}
                    </Text>

                  </View>

                </View>


                {/* ======================================
                    ORDER
                ====================================== */}

                <View
                  style={
                    styles.orderSection
                  }
                >

                  <Text
                    style={
                      styles.sectionLabel
                    }
                  >
                    ORDER
                  </Text>


                  <Text
                    style={styles.customer}
                  >
                    {order?.customerName ||
                      "Unknown customer"}
                  </Text>


                  <Text
                    style={styles.product}
                  >
                    {order?.product ||
                      "-"}
                  </Text>

                </View>


                {/* ======================================
                    DIVIDER
                ====================================== */}

                <View
                  style={styles.divider}
                />


                {/* ======================================
                    OPERATOR + QUANTITY
                ====================================== */}

                <View
                  style={styles.bottomRow}
                >

                  {/* OPERATOR */}

                  <View
                    style={
                      styles.bottomItem
                    }
                  >

                    <Text
                      style={
                        styles.label
                      }
                    >
                      Operator
                    </Text>


                    <Text
                      style={
                        styles.value
                      }
                    >
                      {item.operatorName ||
                        "-"}
                    </Text>

                  </View>


                  {/* QUANTITY */}

                  <View
                    style={
                      styles.bottomItem
                    }
                  >

                    <Text
                      style={
                        styles.label
                      }
                    >
                      Quantity
                    </Text>


                    <Text
                      style={
                        styles.value
                      }
                    >
                      {order?.quantity ??
                        "-"}
                    </Text>

                  </View>

                </View>


                {/* ======================================
                    PRINT BUTTON
                ====================================== */}

                <Pressable

                  disabled={isPrinting}

                  onPress={() =>
                    handlePrintWorkOrder(
                      item
                    )
                  }

                  style={[
                    styles.printButton,

                    isPrinting &&
                      styles.printButtonDisabled,
                  ]}
                >

                  {isPrinting ? (

                    <View
                      style={
                        styles.printLoading
                      }
                    >

                      <ActivityIndicator
                        size="small"
                        color="#ffffff"
                      />

                      <Text
                        style={
                          styles.printButtonText
                        }
                      >
                        Menyiapkan print...
                      </Text>

                    </View>

                  ) : (

                    <Text
                      style={
                        styles.printButtonText
                      }
                    >
                      Print Work Order
                    </Text>

                  )}

                </Pressable>

              </View>
            );
          })}

        </View>
      )}

    </ScrollView>
  );
}


// =====================================================
// STYLES
// =====================================================

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


  // ===================================================
  // HEADER
  // ===================================================

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


  // ===================================================
  // LIST
  // ===================================================

  list: {
    gap: 14,
  },


  desktopList: {
    flexDirection: "row",
    flexWrap: "wrap",
  },


  // ===================================================
  // CARD
  // ===================================================

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


  // ===================================================
  // CARD HEADER
  // ===================================================

  cardHeader: {
    flexDirection: "row",

    justifyContent: "space-between",

    alignItems: "flex-start",
  },


  orderCodeBox: {
    backgroundColor: "#f3f4f6",

    borderRadius: 9,

    paddingHorizontal: 10,

    paddingVertical: 7,
  },


  orderCodeLabel: {
    fontSize: 8,

    fontWeight: "700",

    color: "#9ca3af",

    letterSpacing: 0.7,

    marginBottom: 2,
  },


  orderCode: {
    fontSize: 13,

    fontWeight: "700",

    color: "#111827",
  },


  // ===================================================
  // STATUS
  // ===================================================

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


  // ===================================================
  // PRODUCTION INFO
  // ===================================================

  productionInfo: {
    flexDirection: "row",

    gap: 12,

    marginTop: 18,
  },


  infoBox: {
    flex: 1,

    backgroundColor: "#f9fafb",

    borderRadius: 10,

    paddingHorizontal: 12,

    paddingVertical: 10,

    borderWidth: 1,

    borderColor: "#f0f0f0",
  },


  infoLabel: {
    fontSize: 9,

    fontWeight: "700",

    color: "#9ca3af",

    letterSpacing: 0.5,

    marginBottom: 4,
  },


  infoValue: {
    fontSize: 13,

    fontWeight: "600",

    color: "#374151",
  },


  // ===================================================
  // ORDER
  // ===================================================

  orderSection: {
    marginTop: 18,
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


  // ===================================================
  // DIVIDER
  // ===================================================

  divider: {
    height: 1,

    backgroundColor: "#f0f0f0",

    marginVertical: 16,
  },


  // ===================================================
  // BOTTOM
  // ===================================================

  bottomRow: {
    flexDirection: "row",

    gap: 60,
  },


  bottomItem: {
    minWidth: 90,
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


  // ===================================================
  // PRINT BUTTON
  // ===================================================

  printButton: {
    marginTop: 18,

    backgroundColor: "#111827",

    borderRadius: 10,

    minHeight: 42,

    paddingVertical: 11,

    alignItems: "center",

    justifyContent: "center",
  },


  printButtonDisabled: {
    opacity: 0.6,
  },


  printLoading: {
    flexDirection: "row",

    alignItems: "center",

    justifyContent: "center",

    gap: 8,
  },


  printButtonText: {
    color: "#ffffff",

    fontSize: 13,

    fontWeight: "600",
  },


  // ===================================================
  // LOADING
  // ===================================================

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


  // ===================================================
  // EMPTY
  // ===================================================

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
