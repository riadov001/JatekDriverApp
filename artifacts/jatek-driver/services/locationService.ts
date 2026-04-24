import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";
import { Platform } from "react-native";

import { updateDriverLocation } from "@/lib/api";

export const LOCATION_TASK = "jatek-driver-location-task";

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
    await updateDriverLocation({
      latitude: last.coords.latitude,
      longitude: last.coords.longitude,
      heading: last.coords.heading ?? null,
      speed: last.coords.speed ?? null,
    });
  } catch (e) {
    console.warn("[locationTask] PATCH failed", e);
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
        : "La localisation en arrière-plan est recommandée pour rester en ligne pendant les courses.",
  };
}

export async function isLocationTrackingActive(): Promise<boolean> {
  if (Platform.OS === "web") return false;
  try {
    return await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK);
  } catch {
    return false;
  }
}

export async function startLocationTracking(): Promise<void> {
  if (Platform.OS === "web") {
    // Best effort foreground tracking on web via geolocation API
    return;
  }
  const active = await isLocationTrackingActive();
  if (active) return;

  await Location.startLocationUpdatesAsync(LOCATION_TASK, {
    accuracy: Location.Accuracy.High,
    timeInterval: 15000,
    distanceInterval: 25,
    showsBackgroundLocationIndicator: true,
    pausesUpdatesAutomatically: false,
    foregroundService: {
      notificationTitle: "Jatek Driver",
      notificationBody: "Vous êtes en ligne — partage de position activé.",
      notificationColor: "#E91E8C",
    },
    activityType: Location.ActivityType.AutomotiveNavigation,
    deferredUpdatesInterval: 15000,
  });
}

export async function stopLocationTracking(): Promise<void> {
  if (Platform.OS === "web") return;
  const active = await isLocationTrackingActive();
  if (!active) return;
  await Location.stopLocationUpdatesAsync(LOCATION_TASK);
}
