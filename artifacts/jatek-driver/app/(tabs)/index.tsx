import { Feather } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import React from "react";
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

  const earnings = useQuery({
    queryKey: ["earnings"],
    queryFn: getEarnings,
    refetchInterval: 60_000,
  });

  const available = useQuery({
    queryKey: ["available-orders"],
    queryFn: listAvailableOrders,
    enabled: isOnline,
    refetchInterval: isOnline ? 15_000 : false,
  });

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
            </View>

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
      <Feather name={icon} size={18} color={colors.primary} />
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
        <Text
          style={[
            styles.orderCode,
            { color: colors.mutedForeground, fontFamily: "Inter_500Medium" },
          ]}
        >
          #{order.code}
        </Text>
        <Text
          style={[
            styles.orderPrice,
            { color: colors.primary, fontFamily: "Inter_700Bold" },
          ]}
        >
          {order.driverEarningsMad} DH
        </Text>
      </View>
      <Row icon="arrow-up-circle" text={order.pickupAddress} colors={colors} />
      <Row icon="arrow-down-circle" text={order.dropoffAddress} colors={colors} />
      <View style={styles.orderMeta}>
        <Feather name="navigation" size={13} color={colors.mutedForeground} />
        <Text
          style={[
            styles.orderMetaText,
            { color: colors.mutedForeground, fontFamily: "Inter_500Medium" },
          ]}
        >
          {order.distanceKm.toFixed(1)} km
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
      <Feather name={icon} size={15} color={colors.primary} />
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
  statsRow: { flexDirection: "row", gap: 10, marginBottom: 22 },
  statCard: {
    flex: 1,
    padding: 14,
    borderWidth: 1,
    gap: 6,
  },
  statValue: { fontSize: 20, marginTop: 2 },
  statLabel: { fontSize: 12 },
  sectionTitle: { fontSize: 16, marginBottom: 8 },
  orderCard: { padding: 14, borderWidth: 1, gap: 8 },
  orderTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  orderCode: { fontSize: 12, letterSpacing: 0.5 },
  orderPrice: { fontSize: 16 },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  rowText: { fontSize: 14, flex: 1 },
  orderMeta: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 },
  orderMetaText: { fontSize: 12 },
  empty: { alignItems: "center", paddingVertical: 50, gap: 10 },
  emptyText: { fontSize: 14, textAlign: "center", paddingHorizontal: 20 },
});
