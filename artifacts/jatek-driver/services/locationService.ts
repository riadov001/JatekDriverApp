import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";
import { Platform } from "react-native";

import { updateDriverLocation } from "@/lib/api";
import { getDriverLocationClient } from "./wsClient";

export const LOCATION_TASK = "jatek-driver-location-task";

// In-memory ref to the current active order id, updated by ActiveOrderContext.
// Exposed via setters because TaskManager callbacks live outside React.
let activeOrderId: string | null = null;

export function setActiveOrderForTracking(orderId: string | null): void {
  activeOrderId = orderId;
  console.log(`[location] active order set → ${orderId ?? "none"}`);
}

export function getActiveOrderForTracking(): string | null {
  return activeOrderId;
}

function sendLocation(loc: Location.LocationObject): void {
  const ws = getDriverLocationClient();
  const payload = {
    type: "location" as const,
    orderId: activeOrderId,
    latitude: loc.coords.latitude,
    longitude: loc.coords.longitude,
    heading: loc.coords.heading ?? null,
    speed: loc.coords.speed ?? null,
    accuracy: loc.coords.accuracy ?? null,
    timestamp: loc.timestamp ?? Date.now(),
  };
  const sent = ws.send(payload);
  console.log(
    `[location] tx lat=${payload.latitude.toFixed(5)} lng=${payload.longitude.toFixed(5)} order=${activeOrderId ?? "-"} ${sent ? "OK" : "QUEUED"}`,
  );
  // Best-effort REST fallback so the server's last-known position stays fresh
  // even if the WS server is unavailable. Fire-and-forget.
  updateDriverLocation({
    latitude: payload.latitude,
    longitude: payload.longitude,
    heading: payload.heading,
    speed: payload.speed,
  }).catch(() => {
    /* swallow — WS is the primary channel */
  });
}

// IMPORTANT: TaskManager.defineTask MUST be called at the top level of the
// module so it's registered before the OS triggers background callbacks.
TaskManager.defineTask(LOCATION_TASK, async ({ data, error }) => {
  if (error) {
    console.warn("[locationTask] error", error);
    return;
  }
  if (!data) return;
  const { locations } = data as { locations: Location.LocationObject[] };
  const last = locations?.[locations.length - 1];
  if (!last) return;
  try {
    sendLocation(last);
  } catch (e) {
    console.warn("[locationTask] dispatch failed", e);
  }
});

export type LocationPermissionResult = {
  granted: boolean;
  background: boolean;
  message?: string;
};

export async function requestLocationPermissions(): Promise<LocationPermissionResult> {
  const fg = await Location.requestForegroundPermissionsAsync();
  if (fg.status !== "granted") {
    return {
      granted: false,
      background: false,
      message: "Permission de localisation refusée.",
    };
  }
  if (Platform.OS === "web") {
    return { granted: true, background: false };
  }
  const bg = await Location.requestBackgroundPermissionsAsync();
  return {
    granted: true,
    background: bg.status === "granted",
    message:
      bg.status === "granted"
        ? undefined
        : "La localisation \"Toujours\" est requise pour poursuivre les courses en arrière-plan.",
  };
}

/**
 * Strict check used before activating tracking for a course.
 * Background ("Always") permission is mandatory on native.
 */
export async function ensureAlwaysLocationPermission(): Promise<LocationPermissionResult> {
  const fg = await Location.getForegroundPermissionsAsync();
  if (fg.status !== "granted") {
    const re = await Location.requestForegroundPermissionsAsync();
    if (re.status !== "granted") {
      return {
        granted: false,
        background: false,
        message:
          "Permission de localisation refusée. Activez-la pour accepter une course.",
      };
    }
  }
  if (Platform.OS === "web") return { granted: true, background: false };
  const bg = await Location.getBackgroundPermissionsAsync();
  if (bg.status !== "granted") {
    const reBg = await Location.requestBackgroundPermissionsAsync();
    if (reBg.status !== "granted") {
      return {
        granted: true,
        background: false,
        message:
          "Permission \"Toujours\" requise. Activez-la dans les Réglages pour suivre la course en arrière-plan.",
      };
    }
  }
  return { granted: true, background: true };
}

export async function isLocationTrackingActive(): Promise<boolean> {
  if (Platform.OS === "web") return false;
  try {
    return await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK);
  } catch {
    return false;
  }
}

// ─────────────────────────── Foreground watcher ───────────────────────────
//
// Background Location.startLocationUpdatesAsync schedules updates at OS
// discretion (often deferred). For the strict 3-5s cadence required during
// an active order, we *also* run a foreground high-precision watcher while
// the app is open.

let foregroundSub: Location.LocationSubscription | null = null;

async function startForegroundWatcher(): Promise<void> {
  if (foregroundSub) return;
  if (Platform.OS === "web") {
    if (typeof navigator === "undefined" || !navigator.geolocation) return;
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        sendLocation({
          coords: {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            altitude: pos.coords.altitude ?? null,
            accuracy: pos.coords.accuracy ?? null,
            altitudeAccuracy: pos.coords.altitudeAccuracy ?? null,
            heading: pos.coords.heading ?? null,
            speed: pos.coords.speed ?? null,
          },
          timestamp: pos.timestamp,
        } as unknown as Location.LocationObject);
      },
      (err) => console.warn("[location:web] watch error", err),
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 10000 },
    );
    foregroundSub = {
      remove: () => navigator.geolocation.clearWatch(watchId),
    } as Location.LocationSubscription;
    return;
  }
  foregroundSub = await Location.watchPositionAsync(
    {
      accuracy: Location.Accuracy.BestForNavigation,
      timeInterval: 4000,
      distanceInterval: 5,
      mayShowUserSettingsDialog: true,
    },
    (loc) => sendLocation(loc),
  );
}

function stopForegroundWatcher(): void {
  if (foregroundSub) {
    foregroundSub.remove();
    foregroundSub = null;
  }
}

// ─────────────────────────── Public API ───────────────────────────

/**
 * Idle "online" tracking — driver is available but no order yet.
 * Lower cadence to save battery.
 */
export async function startOnlineTracking(): Promise<void> {
  await startForegroundWatcher();
  if (Platform.OS === "web") return;
  const active = await isLocationTrackingActive();
  if (active) return;
  await Location.startLocationUpdatesAsync(LOCATION_TASK, {
    accuracy: Location.Accuracy.High,
    timeInterval: 15_000,
    distanceInterval: 25,
    showsBackgroundLocationIndicator: true,
    pausesUpdatesAutomatically: false,
    foregroundService: {
      notificationTitle: "Jatek Driver — En ligne",
      notificationBody: "Partage de position activé.",
      notificationColor: "#E91E8C",
    },
    activityType: Location.ActivityType.AutomotiveNavigation,
  });
}

/**
 * High-precision tracking enforced while a course is active.
 * Updates every 3-5s with Best accuracy. Cannot be turned off until the
 * course is closed (delivered/cancelled).
 */
export async function startActiveOrderTracking(orderId: string): Promise<void> {
  setActiveOrderForTracking(orderId);
  // Ensure the WS connection is alive
  getDriverLocationClient().connect().catch(() => {
    /* the client schedules its own reconnects */
  });
  await startForegroundWatcher();
  if (Platform.OS === "web") return;

  const active = await isLocationTrackingActive();
  if (active) {
    // Restart with tighter parameters
    await Location.stopLocationUpdatesAsync(LOCATION_TASK).catch(() => {});
  }
  await Location.startLocationUpdatesAsync(LOCATION_TASK, {
    accuracy: Location.Accuracy.BestForNavigation,
    timeInterval: 4_000,
    distanceInterval: 5,
    showsBackgroundLocationIndicator: true,
    pausesUpdatesAutomatically: false,
    foregroundService: {
      notificationTitle: "Jatek Driver — Course en cours",
      notificationBody:
        "Suivi GPS haute précision actif. Ne pas fermer l'application.",
      notificationColor: "#E91E8C",
    },
    activityType: Location.ActivityType.AutomotiveNavigation,
  });
}

export async function stopLocationTracking(force = false): Promise<void> {
  if (!force && activeOrderId) {
    console.warn(
      "[location] refusing to stop — order is active",
      activeOrderId,
    );
    return;
  }
  stopForegroundWatcher();
  if (Platform.OS === "web") return;
  const active = await isLocationTrackingActive();
  if (!active) return;
  await Location.stopLocationUpdatesAsync(LOCATION_TASK);
}
