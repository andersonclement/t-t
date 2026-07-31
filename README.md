# Dokta

Plateforme de santé digitale pour le Cameroun : commande de médicaments,
répertoire des établissements, carte de santé et assistant Care IA.

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   `npm install`
2. Copy [.env.example](.env.example) to `.env.local` and fill it in. Care IA needs
   `ANTHROPIC_API_KEY`; the rest configures Firebase.
3. Run the app:
   `npm run dev`

## Care IA

The assistant runs on Claude (`claude-opus-5`). The API key stays server-side —
the browser only ever talks to our own routes:

| Route | What it does |
| --- | --- |
| `POST /api/ai/chat` | Streams the medical coach's reply as Server-Sent Events |
| `POST /api/ai/interactions` | Returns a structured drug-interaction report |

The handlers live in `src/server/careIA.ts` and are shared by two transports:

- **Locally**, `server.ts` serves them from Express (with rate limiting).
- **In production**, `api/ai/chat.ts` and `api/ai/interactions.ts` run as Vercel
  serverless functions — the deployed site is static, so the Express process
  never starts.

> ⚠️ The Express rate limiter only protects local development. Serverless
> invocations don't share memory, so add Vercel's own rate limiting (or a
> shared store) before opening the deployment to real traffic.

## Deployment (Vercel)

`vercel.json` builds the SPA into `dist/`, exposes `api/` as serverless
functions, and rewrites every non-`/api` path to `index.html` so client-side
routes survive a refresh.

**Environment variables to set in the Vercel project:**

| Variable | Required | Notes |
| --- | --- | --- |
| `ANTHROPIC_API_KEY` | Yes | Server-side only. Without it Care IA returns a configuration error. |
| `VITE_FIREBASE_*` | Yes | Firebase web config. |
| `VITE_ENABLE_DEMO` | No | `true` by default. **Set to `false` in production** — the demo accounts share a password published in `src/lib/roles.ts`, including the admin one. |
| `VITE_RECAPTCHA_SITE_KEY` | No | Only needed if App Check is re-enabled. |

## Comptes de démonstration

When `VITE_ENABLE_DEMO` is not `false`, the login screen offers one account per
interface (shared password `Dokta123!`):

| Interface | Email |
| --- | --- |
| Patient | `patient@dokta.cm` |
| Pharmacien | `pharmacien@dokta.cm` |
| Clinique | `clinique@dokta.cm` |
| Naturopathe | `naturopathe@dokta.cm` |
| Administrateur | `admin@dokta.cm` |

These are real Firebase accounts, created on first use and activated
immediately so each interface is browsable without going through document
review.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Express + Vite dev server on :3000 |
| `npm run build` | Builds the SPA and bundles the Express server |
| `npm run lint` | `tsc --noEmit` |
| `npm test` | Vitest |
