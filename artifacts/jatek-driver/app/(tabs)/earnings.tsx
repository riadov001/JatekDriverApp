import { Feather } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import React from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import { getEarnings } from "@/lib/api";

export default function EarningsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const earnings = useQuery({ queryKey: ["earnings"], queryFn: getEarnings });

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
      <Text
        style={[
          styles.title,
          { color: colors.foreground, fontFamily: "Inter_700Bold" },
        ]}
      >
        Mes gains
      </Text>

      <View
        style={[
          styles.heroCard,
          {
            backgroundColor: colors.primary,
            borderRadius: colors.radius * 1.4,
          },
        ]}
      >
        <Text
          style={[
            styles.heroLabel,
            { color: colors.primaryForeground, fontFamily: "Inter_500Medium" },
          ]}
        >
          Aujourd&apos;hui
        </Text>
        <Text
          style={[
            styles.heroValue,
            { color: colors.primaryForeground, fontFamily: "Inter_700Bold" },
          ]}
        >
          {earnings.data?.todayMad ?? 0} DH
        </Text>
        <Text
          style={[
            styles.heroSub,
            { color: colors.primaryForeground, fontFamily: "Inter_400Regular" },
          ]}
        >
          {earnings.data?.todayDeliveries ?? 0} livraison
          {(earnings.data?.todayDeliveries ?? 0) > 1 ? "s" : ""}
        </Text>
      </View>

      <View style={styles.row}>
        <Card
          icon="calendar"
          label="Cette semaine"
          value={`${earnings.data?.weekMad ?? 0} DH`}
          sub={`${earnings.data?.weekDeliveries ?? 0} livraisons`}
          colors={colors}
        />
        <Card
          icon="bar-chart-2"
          label="Ce mois"
          value={`${earnings.data?.monthMad ?? 0} DH`}
          colors={colors}
        />
      </View>

      <View
        style={[
          styles.payoutCard,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
            borderRadius: colors.radius,
          },
        ]}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <Feather name="credit-card" size={18} color={colors.primary} />
          <Text
            style={[
              styles.payoutTitle,
              { color: colors.foreground, fontFamily: "Inter_600SemiBold" },
            ]}
          >
            Paiement hebdomadaire
          </Text>
        </View>
        <Text
          style={[
            styles.payoutSub,
            { color: colors.mutedForeground, fontFamily: "Inter_400Regular" },
          ]}
        >
          Vos gains sont versés chaque lundi sur votre compte bancaire enregistré.
        </Text>
      </View>
    </ScrollView>
  );
}

function Card({
  icon,
  label,
  value,
  sub,
  colors,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  value: string;
  sub?: string;
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
      <Feather name={icon} size={18} color={colors.primary} />
      <Text
        style={[
          styles.cardLabel,
          { color: colors.mutedForeground, fontFamily: "Inter_500Medium" },
        ]}
      >
        {label}
      </Text>
      <Text
        style={[
          styles.cardValue,
          { color: colors.foreground, fontFamily: "Inter_700Bold" },
        ]}
      >
        {value}
      </Text>
      {sub ? (
        <Text
          style={[
            styles.cardSub,
            { color: colors.mutedForeground, fontFamily: "Inter_400Regular" },
          ]}
        >
          {sub}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 26, marginBottom: 16 },
  heroCard: { padding: 22, marginBottom: 14 },
  heroLabel: { fontSize: 13, opacity: 0.9 },
  heroValue: { fontSize: 36, marginTop: 4 },
  heroSub: { fontSize: 13, marginTop: 4, opacity: 0.9 },
  row: { flexDirection: "row", gap: 10, marginBottom: 14 },
  card: {
    flex: 1,
    padding: 14,
    borderWidth: 1,
    gap: 6,
  },
  cardLabel: { fontSize: 12, marginTop: 4 },
  cardValue: { fontSize: 20 },
  cardSub: { fontSize: 11 },
  payoutCard: { padding: 16, borderWidth: 1, gap: 10 },
  payoutTitle: { fontSize: 15 },
  payoutSub: { fontSize: 13, lineHeight: 18 },
});
