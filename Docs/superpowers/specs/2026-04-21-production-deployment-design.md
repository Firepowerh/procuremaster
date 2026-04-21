# Production Deployment Design — ProcureMaster

**Date:** 2026-04-21  
**Approach:** Supabase CLI + GitHub → Vercel  
**Scope:** Migrate from local Docker Supabase to Supabase Cloud; deploy Next.js app to Vercel

---

## Context

ProcureMaster is a Next.js 14 B2B SaaS procurement platform currently running against a local Supabase instance via Docker. The project has:

- 31 database migrations in `supabase/migrations/`
- A `supabase/seed.sql` file with initial reference data
- A `vercel.json` already configured with a daily cron job and API headers
- 9 environment variables required at runtime
- One known production-unsafe code issue in `next.config.mjs` (hardcoded local Supabase URLs in CSP)

**Deployment targets:**
- Database: Supabase Cloud (existing project, created via GitHub social login)
- App host: Vercel (new project, GitHub repo import, Vercel subdomain)

---

## Phase 1 — Code Fixes

### 1.1 Fix CSP in `next.config.mjs`

**Problem:** The `connect-src` Content Security Policy directive has `http://127.0.0.1:54321` and `ws://127.0.0.1:54321` hardcoded unconditionally. In production the browser cannot reach these addresses, and the production Supabase Cloud URL is not whitelisted.

**Fix:** Make the CSP environment-aware:
- In `development`: keep the local Supabase URLs (`http://127.0.0.1:54321`, `ws://127.0.0.1:54321`)
- In `production`: derive the allowed origins from `NEXT_PUBLIC_SUPABASE_URL` (REST) and its `wss://` equivalent (Realtime WebSocket)

**Implementation pattern:**
```js
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const supabaseWs = supabaseUrl.replace(/^https/, 'wss').replace(/^http/, 'ws')
const isDev = process.env.NODE_ENV === 'development'

const connectSrc = isDev
  ? `... http://127.0.0.1:54321 ws://127.0.0.1:54321`
  : `... ${supabaseUrl} ${supabaseWs}`
```

No other code changes are needed — all Supabase client code already reads from env vars.

---

## Phase 2 — Supabase Cloud Setup

### 2.1 Install & authenticate Supabase CLI

```bash
# Install (if not already installed)
npm install -g supabase

# Authenticate (opens browser, uses GitHub-linked Supabase account)
supabase login
```

### 2.2 Link local project to cloud project

Find your project ref in the Supabase Dashboard URL: `https://supabase.com/dashboard/project/<PROJECT_REF>`

```bash
supabase link --project-ref <PROJECT_REF>
```

This wires the local `supabase/` directory to the cloud project. You will be prompted for the database password (set when you created the project).

### 2.3 Push all migrations

```bash
supabase db push
```

This runs all 31 migrations in order against the cloud database. If any migration was already applied (e.g., from the Supabase project creation wizard), the CLI skips it safely.

### 2.4 Push seed data

Run `seed.sql` directly against the cloud database using the connection string from:  
Supabase Dashboard → Settings → Database → Connection string (URI mode)

```bash
psql "<CONNECTION_STRING>" -f supabase/seed.sql
```

> Note: Use the **URI** connection string (starts with `postgresql://`). If you don't have `psql` installed locally, you can run the seed SQL via the Supabase Dashboard → SQL Editor.

### 2.5 Configure Supabase Auth for production

In Supabase Dashboard → Authentication → URL Configuration:

| Setting | Value |
|---|---|
| **Site URL** | `https://<your-app>.vercel.app` |
| **Redirect URLs** | `https://<your-app>.vercel.app/**` |

This is required for magic links and any OAuth callbacks to work correctly in production. Without this, email links will redirect to `localhost`.

---

## Phase 3 — Vercel Deployment

### 3.1 Import GitHub repo

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click **"Import Git Repository"**
3. Select the ProcureMaster GitHub repo
4. Vercel auto-detects Next.js — no framework config changes needed

### 3.2 Set environment variables

Set the following in Vercel → Project → Settings → Environment Variables (scope: **Production**, **Preview**, **Development**):

| Variable | Source |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard → Settings → API |
| `GEMINI_API_KEY` | Your current `.env.local` |
| `RESEND_API_KEY` | Your current `.env.local` |
| `RESEND_FROM_EMAIL` | Your verified Resend sender domain |
| `NEXT_PUBLIC_APP_URL` | `https://<your-app>.vercel.app` |
| `AUTH_SECRET` | Generate: `openssl rand -base64 32` |
| `CRON_SECRET` | Generate: `openssl rand -base64 32` |

> `NEXT_PUBLIC_*` variables are embedded in the client bundle at build time. All others are server-only.

### 3.3 Deploy

Click **Deploy**. Vercel builds the app and publishes it. The `vercel.json` cron job (`/api/cron/contracts` at 6am daily) is registered automatically on Vercel's infrastructure.

Every subsequent push to the `main` branch triggers an automatic redeploy.

---

## Post-Deployment Verification

After the first deployment, verify:

- [ ] App loads at the Vercel URL
- [ ] Sign-in page renders correctly
- [ ] Magic link email arrives and redirects back to the Vercel URL (not localhost)
- [ ] A test user can complete the onboarding flow
- [ ] Supabase Realtime (notifications) connects without CSP errors (check browser console)
- [ ] `/api/cron/contracts` endpoint exists and returns 200 when called with the correct `Authorization: Bearer <CRON_SECRET>` header

---

## Decisions & Constraints

- **No custom domain for now** — using Vercel subdomain, can be added later via Vercel → Domains
- **Seed data included** — `supabase/seed.sql` pushed to cloud for initial reference data
- **Local Docker Supabase stays intact** — the local environment is unchanged; `supabase link` does not affect it
- **Future migrations** — run `supabase db push` after any new migration file is added to deploy schema changes to production
