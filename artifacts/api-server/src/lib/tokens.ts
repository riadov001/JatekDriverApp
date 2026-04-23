import crypto from "node:crypto";

const SECRET = process.env.SESSION_SECRET || "dev-secret-change-me";

function b64url(buf: Buffer): string {
  return buf
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function fromB64url(s: string): Buffer {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  return Buffer.from(s.replace(/-/g, "+").replace(/_/g, "/") + pad, "base64");
}

export type TokenPayload = { sub: string; role: "client" | "driver" | "admin"; iat: number };

export function signToken(payload: Omit<TokenPayload, "iat">): string {
  const full: TokenPayload = { ...payload, iat: Date.now() };
  const body = b64url(Buffer.from(JSON.stringify(full)));
  const sig = b64url(
    crypto.createHmac("sha256", SECRET).update(body).digest(),
  );
  return `${body}.${sig}`;
}

export function verifyToken(token: string): TokenPayload | null {
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = b64url(
    crypto.createHmac("sha256", SECRET).update(body).digest(),
  );
  if (
    expected.length !== sig.length ||
    !crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sig))
  ) {
    return null;
  }
  try {
    return JSON.parse(fromB64url(body).toString("utf8")) as TokenPayload;
  } catch {
    return null;
  }
}
