import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import { sendOtp } from "@/lib/api";

export default function LoginScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cleanPhone = phone.replace(/\s+/g, "");
  const valid = cleanPhone.length >= 9;

  const onContinue = async () => {
    if (!valid || loading) return;
    setLoading(true);
    setError(null);
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    try {
      await sendOtp(cleanPhone);
      router.push({ pathname: "/(auth)/otp", params: { phone: cleanPhone } });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erreur réseau";
      // For dev: even if backend isn't ready, allow proceeding to OTP screen
      router.push({ pathname: "/(auth)/otp", params: { phone: cleanPhone } });
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAwareScrollView
      contentContainerStyle={[
        styles.container,
        { backgroundColor: colors.background, paddingTop: insets.top + 32 },
      ]}
      bottomOffset={24}
      keyboardShouldPersistTaps="handled"
    >
      <View
        style={[
          styles.logoCircle,
          { backgroundColor: colors.primary, borderRadius: colors.radius * 4 },
        ]}
      >
        <Feather name="truck" size={36} color={colors.primaryForeground} />
      </View>

      <Text
        style={[
          styles.title,
          { color: colors.foreground, fontFamily: "Inter_700Bold" },
        ]}
      >
        Jatek Driver
      </Text>
      <Text
        style={[
          styles.subtitle,
          { color: colors.mutedForeground, fontFamily: "Inter_400Regular" },
        ]}
      >
        Connectez-vous avec votre numéro de téléphone
      </Text>

      <View style={styles.form}>
        <Text
          style={[
            styles.label,
            { color: colors.mutedForeground, fontFamily: "Inter_500Medium" },
          ]}
        >
          Numéro de téléphone
        </Text>
        <View
          style={[
            styles.phoneRow,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderRadius: colors.radius,
            },
          ]}
        >
          <Text
            style={[
              styles.dial,
              { color: colors.foreground, fontFamily: "Inter_600SemiBold" },
            ]}
          >
            +212
          </Text>
          <TextInput
            value={phone}
            onChangeText={setPhone}
            placeholder="6 12 34 56 78"
            placeholderTextColor={colors.mutedForeground}
            keyboardType="phone-pad"
            autoFocus
            style={[
              styles.input,
              { color: colors.foreground, fontFamily: "Inter_500Medium" },
            ]}
          />
        </View>

        {error ? (
          <Text style={[styles.error, { color: colors.destructive }]}>
            {error}
          </Text>
        ) : null}

        <Pressable
          onPress={onContinue}
          disabled={!valid || loading}
          style={({ pressed }) => [
            styles.button,
            {
              backgroundColor: valid ? colors.primary : colors.muted,
              borderRadius: colors.radius,
              opacity: pressed ? 0.85 : 1,
            },
          ]}
        >
          {loading ? (
            <ActivityIndicator color={colors.primaryForeground} />
          ) : (
            <Text
              style={[
                styles.buttonText,
                {
                  color: valid ? colors.primaryForeground : colors.mutedForeground,
                  fontFamily: "Inter_600SemiBold",
                },
              ]}
            >
              Continuer
            </Text>
          )}
        </Pressable>

        <Text
          style={[
            styles.legal,
            { color: colors.mutedForeground, fontFamily: "Inter_400Regular" },
          ]}
        >
          En continuant, vous acceptez les conditions d&apos;utilisation chauffeur de
          Jatek.
        </Text>
      </View>
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 32 },
  logoCircle: {
    width: 76,
    height: 76,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  title: { fontSize: 28, marginBottom: 6 },
  subtitle: { fontSize: 15, marginBottom: 32 },
  form: { gap: 12 },
  label: { fontSize: 13, marginBottom: 4, marginLeft: 2 },
  phoneRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    paddingHorizontal: 14,
    height: 56,
  },
  dial: { fontSize: 16, marginRight: 10 },
  input: { flex: 1, fontSize: 17 },
  button: {
    height: 54,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
  },
  buttonText: { fontSize: 16 },
  error: { fontSize: 13, marginTop: 4 },
  legal: { fontSize: 12, textAlign: "center", marginTop: 18, paddingHorizontal: 16 },
});
