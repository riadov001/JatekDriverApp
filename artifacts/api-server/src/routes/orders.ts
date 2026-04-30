import { Router, type IRouter, type RequestHandler } from "express";
import { requireAuth, requireDriver } from "../middlewares/auth";
import { orders, users, type OrderStatus } from "../lib/store";

const router: IRouter = Router();

type IdParams = { id: string };
type IdHandler = RequestHandler<IdParams>;

function driverIdOf(req: { auth?: { sub: string } }): string | null {
  return users.get(req.auth!.sub)?.driver?.id ?? null;
}

router.get("/orders/available", requireAuth, requireDriver, (_req, res) => {
  const list = [...orders.values()]
    .filter((o) => o.status === "pending" && !o.driverId)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  res.json(list);
});

router.get("/orders/mine", requireAuth, requireDriver, (req, res) => {
  const did = driverIdOf(req);
  if (!did) {
    res.json([]);
    return;
  }
  const list = [...orders.values()]
    .filter((o) => o.driverId === did)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  res.json(list);
});

const getOrderById: IdHandler = (req, res) => {
  const o = orders.get(req.params.id);
  if (!o) {
    res.status(404).json({ message: "Course introuvable" });
    return;
  }
  const did = driverIdOf(req);
  if (o.driverId && o.driverId !== did) {
    res.status(403).json({ message: "Course assignée à un autre chauffeur" });
    return;
  }
  res.json(o);
};
router.get("/orders/:id", requireAuth, requireDriver, getOrderById);

function transition(
  req: {
    params: { id: string };
    auth?: { sub: string };
    body?: Record<string, unknown>;
  },
  res: import("express").Response,
  from: OrderStatus[],
  to: OrderStatus,
  extra?: (o: ReturnType<typeof orders.get>) => void,
): void {
  const o = orders.get(req.params.id);
  if (!o) {
    res.status(404).json({ message: "Course introuvable" });
    return;
  }
  const did = driverIdOf(req);
  if (!did) {
    res.status(403).json({ message: "Profil chauffeur incomplet" });
    return;
  }
  if (to === "accepted") {
    if (o.driverId && o.driverId !== did) {
      res.status(409).json({ message: "Déjà prise par un autre chauffeur" });
      return;
    }
  } else if (o.driverId !== did) {
    res.status(403).json({ message: "Cette course n'est pas la vôtre" });
    return;
  }
  if (!from.includes(o.status)) {
    res.status(409).json({ message: `Transition invalide depuis ${o.status}` });
    return;
  }
  o.status = to;
  if (to === "accepted") {
    o.driverId = did;
    o.acceptedAt = Date.now();
  }
  if (extra) extra(o);
  res.json(o);
}

const acceptOrder: IdHandler = (req, res) => {
  transition(req, res, ["pending", "assigned"], "accepted");
};
router.post("/orders/:id/accept", requireAuth, requireDriver, acceptOrder);

const arrivedPickup: IdHandler = (req, res) => {
  transition(req, res, ["accepted"], "arrived_pickup");
};
router.post(
  "/orders/:id/arrived-pickup",
  requireAuth,
  requireDriver,
  arrivedPickup,
);

const pickedUp: IdHandler = (req, res) => {
  transition(req, res, ["accepted", "arrived_pickup"], "picked_up");
};
router.post("/orders/:id/picked-up", requireAuth, requireDriver, pickedUp);

const arrivedDropoff: IdHandler = (req, res) => {
  transition(req, res, ["picked_up"], "arrived_dropoff");
};
router.post(
  "/orders/:id/arrived-dropoff",
  requireAuth,
  requireDriver,
  arrivedDropoff,
);

const deliveredHandler: IdHandler = (req, res) => {
  const o = orders.get(req.params.id);
  if (o) {
    const provided = (req.body as { deliveryCode?: string } | undefined)
      ?.deliveryCode;
    if (!provided || provided !== o.deliveryCode) {
      res.status(400).json({ message: "Code de livraison incorrect" });
      return;
    }
  }
  transition(
    req,
    res,
    ["picked_up", "arrived_dropoff"],
    "delivered",
    (oo) => {
      if (oo) oo.deliveredAt = Date.now();
    },
  );
};
router.post("/orders/:id/delivered", requireAuth, requireDriver, deliveredHandler);

const cancelOrder: IdHandler = (req, res) => {
  transition(req, res, ["accepted", "arrived_pickup"], "cancelled");
};
router.post("/orders/:id/cancel", requireAuth, requireDriver, cancelOrder);

const trackingHandler: IdHandler = (req, res) => {
  const o = orders.get(req.params.id);
  if (!o) {
    res.status(404).json({ message: "Course introuvable" });
    return;
  }
  if (!o.driverId) {
    res.json({ available: false });
    return;
  }
  const driver = [...users.values()].find(
    (u) => u.driver?.id === o.driverId,
  )?.driver;
  if (!driver?.lastLat || !driver?.lastLng) {
    res.json({ available: false });
    return;
  }
  res.json({
    available: true,
    latitude: driver.lastLat,
    longitude: driver.lastLng,
    heading: null,
    updatedAt: driver.lastLocationAt ?? null,
    orderStatus: o.status,
    pickupLat: o.pickupLat,
    pickupLng: o.pickupLng,
    dropoffLat: o.dropoffLat,
    dropoffLng: o.dropoffLng,
  });
};
router.get("/orders/:id/tracking", requireAuth, trackingHandler);

export default router;
