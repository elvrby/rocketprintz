// src/components/ui/planning-ui.tsx

import DateTimePicker from "@react-native-community/datetimepicker";
import React from "react";

import {
    Alert,
    FlatList,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";

export type PlanningStatus =
  | "planned"
  | "running"
  | "completed"
  | "cancelled";

export type PlanningUIOrder = {
  id: string;
  orderCode?: string;
  customerName: string;
  product: string;
  quantity: number;

  // Deadline order
  deadline: string;

  status: string;
};

export type PlanningUIOperator = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "operator" | "supervisor";
};

export type PlanningUIItem = {
  id: string;
  orderId: string;

  orderCode?: string;
  customerName?: string;
  product?: string;
  quantity?: number;

  machine: string;
  operatorId: string;
  operatorName: string;
  scheduledDate: string;

  status: PlanningStatus;
};

type Props = {
  width: number;

  planning: PlanningUIItem[];
  availableOrders: PlanningUIOrder[];
  operators: PlanningUIOperator[];

  modalVisible: boolean;
  editingId: string | null;

  orderId: string;
  machine: string;
  operatorId: string;
  scheduledDate: Date;
  status: PlanningStatus;

  showDatePicker: boolean;

  activePicker:
    | "order"
    | "machine"
    | "operator"
    | "status"
    | null;

  selectedOrder?: PlanningUIOrder;
  selectedOperator?: PlanningUIOperator;

  openAddModal: () => void;
  closeModal: () => void;

  editPlanning: (
    item: PlanningUIItem
  ) => void;

  deletePlanning: (
    id: string
  ) => void;

  savePlanning: () => void;

  setOrderId: (
    value: string
  ) => void;

  setMachine: (
    value: string
  ) => void;

  setOperatorId: (
    value: string
  ) => void;

  setScheduledDate: (
    value: Date
  ) => void;

  setStatus: (
    value: PlanningStatus
  ) => void;

  setShowDatePicker: (
    value: boolean
  ) => void;

  setActivePicker: (
    value:
      | "order"
      | "machine"
      | "operator"
      | "status"
      | null
  ) => void;
};

const MACHINES = [
  "Printer A",
  "Printer B",
  "Printer C",
  "Cutting A",
  "Finishing A",
];

const STATUS_OPTIONS: {
  value: PlanningStatus;
  label: string;
  color: string;
  bg: string;
}[] = [
  {
    value: "planned",
    label: "Direncanakan",
    color: "#6366f1",
    bg: "#eef2ff",
  },
  {
    value: "running",
    label: "Sedang Berjalan",
    color: "#0284c7",
    bg: "#e0f2fe",
  },
  {
    value: "completed",
    label: "Selesai",
    color: "#16a34a",
    bg: "#dcfce7",
  },
  {
    value: "cancelled",
    label: "Dibatalkan",
    color: "#dc2626",
    bg: "#fee2e2",
  },
];

export default function PlanningUI({
  width,
  planning,
  availableOrders,
  operators,

  modalVisible,
  editingId,

  orderId,
  machine,
  operatorId,
  scheduledDate,
  status,

  showDatePicker,
  activePicker,

  selectedOrder,
  selectedOperator,

  openAddModal,
  closeModal,

  editPlanning,
  deletePlanning,
  savePlanning,

  setOrderId,
  setMachine,
  setOperatorId,
  setScheduledDate,
  setStatus,

  setShowDatePicker,
  setActivePicker,
}: Props) {
  const isMobile = width < 768;

  // ======================================================
  // DATE HELPERS
  // ======================================================

  /**
   * Mengubah string YYYY-MM-DD
   * menjadi Date lokal.
   */
  const parseDate = (
    dateString?: string
  ): Date | null => {
    if (!dateString) {
      return null;
    }

    const parts = dateString.split("-");

    if (parts.length !== 3) {
      return null;
    }

    const year = Number(parts[0]);
    const month = Number(parts[1]);
    const day = Number(parts[2]);

    if (
      !year ||
      !month ||
      !day
    ) {
      return null;
    }

    const date = new Date(
      year,
      month - 1,
      day
    );

    date.setHours(
      0,
      0,
      0,
      0
    );

    return date;
  };

  /**
   * Format Date menjadi YYYY-MM-DD.
   */
  const formatDate = (
    date: Date
  ): string => {
    const year =
      date.getFullYear();

    const month =
      String(
        date.getMonth() + 1
      ).padStart(2, "0");

    const day =
      String(
        date.getDate()
      ).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  /**
   * Deadline order yang sedang dipilih.
   */
  const selectedDeadline =
    parseDate(
      selectedOrder?.deadline
    );

  /**
   * Mengubah tanggal produksi.
   *
   * Jika tanggal lebih besar
   * dari deadline, otomatis
   * dikembalikan ke deadline.
   */
  const handleScheduledDateChange = (
    date: Date
  ) => {
    const newDate =
      new Date(date);

    newDate.setHours(
      0,
      0,
      0,
      0
    );

    if (selectedDeadline) {
      const deadline =
        new Date(
          selectedDeadline
        );

      deadline.setHours(
        0,
        0,
        0,
        0
      );

      if (
        newDate > deadline
      ) {
        setScheduledDate(
          deadline
        );

        return;
      }
    }

    setScheduledDate(
      newDate
    );
  };

  /**
   * Handler khusus Web.
   *
   * Digunakan oleh:
   * <input type="date">
   */
  const handleWebDateChange = (
    value: string
  ) => {
    if (!value) {
      return;
    }

    const selectedDate =
      parseDate(value);

    if (!selectedDate) {
      return;
    }

    handleScheduledDateChange(
      selectedDate
    );
  };

  /**
   * Saat order dipilih.
   *
   * Jika tanggal planning sekarang
   * melewati deadline order,
   * otomatis dikembalikan ke deadline.
   */
  const handleSelectOrder = (
    order: PlanningUIOrder
  ) => {
    setOrderId(
      order.id
    );

    const deadline =
      parseDate(
        order.deadline
      );

    if (deadline) {
      const currentDate =
        new Date(
          scheduledDate
        );

      currentDate.setHours(
        0,
        0,
        0,
        0
      );

      if (
        currentDate > deadline
      ) {
        setScheduledDate(
          deadline
        );
      }
    }

    setActivePicker(
      null
    );
  };

  /**
   * Konfirmasi hapus yang
   * kompatibel dengan Web
   * dan Mobile.
   */
  const handleDeletePlanning = (
    id: string
  ) => {
    // ==============================================
    // WEB
    // ==============================================

    if (Platform.OS === "web") {
      const confirmed =
        window.confirm(
          "Apakah Anda yakin ingin menghapus planning ini?"
        );

      if (confirmed) {
        deletePlanning(id);
      }

      return;
    }

    // ==============================================
    // ANDROID / IOS
    // ==============================================

    Alert.alert(
      "Hapus Planning",
      "Apakah Anda yakin ingin menghapus planning ini?",
      [
        {
          text: "Batal",
          style: "cancel",
        },
        {
          text: "Hapus",
          style: "destructive",
          onPress: () => {
            deletePlanning(id);
          },
        },
      ]
    );
  };

  const getStatusConfig = (
    value: string
  ) => {
    return (
      STATUS_OPTIONS.find(
        (item) =>
          item.value === value
      ) ?? {
        label: value,
        color: "#4b5563",
        bg: "#f3f4f6",
      }
    );
  };

  return (
    <View
      style={
        styles.container
      }
    >
      {/* ==================================================
          HEADER
      ================================================== */}

      <View
        style={[
          styles.header,
          isMobile &&
            styles.headerMobile,
        ]}
      >
        <View
          style={
            styles.headerTextContainer
          }
        >
          <Text
            style={[
              styles.title,
              isMobile &&
                styles.titleMobile,
            ]}
            numberOfLines={1}
          >
            Planning Produksi
          </Text>

          <Text
            style={[
              styles.subtitle,
              isMobile &&
                styles.subtitleMobile,
            ]}
            numberOfLines={1}
          >
            Jadwal mesin & alokasi operator
          </Text>
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.addButton,
            isMobile &&
              styles.addButtonMobile,
            pressed &&
              styles.pressedOpacity,
          ]}
          onPress={
            openAddModal
          }
        >
          <Text
            style={[
              styles.addButtonText,
              isMobile &&
                styles.addButtonTextMobile,
            ]}
          >
            + Tambah
          </Text>
        </Pressable>
      </View>

      {/* ==================================================
          LIST
      ================================================== */}

      <FlatList
        data={planning}
        keyExtractor={(item) =>
          item.id
        }
        contentContainerStyle={[
          styles.list,
          isMobile &&
            styles.listMobile,
        ]}
        showsVerticalScrollIndicator={
          false
        }
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <View
            style={
              styles.empty
            }
          >
            <View
              style={
                styles.emptyIconCircle
              }
            >
              <Text
                style={
                  styles.emptyIcon
                }
              >
                📋
              </Text>
            </View>

            <Text
              style={
                styles.emptyTitle
              }
            >
              Belum ada planning
            </Text>

            <Text
              style={
                styles.emptyText
              }
            >
              Buat jadwal produksi pertama
              Anda untuk mulai mengelola
              antrean.
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const statusConfig =
            getStatusConfig(
              item.status
            );

          return (
            <View
              style={[
                styles.card,
                isMobile &&
                  styles.cardMobile,
              ]}
            >
              {/* CARD HEADER */}

              <View
                style={[
                  styles.cardHeader,
                  isMobile &&
                    styles.cardHeaderMobile,
                ]}
              >
                <View
                  style={
                    styles.cardTitleContainer
                  }
                >
                  {item.orderCode ? (
                    <Text
                      style={
                        styles.orderCode
                      }
                    >
                      {
                        item.orderCode
                      }
                    </Text>
                  ) : null}

                  <Text
                    style={[
                      styles.product,
                      isMobile &&
                        styles.productMobile,
                    ]}
                    numberOfLines={2}
                  >
                    {item.product ||
                      "Produk tidak tersedia"}
                  </Text>

                  <Text
                    style={[
                      styles.customer,
                      isMobile &&
                        styles.customerMobile,
                    ]}
                    numberOfLines={1}
                  >
                    {item.customerName ||
                      "-"}
                  </Text>
                </View>

                <View
                  style={[
                    styles.statusBadge,
                    isMobile &&
                      styles.statusBadgeMobile,
                    {
                      backgroundColor:
                        statusConfig.bg,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.statusDot,
                      {
                        backgroundColor:
                          statusConfig.color,
                      },
                    ]}
                  />

                  <Text
                    style={[
                      styles.statusText,
                      {
                        color:
                          statusConfig.color,
                      },
                    ]}
                  >
                    {
                      statusConfig.label
                    }
                  </Text>
                </View>
              </View>

              <View
                style={
                  styles.divider
                }
              />

              {/* INFO */}

              <View
                style={[
                  styles.infoGrid,
                  isMobile &&
                    styles.infoGridMobile,
                ]}
              >
                <InfoItem
                  label="Tanggal"
                  value={
                    item.scheduledDate ||
                    "-"
                  }
                  icon="📅"
                  isMobile={
                    isMobile
                  }
                />

                <InfoItem
                  label="Mesin"
                  value={
                    item.machine ||
                    "-"
                  }
                  icon="⚙️"
                  isMobile={
                    isMobile
                  }
                />

                <InfoItem
                  label="Operator"
                  value={
                    item.operatorName ||
                    "-"
                  }
                  icon="👤"
                  isMobile={
                    isMobile
                  }
                />

                <InfoItem
                  label="Kuantitas"
                  value={
                    item.quantity !==
                    undefined
                      ? `${item.quantity} pcs`
                      : "-"
                  }
                  icon="📦"
                  isMobile={
                    isMobile
                  }
                />
              </View>

              {/* ACTION */}

              <View
                style={[
                  styles.cardFooter,
                  isMobile &&
                    styles.cardFooterMobile,
                ]}
              >
                <Pressable
                  style={({ pressed }) => [
                    styles.actionButton,
                    styles.editButton,
                    isMobile &&
                      styles.actionButtonMobile,
                    pressed &&
                      styles.pressedOpacity,
                  ]}
                  onPress={() =>
                    editPlanning(
                      item
                    )
                  }
                >
                  <Text
                    style={[
                      styles.editText,
                      isMobile &&
                        styles.actionTextMobile,
                    ]}
                  >
                    Edit
                  </Text>
                </Pressable>

                <Pressable
                  style={({ pressed }) => [
                    styles.actionButton,
                    styles.deleteButton,
                    isMobile &&
                      styles.actionButtonMobile,
                    pressed &&
                      styles.pressedOpacity,
                  ]}
                  onPress={() =>
                    handleDeletePlanning(
                      item.id
                    )
                  }
                >
                  <Text
                    style={[
                      styles.deleteText,
                      isMobile &&
                        styles.actionTextMobile,
                    ]}
                  >
                    Hapus
                  </Text>
                </Pressable>
              </View>
            </View>
          );
        }}
      />

      {/* ==================================================
          MODAL
      ================================================== */}

      <Modal
        visible={
          modalVisible
        }
        animationType="fade"
        transparent
        onRequestClose={
          closeModal
        }
      >
        <View
          style={[
            styles.modalOverlay,
            isMobile &&
              styles.modalOverlayMobile,
          ]}
        >
          <View
            style={[
              styles.modal,
              isMobile &&
                styles.modalMobile,
            ]}
          >
            {/* MODAL HEADER */}

            <View
              style={
                styles.modalHeader
              }
            >
              <Text
                style={[
                  styles.modalTitle,
                  isMobile &&
                    styles.modalTitleMobile,
                ]}
              >
                {editingId
                  ? "Edit Planning"
                  : "Planning Baru"}
              </Text>

              <Pressable
                onPress={
                  closeModal
                }
                hitSlop={10}
              >
                <Text
                  style={
                    styles.close
                  }
                >
                  ✕
                </Text>
              </Pressable>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={
                false
              }
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={[
                styles.formContainer,
                isMobile &&
                  styles.formContainerMobile,
              ]}
            >
              {/* ==================================================
                  ORDER
              ================================================== */}

              <Text
                style={
                  styles.label
                }
              >
                Pilih Order
              </Text>

              <Pressable
                style={[
                  styles.selectInput,
                  activePicker ===
                    "order" &&
                    styles.selectActive,
                ]}
                onPress={() =>
                  setActivePicker(
                    activePicker ===
                      "order"
                      ? null
                      : "order"
                  )
                }
              >
                <View
                  style={{
                    flex: 1,
                  }}
                >
                  <Text
                    style={
                      selectedOrder
                        ? styles.selectValue
                        : styles.placeholder
                    }
                  >
                    {selectedOrder
                      ? selectedOrder.product
                      : "Pilih order produksi..."}
                  </Text>

                  {selectedOrder && (
                    <>
                      <Text
                        style={
                          styles.selectSubtext
                        }
                      >
                        {selectedOrder.orderCode
                          ? `${selectedOrder.orderCode} • `
                          : ""}

                        {
                          selectedOrder.customerName
                        }

                        {" • "}

                        {
                          selectedOrder.quantity
                        }

                        {" pcs"}
                      </Text>

                      {selectedOrder.deadline ? (
                        <Text
                          style={
                            styles.deadlineText
                          }
                        >
                          Deadline:{" "}
                          {
                            selectedOrder.deadline
                          }
                        </Text>
                      ) : null}
                    </>
                  )}
                </View>

                <Text
                  style={
                    styles.arrowIcon
                  }
                >
                  {activePicker ===
                  "order"
                    ? "▲"
                    : "▼"}
                </Text>
              </Pressable>

              {activePicker ===
                "order" && (
                <View
                  style={
                    styles.dropdownContainer
                  }
                >
                  {availableOrders.length ===
                  0 ? (
                    <View
                      style={
                        styles.dropdownEmpty
                      }
                    >
                      <Text
                        style={
                          styles.dropdownEmptyTitle
                        }
                      >
                        Semua order sudah
                        memiliki planning
                      </Text>

                      <Text
                        style={
                          styles.dropdownEmptyText
                        }
                      >
                        Tidak ada order yang
                        bisa ditambahkan ke
                        planning baru.
                      </Text>
                    </View>
                  ) : (
                    availableOrders.map(
                      (o) => (
                        <Pressable
                          key={o.id}
                          style={
                            styles.dropdownOption
                          }
                          onPress={() =>
                            handleSelectOrder(
                              o
                            )
                          }
                        >
                          {o.orderCode ? (
                            <Text
                              style={
                                styles.optionCode
                              }
                            >
                              {
                                o.orderCode
                              }
                            </Text>
                          ) : null}

                          <Text
                            style={
                              styles.optionTitle
                            }
                          >
                            {
                              o.product
                            }
                          </Text>

                          <Text
                            style={
                              styles.optionSubtext
                            }
                          >
                            {
                              o.customerName
                            }

                            {" • "}

                            {
                              o.quantity
                            }

                            {" pcs"}
                          </Text>

                          {o.deadline ? (
                            <Text
                              style={
                                styles.optionDeadline
                              }
                            >
                              Deadline:{" "}
                              {
                                o.deadline
                              }
                            </Text>
                          ) : null}
                        </Pressable>
                      )
                    )
                  )}
                </View>
              )}

              {/* ==================================================
                  MACHINE
              ================================================== */}

              <Text
                style={
                  styles.label
                }
              >
                Mesin
              </Text>

              <Pressable
                style={[
                  styles.selectInput,
                  activePicker ===
                    "machine" &&
                    styles.selectActive,
                ]}
                onPress={() =>
                  setActivePicker(
                    activePicker ===
                      "machine"
                      ? null
                      : "machine"
                  )
                }
              >
                <Text
                  style={
                    machine
                      ? styles.selectValue
                      : styles.placeholder
                  }
                >
                  {machine ||
                    "Pilih mesin..."}
                </Text>

                <Text
                  style={
                    styles.arrowIcon
                  }
                >
                  {activePicker ===
                  "machine"
                    ? "▲"
                    : "▼"}
                </Text>
              </Pressable>

              {activePicker ===
                "machine" && (
                <View
                  style={
                    styles.dropdownContainer
                  }
                >
                  {MACHINES.map(
                    (m) => (
                      <Pressable
                        key={m}
                        style={
                          styles.dropdownOption
                        }
                        onPress={() => {
                          setMachine(
                            m
                          );

                          setActivePicker(
                            null
                          );
                        }}
                      >
                        <Text
                          style={
                            styles.optionTitle
                          }
                        >
                          {m}
                        </Text>
                      </Pressable>
                    )
                  )}
                </View>
              )}

              {/* ==================================================
                  OPERATOR
              ================================================== */}

              <Text
                style={
                  styles.label
                }
              >
                Operator
              </Text>

              <Pressable
                style={[
                  styles.selectInput,
                  activePicker ===
                    "operator" &&
                    styles.selectActive,
                ]}
                onPress={() =>
                  setActivePicker(
                    activePicker ===
                      "operator"
                      ? null
                      : "operator"
                  )
                }
              >
                <Text
                  style={
                    selectedOperator
                      ? styles.selectValue
                      : styles.placeholder
                  }
                >
                  {selectedOperator
                    ? selectedOperator.name
                    : "Pilih operator..."}
                </Text>

                <Text
                  style={
                    styles.arrowIcon
                  }
                >
                  {activePicker ===
                  "operator"
                    ? "▲"
                    : "▼"}
                </Text>
              </Pressable>

              {activePicker ===
                "operator" && (
                <View
                  style={
                    styles.dropdownContainer
                  }
                >
                  {operators.length ===
                  0 ? (
                    <View
                      style={
                        styles.dropdownEmpty
                      }
                    >
                      <Text
                        style={
                          styles.dropdownEmptyTitle
                        }
                      >
                        Belum ada operator
                      </Text>

                      <Text
                        style={
                          styles.dropdownEmptyText
                        }
                      >
                        Tambahkan user dengan
                        role operator terlebih
                        dahulu.
                      </Text>
                    </View>
                  ) : (
                    operators.map(
                      (op) => (
                        <Pressable
                          key={op.id}
                          style={
                            styles.dropdownOption
                          }
                          onPress={() => {
                            setOperatorId(
                              op.id
                            );

                            setActivePicker(
                              null
                            );
                          }}
                        >
                          <Text
                            style={
                              styles.optionTitle
                            }
                          >
                            {op.name}
                          </Text>

                          <Text
                            style={
                              styles.optionSubtext
                            }
                          >
                            {op.email}
                          </Text>
                        </Pressable>
                      )
                    )
                  )}
                </View>
              )}

              {/* ==================================================
                  DATE
              ================================================== */}

              <Text
                style={
                  styles.label
                }
              >
                Tanggal Produksi
              </Text>

              <Pressable
                style={[
                  styles.selectInput,
                  selectedDeadline &&
                    scheduledDate >
                      selectedDeadline &&
                    styles.dateErrorInput,
                ]}
                onPress={() => {
                  setShowDatePicker(
                    true
                  );
                }}
              >
                <Text
                  style={[
                    styles.selectValue,
                    selectedDeadline &&
                      scheduledDate >
                        selectedDeadline &&
                      styles.dateErrorText,
                  ]}
                >
                  📅{" "}
                  {formatDate(
                    scheduledDate
                  )}
                </Text>
              </Pressable>

              {selectedDeadline && (
                <Text
                  style={
                    styles.deadlineHint
                  }
                >
                  Maksimal tanggal produksi:{" "}
                  {formatDate(
                    selectedDeadline
                  )}
                </Text>
              )}

              {selectedDeadline &&
                scheduledDate >
                  selectedDeadline && (
                  <Text
                    style={
                      styles.dateErrorMessage
                    }
                  >
                    Tanggal produksi tidak boleh
                    melebihi deadline order.
                  </Text>
                )}

              {/* ==================================================
                  MOBILE DATE PICKER
              ================================================== */}

              {showDatePicker &&
                Platform.OS !== "web" && (
                  <DateTimePicker
                    value={
                      scheduledDate
                    }
                    mode="date"
                    display={
                      Platform.OS ===
                      "ios"
                        ? "spinner"
                        : "default"
                    }
                    maximumDate={
                      selectedDeadline ||
                      undefined
                    }
                    onChange={(
                      event,
                      date
                    ) => {
                      /**
                       * Android:
                       * picker langsung ditutup
                       * setelah memilih tanggal.
                       *
                       * iOS:
                       * tetap terbuka karena
                       * menggunakan spinner.
                       */
                      if (
                        Platform.OS !==
                        "ios"
                      ) {
                        setShowDatePicker(
                          false
                        );
                      }

                      if (date) {
                        handleScheduledDateChange(
                          date
                        );
                      }
                    }}
                  />
                )}

              {/* ==================================================
                  WEB DATE PICKER
              ================================================== */}

              {showDatePicker &&
                Platform.OS === "web" && (
                  <View
                    style={
                      styles.webDatePickerContainer
                    }
                  >
                    <Text
                      style={
                        styles.webDateLabel
                      }
                    >
                      Pilih tanggal produksi
                    </Text>

                    {React.createElement(
                      "input",
                      {
                        type: "date",

                        value:
                          formatDate(
                            scheduledDate
                          ),

                        /**
                         * Tidak ada tanggal
                         * minimum khusus.
                         *
                         * Yang dibatasi hanya
                         * tanggal maksimum
                         * sesuai deadline.
                         */
                        max:
                          selectedDeadline
                            ? formatDate(
                                selectedDeadline
                              )
                            : undefined,

                        onChange: (
                          event: React.ChangeEvent<HTMLInputElement>
                        ) => {
                          handleWebDateChange(
                            event.target
                              .value
                          );
                        },

                        onBlur: () => {
                          setShowDatePicker(
                            false
                          );
                        },

                        style: {
                          width:
                            "100%",
                          height:
                            44,
                          border:
                            "1px solid #e2e8f0",
                          borderRadius:
                            10,
                          paddingLeft:
                            12,
                          paddingRight:
                            12,
                          fontSize:
                            14,
                          color:
                            "#0f172a",
                          backgroundColor:
                            "#f8fafc",
                          boxSizing:
                            "border-box",
                          outline:
                            "none",
                        },
                      }
                    )}

                    {selectedDeadline && (
                      <Text
                        style={
                          styles.webDateHint
                        }
                      >
                        Maksimal:{" "}
                        {formatDate(
                          selectedDeadline
                        )}
                      </Text>
                    )}
                  </View>
                )}

              {/* ==================================================
                  STATUS
              ================================================== */}

              <Text
                style={
                  styles.label
                }
              >
                Status Produksi
              </Text>

              <Pressable
                style={[
                  styles.selectInput,
                  activePicker ===
                    "status" &&
                    styles.selectActive,
                ]}
                onPress={() =>
                  setActivePicker(
                    activePicker ===
                      "status"
                      ? null
                      : "status"
                  )
                }
              >
                <Text
                  style={
                    styles.selectValue
                  }
                >
                  {
                    getStatusConfig(
                      status
                    ).label
                  }
                </Text>

                <Text
                  style={
                    styles.arrowIcon
                  }
                >
                  {activePicker ===
                  "status"
                    ? "▲"
                    : "▼"}
                </Text>
              </Pressable>

              {activePicker ===
                "status" && (
                <View
                  style={
                    styles.dropdownContainer
                  }
                >
                  {STATUS_OPTIONS.map(
                    (opt) => (
                      <Pressable
                        key={
                          opt.value
                        }
                        style={
                          styles.dropdownOption
                        }
                        onPress={() => {
                          setStatus(
                            opt.value
                          );

                          setActivePicker(
                            null
                          );
                        }}
                      >
                        <Text
                          style={[
                            styles.optionTitle,
                            {
                              color:
                                opt.color,
                            },
                          ]}
                        >
                          {
                            opt.label
                          }
                        </Text>
                      </Pressable>
                    )
                  )}
                </View>
              )}

              {/* ==================================================
                  SAVE
              ================================================== */}

              <Pressable
                style={({ pressed }) => [
                  styles.saveButton,
                  isMobile &&
                    styles.saveButtonMobile,
                  pressed &&
                    styles.pressedOpacity,
                ]}
                onPress={() => {
                  /**
                   * Safety validation:
                   * Jangan izinkan save jika
                   * tanggal melewati deadline.
                   */
                  if (
                    selectedDeadline &&
                    scheduledDate >
                      selectedDeadline
                  ) {
                    setScheduledDate(
                      selectedDeadline
                    );

                    return;
                  }

                  savePlanning();
                }}
              >
                <Text
                  style={
                    styles.saveText
                  }
                >
                  {editingId
                    ? "Simpan Perubahan"
                    : "Buat Planning"}
                </Text>
              </Pressable>

              <View
                style={
                  styles.formBottomSpace
                }
              />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ======================================================
// INFO ITEM
// ======================================================

function InfoItem({
  label,
  value,
  icon,
  isMobile,
}: {
  label: string;
  value: string;
  icon: string;
  isMobile?: boolean;
}) {
  return (
    <View
      style={[
        styles.infoBox,
        isMobile &&
          styles.infoBoxMobile,
      ]}
    >
      <Text
        style={[
          styles.infoLabel,
          isMobile &&
            styles.infoLabelMobile,
        ]}
        numberOfLines={1}
      >
        {icon} {label}
      </Text>

      <Text
        style={[
          styles.infoValue,
          isMobile &&
            styles.infoValueMobile,
        ]}
        numberOfLines={1}
      >
        {value}
      </Text>
    </View>
  );
}

// ======================================================
// STYLES
// ======================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },

  // ====================================================
  // HEADER
  // ====================================================

  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  headerMobile: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
  },

  headerTextContainer: {
    flex: 1,
    paddingRight: 10,
  },

  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#0f172a",
    letterSpacing: -0.5,
  },

  titleMobile: {
    fontSize: 21,
  },

  subtitle: {
    marginTop: 2,
    color: "#64748b",
    fontSize: 13,
  },

  subtitleMobile: {
    fontSize: 11,
  },

  addButton: {
    backgroundColor: "#0f172a",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    elevation: 2,
  },

  addButtonMobile: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
  },

  addButtonText: {
    color: "#ffffff",
    fontWeight: "600",
    fontSize: 14,
  },

  addButtonTextMobile: {
    fontSize: 12,
  },

  pressedOpacity: {
    opacity: 0.8,
  },

  // ====================================================
  // LIST
  // ====================================================

  list: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    gap: 16,
  },

  listMobile: {
    paddingHorizontal: 14,
    paddingBottom: 110,
    gap: 12,
  },

  // ====================================================
  // CARD
  // ====================================================

  card: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    elevation: 2,
  },

  cardMobile: {
    borderRadius: 14,
    padding: 14,
  },

  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },

  cardHeaderMobile: {
    gap: 8,
  },

  cardTitleContainer: {
    flex: 1,
    paddingRight: 8,
  },

  orderCode: {
    fontSize: 11,
    fontWeight: "800",
    color: "#6366f1",
    marginBottom: 3,
    letterSpacing: 0.4,
  },

  product: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1e293b",
  },

  productMobile: {
    fontSize: 15,
  },

  customer: {
    marginTop: 2,
    color: "#64748b",
    fontSize: 13,
  },

  customerMobile: {
    fontSize: 12,
  },

  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 6,
  },

  statusBadgeMobile: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },

  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },

  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },

  divider: {
    height: 1,
    backgroundColor: "#f1f5f9",
    marginVertical: 14,
  },

  // ====================================================
  // INFO
  // ====================================================

  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },

  infoGridMobile: {
    gap: 10,
  },

  infoBox: {
    width: "47%",
  },

  infoBoxMobile: {
    width: "48%",
  },

  infoLabel: {
    fontSize: 11,
    color: "#94a3b8",
    fontWeight: "500",
    marginBottom: 2,
  },

  infoLabelMobile: {
    fontSize: 10,
  },

  infoValue: {
    fontSize: 13,
    fontWeight: "600",
    color: "#334155",
  },

  infoValueMobile: {
    fontSize: 12,
  },

  // ====================================================
  // CARD ACTION
  // ====================================================

  cardFooter: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
    marginTop: 16,
  },

  cardFooterMobile: {
    marginTop: 14,
  },

  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },

  actionButtonMobile: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
  },

  editButton: {
    backgroundColor: "#f1f5f9",
  },

  editText: {
    fontWeight: "600",
    fontSize: 12,
    color: "#475569",
  },

  deleteButton: {
    backgroundColor: "#fef2f2",
  },

  deleteText: {
    fontWeight: "600",
    fontSize: 12,
    color: "#ef4444",
  },

  actionTextMobile: {
    fontSize: 12,
  },

  // ====================================================
  // EMPTY
  // ====================================================

  empty: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 20,
  },

  emptyIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },

  emptyIcon: {
    fontSize: 24,
  },

  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#334155",
  },

  emptyText: {
    color: "#94a3b8",
    fontSize: 13,
    textAlign: "center",
    marginTop: 4,
    maxWidth: 280,
  },

  // ====================================================
  // MODAL
  // ====================================================

  modalOverlay: {
    flex: 1,
    backgroundColor:
      "rgba(15, 23, 42, 0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },

  modalOverlayMobile: {
    padding: 12,
    justifyContent: "center",
  },

  modal: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 20,
    maxWidth: 500,
    width: "100%",
    maxHeight: "85%",
  },

  modalMobile: {
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    maxHeight: "92%",
  },

  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0f172a",
  },

  modalTitleMobile: {
    fontSize: 17,
  },

  close: {
    fontSize: 16,
    color: "#94a3b8",
    fontWeight: "600",
  },

  // ====================================================
  // FORM
  // ====================================================

  formContainer: {
    paddingTop: 12,
    paddingBottom: 10,
  },

  formContainerMobile: {
    paddingTop: 8,
    paddingBottom: 8,
  },

  formBottomSpace: {
    height: 20,
  },

  label: {
    fontSize: 12,
    fontWeight: "600",
    color: "#475569",
    marginTop: 12,
    marginBottom: 6,
  },

  selectInput: {
    minHeight: 46,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 10,
    paddingHorizontal: 14,
    backgroundColor: "#f8fafc",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  selectActive: {
    borderColor: "#0f172a",
    backgroundColor: "#ffffff",
  },

  selectValue: {
    fontSize: 14,
    fontWeight: "500",
    color: "#0f172a",
  },

  placeholder: {
    fontSize: 14,
    color: "#94a3b8",
  },

  selectSubtext: {
    fontSize: 11,
    color: "#64748b",
    marginTop: 1,
  },

  deadlineText: {
    fontSize: 10,
    color: "#dc2626",
    fontWeight: "600",
    marginTop: 3,
  },

  deadlineHint: {
    fontSize: 11,
    color: "#64748b",
    marginTop: 5,
  },

  dateErrorInput: {
    borderColor: "#ef4444",
    backgroundColor: "#fff7f7",
  },

  dateErrorText: {
    color: "#dc2626",
  },

  dateErrorMessage: {
    fontSize: 11,
    color: "#dc2626",
    marginTop: 4,
    fontWeight: "500",
  },

  // ====================================================
  // WEB DATE PICKER
  // ====================================================

  webDatePickerContainer: {
    marginTop: 8,
    padding: 10,
    backgroundColor: "#f8fafc",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },

  webDateLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#64748b",
    marginBottom: 6,
  },

  webDateHint: {
    fontSize: 10,
    color: "#64748b",
    marginTop: 5,
  },

  arrowIcon: {
    fontSize: 10,
    color: "#94a3b8",
    marginLeft: 10,
  },

  // ====================================================
  // DROPDOWN
  // ====================================================

  dropdownContainer: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 10,
    marginTop: 4,
    backgroundColor: "#ffffff",
    overflow: "hidden",
  },

  dropdownOption: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f8fafc",
  },

  optionCode: {
    fontSize: 10,
    fontWeight: "800",
    color: "#6366f1",
    marginBottom: 2,
  },

  optionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1e293b",
  },

  optionSubtext: {
    fontSize: 11,
    color: "#64748b",
    marginTop: 2,
  },

  optionDeadline: {
    fontSize: 10,
    color: "#dc2626",
    fontWeight: "600",
    marginTop: 4,
  },

  dropdownEmpty: {
    padding: 16,
    alignItems: "center",
  },

  dropdownEmptyTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#475569",
    textAlign: "center",
  },

  dropdownEmptyText: {
    fontSize: 11,
    color: "#94a3b8",
    textAlign: "center",
    marginTop: 4,
  },

  // ====================================================
  // SAVE
  // ====================================================

  saveButton: {
    backgroundColor: "#0f172a",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 24,
  },

  saveButtonMobile: {
    marginTop: 20,
    paddingVertical: 13,
  },

  saveText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 14,
  },
});