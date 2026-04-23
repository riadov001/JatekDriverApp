import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
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
import { loginWithCredentials, sendOtp } from "@/lib/api";
import {
  ApiTarget,
  getApiTarget,
  setApiTarget,
} from "@/lib/apiTarget";

export default function LoginScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [target, setTarget] = useState<ApiTarget>("local");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getApiTarget().then(setTarget);
  }, []);

  const cleanPhone = phone.replace(/\s+/g, "");
  const localValid = cleanPhone.length >= 9;
  const prodValid = email.includes("@") && password.length >= 4;
  const valid = target === "prod" ? prodValid : localValid;

  const onChangeTarget = async (next: ApiTarget) => {
    setError(null);
    setTarget(next);
    await setApiTarget(next);
  };

  const onContinue = async () => {
    if (!valid || loading) return;
    setLoading(true);
    setError(null);
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    try {
      if (target === "prod") {
        await loginWithCredentials(email.trim(), password);
        router.replace("/");
      } else {
        await sendOtp(cleanPhone);
        router.push({
          pathname: "/(auth)/otp",
          params: { phone: cleanPhone },
        });
      }
    } catch (e) {
      const msg =
        e && typeof e === "object" && "message" in e
          ? String((e as { message: unknown }).message)
          : "Erreur réseau";
      if (target === "local") {
        // Dev shortcut: even if backend isn't ready, allow proceeding to OTP
        router.push({
          pathname: "/(auth)/otp",
          params: { phone: cleanPhone },
        });
      }
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
        {target === "prod"
          ? "Connectez-vous avec votre email et mot de passe"
          : "Connectez-vous avec votre numéro de téléphone"}
      </Text>

      <View
        style={[
          styles.targetSwitch,
          { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius },
        ]}
      >
        {(["local", "prod"] as const).map((t) => {
          const active = target === t;
          return (
            <Pressable
              key={t}
              onPress={() => onChangeTarget(t)}
              style={[
                styles.targetBtn,
                {
                  backgroundColor: active ? colors.primary : "transparent",
                  borderRadius: colors.radius - 2,
                },
              ]}
            >
              <Text
                style={{
                  color: active ? colors.primaryForeground : colors.mutedForeground,
                  fontFamily: "Inter_600SemiBold",
                  fontSize: 13,
                }}
              >
                {t === "local" ? "Démo (OTP)" : "Production"}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.form}>
        {target === "prod" ? (
          <>
            <Text style={[styles.label, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>Email</Text>
            <View style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="vous@jatek.app"
                placeholderTextColor={colors.mutedForeground}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                style={[styles.input, { color: colors.foreground, fontFamily: "Inter_500Medium" }]}
              />
            </View>
            <Text style={[styles.label, { color: colors.mutedForeground, fontFamily: "Inter_500Medium", marginTop: 8 }]}>Mot de passe</Text>
            <View style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor={colors.mutedForeground}
                secureTextEntry
                style={[styles.input, { color: colors.foreground, fontFamily: "Inter_500Medium" }]}
              />
            </View>
          </>
        ) : (
          <>
            <Text style={[styles.label, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>Numéro de téléphone</Text>
            <View style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
              <Text style={[styles.dial, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>+212</Text>
              <TextInput
                value={phone}
                onChangeText={setPhone}
                placeholder="6 12 34 56 78"
                placeholderTextColor={colors.mutedForeground}
                keyboardType="phone-pad"
                autoFocus
                style={[styles.input, { color: colors.foreground, fontFamily: "Inter_500Medium" }]}
              />
            </View>
          </>
        )}

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
              {target === "prod" ? "Se connecter" : "Continuer"}
            </Text>
          )}
        </Pressable>

        <Text style={[styles.legal, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
          {target === "prod"
            ? "Backend connecté : backend.jatek.app"
            : "Mode démo : backend local en mémoire (code 000000)"}
        </Text>
      </View>
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 32 },
  logoCircle: { width: 76, height: 76, alignItems: "center", justifyContent: "center", marginBottom: 24 },
  title: { fontSize: 28, marginBottom: 6 },
  subtitle: { fontSize: 15, marginBottom: 20 },
  targetSwitch: {
    flexDirection: "row",
    padding: 4,
    borderWidth: 1,
    marginBottom: 20,
    gap: 4,
  },
  targetBtn: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 10 },
  form: { gap: 12 },
  label: { fontSize: 13, marginBottom: 4, marginLeft: 2 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    paddingHorizontal: 14,
    height: 56,
  },
  dial: { fontSize: 16, marginRight: 10 },
  input: { flex: 1, fontSize: 17 },
  button: { height: 54, alignItems: "center", justifyContent: "center", marginTop: 12 },
  buttonText: { fontSize: 16 },
  error: { fontSize: 13, marginTop: 4 },
  legal: { fontSize: 12, textAlign: "center", marginTop: 18, paddingHorizontal: 16 },
});
