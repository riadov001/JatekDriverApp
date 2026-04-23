import { Feather } from "@expo/vector-icons";
import React from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/context/AuthContext";
import { useOnline } from "@/context/OnlineContext";
import { useColors } from "@/hooks/useColors";

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, signOut } = useAuth();
  const { isOnline, toggleOnline } = useOnline();

  const onSignOut = () => {
    Alert.alert("Déconnexion", "Voulez-vous vraiment vous déconnecter ?", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Déconnexion",
        style: "destructive",
        onPress: async () => {
          if (isOnline) await toggleOnline();
          await signOut();
        },
      },
    ]);
  };

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={{
        paddingTop: insets.top + 12,
        paddingBottom: insets.bottom + 100,
        paddingHorizontal: 16,
      }}
    >
      <Text
        style={[
          styles.title,
          { color: colors.foreground, fontFamily: "Inter_700Bold" },
        ]}
      >
        Profil
      </Text>

      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
            borderRadius: colors.radius * 1.4,
          },
        ]}
      >
        <View
          style={[
            styles.avatar,
            { backgroundColor: colors.primary, borderRadius: 36 },
          ]}
        >
          <Text
            style={[
              styles.avatarText,
              { color: colors.primaryForeground, fontFamily: "Inter_700Bold" },
            ]}
          >
            {(user?.fullName ?? user?.driver?.fullName ?? "JD")
              .split(" ")
              .map((p) => p[0])
              .join("")
              .slice(0, 2)
              .toUpperCase()}
          </Text>
        </View>
        <Text
          style={[
            styles.name,
            { color: colors.foreground, fontFamily: "Inter_700Bold" },
          ]}
        >
          {user?.fullName ?? user?.driver?.fullName ?? "Chauffeur"}
        </Text>
        <Text
          style={[
            styles.phone,
            { color: colors.mutedForeground, fontFamily: "Inter_500Medium" },
          ]}
        >
          {user?.phone ? `+212 ${user.phone}` : "—"}
        </Text>
        {user?.driver?.rating != null ? (
          <View style={styles.ratingRow}>
            <Feather name="star" size={14} color={colors.warning} />
            <Text
              style={[
                styles.rating,
                { color: colors.foreground, fontFamily: "Inter_600SemiBold" },
              ]}
            >
              {user.driver.rating.toFixed(2)}
            </Text>
          </View>
        ) : null}
      </View>

      <Section title="Véhicule" colors={colors}>
        <Item
          icon="truck"
          label="Type"
          value={user?.driver?.vehicleType ?? "—"}
          colors={colors}
        />
        <Item
          icon="hash"
          label="Plaque"
          value={user?.driver?.vehiclePlate ?? "—"}
          colors={colors}
        />
      </Section>

      <Section title="Documents" colors={colors}>
        <Item
          icon="credit-card"
          label="CIN"
          value={user?.driver?.cin ?? "—"}
          colors={colors}
        />
        <Item
          icon="award"
          label="Permis"
          value={user?.driver?.licenseNumber ?? "—"}
          colors={colors}
        />
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
        <Text
          style={[
            styles.signOutText,
            { color: colors.destructive, fontFamily: "Inter_600SemiBold" },
          ]}
        >
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
    <View style={{ marginTop: 18 }}>
      <Text
        style={[
          styles.sectionTitle,
          { color: colors.mutedForeground, fontFamily: "Inter_500Medium" },
        ]}
      >
        {title.toUpperCase()}
      </Text>
      <View
        style={[
          styles.section,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
            borderRadius: colors.radius,
          },
        ]}
      >
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
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  value: string;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={[styles.itemRow, { borderBottomColor: colors.border }]}>
      <Feather name={icon} size={16} color={colors.mutedForeground} />
      <Text
        style={[
          styles.itemLabel,
          { color: colors.mutedForeground, fontFamily: "Inter_500Medium" },
        ]}
      >
        {label}
      </Text>
      <Text
        style={[
          styles.itemValue,
          { color: colors.foreground, fontFamily: "Inter_500Medium" },
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 26, marginBottom: 16 },
  card: {
    padding: 22,
    borderWidth: 1,
    alignItems: "center",
    gap: 8,
  },
  avatar: { width: 72, height: 72, alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 24 },
  name: { fontSize: 18, marginTop: 4 },
  phone: { fontSize: 13 },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  rating: { fontSize: 13 },
  sectionTitle: { fontSize: 11, letterSpacing: 1, marginBottom: 8, marginLeft: 4 },
  section: { borderWidth: 1, overflow: "hidden" },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
  },
  itemLabel: { fontSize: 13, flex: 1 },
  itemValue: { fontSize: 13 },
  signOut: {
    marginTop: 24,
    height: 50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
  },
  signOutText: { fontSize: 14 },
});
