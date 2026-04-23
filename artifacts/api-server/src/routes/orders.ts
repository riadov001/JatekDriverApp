import { Router, type IRouter } from "express";
import { requireAuth, requireDriver } from "../middlewares/auth";
import { orders, users, type OrderStatus } from "../lib/store";

const router: IRouter = Router();

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

router.get("/orders/:id", requireAuth, requireDriver, (req, res) => {
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
});

function transition(
  req: { params: { id: string }; auth?: { sub: string } },
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
  if (to === "accepted") o.driverId = did;
  if (extra) extra(o);
  res.json(o);
}

router.post("/orders/:id/accept", requireAuth, requireDriver, (req, res) => {
  transition(req, res, ["pending", "assigned"], "accepted");
});

router.post("/orders/:id/picked-up", requireAuth, requireDriver, (req, res) => {
  transition(req, res, ["accepted"], "picked_up");
});

router.post("/orders/:id/delivered", requireAuth, requireDriver, (req, res) => {
  transition(req, res, ["picked_up"], "delivered", (o) => {
    if (o) o.deliveredAt = Date.now();
  });
});

export default router;
