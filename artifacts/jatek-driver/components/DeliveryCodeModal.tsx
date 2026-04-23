import { Feather } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { useColors } from "@/hooks/useColors";

export function DeliveryCodeModal({
  visible,
  loading,
  error,
  onClose,
  onSubmit,
}: {
  visible: boolean;
  loading: boolean;
  error?: string | null;
  onClose: () => void;
  onSubmit: (code: string) => void;
}) {
  const colors = useColors();
  const [code, setCode] = useState("");
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (visible) {
      setCode("");
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: colors.card,
              borderRadius: colors.radius * 1.4,
            },
          ]}
        >
          <View
            style={[
              styles.iconWrap,
              { backgroundColor: colors.muted, borderRadius: 28 },
            ]}
          >
            <Feather name="shield" size={22} color={colors.primary} />
          </View>
          <Text
            style={[
              styles.title,
              { color: colors.foreground, fontFamily: "Inter_700Bold" },
            ]}
          >
            Code de livraison
          </Text>
          <Text
            style={[
              styles.subtitle,
              {
                color: colors.mutedForeground,
                fontFamily: "Inter_400Regular",
              },
            ]}
          >
            Demandez les 4 chiffres au client pour confirmer la remise.
          </Text>

          <TextInput
            ref={inputRef}
            value={code}
            onChangeText={(t) => setCode(t.replace(/\D/g, "").slice(0, 4))}
            keyboardType="number-pad"
            maxLength={4}
            placeholder="0000"
            placeholderTextColor={colors.mutedForeground}
            style={[
              styles.input,
              {
                color: colors.foreground,
                backgroundColor: colors.muted,
                borderRadius: colors.radius,
                fontFamily: "Inter_700Bold",
              },
            ]}
          />

          {error ? (
            <Text
              style={{
                color: colors.destructive,
                fontFamily: "Inter_500Medium",
                fontSize: 13,
                textAlign: "center",
                marginTop: 8,
              }}
            >
              {error}
            </Text>
          ) : null}

          <View style={styles.row}>
            <Pressable
              onPress={onClose}
              disabled={loading}
              style={({ pressed }) => [
                styles.cancel,
                {
                  borderColor: colors.border,
                  borderRadius: colors.radius,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
            >
              <Text
                style={{
                  color: colors.mutedForeground,
                  fontFamily: "Inter_600SemiBold",
                }}
              >
                Annuler
              </Text>
            </Pressable>
            <Pressable
              onPress={() => onSubmit(code)}
              disabled={loading || code.length !== 4}
              style={({ pressed }) => [
                styles.confirm,
                {
                  backgroundColor:
                    code.length === 4 ? colors.primary : colors.muted,
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
                    color:
                      code.length === 4
                        ? colors.primaryForeground
                        : colors.mutedForeground,
                    fontFamily: "Inter_700Bold",
                  }}
                >
                  Confirmer
                </Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  sheet: {
    width: "100%",
    maxWidth: 380,
    padding: 22,
    alignItems: "center",
  },
  iconWrap: {
    width: 56,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  title: { fontSize: 18, marginBottom: 6 },
  subtitle: { fontSize: 13, textAlign: "center", marginBottom: 18 },
  input: {
    width: "100%",
    height: 64,
    fontSize: 30,
    letterSpacing: 12,
    textAlign: "center",
    paddingHorizontal: 16,
  },
  row: { flexDirection: "row", gap: 10, marginTop: 18, alignSelf: "stretch" },
  cancel: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  confirm: {
    flex: 2,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
});
