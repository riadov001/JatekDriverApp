import { Feather } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
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

type FilterKey = "Toutes" | "En cours" | "Terminées";

const FILTER_OPTIONS: FilterKey[] = ["Toutes", "En cours", "Terminées"];

const ACTIVE_STATUSES: OrderStatus[] = ["assigned", "accepted", "arrived_pickup", "picked_up", "arrived_dropoff"];
const DONE_STATUSES: OrderStatus[] = ["delivered", "cancelled"];

export default function CoursesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [filter, setFilter] = useState<FilterKey>("Toutes");
  const orders = useQuery({ queryKey: ["my-orders"], queryFn: listMyOrders });

  const filtered = (orders.data ?? []).filter((o) => {
    if (filter === "En cours") return ACTIVE_STATUSES.includes(o.status);
    if (filter === "Terminées") return DONE_STATUSES.includes(o.status);
    return true;
  });

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={{ paddingTop: insets.top + 12, paddingHorizontal: 16, paddingBottom: 8, backgroundColor: colors.background }}>
        <Text style={[styles.header, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
          Mes Courses
        </Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          {FILTER_OPTIONS.map((f) => {
            const active = filter === f;
            return (
              <Pressable
                key={f}
                onPress={() => setFilter(f)}
                style={[
                  styles.filterPill,
                  {
                    backgroundColor: active ? colors.primary : colors.muted,
                    borderColor: active ? colors.primary : colors.border,
                  },
                ]}
              >
                <Text
                  style={{
                    color: active ? colors.primaryForeground : colors.mutedForeground,
                    fontFamily: "Inter_500Medium",
                    fontSize: 13,
                  }}
                >
                  {f}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(o) => o.id}
        contentContainerStyle={{
          paddingBottom: insets.bottom + 100,
          paddingHorizontal: 16,
          paddingTop: 8,
        }}
        refreshControl={
          <RefreshControl
            refreshing={orders.isRefetching}
            onRefresh={orders.refetch}
            tintColor={colors.primary}
          />
        }
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        renderItem={({ item }) => (
          <OrderRow
            order={item}
            colors={colors}
            onPress={() => router.push(`/order/${item.id}`)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather name="inbox" size={36} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>
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
  const isActive = ["assigned", "accepted", "arrived_pickup", "picked_up", "arrived_dropoff"].includes(order.status);
  const isDelivered = order.status === "delivered";
  const isCancelled = order.status === "cancelled";

  const leftBorderColor = isActive
    ? colors.primary
    : isDelivered
    ? colors.success
    : isCancelled
    ? colors.destructive
    : colors.border;

  const badgeBg = isActive
    ? colors.accent
    : isDelivered
    ? "#EEF4D0"
    : isCancelled
    ? "#FDEAEA"
    : colors.muted;

  const badgeFg = isActive
    ? colors.primary
    : isDelivered
    ? colors.success
    : isCancelled
    ? colors.destructive
    : colors.mutedForeground;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderRadius: colors.radius,
          borderLeftColor: leftBorderColor,
          opacity: pressed ? 0.9 : 1,
        },
      ]}
    >
      <View style={styles.cardTop}>
        <View style={[styles.storeIcon, { backgroundColor: colors.secondary }]}>
          <Feather name="shopping-bag" size={18} color={colors.info} />
        </View>
        <View style={{ flex: 1 }}>
          <Text
            style={[styles.restaurant, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}
            numberOfLines={1}
          >
            {order.restaurantName}
          </Text>
          <Text
            style={[styles.client, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}
            numberOfLines={1}
          >
            {order.dropoffAddress}
          </Text>
        </View>
        <View style={[styles.badge, { backgroundColor: badgeBg }]}>
          <Text style={[styles.badgeText, { color: badgeFg, fontFamily: "Inter_600SemiBold" }]}>
            {STATUS_LABEL[order.status]}
          </Text>
        </View>
      </View>

      <View style={[styles.cardBottom, { borderTopColor: colors.border }]}>
        <Text style={[styles.meta, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
          {order.distanceKm.toFixed(1)} km · #{order.code}
        </Text>
        <Text style={[styles.price, { color: colors.success, fontFamily: "Inter_700Bold" }]}>
          {order.driverEarningsMad + order.tipMad} DH
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { fontSize: 22, marginBottom: 12 },
  filterScroll: { marginBottom: 4 },
  filterPill: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 50,
    borderWidth: 1,
    marginRight: 8,
  },
  card: {
    borderWidth: 1,
    borderLeftWidth: 4,
    gap: 12,
    padding: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  cardTop: { flexDirection: "row", alignItems: "center", gap: 12 },
  storeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  restaurant: { fontSize: 15, marginBottom: 2 },
  client: { fontSize: 12 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 50 },
  badgeText: { fontSize: 11 },
  cardBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 10,
    borderTopWidth: 1,
  },
  meta: { fontSize: 12 },
  price: { fontSize: 17 },
  empty: { alignItems: "center", paddingVertical: 60, gap: 12 },
  emptyText: { fontSize: 14 },
});
