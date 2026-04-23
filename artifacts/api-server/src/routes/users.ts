import { Router, type IRouter } from "express";
import { requireAuth } from "../middlewares/auth";
import { users } from "../lib/store";

const router: IRouter = Router();

router.get("/users/me", requireAuth, (req, res) => {
  const user = users.get(req.auth!.sub);
  if (!user) {
    res.status(404).json({ message: "Not found" });
    return;
  }
  res.json(user);
});

export default router;
