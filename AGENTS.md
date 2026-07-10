# Sushiro NPS Form Auto-Submitter

A React + Vite + TypeScript application to simplify the Sushiro multi-page customer satisfaction survey into a single-page auto-submitter.

---

## 🛠 Developer Commands

The project uses `bun` for lockfile tracking (`bun.lockb` is present). Run commands with npm or bun.

- **Dev Server**: `npm run dev`
- **Build Production**: `npm run build`
- **Build Dev mode**: `npm run build:dev` (outputs Vite development build)
- **Lint**: `npm run lint` (runs `eslint .`)
- **Run Tests**: `npm run test` (runs `vitest run` once)
- **Watch Tests**: `npm run test:watch` (runs `vitest` in watch mode)

---

## 📐 Architecture & Routing

- **Single Route (`/`)**: Main entry point is `src/pages/Index.tsx`. Handles all form states, random generation, preset buttons, and submission logic.
- **Data Layer (`src/data/questions.ts`)**: Contains the parsed question structure (form type 1 for radio, form type 3 for comments/text).
- **Core Library (`src/lib/sushiro.ts`)**: Encapsulates invitation code generation, pricing algorithms, preset application mapping, and API submission.

---

## 🔌 API & CORS Proxies

- **Endpoint**: `/api/v1/surveys/next` with Authorization header `Bearer web:624a677331626b5044e9bb25a1fcf8a9`
- **Local Dev Proxy**: Proxy configured via `vite.config.ts` mapping `/sushiro-api` to `https://nps.sushiro.com.tw`.
- **Production Warning**: Direct calls to `nps.sushiro.com.tw` fail due to CORS. In Lovable previews or deployments, requests must go through a proxy (e.g. Supabase Edge Function `sushiro-proxy` or backend router).

---

## 🧪 Testing

- **Configuration**: Uses `vitest.config.ts` and `jsdom`.
- **Global Setup**: `src/test/setup.ts` registers `@testing-library/jest-dom` matchers.
- **Verification**: Run `npm run test` to verify helper logic (e.g., date formats, price/time generation) or UI render matches.
