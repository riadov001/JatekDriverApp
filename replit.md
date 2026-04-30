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

## Production Backend

All three apps (driver, client, merchant) connect to the production backend at:
**`https://ma.jatek.app/api`**

### Key API Routes
- `POST /auth/login` — email + password → JWT token
- `POST /auth/register` — create account with `role: customer|driver|restaurant_owner`
- `GET /auth/me` — current user (id, name, email, role)
- `GET /api/restaurants` — list all restaurants
- `GET /api/restaurants/{id}/menu` — menu items for restaurant
- `GET /api/orders` — customer sees own orders; restaurant_owner sees owned restaurant orders
- `GET /api/orders?restaurantId={id}` — orders for a specific restaurant (works for any restaurant_owner)
- `POST /api/orders` — create order (customer auth)
- `PATCH /api/orders/{id}/status` — update status (restaurant_owner)
- `PATCH /api/orders/{id}` — driver accept/update
- `GET /api/orders/available` — orders with status "ready" (driver use)
- `GET /api/drivers` — list all drivers

### Test Accounts
- Customer: `client.test@jatek.app / Jatek2026!` (userId: 67)
- Merchant: `marchand.test@jatek.app / Jatek2026!` (userId: 68, role: restaurant_owner)
- Driver: `chauffeur.test@jatek.app / Jatek2026!` (driverId: 4)

### Order Object Structure (from API)
```json
{
  "id": 4,              // number
  "reference": "JTK-2604-F2R9MX",
  "userName": "Test Client",
  "restaurantName": "Burger Station",
  "status": "pending|preparing|ready|picked_up|delivered|cancelled",
  "total": 55,
  "subtotal": 55,
  "deliveryFee": 0,
  "deliveryAddress": "...",
  "items": [{ "menuItemName": "...", "quantity": 1, "unitPrice": 55, "totalPrice": 55 }]
}
```

## Artifacts

### Jatek Driver (`artifacts/jatek-driver`)
- **Type**: Expo React Native mobile app
- **Auth**: email + password, role=driver
- **Key fix**: `PROD_BASE = https://ma.jatek.app/api`, `getMe()` matches driver from `/api/drivers` list by userId
- **Features**: Online/offline toggle, order notifications, order acceptance, delivery tracking

### Jatek Client (`artifacts/jatek-client`)
- **Type**: React + Vite web app (mobile-first)
- **Auth**: email + password, role=customer
- **Pages**: Login/Register, Restaurant list (home), Restaurant detail + menu, Cart + checkout, Order history (live polling 15s)
- **API client**: `src/lib/api.ts` — direct fetch to ma.jatek.app with JWT from localStorage (`jatek_token`)
- **Contexts**: Auth (`src/lib/auth.tsx`), Cart (`src/lib/cart.tsx`)

### Jatek Merchant (`artifacts/jatek-merchant`)
- **Type**: React + Vite web app (desktop dashboard)
- **Auth**: email + password, role=restaurant_owner
- **Pages**: Login, Kanban order dashboard (3 columns: Pending / Preparing / Ready, 8s polling)
- **API client**: `src/lib/api.ts` — direct fetch to ma.jatek.app with JWT from localStorage (`jatek_merchant_token`)
- **Restaurant picker**: On login, opens a modal to select which restaurant to manage; stored in `jatek_merchant_restaurantId`
- **Note**: Any restaurant_owner can see orders for any restaurant via `GET /api/orders?restaurantId={id}`

## Jatek Driver — Design System

The app uses a tri-color palette inspired by Uber Eats courier, with Jatek branding:
- **Rose Magenta** `#E91E8C` — primary CTAs, active states, online toggle
- **Turquoise Blue** `#00B4D8` — info badges, secondary accents (`colors.info`)
- **Olive Yellow** `#9BA617` — earnings/money amounts (`colors.success`)
- Background: `#FFFFFF`, Cards: `#F8F8F8`, Border: `#EEEEEE`, Text: `#1A1A1A`

Color tokens in `constants/colors.ts`: `primary`, `info`, `success`, `secondary`, `accent`, `muted`, `warning`, `destructive`, `border`, `radius` (16).

Both web apps (jatek-client, jatek-merchant) use the same Jatek brand tokens in `index.css`:
- Primary: Rose Magenta `hsl(327 81% 52%)`
- Secondary: Turquoise Blue `hsl(191 100% 42%)`
- Font: Inter

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
