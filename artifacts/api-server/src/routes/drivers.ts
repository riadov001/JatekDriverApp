import { Router, type IRouter } from "express";
import { requireAuth, requireDriver } from "../middlewares/auth";
import {
  users,
  orders,
  id,
  promotionsFor,
  type DriverProfile,
  type VehicleType,
} from "../lib/store";

const router: IRouter = Router();

const VEHICLES: VehicleType[] = ["scooter", "moto", "voiture", "velo"];

router.post(
  "/drivers/me/onboarding",
  requireAuth,
  requireDriver,
  (req, res) => {
    const user = users.get(req.auth!.sub)!;
    const {
      fullName,
      vehicleType,
      vehiclePlate,
      cin,
      licenseNumber,
      photoUrl,
    } = req.body ?? {};
    if (
      !fullName ||
      !vehicleType ||
      !vehiclePlate ||
      !cin ||
      !licenseNumber ||
      !VEHICLES.includes(vehicleType)
    ) {
      res.status(400).json({ message: "Champs manquants" });
      return;
    }
    const profile: DriverProfile = {
      id: user.driver?.id ?? id("d_"),
      fullName,
      vehicleType,
      vehiclePlate,
      cin,
      licenseNumber,
      photoUrl: photoUrl ?? null,
      // Auto-approve in dev so drivers can start immediately.
      status: "approved",
      isOnline: user.driver?.isOnline ?? false,
      rating: user.driver?.rating ?? 5.0,
      lastLat: user.driver?.lastLat ?? null,
      lastLng: user.driver?.lastLng ?? null,
      lastLocationAt: user.driver?.lastLocationAt ?? null,
    };
    user.driver = profile;
    user.fullName = fullName;
    res.json(profile);
  },
);

router.patch(
  "/drivers/me/status",
  requireAuth,
  requireDriver,
  (req, res) => {
    const user = users.get(req.auth!.sub)!;
    if (!user.driver) {
      res.status(400).json({ message: "Profil chauffeur incomplet" });
      return;
    }
    const isOnline = !!req.body?.isOnline;
    user.driver.isOnline = isOnline;
    res.json({ isOnline });
  },
);

router.patch(
  "/drivers/me/location",
  requireAuth,
  requireDriver,
  (req, res) => {
    const user = users.get(req.auth!.sub)!;
    if (!user.driver) {
      res.status(400).json({ message: "Profil chauffeur incomplet" });
      return;
    }
    const { latitude, longitude } = req.body ?? {};
    if (typeof latitude !== "number" || typeof longitude !== "number") {
      res.status(400).json({ message: "Coordonnées invalides" });
      return;
    }
    user.driver.lastLat = latitude;
    user.driver.lastLng = longitude;
    user.driver.lastLocationAt = Date.now();
    res.json({ ok: true });
  },
);

router.get(
  "/drivers/me/earnings",
  requireAuth,
  requireDriver,
  (req, res) => {
    const driverId = users.get(req.auth!.sub)?.driver?.id;
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    let todayMad = 0,
      weekMad = 0,
      monthMad = 0,
      todayDeliveries = 0,
      weekDeliveries = 0,
      todayTipsMad = 0,
      weekTipsMad = 0;
    for (const o of orders.values()) {
      if (o.status !== "delivered" || !o.deliveredAt) continue;
      if (o.driverId !== driverId) continue;
      const total = o.driverEarningsMad + (o.tipMad ?? 0);
      const age = now - o.deliveredAt;
      if (age < dayMs) {
        todayMad += total;
        todayTipsMad += o.tipMad ?? 0;
        todayDeliveries++;
      }
      if (age < 7 * dayMs) {
        weekMad += total;
        weekTipsMad += o.tipMad ?? 0;
        weekDeliveries++;
      }
      if (age < 30 * dayMs) {
        monthMad += total;
      }
    }
    res.json({
      todayMad,
      weekMad,
      monthMad,
      todayDeliveries,
      weekDeliveries,
      todayTipsMad,
      weekTipsMad,
    });
  },
);

router.get(
  "/drivers/me/promotions",
  requireAuth,
  requireDriver,
  (req, res) => {
    const driverId = users.get(req.auth!.sub)?.driver?.id;
    res.json(promotionsFor(driverId));
  },
);

export default router;
