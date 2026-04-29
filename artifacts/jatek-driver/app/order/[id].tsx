import { Feather } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as Linking from "expo-linking";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
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

import { DeliveryCodeModal } from "@/components/DeliveryCodeModal";
import { DeliveryMap } from "@/components/DeliveryMap";
import { useActiveOrder } from "@/context/ActiveOrderContext";
import { useColors } from "@/hooks/useColors";
import { useOrderNotifications } from "@/hooks/useOrderNotifications";
import {
  acceptOrder,
  cancelOrder,
  getOrder,
  markArrivedDropoff,
  markArrivedPickup,
  markDelivered,
  markPickedUp,
  type Order,
  type OrderStatus,
  type PaymentMethod,
} from "@/lib/api";
import type { WsStatus } from "@/services/wsClient";

const STEPS: { key: OrderStatus; label: string }[] = [
  { key: "accepted", label: "Vers le commerçant" },
  { key: "arrived_pickup", label: "Au commerçant" },
  { key: "picked_up", label: "Vers le client" },
  { key: "arrived_dropoff", label: "Chez le client" },
  { key: "delivered", label: "Livré" },
];

export default function OrderDetailScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const qc = useQueryClient();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [codeModal, setCodeModal] = useState(false);
  const [codeError, setCodeError] = useState<string | null>(null);
  const { activeOrderId, trackingActive, wsStatus, beginTracking, endTracking } =
    useActiveOrder();

  const order = useQuery({
    queryKey: ["order", id],
    queryFn: () => getOrder(id!),
    enabled: !!id,
    refetchInterval: 8_000,
  });

  useOrderNotifications(order.data?.status);

  // Auto-start tracking when this order becomes active and auto-stop when it
  // closes. Acts as a safety net even if the user navigates away during accept.
  useEffect(() => {
    const status = order.data?.status;
    if (!id || !status) return;
    const isActiveStatus =
      status === "accepted" ||
      status === "arrived_pickup" ||
      status === "picked_up" ||
      status === "arrived_dropoff";
    if (isActiveStatus && activeOrderId !== id) {
      beginTracking(id).then((err) => {
        if (err) console.warn("[order] auto-start tracking failed:", err);
      });
    }
    if (!isActiveStatus && activeOrderId === id) {
      endTracking().catch((e) => console.warn("[order] stop tracking", e));
    }
  }, [id, order.data?.status, activeOrderId, beginTracking, endTracking]);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["order", id] });
    qc.invalidateQueries({ queryKey: ["my-orders"] });
    qc.invalidateQueries({ queryKey: ["available-orders"] });
  };

  const accept = useMutation({
    mutationFn: () => acceptOrder(id!),
    onSuccess: invalidate,
    onError: (e) =>
      Alert.alert("Erreur", e instanceof Error ? e.message : "Échec"),
  });
  const arrivedPickup = useMutation({
    mutationFn: () => markArrivedPickup(id!),
    onSuccess: invalidate,
  });
  const pickup = useMutation({
    mutationFn: () => markPickedUp(id!),
    onSuccess: invalidate,
  });
  const arrivedDropoff = useMutation({
    mutationFn: () => markArrivedDropoff(id!),
    onSuccess: invalidate,
  });
  const deliver = useMutation({
    mutationFn: (code: string) => markDelivered(id!, code),
    onSuccess: () => {
      setCodeModal(false);
      setCodeError(null);
      qc.invalidateQueries({ queryKey: ["earnings"] });
      invalidate();
      router.back();
    },
    onError: (e) =>
      setCodeError(e instanceof Error ? e.message : "Code invalide"),
  });
  const cancel = useMutation({
    mutationFn: () => cancelOrder(id!),
    onSuccess: () => {
      invalidate();
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
      </View>
    );
  }

  const o = order.data;
  const itemsCount = o.items.reduce((s, i) => s + i.quantity, 0);

  return (
    <>
      <ScrollView
        style={{ backgroundColor: colors.background }}
        contentContainerStyle={{
          padding: 16,
          paddingBottom: insets.bottom + 24,
        }}
      >
        <View style={styles.headerTop}>
          <Text
            style={[
              styles.code,
              { color: colors.mutedForeground, fontFamily: "Inter_500Medium" },
            ]}
          >
            #{o.code}
          </Text>
          <PaymentBadge method={o.paymentMethod} colors={colors} />
        </View>
        <Text
          style={[
            styles.price,
            { color: colors.foreground, fontFamily: "Inter_700Bold" },
          ]}
        >
          {o.driverEarningsMad + o.tipMad} DH
        </Text>
        <Text
          style={[
            styles.priceSub,
            { color: colors.mutedForeground, fontFamily: "Inter_400Regular" },
          ]}
        >
          {o.driverEarningsMad} DH course
          {o.tipMad > 0 ? ` + ${o.tipMad} DH pourboire` : ""} ·{" "}
          {o.distanceKm.toFixed(1)} km · ~{o.etaMinutes} min
        </Text>

        {(o.status === "accepted" ||
          o.status === "arrived_pickup" ||
          o.status === "picked_up" ||
          o.status === "arrived_dropoff") && (
          <DeliveryMap order={o} style={{ marginBottom: 16 }} />
        )}

        <Stepper status={o.status} colors={colors} />

        {activeOrderId === o.id ? (
          <LiveStatusBadge
            wsStatus={wsStatus}
            tracking={trackingActive}
            colors={colors}
          />
        ) : null}

        <Card colors={colors}>
          <Stop
            icon="shopping-bag"
            label="COMMERÇANT"
            primary={o.restaurantName}
            secondary={o.pickupAddress}
            actionIcon="phone"
            onAction={() => RNLinking.openURL(`tel:${o.restaurantPhone}`)}
            onNavigate={() => openMaps(o.pickupLat, o.pickupLng)}
            colors={colors}
          />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <Stop
            icon="user"
            label="CLIENT"
            primary={o.customerName}
            secondary={o.dropoffAddress}
            actionIcon="phone"
            onAction={() => RNLinking.openURL(`tel:${o.customerPhone}`)}
            onNavigate={() => openMaps(o.dropoffLat, o.dropoffLng)}
            colors={colors}
          />
        </Card>

        <SectionTitle colors={colors}>
          Articles ({itemsCount})
        </SectionTitle>
        <Card colors={colors}>
          {o.items.map((it, idx) => (
            <View key={idx}>
              <View style={styles.itemRow}>
                <Text
                  style={[
                    styles.itemQty,
                    {
                      color: colors.primary,
                      fontFamily: "Inter_700Bold",
                    },
                  ]}
                >
                  {it.quantity}×
                </Text>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      color: colors.foreground,
                      fontFamily: "Inter_500Medium",
                      fontSize: 14,
                    }}
                  >
                    {it.name}
                  </Text>
                  {it.options ? (
                    <Text
                      style={{
                        color: colors.mutedForeground,
                        fontFamily: "Inter_400Regular",
                        fontSize: 12,
                        marginTop: 1,
                      }}
                    >
                      {it.options}
                    </Text>
                  ) : null}
                </View>
              </View>
              {idx < o.items.length - 1 ? (
                <View
                  style={[
                    styles.itemDivider,
                    { backgroundColor: colors.border },
                  ]}
                />
              ) : null}
            </View>
          ))}
          <View
            style={[styles.totalRow, { borderTopColor: colors.border }]}
          >
            <Text
              style={{
                color: colors.mutedForeground,
                fontFamily: "Inter_500Medium",
                fontSize: 13,
              }}
            >
              {o.paymentMethod === "cash"
                ? "À encaisser"
                : "Total commande (déjà payé)"}
            </Text>
            <Text
              style={{
                color: colors.foreground,
                fontFamily: "Inter_700Bold",
                fontSize: 18,
              }}
            >
              {o.priceMad} DH
            </Text>
          </View>
        </Card>

        {o.notes ? (
          <Card colors={colors}>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <Feather name="message-circle" size={16} color={colors.primary} />
              <Text
                style={{
                  color: colors.foreground,
                  fontFamily: "Inter_400Regular",
                  fontSize: 13,
                  flex: 1,
                  lineHeight: 18,
                }}
              >
                {o.notes}
              </Text>
            </View>
          </Card>
        ) : null}

        {o.status === "arrived_dropoff" || o.status === "picked_up" ? (
          <Text
            style={{
              color: colors.mutedForeground,
              fontFamily: "Inter_400Regular",
              fontSize: 12,
              marginTop: 12,
              textAlign: "center",
            }}
          >
            Le client recevra un code à 4 chiffres pour confirmer la livraison.
          </Text>
        ) : null}

        <ActionBar
          order={o}
          colors={colors}
          loading={
            accept.isPending ||
            arrivedPickup.isPending ||
            pickup.isPending ||
            arrivedDropoff.isPending
          }
          onAccept={() => accept.mutate()}
          onArrivedPickup={() => arrivedPickup.mutate()}
          onPickup={() => pickup.mutate()}
          onArrivedDropoff={() => arrivedDropoff.mutate()}
          onDeliver={() => {
            setCodeError(null);
            setCodeModal(true);
          }}
        />

        {(o.status === "accepted" || o.status === "arrived_pickup") && (
          <Pressable
            onPress={() =>
              Alert.alert("Annuler la course", "Êtes-vous sûr ?", [
                { text: "Non" },
                {
                  text: "Oui",
                  style: "destructive",
                  onPress: () => cancel.mutate(),
                },
              ])
            }
            style={({ pressed }) => [
              styles.cancelBtn,
              { opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Text
              style={{
                color: colors.destructive,
                fontFamily: "Inter_500Medium",
                fontSize: 13,
              }}
            >
              Annuler la course
            </Text>
          </Pressable>
        )}
      </ScrollView>

      <DeliveryCodeModal
        visible={codeModal}
        loading={deliver.isPending}
        error={codeError}
        onClose={() => {
          setCodeModal(false);
          setCodeError(null);
        }}
        onSubmit={(code) => deliver.mutate(code)}
      />
    </>
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

function LiveStatusBadge({
  wsStatus,
  tracking,
  colors,
}: {
  wsStatus: WsStatus;
  tracking: boolean;
  colors: ReturnType<typeof useColors>;
}) {
  const map: Record<WsStatus, { label: string; bg: string; fg: string; icon: keyof typeof Feather.glyphMap }> = {
    idle: { label: "En attente…", bg: colors.muted, fg: colors.foreground, icon: "clock" },
    connecting: { label: "Connexion…", bg: colors.muted, fg: colors.foreground, icon: "loader" },
    open: { label: tracking ? "Suivi GPS LIVE" : "Connecté", bg: "#1f7a3a", fg: "#ffffff", icon: "radio" },
    closed: { label: "Hors-ligne", bg: colors.destructive, fg: "#ffffff", icon: "wifi-off" },
    error: { label: "Erreur connexion", bg: colors.destructive, fg: "#ffffff", icon: "alert-triangle" },
    reconnecting: { label: "Reconnexion…", bg: colors.warning, fg: "#1f1300", icon: "refresh-cw" },
  };
  const m = map[wsStatus];
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        alignSelf: "flex-start",
        paddingHorizontal: 10,
        paddingVertical: 6,
        backgroundColor: m.bg,
        borderRadius: colors.radius / 2,
        marginTop: 12,
        marginBottom: 8,
      }}
    >
      <Feather name={m.icon} size={12} color={m.fg} />
      <Text
        style={{
          color: m.fg,
          fontFamily: "Inter_600SemiBold",
          fontSize: 11,
          letterSpacing: 0.3,
        }}
      >
        {m.label}
      </Text>
    </View>
  );
}

function PaymentBadge({
  method,
  colors,
}: {
  method: PaymentMethod;
  colors: ReturnType<typeof useColors>;
}) {
  const map: Record<
    PaymentMethod,
    { label: string; icon: keyof typeof Feather.glyphMap }
  > = {
    cash: { label: "Espèces", icon: "dollar-sign" },
    card: { label: "Carte", icon: "credit-card" },
    online: { label: "Payé en ligne", icon: "check-circle" },
  };
  const m = map[method];
  const isCash = method === "cash";
  return (
    <View
      style={[
        styles.payBadge,
        {
          backgroundColor: isCash ? colors.warning : colors.muted,
          borderRadius: colors.radius / 2,
        },
      ]}
    >
      <Feather
        name={m.icon}
        size={12}
        color={isCash ? "#1f1300" : colors.foreground}
      />
      <Text
        style={{
          color: isCash ? "#1f1300" : colors.foreground,
          fontFamily: "Inter_600SemiBold",
          fontSize: 11,
        }}
      >
        {m.label}
      </Text>
    </View>
  );
}

function Stepper({
  status,
  colors,
}: {
  status: OrderStatus;
  colors: ReturnType<typeof useColors>;
}) {
  const idx = STEPS.findIndex((s) => s.key === status);
  if (idx < 0) return null;
  return (
    <View style={styles.stepper}>
      {STEPS.map((s, i) => {
        const done = i <= idx;
        return (
          <React.Fragment key={s.key}>
            <View style={styles.stepItem}>
              <View
                style={[
                  styles.stepDot,
                  {
                    backgroundColor: done ? colors.primary : colors.muted,
                    borderColor: done ? colors.primary : colors.border,
                  },
                ]}
              >
                {done ? (
                  <Feather
                    name="check"
                    size={10}
                    color={colors.primaryForeground}
                  />
                ) : null}
              </View>
              <Text
                style={[
                  styles.stepLabel,
                  {
                    color: done ? colors.foreground : colors.mutedForeground,
                    fontFamily: done ? "Inter_600SemiBold" : "Inter_400Regular",
                  },
                ]}
                numberOfLines={2}
              >
                {s.label}
              </Text>
            </View>
            {i < STEPS.length - 1 ? (
              <View
                style={[
                  styles.stepLine,
                  {
                    backgroundColor: i < idx ? colors.primary : colors.border,
                  },
                ]}
              />
            ) : null}
          </React.Fragment>
        );
      })}
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

function SectionTitle({
  children,
  colors,
}: {
  children: React.ReactNode;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <Text
      style={{
        color: colors.mutedForeground,
        fontFamily: "Inter_500Medium",
        fontSize: 11,
        letterSpacing: 1,
        marginTop: 18,
        marginBottom: 8,
        marginLeft: 4,
      }}
    >
      {String(children).toUpperCase()}
    </Text>
  );
}

function Stop({
  icon,
  label,
  primary,
  secondary,
  actionIcon,
  onAction,
  onNavigate,
  colors,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  primary: string;
  secondary: string;
  actionIcon: keyof typeof Feather.glyphMap;
  onAction: () => void;
  onNavigate: () => void;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={styles.stop}>
      <View
        style={[
          styles.stopIcon,
          { backgroundColor: colors.muted, borderRadius: 10 },
        ]}
      >
        <Feather name={icon} size={16} color={colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text
          style={{
            color: colors.mutedForeground,
            fontFamily: "Inter_500Medium",
            fontSize: 10,
            letterSpacing: 1,
          }}
        >
          {label}
        </Text>
        <Text
          style={{
            color: colors.foreground,
            fontFamily: "Inter_600SemiBold",
            fontSize: 15,
            marginTop: 1,
          }}
        >
          {primary}
        </Text>
        <Text
          style={{
            color: colors.mutedForeground,
            fontFamily: "Inter_400Regular",
            fontSize: 12,
            marginTop: 1,
          }}
          numberOfLines={2}
        >
          {secondary}
        </Text>
      </View>
      <Pressable
        onPress={onAction}
        hitSlop={6}
        style={[
          styles.iconBtn,
          {
            backgroundColor: colors.muted,
            borderRadius: colors.radius,
          },
        ]}
      >
        <Feather name={actionIcon} size={16} color={colors.primary} />
      </Pressable>
      <Pressable
        onPress={onNavigate}
        hitSlop={6}
        style={[
          styles.iconBtn,
          {
            backgroundColor: colors.primary,
            borderRadius: colors.radius,
          },
        ]}
      >
        <Feather name="navigation" size={16} color={colors.primaryForeground} />
      </Pressable>
    </View>
  );
}

function ActionBar({
  order,
  colors,
  loading,
  onAccept,
  onArrivedPickup,
  onPickup,
  onArrivedDropoff,
  onDeliver,
}: {
  order: Order;
  colors: ReturnType<typeof useColors>;
  loading: boolean;
  onAccept: () => void;
  onArrivedPickup: () => void;
  onPickup: () => void;
  onArrivedDropoff: () => void;
  onDeliver: () => void;
}) {
  let label = "";
  let onPress: (() => void) | null = null;
  switch (order.status) {
    case "pending":
    case "assigned":
      label = "Accepter la course";
      onPress = onAccept;
      break;
    case "accepted":
      label = "Je suis arrivé au commerçant";
      onPress = onArrivedPickup;
      break;
    case "arrived_pickup":
      label = "J'ai récupéré la commande";
      onPress = onPickup;
      break;
    case "picked_up":
      label = "Je suis arrivé chez le client";
      onPress = onArrivedDropoff;
      break;
    case "arrived_dropoff":
      label = "Confirmer la livraison";
      onPress = onDeliver;
      break;
    default:
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
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
  },
  code: { fontSize: 12 },
  payBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  price: { fontSize: 32, marginTop: 6 },
  priceSub: { fontSize: 12, marginBottom: 18 },

  stepper: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 18,
    paddingHorizontal: 4,
  },
  stepItem: { alignItems: "center", width: 60 },
  stepDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  stepLabel: {
    fontSize: 9,
    textAlign: "center",
    marginTop: 4,
    lineHeight: 11,
  },
  stepLine: { flex: 1, height: 2, marginTop: 10, marginHorizontal: -2 },

  card: { padding: 16, borderWidth: 1, marginTop: 12 },
  divider: { height: 1, marginVertical: 14, marginLeft: 46 },
  stop: { flexDirection: "row", alignItems: "center", gap: 10 },
  stopIcon: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  iconBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },

  itemRow: { flexDirection: "row", gap: 12, paddingVertical: 8 },
  itemQty: { fontSize: 14, width: 28 },
  itemDivider: { height: 1 },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    paddingTop: 12,
    marginTop: 8,
  },

  action: {
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 24,
  },
  cancelBtn: { alignSelf: "center", padding: 14, marginTop: 4 },
});
