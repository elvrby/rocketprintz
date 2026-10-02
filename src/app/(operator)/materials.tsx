// src/app/(operator)/materials.tsx

import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions
} from "react-native";

import {
  collection,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";

import { db } from "../../firebase/config";

type Material = {
  id: string;
  name?: string;
  materialName?: string;
  code?: string;
  unit?: string;
  stock?: number;
  minStock?: number;
  description?: string;
};

export default function OperatorMaterials() {
  const { width } = useWindowDimensions();

  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const materialsRef = collection(db, "materials");

    const materialsQuery = query(
      materialsRef,
      orderBy("name", "asc")
    );

    const unsubscribe = onSnapshot(
      materialsQuery,
      (snapshot) => {
        const data: Material[] = snapshot.docs.map((item) => {
          const data = item.data();

          return {
            id: item.id,
            name: data.name || "",
            materialName: data.materialName || "",
            code: data.code || "",
            unit: data.unit || "",
            stock:
              typeof data.stock === "number"
                ? data.stock
                : Number(data.stock || 0),
            minStock:
              typeof data.minStock === "number"
                ? data.minStock
                : Number(data.minStock || 0),
            description: data.description || "",
          };
        });

        setMaterials(data);
        setLoading(false);
      },
      (error) => {
        console.error(
          "Gagal mengambil data materials:",
          error
        );

        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const filteredMaterials = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) {
      return materials;
    }

    return materials.filter((material) => {
      const name =
        material.name ||
        material.materialName ||
        "";

      const code = material.code || "";

      return (
        name.toLowerCase().includes(keyword) ||
        code.toLowerCase().includes(keyword)
      );
    });
  }, [materials, search]);

  const getMaterialName = (item: Material) => {
    return (
      item.name ||
      item.materialName ||
      "Material tanpa nama"
    );
  };

  const getStockStatus = (item: Material) => {
    const stock = item.stock || 0;
    const minStock = item.minStock || 0;

    if (stock <= 0) {
      return "Habis";
    }

    if (stock <= minStock) {
      return "Stok Menipis";
    }

    return "Tersedia";
  };

  const getStatusStyle = (item: Material) => {
    const status = getStockStatus(item);

    if (status === "Habis") {
      return styles.statusDanger;
    }

    if (status === "Stok Menipis") {
      return styles.statusWarning;
    }

    return styles.statusSuccess;
  };

  const getStatusTextStyle = (item: Material) => {
    const status = getStockStatus(item);

    if (status === "Habis") {
      return styles.statusDangerText;
    }

    if (status === "Stok Menipis") {
      return styles.statusWarningText;
    }

    return styles.statusSuccessText;
  };

  const renderMaterial = ({
    item,
  }: {
    item: Material;
  }) => {
    const stock = item.stock || 0;
    const minStock = item.minStock || 0;
    const unit = item.unit || "-";

    return (
      <View style={styles.card}>
        <View style={styles.cardTop}>
          <View style={styles.nameContainer}>
            <Text
              style={styles.materialName}
              numberOfLines={1}
            >
              {getMaterialName(item)}
            </Text>

            {item.code ? (
              <Text style={styles.materialCode}>
                Kode: {item.code}
              </Text>
            ) : null}
          </View>

          <View
            style={[
              styles.statusBadge,
              getStatusStyle(item),
            ]}
          >
            <Text
              style={[
                styles.statusText,
                getStatusTextStyle(item),
              ]}
            >
              {getStockStatus(item)}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>
              Stok
            </Text>

            <Text style={styles.stockValue}>
              {stock}
            </Text>
          </View>

          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>
              Satuan
            </Text>

            <Text style={styles.infoValue}>
              {unit}
            </Text>
          </View>

          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>
              Minimum
            </Text>

            <Text style={styles.infoValue}>
              {minStock}
            </Text>
          </View>
        </View>

        {item.description ? (
          <>
            <View style={styles.divider} />

            <Text style={styles.description}>
              {item.description}
            </Text>
          </>
        ) : null}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* HEADER */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>
              Materials
            </Text>

            <Text style={styles.subtitle}>
              Daftar material yang tersedia
            </Text>
          </View>

          <View style={styles.totalContainer}>
            <Text style={styles.totalLabel}>
              Total Material
            </Text>

            <Text style={styles.totalValue}>
              {materials.length}
            </Text>
          </View>
        </View>

        {/* SEARCH */}
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>
            🔍
          </Text>

          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Cari material atau kode..."
            placeholderTextColor="#9ca3af"
            style={styles.searchInput}
          />
        </View>

        {/* CONTENT */}
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator
              size="large"
              color="#111827"
            />

            <Text style={styles.loadingText}>
              Memuat material...
            </Text>
          </View>
        ) : filteredMaterials.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>
              📦
            </Text>

            <Text style={styles.emptyTitle}>
              {search
                ? "Material tidak ditemukan"
                : "Belum ada material"}
            </Text>

            <Text style={styles.emptyText}>
              {search
                ? "Coba gunakan kata kunci yang berbeda."
                : "Data material belum tersedia."}
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredMaterials}
            keyExtractor={(item) => item.id}
            renderItem={renderMaterial}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              styles.list,
              width >= 900 && styles.desktopList,
            ]}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },

  content: {
    flex: 1,
    width: "100%",
    maxWidth: 1400,
    alignSelf: "center",
    paddingHorizontal: 20,
    paddingTop: 24,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },

  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111111",
  },

  subtitle: {
    marginTop: 5,
    fontSize: 14,
    color: "#737373",
  },

  totalContainer: {
    minWidth: 120,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#e5e5e5",
  },

  totalLabel: {
    fontSize: 11,
    color: "#737373",
    marginBottom: 3,
  },

  totalValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111111",
  },

  searchContainer: {
    height: 48,
    backgroundColor: "#ffffff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e5e5e5",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    marginBottom: 16,
  },

  searchIcon: {
    fontSize: 16,
    marginRight: 9,
  },

  searchInput: {
    flex: 1,
    height: "100%",
    color: "#111111",
    fontSize: 14,
    outlineStyle: "none",
  } as any,

  list: {
    paddingBottom: 30,
  },

  desktopList: {
    paddingBottom: 40,
  },

  card: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e5e5",
    padding: 18,
    marginBottom: 12,
  },

  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  nameContainer: {
    flex: 1,
    marginRight: 15,
  },

  materialName: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111111",
  },

  materialCode: {
    marginTop: 4,
    fontSize: 12,
    color: "#737373",
  },

  statusBadge: {
    borderRadius: 20,
    paddingHorizontal: 11,
    paddingVertical: 6,
  },

  statusText: {
    fontSize: 11,
    fontWeight: "600",
  },

  statusSuccess: {
    backgroundColor: "#f0fdf4",
  },

  statusSuccessText: {
    color: "#15803d",
  },

  statusWarning: {
    backgroundColor: "#fffbeb",
  },

  statusWarningText: {
    color: "#b45309",
  },

  statusDanger: {
    backgroundColor: "#fef2f2",
  },

  statusDangerText: {
    color: "#dc2626",
  },

  divider: {
    height: 1,
    backgroundColor: "#eeeeee",
    marginVertical: 15,
  },

  infoRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  infoItem: {
    flex: 1,
  },

  infoLabel: {
    fontSize: 11,
    color: "#737373",
    marginBottom: 4,
  },

  infoValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#262626",
  },

  stockValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111111",
  },

  description: {
    fontSize: 13,
    lineHeight: 19,
    color: "#525252",
  },

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  loadingText: {
    marginTop: 10,
    fontSize: 13,
    color: "#737373",
  },

  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 80,
  },

  emptyIcon: {
    fontSize: 40,
    marginBottom: 12,
  },

  emptyTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111111",
  },

  emptyText: {
    marginTop: 5,
    fontSize: 13,
    color: "#737373",
    textAlign: "center",
  },
});