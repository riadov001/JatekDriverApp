import * as Haptics from "expo-haptics";
import { useEffect, useRef } from "react";
import { Platform } from "react-native";

import type { Order } from "@/lib/api";
import {
  requestNotificationPermissions,
  sendNewOrderNotification,
} from "@/hooks/useOrderNotifications";

const HAPTIC_INTERVAL_MS = 1400;

async function triggerAlertHaptic() {
  if (Platform.OS === "web") return;
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  } catch {
    // silently degrade if haptics unavailable
  }
}

async function triggerPulseHaptic() {
  if (Platform.OS === "web") return;
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  } catch {
    // silently degrade
  }
}

export function useNewOrderAlert(order: Order | null, visible: boolean) {
  const permChecked = useRef(false);
  const notifiedIds = useRef<Set<string>>(new Set());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!permChecked.current) {
      requestNotificationPermissions().catch(console.warn);
      permChecked.current = true;
    }
  }, []);

  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (!visible || !order) return;

    if (!notifiedIds.current.has(order.id)) {
      notifiedIds.current.add(order.id);
      sendNewOrderNotification(order).catch(console.warn);
    }

    triggerAlertHaptic();

    intervalRef.current = setInterval(() => {
      triggerPulseHaptic();
    }, HAPTIC_INTERVAL_MS);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [visible, order]);
}
