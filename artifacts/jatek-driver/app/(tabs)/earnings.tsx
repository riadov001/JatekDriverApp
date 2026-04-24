import { Feather } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import React, { useState } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import { getEarnings } from "@/lib/api";

type Period = "Aujourd'hui" | "Semaine" | "Mois";
const PERIODS: Period[] = ["Aujourd'hui", "Semaine", "Mois"];

export default function EarningsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [period, setPeriod] = useState<Period>("Aujourd'hui");
  const earnings = useQuery({ queryKey: ["earnings"], queryFn: getEarnings });

  const mainAmount =
    period === "Aujourd'hui"
      ? earnings.data?.todayMad ?? 0
      : period === "Semaine"
      ? earnings.data?.weekMad ?? 0
      : earnings.data?.monthMad ?? 0;

  const mainDeliveries =
    period === "Aujourd'hui"
      ? earnings.data?.todayDeliveries ?? 0
      : period === "Semaine"
      ? earnings.data?.weekDeliveries ?? 0
      : null;

  const mainTips =
    period === "Aujourd'hui"
      ? earnings.data?.todayTipsMad ?? 0
      : period === "Semaine"
      ? earnings.data?.weekTipsMad ?? 0
      : 0;

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={{
        paddingTop: insets.top + 12,
        paddingBottom: insets.bottom + 100,
        paddingHorizontal: 16,
      }}
      refreshControl={
        <RefreshControl
          refreshing={earnings.isRefetching}
          onRefresh={earnings.refetch}
          tintColor={colors.primary}
        />
      }
    >
      <Text style={[styles.title, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
        Mes Gains
      </Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.periodScroll}>
        {PERIODS.map((p) => {
          const active = period === p;
          return (
            <Pressable
              key={p}
              onPress={() => setPeriod(p)}
              style={[
                styles.periodPill,
                {
                  backgroundColor: active ? colors.primary : colors.background,
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
                {p}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={[styles.heroCard, { borderRadius: colors.radius * 1.5 }]}>
        <Text style={[styles.heroLabel, { color: "rgba(255,255,255,0.8)", fontFamily: "Inter_500Medium" }]}>
          {period}
        </Text>
        <Text style={[styles.heroValue, { color: "#FFFFFF", fontFamily: "Inter_700Bold" }]}>
          {mainAmount} DH
        </Text>
        <Text style={[styles.heroSub, { color: "rgba(255,255,255,0.75)", fontFamily: "Inter_400Regular" }]}>
          {mainDeliveries != null
            ? `${mainDeliveries} livraison${mainDeliveries !== 1 ? "s" : ""}${mainTips > 0 ? `  ·  ${mainTips} DH pourboires` : ""}`
            : `${mainTips > 0 ? `${mainTips} DH pourboires` : "Gains du mois"}`}
        </Text>
      </View>

      <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
        Détails
      </Text>

      <BreakdownItem
        icon="truck"
        label="Livraisons de base"
        value={`${Math.round(mainAmount * 0.74)} DH`}
        iconColor={colors.info}
        iconBg={colors.secondary}
        valueColor={colors.success}
        colors={colors}
      />
      <BreakdownItem
        icon="gift"
        label="Pourboires"
        value={`${mainTips} DH`}
        iconColor={colors.success}
        iconBg="#EEF4D0"
        valueColor={colors.success}
        colors={colors}
      />
      <BreakdownItem
        icon="map"
        label="Bonus distance"
        value={`${Math.round(mainAmount * 0.09)} DH`}
        iconColor={colors.primary}
        iconBg={colors.accent}
        valueColor={colors.primary}
        colors={colors}
      />
      <BreakdownItem
        icon="trending-up"
        label="Promotions"
        value={`${Math.round(mainAmount * 0.04)} DH`}
        iconColor={colors.primary}
        iconBg={colors.accent}
        valueColor={colors.primary}
        colors={colors}
      />

      <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: "Inter_700Bold", marginTop: 8 }]}>
        Historique des paiements
      </Text>

      <View style={[styles.payoutRow, { borderBottomColor: colors.border }]}>
        <View style={[styles.payoutIcon, { backgroundColor: colors.accent }]}>
          <Feather name="check-circle" size={20} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.payoutTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
            Virement · 890 DH
          </Text>
          <Text style={[styles.payoutDate, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
            Lun. 12 Juin, 09:30
          </Text>
        </View>
      </View>

      <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
        <Feather name="credit-card" size={18} color={colors.primary} />
        <View style={{ flex: 1 }}>
          <Text style={[styles.infoTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
            Paiement hebdomadaire
          </Text>
          <Text style={[styles.infoSub, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
            Vos gains sont versés chaque lundi sur votre compte bancaire enregistré.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

function BreakdownItem({
  icon,
  label,
  value,
  iconColor,
  iconBg,
  valueColor,
  colors,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  value: string;
  iconColor: string;
  iconBg: string;
  valueColor: string;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View
      style={[
        styles.breakdownRow,
        { backgroundColor: colors.background, borderColor: colors.border, borderRadius: colors.radius },
      ]}
    >
      <View style={[styles.breakdownIcon, { backgroundColor: iconBg }]}>
        <Feather name={icon} size={18} color={iconColor} />
      </View>
      <Text style={[styles.breakdownLabel, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
        {label}
      </Text>
      <Text style={[styles.breakdownValue, { color: valueColor, fontFamily: "Inter_700Bold" }]}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 22, marginBottom: 16 },
  periodScroll: { marginBottom: 20 },
  periodPill: {
    paddingHorizontal: 20,
    paddingVertical: 9,
    borderRadius: 50,
    borderWidth: 1,
    marginRight: 10,
  },
  heroCard: {
    padding: 24,
    marginBottom: 24,
    backgroundColor: "#9BA617",
    gap: 6,
  },
  heroLabel: { fontSize: 13 },
  heroValue: { fontSize: 48, lineHeight: 54 },
  heroSub: { fontSize: 14 },
  sectionTitle: { fontSize: 18, marginBottom: 12 },
  breakdownRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 14,
    borderWidth: 1,
    marginBottom: 10,
  },
  breakdownIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  breakdownLabel: { flex: 1, fontSize: 14 },
  breakdownValue: { fontSize: 16 },
  payoutRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 16,
    borderBottomWidth: 1,
    marginBottom: 20,
  },
  payoutIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  payoutTitle: { fontSize: 14 },
  payoutDate: { fontSize: 12, marginTop: 2 },
  infoCard: {
    flexDirection: "row",
    gap: 12,
    padding: 16,
    borderWidth: 1,
    alignItems: "flex-start",
  },
  infoTitle: { fontSize: 14, marginBottom: 6 },
  infoSub: { fontSize: 13, lineHeight: 18 },
});
