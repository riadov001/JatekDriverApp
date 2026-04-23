import { Router, type IRouter } from "express";
import {
  users,
  usersByPhone,
  otps,
  id,
  code6,
  type Role,
} from "../lib/store";
import { signToken } from "../lib/tokens";

const router: IRouter = Router();

router.post("/auth/send-otp", (req, res) => {
  const { phone } = req.body ?? {};
  if (!phone || typeof phone !== "string") {
    res.status(400).json({ message: "Phone required" });
    return;
  }
  const c = code6();
  otps.set(phone, { code: c, expiresAt: Date.now() + 5 * 60 * 1000 });
  // In production, send via SMS gateway. Returned for development only.
  res.json({ ok: true, debugCode: c });
});

router.post("/auth/verify-otp", (req, res) => {
  const { phone, code, role } = req.body ?? {};
  if (!phone || !code) {
    res.status(400).json({ message: "Phone and code required" });
    return;
  }
  const entry = otps.get(phone);
  // Dev shortcut: 000000 always works.
  const ok =
    code === "000000" ||
    (entry && entry.code === code && entry.expiresAt > Date.now());
  if (!ok) {
    res.status(401).json({ message: "Code invalide" });
    return;
  }
  otps.delete(phone);

  let userId = usersByPhone.get(phone);
  let isNewUser = false;
  if (!userId) {
    userId = id("u_");
    const userRole: Role = role === "driver" ? "driver" : "client";
    users.set(userId, {
      id: userId,
      phone,
      role: userRole,
      fullName: null,
      driver: null,
    });
    usersByPhone.set(phone, userId);
    isNewUser = true;
  }
  const user = users.get(userId)!;

  // If signing in as driver but the existing user is a client without a
  // driver profile, upgrade their role so they can complete onboarding.
  if (role === "driver" && user.role !== "driver" && !user.driver) {
    user.role = "driver";
  }

  const token = signToken({ sub: user.id, role: user.role });
  res.json({ token, isNewUser: isNewUser || !user.driver });
});

export default router;
