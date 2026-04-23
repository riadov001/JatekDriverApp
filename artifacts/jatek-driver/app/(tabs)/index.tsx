import { Feather } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { IncomingOrderModal } from "@/components/IncomingOrderModal";
import { PromotionsCarousel } from "@/components/PromotionsCarousel";
import { useAuth } from "@/context/AuthContext";
import { useOnline } from "@/context/OnlineContext";
import { useColors } from "@/hooks/useColors";
import { getEarnings, listAvailableOrders, type Order } from "@/lib/api";

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const { isOnline, toggling, toggleOnline } = useOnline();
  const [incoming, setIncoming] = useState<Order | null>(null);
  const seenIds = useRef<Set<string>>(new Set());
  const dismissedIds = useRef<Set<string>>(new Set());

  const earnings = useQuery({
    queryKey: ["earnings"],
    queryFn: getEarnings,
    refetchInterval: 60_000,
  });

  const available = useQuery({
    queryKey: ["available-orders"],
    queryFn: listAvailableOrders,
    enabled: isOnline,
    refetchInterval: isOnline ? 12_000 : false,
  });

  // Auto-trigger incoming order modal for new available orders.
  useEffect(() => {
    if (!isOnline || !available.data?.length || incoming) return;
    const fresh = available.data.find(
      (o) => !seenIds.current.has(o.id) && !dismissedIds.current.has(o.id),
    );
    if (fresh) {
      seenIds.current.add(fresh.id);
      setIncoming(fresh);
    } else {
      // Mark all as seen so future polls don't replay old ones.
      available.data.forEach((o) => seenIds.current.add(o.id));
    }
  }, [available.data, isOnline, incoming]);

  // Reset seen list when going offline so they re-trigger when back online.
  useEffect(() => {
    if (!isOnline) {
      seenIds.current.clear();
      dismissedIds.current.clear();
      setIncoming(null);
    }
  }, [isOnline]);

  const onRefresh = () => {
    earnings.refetch();
    if (isOnline) available.refetch();
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <FlatList
        data={isOnline ? available.data ?? [] : []}
        keyExtractor={(o) => o.id}
        contentContainerStyle={{
          paddingTop: insets.top + 12,
          paddingBottom: insets.bottom + 100,
          paddingHorizontal: 16,
        }}
        refreshControl={
          <RefreshControl
            refreshing={available.isRefetching || earnings.isRefetching}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        ListHeaderComponent={
          <View style={{ marginBottom: 16 }}>
            <Text
              style={[
                styles.hello,
                { color: colors.mutedForeground, fontFamily: "Inter_400Regular" },
              ]}
            >
              Bonjour
            </Text>
            <Text
              style={[
                styles.name,
                { color: colors.foreground, fontFamily: "Inter_700Bold" },
              ]}
            >
              {user?.fullName ?? user?.driver?.fullName ?? "Chauffeur"}
            </Text>

            <Pressable
              onPress={toggleOnline}
              disabled={toggling}
              style={({ pressed }) => [
                styles.onlineCard,
                {
                  backgroundColor: isOnline ? colors.primary : colors.card,
                  borderColor: isOnline ? colors.primary : colors.border,
                  borderRadius: colors.radius * 1.4,
                  opacity: pressed ? 0.9 : 1,
                },
              ]}
            >
              <View style={styles.onlineRow}>
                <View
                  style={[
                    styles.dot,
                    {
                      backgroundColor: isOnline
                        ? colors.primaryForeground
                        : colors.mutedForeground,
                    },
                  ]}
                />
                <Text
                  style={[
                    styles.onlineLabel,
                    {
                      color: isOnline
                        ? colors.primaryForeground
                        : colors.foreground,
                      fontFamily: "Inter_600SemiBold",
                    },
                  ]}
                >
                  {isOnline ? "EN LIGNE" : "HORS LIGNE"}
                </Text>
                {toggling ? (
                  <ActivityIndicator
                    color={isOnline ? colors.primaryForeground : colors.primary}
                    style={{ marginLeft: 10 }}
                  />
                ) : null}
              </View>
              <Text
                style={[
                  styles.onlineHint,
                  {
                    color: isOnline
                      ? colors.primaryForeground
                      : colors.mutedForeground,
                    fontFamily: "Inter_400Regular",
                  },
                ]}
              >
                {isOnline
                  ? "Vous recevez des courses. Tap pour passer hors ligne."
                  : "Tap pour commencer à recevoir des courses."}
              </Text>
            </Pressable>

            <View style={styles.statsRow}>
              <Stat
                label="Aujourd'hui"
                value={`${earnings.data?.todayMad ?? 0} DH`}
                icon="trending-up"
                colors={colors}
              />
              <Stat
                label="Livraisons"
                value={`${earnings.data?.todayDeliveries ?? 0}`}
                icon="package"
                colors={colors}
              />
              <Stat
                label="Pourboires"
                value={`${earnings.data?.todayTipsMad ?? 0} DH`}
                icon="gift"
                colors={colors}
              />
            </View>

            <PromotionsCarousel />

            <Text
              style={[
                styles.sectionTitle,
                { color: colors.foreground, fontFamily: "Inter_600SemiBold" },
              ]}
            >
              Courses disponibles
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <OrderCard
            order={item}
            colors={colors}
            onPress={() => router.push(`/order/${item.id}`)}
          />
        )}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather
              name={isOnline ? "search" : "moon"}
              size={32}
              color={colors.mutedForeground}
            />
            <Text
              style={[
                styles.emptyText,
                {
                  color: colors.mutedForeground,
                  fontFamily: "Inter_500Medium",
                },
              ]}
            >
              {isOnline
                ? "Aucune course disponible pour le moment."
                : "Passez en ligne pour voir les courses."}
            </Text>
          </View>
        }
      />

      <IncomingOrderModal
        visible={!!incoming}
        order={incoming}
        onClose={() => {
          if (incoming) dismissedIds.current.add(incoming.id);
          setIncoming(null);
        }}
      />
    </View>
  );
}

function Stat({
  label,
  value,
  icon,
  colors,
}: {
  label: string;
  value: string;
  icon: keyof typeof Feather.glyphMap;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View
      style={[
        styles.statCard,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderRadius: colors.radius,
        },
      ]}
    >
      <Feather name={icon} size={16} color={colors.primary} />
      <Text
        style={[
          styles.statValue,
          { color: colors.foreground, fontFamily: "Inter_700Bold" },
        ]}
      >
        {value}
      </Text>
      <Text
        style={[
          styles.statLabel,
          { color: colors.mutedForeground, fontFamily: "Inter_500Medium" },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

function OrderCard({
  order,
  colors,
  onPress,
}: {
  order: Order;
  colors: ReturnType<typeof useColors>;
  onPress: () => void;
}) {
  const itemsCount = order.items.reduce((s, i) => s + i.quantity, 0);
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.orderCard,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderRadius: colors.radius,
          opacity: pressed ? 0.9 : 1,
        },
      ]}
    >
      <View style={styles.orderTop}>
        <View style={{ flex: 1 }}>
          <Text
            style={[
              styles.restaurant,
              { color: colors.foreground, fontFamily: "Inter_600SemiBold" },
            ]}
            numberOfLines={1}
          >
            {order.restaurantName}
          </Text>
          <Text
            style={[
              styles.orderCode,
              { color: colors.mutedForeground, fontFamily: "Inter_500Medium" },
            ]}
          >
            #{order.code} · {itemsCount} art.
          </Text>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text
            style={[
              styles.orderPrice,
              { color: colors.primary, fontFamily: "Inter_700Bold" },
            ]}
          >
            {order.driverEarningsMad + order.tipMad} DH
          </Text>
          {order.tipMad > 0 ? (
            <Text
              style={{
                color: colors.warning,
                fontFamily: "Inter_500Medium",
                fontSize: 11,
              }}
            >
              +{order.tipMad} pourboire
            </Text>
          ) : null}
        </View>
      </View>
      <Row icon="map-pin" text={order.dropoffAddress} colors={colors} />
      <View style={styles.orderMeta}>
        <Feather name="navigation" size={13} color={colors.mutedForeground} />
        <Text
          style={[
            styles.orderMetaText,
            { color: colors.mutedForeground, fontFamily: "Inter_500Medium" },
          ]}
        >
          {order.distanceKm.toFixed(1)} km · ~{order.etaMinutes} min
        </Text>
      </View>
    </Pressable>
  );
}

function Row({
  icon,
  text,
  colors,
}: {
  icon: keyof typeof Feather.glyphMap;
  text: string;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={styles.row}>
      <Feather name={icon} size={14} color={colors.primary} />
      <Text
        numberOfLines={1}
        style={[
          styles.rowText,
          { color: colors.foreground, fontFamily: "Inter_500Medium" },
        ]}
      >
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  hello: { fontSize: 14 },
  name: { fontSize: 24, marginBottom: 18 },
  onlineCard: { padding: 18, borderWidth: 1, marginBottom: 18 },
  onlineRow: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: 10 },
  onlineLabel: { fontSize: 14, letterSpacing: 1 },
  onlineHint: { fontSize: 13 },
  statsRow: { flexDirection: "row", gap: 8, marginBottom: 22 },
  statCard: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    gap: 4,
  },
  statValue: { fontSize: 17, marginTop: 2 },
  statLabel: { fontSize: 11 },
  sectionTitle: { fontSize: 16, marginBottom: 8 },
  orderCard: { padding: 14, borderWidth: 1, gap: 8 },
  orderTop: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  restaurant: { fontSize: 15 },
  orderCode: { fontSize: 11, marginTop: 2 },
  orderPrice: { fontSize: 17 },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  rowText: { fontSize: 13, flex: 1 },
  orderMeta: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 },
  orderMetaText: { fontSize: 12 },
  empty: { alignItems: "center", paddingVertical: 50, gap: 10 },
  emptyText: { fontSize: 14, textAlign: "center", paddingHorizontal: 20 },
});
