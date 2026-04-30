import { Feather } from "@expo/vector-icons";
import React from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useActiveOrder } from "@/context/ActiveOrderContext";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";
import {
  setActiveOrderForTracking,
  stopLocationTracking,
} from "@/services/locationService";
import {
  getDriverLocationClient,
  getOrderTrackingClient,
} from "@/services/wsClient";

function confirmCrossPlatform(
  title: string,
  message: string,
): Promise<boolean> {
  return new Promise((resolve) => {
    if (Platform.OS === "web") {
      const ok =
        typeof window !== "undefined" && window.confirm(`${title}\n\n${message}`);
      resolve(!!ok);
      return;
    }
    Alert.alert(title, message, [
      { text: "Annuler", style: "cancel", onPress: () => resolve(false) },
      {
        text: "Déconnexion",
        style: "destructive",
        onPress: () => resolve(true),
      },
    ]);
  });
}

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, signOut } = useAuth();
  const { activeOrderId, endTracking } = useActiveOrder();

  const onSignOut = async () => {
    const confirmed = await confirmCrossPlatform(
      "Déconnexion",
      activeOrderId
        ? "Une course est encore active. La déconnexion l'annulera côté tracking."
        : "Voulez-vous vraiment vous déconnecter ?",
    );
    if (!confirmed) return;

    // Defensive teardown — never let any of these block sign-out.
    try {
      if (activeOrderId) await endTracking();
    } catch (e) {
      console.warn("[signout] endTracking failed", e);
    }
    try {
      setActiveOrderForTracking(null);
      await stopLocationTracking(true);
    } catch (e) {
      console.warn("[signout] stopLocationTracking failed", e);
    }
    try {
      getDriverLocationClient().close();
      getOrderTrackingClient().close();
    } catch (e) {
      console.warn("[signout] ws close failed", e);
    }

    try {
      await signOut();
    } catch (e) {
      console.warn("[signout] signOut failed", e);
    }
  };

  const fullName = user?.fullName ?? user?.driver?.fullName ?? "Chauffeur";
  const initials = fullName
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={{
        paddingTop: insets.top + 12,
        paddingBottom: insets.bottom + 100,
        paddingHorizontal: 16,
      }}
    >
      <Text style={[styles.title, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
        Profil
      </Text>

      <View style={[styles.profileCard, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius * 1.2 }]}>
        <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
          <Text style={[styles.avatarText, { color: colors.primaryForeground, fontFamily: "Inter_700Bold" }]}>
            {initials}
          </Text>
        </View>
        <Text style={[styles.name, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
          {fullName}
        </Text>
        <Text style={[styles.phone, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>
          {user?.phone ? `+212 ${user.phone}` : "—"}
        </Text>
        {user?.driver?.rating != null ? (
          <View style={styles.ratingRow}>
            <Feather name="star" size={14} color={colors.warning} />
            <Text style={[styles.rating, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
              {user.driver.rating.toFixed(2)}
            </Text>
          </View>
        ) : null}
      </View>

      <Section title="Véhicule" colors={colors}>
        <Item icon="truck" label="Type" value={user?.driver?.vehicleType ?? "—"} colors={colors} />
        <Item icon="hash" label="Plaque" value={user?.driver?.vehiclePlate ?? "—"} colors={colors} last />
      </Section>

      <Section title="Documents" colors={colors}>
        <Item icon="credit-card" label="CIN" value={user?.driver?.cin ?? "—"} colors={colors} />
        <Item icon="award" label="Permis" value={user?.driver?.licenseNumber ?? "—"} colors={colors} last />
      </Section>

      <Pressable
        onPress={onSignOut}
        style={({ pressed }) => [
          styles.signOut,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
            borderRadius: colors.radius,
            opacity: pressed ? 0.85 : 1,
          },
        ]}
      >
        <Feather name="log-out" size={18} color={colors.destructive} />
        <Text style={[styles.signOutText, { color: colors.destructive, fontFamily: "Inter_600SemiBold" }]}>
          Se déconnecter
        </Text>
      </Pressable>
    </ScrollView>
  );
}

function Section({
  title,
  children,
  colors,
}: {
  title: string;
  children: React.ReactNode;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={{ marginTop: 20 }}>
      <Text style={[styles.sectionTitle, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>
        {title.toUpperCase()}
      </Text>
      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
        {children}
      </View>
    </View>
  );
}

function Item({
  icon,
  label,
  value,
  colors,
  last,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  value: string;
  colors: ReturnType<typeof useColors>;
  last?: boolean;
}) {
  return (
    <View style={[styles.itemRow, { borderBottomColor: last ? "transparent" : colors.border }]}>
      <View style={[styles.itemIconWrap, { backgroundColor: colors.secondary }]}>
        <Feather name={icon} size={15} color={colors.info} />
      </View>
      <Text style={[styles.itemLabel, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>
        {label}
      </Text>
      <Text style={[styles.itemValue, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 22, marginBottom: 20 },
  profileCard: {
    padding: 24,
    borderWidth: 1,
    alignItems: "center",
    gap: 6,
  },
  avatar: { width: 72, height: 72, borderRadius: 36, alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 26 },
  name: { fontSize: 18, marginTop: 6 },
  phone: { fontSize: 13 },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  rating: { fontSize: 13 },
  sectionTitle: { fontSize: 11, letterSpacing: 1, marginBottom: 8, marginLeft: 4 },
  section: { borderWidth: 1, overflow: "hidden" },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
  },
  itemIconWrap: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  itemLabel: { fontSize: 13, flex: 1 },
  itemValue: { fontSize: 13 },
  signOut: {
    marginTop: 28,
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderWidth: 1,
  },
  signOutText: { fontSize: 15 },
});
