# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## Jatek Driver — Design System

The app uses a tri-color palette inspired by Uber Eats courier, with Jatek branding:
- **Rose Magenta** `#E91E8C` — primary CTAs, active states, online toggle
- **Turquoise Blue** `#00B4D8` — info badges, secondary accents (`colors.info`)
- **Olive Yellow** `#9BA617` — earnings/money amounts (`colors.success`)
- Background: `#FFFFFF`, Cards: `#F8F8F8`, Border: `#EEEEEE`, Text: `#1A1A1A`

Color tokens in `constants/colors.ts`: `primary`, `info`, `success`, `secondary`, `accent`, `muted`, `warning`, `destructive`, `border`, `radius` (16).

## Jatek Driver — GPS Tracking & WebSocket

Real-time driver location is pushed to the backend over WebSocket. Architecture:

**Backend (`artifacts/api-server`)**
- HTTP and WS share the same Node `http.Server` (see `src/index.ts` + `src/lib/ws.ts`).
- Two WS channels, both auth via `?token=<jwt>` query param:
  - `wss://<host>/ws/driver-location` — driver-only; sends `{type:"location", latitude, longitude, heading, speed, timestamp, orderId?}`. Server replies with `location-ack`, persists to `driver.lastLat/lastLng/lastLocationAt`, and broadcasts to subscribers of the related order.
  - `wss://<host>/ws/order-tracking` — any authed user; client subscribes with `{type:"subscribe", orderId}`. Server pushes `{type:"order-tracking", orderId, data:{latitude,longitude,heading,speed,updatedAt,orderStatus?}}`.
- Heartbeat: server pings every 25s and terminates dead sockets (`ws.isAlive`).
- `{type:"ping"}` from client gets `{type:"pong",t}`.

**Driver app (`artifacts/jatek-driver`)**
- `services/wsClient.ts` — `WsClient` with auto-reconnect (exponential backoff, jittered, max 30s), 25s heartbeat, message queue when offline, status listeners (`idle | connecting | open | closed | error | reconnecting`). Singletons via `getDriverLocationClient()` / `getOrderTrackingClient()`.
- `services/locationService.ts` — two tracking modes:
  - `startOnlineTracking()` — when driver toggles online; 15s cadence, `Accuracy.High`.
  - `startActiveOrderTracking(orderId)` — when an order is active; 4s cadence, `Accuracy.BestForNavigation`, runs *both* a foreground `watchPositionAsync` (fast) and the background TaskManager task (resilient). Sets `activeOrderId` so every emitted location includes the order id.
  - `stopLocationTracking(force=false)` — refuses to stop while an order is active unless `force=true`.
  - `ensureAlwaysLocationPermission()` — strictly requires Background ("Always") on native before a course can begin.
- `context/ActiveOrderContext.tsx` — owns active-order state, exposes `beginTracking(orderId)` / `endTracking()` and live `wsStatus`.
- `context/OnlineContext.tsx` — blocks the offline toggle while an active order exists.
- `app/order/[id].tsx` — auto-calls `beginTracking` when status enters `accepted/arrived_pickup/picked_up/arrived_dropoff` and `endTracking` when it leaves; renders a `LiveStatusBadge` reflecting WS connection state.
- Background `expo-location` task is registered at module load via side-effect import in `app/_layout.tsx`.
- iOS `UIBackgroundModes: ["location","fetch"]` and Android `ACCESS_BACKGROUND_LOCATION` + `FOREGROUND_SERVICE_LOCATION` are already declared in `app.json`.

## Jatek Driver — Backend targets

The driver app (`artifacts/jatek-driver`) supports two backend targets, switchable from the login screen:

- **Démo (OTP)** → local in-memory `api-server` (rich features: tips, promotions, multi-step delivery, delivery code `000000`).
- **Production** → `https://backend.jatek.app/api` (real Google App Engine REST API, email + password auth, integer IDs).

Selection is persisted in `expo-secure-store` under `jatek_driver_api_target`. The runtime adapter in `lib/api.ts` maps the prod schema (`isAvailable`, `nationalId`, `pickupCode`, `vehicleType: "Moto"`, etc.) onto the in-app types so all screens work against either backend without changes. Features that prod doesn't expose (tips, promotions) gracefully degrade to empty/zero on prod.

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
