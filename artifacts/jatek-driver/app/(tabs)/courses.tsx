import { Feather } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import React from "react";
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import { listMyOrders, type Order, type OrderStatus } from "@/lib/api";

const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "En attente",
  assigned: "Assignée",
  accepted: "Acceptée",
  arrived_pickup: "Au commerçant",
  picked_up: "En cours",
  arrived_dropoff: "Chez le client",
  delivered: "Livrée",
  cancelled: "Annulée",
};

const STATUS_TONE: Record<OrderStatus, "success" | "warning" | "muted" | "destructive"> = {
  pending: "muted",
  assigned: "warning",
  accepted: "warning",
  arrived_pickup: "warning",
  picked_up: "warning",
  arrived_dropoff: "warning",
  delivered: "success",
  cancelled: "destructive",
};

export default function CoursesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const orders = useQuery({ queryKey: ["my-orders"], queryFn: listMyOrders });

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <FlatList
        data={orders.data ?? []}
        keyExtractor={(o) => o.id}
        contentContainerStyle={{
          paddingTop: insets.top + 12,
          paddingBottom: insets.bottom + 100,
          paddingHorizontal: 16,
        }}
        refreshControl={
          <RefreshControl
            refreshing={orders.isRefetching}
            onRefresh={orders.refetch}
            tintColor={colors.primary}
          />
        }
        ListHeaderComponent={
          <Text
            style={[
              styles.header,
              { color: colors.foreground, fontFamily: "Inter_700Bold" },
            ]}
          >
            Mes courses
          </Text>
        }
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        renderItem={({ item }) => (
          <OrderRow
            order={item}
            colors={colors}
            onPress={() => router.push(`/order/${item.id}`)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather name="inbox" size={32} color={colors.mutedForeground} />
            <Text
              style={[
                styles.emptyText,
                { color: colors.mutedForeground, fontFamily: "Inter_500Medium" },
              ]}
            >
              Aucune course pour l&apos;instant.
            </Text>
          </View>
        }
      />
    </View>
  );
}

function OrderRow({
  order,
  colors,
  onPress,
}: {
  order: Order;
  colors: ReturnType<typeof useColors>;
  onPress: () => void;
}) {
  const tone = STATUS_TONE[order.status];
  const toneBg =
    tone === "success"
      ? colors.accent
      : tone === "warning"
        ? colors.muted
        : tone === "destructive"
          ? colors.destructive
          : colors.muted;
  const toneFg =
    tone === "success"
      ? colors.accentForeground
      : tone === "destructive"
        ? colors.destructiveForeground
        : colors.foreground;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderRadius: colors.radius,
          opacity: pressed ? 0.9 : 1,
        },
      ]}
    >
      <View style={styles.cardTop}>
        <Text
          style={[
            styles.code,
            { color: colors.mutedForeground, fontFamily: "Inter_500Medium" },
          ]}
        >
          #{order.code}
        </Text>
        <View
          style={[
            styles.badge,
            { backgroundColor: toneBg, borderRadius: colors.radius / 2 },
          ]}
        >
          <Text
            style={[
              styles.badgeText,
              { color: toneFg, fontFamily: "Inter_500Medium" },
            ]}
          >
            {STATUS_LABEL[order.status]}
          </Text>
        </View>
      </View>
      <Text
        numberOfLines={1}
        style={[
          styles.addr,
          { color: colors.foreground, fontFamily: "Inter_600SemiBold" },
        ]}
      >
        {order.restaurantName}
      </Text>
      <Text
        numberOfLines={1}
        style={[
          styles.subaddr,
          { color: colors.mutedForeground, fontFamily: "Inter_400Regular" },
        ]}
      >
        → {order.dropoffAddress}
      </Text>
      <View style={styles.bottomRow}>
        <Text
          style={[
            styles.meta,
            { color: colors.mutedForeground, fontFamily: "Inter_400Regular" },
          ]}
        >
          {order.distanceKm.toFixed(1)} km
        </Text>
        <Text
          style={[
            styles.price,
            { color: colors.primary, fontFamily: "Inter_700Bold" },
          ]}
        >
          {order.driverEarningsMad + order.tipMad} DH
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { fontSize: 26, marginBottom: 16 },
  card: { padding: 14, borderWidth: 1, gap: 8 },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  code: { fontSize: 12 },
  badge: { paddingHorizontal: 8, paddingVertical: 4 },
  badgeText: { fontSize: 11 },
  addr: { fontSize: 14 },
  subaddr: { fontSize: 12 },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  meta: { fontSize: 12 },
  price: { fontSize: 15 },
  empty: { alignItems: "center", paddingVertical: 60, gap: 10 },
  emptyText: { fontSize: 14 },
});
