import type { Server as HttpServer, IncomingMessage } from "node:http";
import { WebSocketServer, WebSocket } from "ws";
import { verifyToken, type TokenPayload } from "./tokens";
import { users, orders } from "./store";
import { logger } from "./logger";

type Channel = "driver-location" | "order-tracking";

type AuthedSocket = WebSocket & {
  auth?: TokenPayload;
  channel?: Channel;
  isAlive?: boolean;
  subscribedOrderIds?: Set<string>;
};

type ClientMessage =
  | { type: "subscribe"; orderId: string }
  | { type: "unsubscribe"; orderId: string }
  | {
      type: "location";
      orderId?: string | null;
      latitude: number;
      longitude: number;
      heading?: number | null;
      speed?: number | null;
      accuracy?: number | null;
      timestamp?: number;
    }
  | { type: "ping"; t?: number };

const channels = new Map<Channel, Set<AuthedSocket>>([
  ["driver-location", new Set()],
  ["order-tracking", new Set()],
]);

function send(ws: WebSocket, payload: unknown): void {
  if (ws.readyState !== WebSocket.OPEN) return;
  try {
    ws.send(JSON.stringify(payload));
  } catch (e) {
    logger.warn({ err: e }, "ws send failed");
  }
}

function broadcastOrderTracking(orderId: string, data: unknown): void {
  const set = channels.get("order-tracking");
  if (!set) return;
  for (const ws of set) {
    if (ws.subscribedOrderIds?.has(orderId)) {
      send(ws, { type: "order-tracking", orderId, data });
    }
  }
}

function parseQuery(url: string | undefined): URLSearchParams {
  try {
    const u = new URL(url ?? "/", "http://internal");
    return u.searchParams;
  } catch {
    return new URLSearchParams();
  }
}

function parseChannel(url: string | undefined): Channel | null {
  try {
    const u = new URL(url ?? "/", "http://internal");
    const parts = u.pathname.split("/").filter(Boolean);
    // expect: /ws/<channel>
    const last = parts[parts.length - 1];
    if (last === "driver-location" || last === "order-tracking") return last;
    return null;
  } catch {
    return null;
  }
}

export function attachWebSocketServer(server: HttpServer): void {
  const wss = new WebSocketServer({ noServer: true });

  server.on("upgrade", (req: IncomingMessage, socket, head) => {
    const url = req.url ?? "/";
    if (!url.startsWith("/ws/")) {
      socket.destroy();
      return;
    }
    const channel = parseChannel(url);
    if (!channel) {
      socket.destroy();
      return;
    }
    const params = parseQuery(url);
    const token =
      params.get("token") ??
      (req.headers["sec-websocket-protocol"] as string | undefined) ??
      null;
    const payload = token ? verifyToken(token) : null;
    if (!payload || !users.has(payload.sub)) {
      socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
      socket.destroy();
      return;
    }
    if (channel === "driver-location" && payload.role !== "driver") {
      socket.write("HTTP/1.1 403 Forbidden\r\n\r\n");
      socket.destroy();
      return;
    }
    wss.handleUpgrade(req, socket, head, (ws) => {
      const aws = ws as AuthedSocket;
      aws.auth = payload;
      aws.channel = channel;
      aws.isAlive = true;
      aws.subscribedOrderIds = new Set();
      channels.get(channel)!.add(aws);
      logger.info(
        { sub: payload.sub, role: payload.role, channel },
        "ws connected",
      );
      send(aws, { type: "welcome", channel, serverTime: Date.now() });
      wss.emit("connection", aws, req);
    });
  });

  wss.on("connection", (ws: AuthedSocket) => {
    ws.on("pong", () => {
      ws.isAlive = true;
    });

    ws.on("message", (raw) => {
      let msg: ClientMessage | null = null;
      try {
        msg = JSON.parse(raw.toString()) as ClientMessage;
      } catch {
        return;
      }
      if (!msg || typeof msg !== "object") return;

      if (msg.type === "ping") {
        send(ws, { type: "pong", t: msg.t ?? Date.now() });
        return;
      }

      if (ws.channel === "order-tracking") {
        if (msg.type === "subscribe") {
          ws.subscribedOrderIds!.add(msg.orderId);
          // immediate snapshot
          const o = orders.get(msg.orderId);
          if (o?.driverId) {
            const driver = [...users.values()].find(
              (u) => u.driver?.id === o.driverId,
            )?.driver;
            if (driver?.lastLat != null && driver?.lastLng != null) {
              send(ws, {
                type: "order-tracking",
                orderId: msg.orderId,
                data: {
                  latitude: driver.lastLat,
                  longitude: driver.lastLng,
                  updatedAt: driver.lastLocationAt ?? null,
                  orderStatus: o.status,
                },
              });
            }
          }
          return;
        }
        if (msg.type === "unsubscribe") {
          ws.subscribedOrderIds!.delete(msg.orderId);
          return;
        }
      }

      if (ws.channel === "driver-location" && msg.type === "location") {
        const sub = ws.auth?.sub;
        if (!sub) return;
        const user = users.get(sub);
        if (!user?.driver) return;
        if (
          typeof msg.latitude !== "number" ||
          typeof msg.longitude !== "number"
        )
          return;
        user.driver.lastLat = msg.latitude;
        user.driver.lastLng = msg.longitude;
        user.driver.lastLocationAt = msg.timestamp ?? Date.now();

        // ack
        send(ws, {
          type: "location-ack",
          serverTime: Date.now(),
          timestamp: user.driver.lastLocationAt,
        });

        // broadcast to subscribers of driver's active orders
        if (msg.orderId) {
          broadcastOrderTracking(msg.orderId, {
            latitude: msg.latitude,
            longitude: msg.longitude,
            heading: msg.heading ?? null,
            speed: msg.speed ?? null,
            updatedAt: user.driver.lastLocationAt,
          });
        } else {
          for (const o of orders.values()) {
            if (
              o.driverId === user.driver.id &&
              o.status !== "delivered" &&
              o.status !== "cancelled"
            ) {
              broadcastOrderTracking(o.id, {
                latitude: msg.latitude,
                longitude: msg.longitude,
                heading: msg.heading ?? null,
                speed: msg.speed ?? null,
                updatedAt: user.driver.lastLocationAt,
                orderStatus: o.status,
              });
            }
          }
        }
      }
    });

    ws.on("close", () => {
      if (ws.channel) channels.get(ws.channel)!.delete(ws);
      logger.info(
        { sub: ws.auth?.sub, channel: ws.channel },
        "ws disconnected",
      );
    });

    ws.on("error", (err) => {
      logger.warn({ err, sub: ws.auth?.sub }, "ws error");
    });
  });

  // Heartbeat: terminate sockets that don't respond to pings.
  const interval = setInterval(() => {
    for (const set of channels.values()) {
      for (const ws of set) {
        if (ws.isAlive === false) {
          try {
            ws.terminate();
          } catch {
            // noop
          }
          set.delete(ws);
          continue;
        }
        ws.isAlive = false;
        try {
          ws.ping();
        } catch {
          // noop
        }
      }
    }
  }, 25_000);

  wss.on("close", () => clearInterval(interval));

  logger.info("WebSocket server attached on /ws/driver-location and /ws/order-tracking");
}
