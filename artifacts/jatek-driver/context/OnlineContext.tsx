import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Alert } from "react-native";

import { setDriverOnline } from "@/lib/api";
import {
  isLocationTrackingActive,
  requestLocationPermissions,
  startLocationTracking,
  stopLocationTracking,
} from "@/services/locationService";

import { useAuth } from "./AuthContext";

type OnlineState = {
  isOnline: boolean;
  toggling: boolean;
  toggleOnline: () => Promise<void>;
};

const Ctx = createContext<OnlineState | undefined>(undefined);

export function OnlineProvider({ children }: { children: React.ReactNode }) {
  const { user, refresh } = useAuth();
  const [isOnline, setIsOnline] = useState(false);
  const [toggling, setToggling] = useState(false);

  // Sync from server state when user loads
  useEffect(() => {
    if (user?.driver) {
      setIsOnline(!!user.driver.isOnline);
    }
  }, [user?.driver]);

  // On mount, sync local state from running task
  useEffect(() => {
    (async () => {
      const active = await isLocationTrackingActive();
      if (active) setIsOnline(true);
    })();
  }, []);

  const toggleOnline = useCallback(async () => {
    if (toggling) return;
    setToggling(true);
    try {
      if (!isOnline) {
        const perm = await requestLocationPermissions();
        if (!perm.granted) {
          Alert.alert("Permission requise", perm.message ?? "Localisation refusée.");
          return;
        }
        if (!perm.background && perm.message) {
          Alert.alert("Conseil", perm.message);
        }
        await startLocationTracking();
        try {
          await setDriverOnline(true);
        } catch {
          // server may be unavailable; tracking is the source of truth locally
        }
        setIsOnline(true);
      } else {
        await stopLocationTracking();
        try {
          await setDriverOnline(false);
        } catch {}
        setIsOnline(false);
      }
      refresh();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erreur inconnue";
      Alert.alert("Erreur", msg);
    } finally {
      setToggling(false);
    }
  }, [isOnline, toggling, refresh]);

  const value = useMemo(
    () => ({ isOnline, toggling, toggleOnline }),
    [isOnline, toggling, toggleOnline],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useOnline(): OnlineState {
  const c = useContext(Ctx);
  if (!c) throw new Error("useOnline must be used within OnlineProvider");
  return c;
}
