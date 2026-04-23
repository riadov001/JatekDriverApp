import type { Request, Response, NextFunction } from "express";
import { verifyToken, type TokenPayload } from "../lib/tokens";
import { users } from "../lib/store";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      auth?: TokenPayload;
    }
  }
}

export function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ message: "Missing token" });
    return;
  }
  const payload = verifyToken(header.slice(7));
  if (!payload) {
    res.status(401).json({ message: "Invalid token" });
    return;
  }
  if (!users.has(payload.sub)) {
    res.status(401).json({ message: "User not found" });
    return;
  }
  req.auth = payload;
  next();
}

export function requireDriver(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (req.auth?.role !== "driver") {
    res.status(403).json({ message: "Driver only" });
    return;
  }
  next();
}
