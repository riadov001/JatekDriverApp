import * as Notifications from "expo-notifications";
import { useEffect, useRef } from "react";
import { Platform } from "react-native";

import type { OrderStatus } from "@/lib/api";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

type StepMessage = {
  title: string;
  body: string;
};

const STEP_MESSAGES: Partial<Record<OrderStatus, StepMessage>> = {
  accepted: {
    title: "🏍️ Chauffeur en route",
    body: "Votre livreur se dirige vers le restaurant.",
  },
  arrived_pickup: {
    title: "🏪 Arrivé au restaurant",
    body: "Le livreur récupère votre commande.",
  },
  picked_up: {
    title: "📦 Commande récupérée",
    body: "Votre livreur est en route vers vous !",
  },
  arrived_dropoff: {
    title: "📍 Livreur à votre porte",
    body: "Votre livreur est arrivé. Préparez le code de livraison.",
  },
  delivered: {
    title: "✅ Livraison confirmée",
    body: "Votre commande a été livrée. Bon appétit !",
  },
  cancelled: {
    title: "❌ Course annulée",
    body: "La course a été annulée.",
  },
};

async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === "web") return false;
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === "granted") return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

async function sendLocalNotification(status: OrderStatus): Promise<void> {
  const msg = STEP_MESSAGES[status];
  if (!msg) return;
  await Notifications.scheduleNotificationAsync({
    content: {
      title: msg.title,
      body: msg.body,
      sound: true,
      color: "#E91E8C",
    },
    trigger: null,
  });
}

export function useOrderNotifications(status: OrderStatus | undefined) {
  const prevStatus = useRef<OrderStatus | undefined>(undefined);
  const permGranted = useRef(false);

  useEffect(() => {
    if (Platform.OS === "web") return;
    requestNotificationPermissions().then((granted) => {
      permGranted.current = granted;
    });
  }, []);

  useEffect(() => {
    if (!status) return;
    if (prevStatus.current === status) return;

    const wasInitialLoad = prevStatus.current === undefined;
    prevStatus.current = status;

    if (wasInitialLoad) return;

    if (permGranted.current) {
      sendLocalNotification(status).catch(console.warn);
    }
  }, [status]);
}
