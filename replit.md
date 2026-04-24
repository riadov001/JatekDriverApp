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

## Jatek Driver — Backend targets

The driver app (`artifacts/jatek-driver`) supports two backend targets, switchable from the login screen:

- **Démo (OTP)** → local in-memory `api-server` (rich features: tips, promotions, multi-step delivery, delivery code `000000`).
- **Production** → `https://backend.jatek.app/api` (real Google App Engine REST API, email + password auth, integer IDs).

Selection is persisted in `expo-secure-store` under `jatek_driver_api_target`. The runtime adapter in `lib/api.ts` maps the prod schema (`isAvailable`, `nationalId`, `pickupCode`, `vehicleType: "Moto"`, etc.) onto the in-app types so all screens work against either backend without changes. Features that prod doesn't expose (tips, promotions) gracefully degrade to empty/zero on prod.

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
