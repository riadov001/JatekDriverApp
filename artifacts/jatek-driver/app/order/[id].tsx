import { Feather } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as Linking from "expo-linking";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  Alert,
  Linking as RNLinking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import {
  acceptOrder,
  getOrder,
  markDelivered,
  markPickedUp,
  type Order,
  type OrderStatus,
} from "@/lib/api";

export default function OrderDetailScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const qc = useQueryClient();
  const { id } = useLocalSearchParams<{ id: string }>();

  const order = useQuery({
    queryKey: ["order", id],
    queryFn: () => getOrder(id!),
    enabled: !!id,
    refetchInterval: 15_000,
  });

  const accept = useMutation({
    mutationFn: () => acceptOrder(id!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["order", id] });
      qc.invalidateQueries({ queryKey: ["my-orders"] });
      qc.invalidateQueries({ queryKey: ["available-orders"] });
    },
    onError: (e) =>
      Alert.alert("Erreur", e instanceof Error ? e.message : "Échec"),
  });
  const pickup = useMutation({
    mutationFn: () => markPickedUp(id!),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["order", id] }),
  });
  const deliver = useMutation({
    mutationFn: () => markDelivered(id!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["order", id] });
      qc.invalidateQueries({ queryKey: ["earnings"] });
      router.back();
    },
  });

  if (order.isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }
  if (order.isError || !order.data) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Feather name="alert-circle" size={28} color={colors.destructive} />
        <Text
          style={{
            color: colors.foreground,
            fontFamily: "Inter_500Medium",
            marginTop: 8,
          }}
        >
          Course introuvable
        </Text>
        <Pressable
          onPress={() => order.refetch()}
          style={[styles.retry, { borderColor: colors.border, borderRadius: colors.radius }]}
        >
          <Text style={{ color: colors.primary, fontFamily: "Inter_600SemiBold" }}>
            Réessayer
          </Text>
        </Pressable>
      </View>
    );
  }

  const o = order.data;

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={{
        padding: 16,
        paddingBottom: insets.bottom + 24,
      }}
    >
      <StatusPill status={o.status} colors={colors} />

      <Text
        style={[
          styles.code,
          { color: colors.mutedForeground, fontFamily: "Inter_500Medium" },
        ]}
      >
        Course #{o.code}
      </Text>
      <Text
        style={[
          styles.price,
          { color: colors.foreground, fontFamily: "Inter_700Bold" },
        ]}
      >
        {o.driverEarningsMad} DH
      </Text>
      <Text
        style={[
          styles.priceSub,
          { color: colors.mutedForeground, fontFamily: "Inter_400Regular" },
        ]}
      >
        Distance estimée : {o.distanceKm.toFixed(1)} km
      </Text>

      <Card colors={colors}>
        <Stop
          icon="arrow-up-circle"
          label="RAMASSAGE"
          address={o.pickupAddress}
          onNavigate={() => openMaps(o.pickupLat, o.pickupLng)}
          colors={colors}
        />
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <Stop
          icon="arrow-down-circle"
          label="LIVRAISON"
          address={o.dropoffAddress}
          onNavigate={() => openMaps(o.dropoffLat, o.dropoffLng)}
          colors={colors}
        />
      </Card>

      <Card colors={colors}>
        <View style={styles.cust}>
          <Feather name="user" size={18} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <Text
              style={{
                color: colors.foreground,
                fontFamily: "Inter_600SemiBold",
                fontSize: 15,
              }}
            >
              {o.customerName}
            </Text>
            <Text
              style={{
                color: colors.mutedForeground,
                fontFamily: "Inter_400Regular",
                fontSize: 12,
                marginTop: 2,
              }}
            >
              {o.customerPhone}
            </Text>
          </View>
          <Pressable
            onPress={() => RNLinking.openURL(`tel:${o.customerPhone}`)}
            style={[
              styles.callBtn,
              { backgroundColor: colors.primary, borderRadius: colors.radius },
            ]}
            hitSlop={6}
          >
            <Feather name="phone" size={16} color={colors.primaryForeground} />
          </Pressable>
        </View>
        {o.notes ? (
          <Text
            style={{
              color: colors.mutedForeground,
              fontFamily: "Inter_400Regular",
              fontSize: 13,
              marginTop: 12,
            }}
          >
            Note : {o.notes}
          </Text>
        ) : null}
      </Card>

      <ActionBar
        order={o}
        colors={colors}
        loading={accept.isPending || pickup.isPending || deliver.isPending}
        onAccept={() => accept.mutate()}
        onPickup={() => pickup.mutate()}
        onDeliver={() =>
          Alert.alert(
            "Livraison terminée ?",
            "Confirmez que la commande a bien été remise au client.",
            [
              { text: "Annuler", style: "cancel" },
              { text: "Confirmer", onPress: () => deliver.mutate() },
            ],
          )
        }
      />
    </ScrollView>
  );
}

function openMaps(lat: number, lng: number) {
  const url = Platform.select({
    ios: `maps://?daddr=${lat},${lng}`,
    android: `google.navigation:q=${lat},${lng}`,
    default: `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`,
  });
  Linking.openURL(url!).catch(() => {});
}

function StatusPill({
  status,
  colors,
}: {
  status: OrderStatus;
  colors: ReturnType<typeof useColors>;
}) {
  const map: Record<OrderStatus, { label: string; bg: string; fg: string }> = {
    pending: { label: "En attente", bg: colors.muted, fg: colors.foreground },
    assigned: { label: "Assignée", bg: colors.muted, fg: colors.foreground },
    accepted: { label: "Acceptée", bg: colors.accent, fg: colors.accentForeground },
    picked_up: { label: "En cours", bg: colors.accent, fg: colors.accentForeground },
    delivered: { label: "Livrée", bg: colors.primary, fg: colors.primaryForeground },
    cancelled: {
      label: "Annulée",
      bg: colors.destructive,
      fg: colors.destructiveForeground,
    },
  };
  const s = map[status];
  return (
    <View
      style={[
        styles.pill,
        { backgroundColor: s.bg, borderRadius: colors.radius / 1.4 },
      ]}
    >
      <Text style={[styles.pillText, { color: s.fg, fontFamily: "Inter_500Medium" }]}>
        {s.label}
      </Text>
    </View>
  );
}

function Card({
  children,
  colors,
}: {
  children: React.ReactNode;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderRadius: colors.radius,
        },
      ]}
    >
      {children}
    </View>
  );
}

function Stop({
  icon,
  label,
  address,
  onNavigate,
  colors,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  address: string;
  onNavigate: () => void;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={styles.stop}>
      <Feather name={icon} size={20} color={colors.primary} />
      <View style={{ flex: 1 }}>
        <Text
          style={{
            color: colors.mutedForeground,
            fontFamily: "Inter_500Medium",
            fontSize: 11,
            letterSpacing: 1,
          }}
        >
          {label}
        </Text>
        <Text
          style={{
            color: colors.foreground,
            fontFamily: "Inter_500Medium",
            fontSize: 14,
            marginTop: 2,
          }}
        >
          {address}
        </Text>
      </View>
      <Pressable onPress={onNavigate} hitSlop={8}>
        <Feather name="navigation" size={18} color={colors.primary} />
      </Pressable>
    </View>
  );
}

function ActionBar({
  order,
  colors,
  loading,
  onAccept,
  onPickup,
  onDeliver,
}: {
  order: Order;
  colors: ReturnType<typeof useColors>;
  loading: boolean;
  onAccept: () => void;
  onPickup: () => void;
  onDeliver: () => void;
}) {
  let label = "";
  let onPress: (() => void) | null = null;
  if (order.status === "pending" || order.status === "assigned") {
    label = "Accepter la course";
    onPress = onAccept;
  } else if (order.status === "accepted") {
    label = "Marquer comme récupérée";
    onPress = onPickup;
  } else if (order.status === "picked_up") {
    label = "Marquer comme livrée";
    onPress = onDeliver;
  } else {
    return null;
  }

  return (
    <Pressable
      onPress={onPress ?? undefined}
      disabled={loading || !onPress}
      style={({ pressed }) => [
        styles.action,
        {
          backgroundColor: colors.primary,
          borderRadius: colors.radius,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={colors.primaryForeground} />
      ) : (
        <Text
          style={{
            color: colors.primaryForeground,
            fontFamily: "Inter_600SemiBold",
            fontSize: 16,
          }}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  retry: { marginTop: 12, paddingHorizontal: 18, paddingVertical: 10, borderWidth: 1 },
  pill: { alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 5 },
  pillText: { fontSize: 11, letterSpacing: 0.5 },
  code: { fontSize: 12, marginTop: 14 },
  price: { fontSize: 32, marginTop: 4 },
  priceSub: { fontSize: 13, marginBottom: 16 },
  card: { padding: 16, borderWidth: 1, marginTop: 12 },
  stop: { flexDirection: "row", alignItems: "center", gap: 12 },
  divider: { height: 1, marginVertical: 14, marginLeft: 32 },
  cust: { flexDirection: "row", alignItems: "center", gap: 12 },
  callBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  action: {
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 24,
  },
});
