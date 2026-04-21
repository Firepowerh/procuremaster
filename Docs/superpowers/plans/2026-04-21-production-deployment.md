# Production Deployment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deploy ProcureMaster from local Docker Supabase to Supabase Cloud + Vercel, with a production-safe CSP fix.

**Architecture:** Fix one unsafe hardcoded CSP entry in `next.config.mjs`, push the 31-migration schema + seed data to Supabase Cloud via the Supabase CLI, configure Auth redirect URLs, then import the GitHub repo into Vercel with all required env vars.

**Tech Stack:** Next.js 14 (standalone output), Supabase Cloud (Postgres + Auth + Storage + Realtime), Supabase CLI, Vercel

---

## File Map

| Action | File | Change |
|--------|------|--------|
| Modify | `next.config.mjs` | Make `connect-src` CSP entry environment-aware (dev vs prod) |

All other changes are CLI commands and dashboard configuration — no additional files are created or modified.

---

## Task 1: Fix CSP for Production

**Files:**
- Modify: `next.config.mjs` (line 36)

The current `connect-src` directive unconditionally includes `http://127.0.0.1:54321` and `ws://127.0.0.1:54321` (local Docker Supabase). In production these are unreachable and pollute the policy. The wildcard entries `https://*.supabase.co` and `wss://*.supabase.co` already cover Supabase Cloud, so only the localhost entries need to become dev-only.

- [ ] **Step 1.1: Replace the contents of `next.config.mjs` with the environment-aware version**

Replace the entire file with:

```js
/** @type {import('next').NextConfig} */
const isDev = process.env.NODE_ENV === 'development'

const connectSrc = [
  "'self'",
  'https://*.supabase.co',
  'https://*.supabase.in',
  'wss://*.supabase.co',
  'https://generativelanguage.googleapis.com',
  ...(isDev ? ['http://127.0.0.1:54321', 'ws://127.0.0.1:54321'] : []),
].join(' ')

const nextConfig = {
  output: 'standalone',

  // Security headers applied to all routes
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Prevent embedding in iframes (clickjacking)
          { key: 'X-Frame-Options', value: 'DENY' },
          // Prevent MIME-type sniffing
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // Control referrer information
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // Enforce HTTPS for 1 year, include subdomains
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
          // Disable browser features not needed by this app
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=()',
          },
          // Content Security Policy
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https://*.supabase.co https://*.supabase.in",
              "font-src 'self' data:",
              `connect-src ${connectSrc}`,
              "worker-src 'self' blob:",
              "frame-src 'none'",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join('; '),
          },
        ],
      },
      // Cache static assets aggressively
      {
        source: '/_next/static/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ]
  },

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.in',
      },
    ],
  },
}

export default nextConfig
```

- [ ] **Step 1.2: Verify the dev server still starts cleanly**

```bash
npm run dev
```

Expected: Server starts at `http://localhost:3000` with no errors. Open the browser console — no CSP violations should appear when using the local app.

- [ ] **Step 1.3: Commit**

```bash
git add next.config.mjs
git commit -m "fix: scope local Supabase CSP entries to development only"
```

- [ ] **Step 1.4: Push to GitHub**

```bash
git push origin master
```

---

## Task 2: Install & Authenticate Supabase CLI

- [ ] **Step 2.1: Check if Supabase CLI is already installed**

```bash
supabase --version
```

If a version number prints (e.g., `2.x.x`), skip to Step 2.3.  
If the command is not found, continue to Step 2.2.

- [ ] **Step 2.2: Install Supabase CLI**

```bash
npm install -g supabase
```

Verify:

```bash
supabase --version
```

Expected output: a version string like `2.x.x`

- [ ] **Step 2.3: Log in to Supabase CLI**

```bash
supabase login
```

This opens a browser window. Log in using your GitHub account (same one linked to your Supabase Cloud project). Once authenticated, the terminal prints:

```
You are now logged in. Happy coding!
```

---

## Task 3: Link Local Project to Supabase Cloud

- [ ] **Step 3.1: Find your Supabase project ref**

Go to [https://supabase.com/dashboard](https://supabase.com/dashboard) → click your project → look at the URL:

```
https://supabase.com/dashboard/project/<PROJECT_REF>
```

Copy the `<PROJECT_REF>` (it looks like `abcdefghijklmnop`, ~20 characters).

- [ ] **Step 3.2: Link the local project**

Run this from the project root:

```bash
supabase link --project-ref <PROJECT_REF>
```

You will be prompted for your database password (the one you set when creating the Supabase Cloud project). Enter it.

Expected output:

```
Finished supabase link.
```

- [ ] **Step 3.3: Confirm the link**

```bash
supabase status
```

Expected: shows your linked project ref and cloud project details (not the local Docker instance).

---

## Task 4: Push Migrations to Supabase Cloud

- [ ] **Step 4.1: Push all 31 migrations**

```bash
supabase db push
```

This applies every file in `supabase/migrations/` to the cloud database in order. The CLI compares what's already been applied and skips anything already present.

Expected output ends with:

```
Finished supabase db push.
```

If any migration fails, the CLI prints the failing SQL and stops. Read the error, fix the migration file, and re-run `supabase db push`.

- [ ] **Step 4.2: Verify migrations in dashboard**

Go to Supabase Dashboard → Table Editor. You should see all the expected tables: `organisations`, `profiles`, `rfps`, `vendor_accounts`, `evaluations`, etc.

---

## Task 5: Push Seed Data

> The seed file populates initial reference data (scoring templates, org defaults, etc.). It does not insert test users or test RFPs.

- [ ] **Step 5.1: Get the cloud database connection string**

Go to Supabase Dashboard → Settings → Database → scroll to **Connection string** → select **URI** mode.

It looks like:

```
postgresql://postgres:<PASSWORD>@db.<PROJECT_REF>.supabase.co:5432/postgres
```

Copy it.

- [ ] **Step 5.2: Check if `psql` is available**

```bash
psql --version
```

If it prints a version (e.g., `psql (PostgreSQL) 15.x`), continue to Step 5.3.  
If not found, use the **SQL Editor fallback** in Step 5.4 instead.

- [ ] **Step 5.3: Run seed via `psql` (preferred)**

```bash
psql "<CONNECTION_STRING>" -f supabase/seed.sql
```

Replace `<CONNECTION_STRING>` with the URI from Step 5.1. If the password contains special characters, URL-encode them (e.g., `@` → `%40`).

Expected: SQL commands execute without errors. Some `INSERT 0` lines are normal if rows already exist and the seed uses `ON CONFLICT DO NOTHING`.

- [ ] **Step 5.4: Run seed via SQL Editor (fallback if no psql)**

Open Supabase Dashboard → SQL Editor → New query. Copy the entire contents of `supabase/seed.sql` and paste into the editor. Click **Run**.

Verify no red error messages appear.

---

## Task 6: Configure Supabase Auth for Production

Without this step, magic link emails will redirect users back to `localhost:3000` instead of the live app.

- [ ] **Step 6.1: Get your Vercel subdomain**

You will set this up in Task 7, but you need the URL now. Your Vercel subdomain will be:
`https://<repo-name>.vercel.app` (Vercel uses the GitHub repo name by default).

If you've already deployed, go to Vercel Dashboard → your project → the URL shown at the top.

- [ ] **Step 6.2: Set Site URL in Supabase**

Go to Supabase Dashboard → Authentication → URL Configuration.

Set **Site URL** to:

```
https://<your-app>.vercel.app
```

- [ ] **Step 6.3: Add Redirect URLs**

In the same section, under **Redirect URLs**, add:

```
https://<your-app>.vercel.app/**
```

The `/**` wildcard allows any path under your domain to be a valid redirect target (needed for deep links after login).

Click **Save**.

---

## Task 7: Deploy to Vercel

### 7A — Generate Security Secrets

- [ ] **Step 7A.1: Generate AUTH_SECRET**

```bash
openssl rand -base64 32
```

Copy the output. This is your `AUTH_SECRET`. Save it somewhere temporarily (password manager or notepad).

- [ ] **Step 7A.2: Generate CRON_SECRET**

```bash
openssl rand -base64 32
```

Copy the output. This is your `CRON_SECRET`. Keep it separate from `AUTH_SECRET`.

### 7B — Import Repo to Vercel

- [ ] **Step 7B.1: Create new Vercel project**

Go to [https://vercel.com/new](https://vercel.com/new).

Click **"Import Git Repository"** → select the ProcureMaster GitHub repo.

Vercel auto-detects Next.js. Do **not** change the build settings — the defaults are correct.

- [ ] **Step 7B.2: Set all environment variables**

Before clicking Deploy, expand the **Environment Variables** section and add each of the following. Set scope to **Production**, **Preview**, and **Development** for all of them.

| Variable | Where to get it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard → Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard → Settings → API → anon / public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard → Settings → API → service_role key |
| `GEMINI_API_KEY` | Copy from your local `.env.local` |
| `RESEND_API_KEY` | Copy from your local `.env.local` |
| `RESEND_FROM_EMAIL` | Copy from your local `.env.local` |
| `NEXT_PUBLIC_APP_URL` | `https://<your-app>.vercel.app` (same as Task 6) |
| `AUTH_SECRET` | The value you generated in Step 7A.1 |
| `CRON_SECRET` | The value you generated in Step 7A.2 |

> `NEXT_PUBLIC_*` variables are baked into the client bundle at build time. All others are server-only and never exposed to the browser.

- [ ] **Step 7B.3: Deploy**

Click **Deploy**. Vercel builds the Next.js app (using `output: 'standalone'`) and publishes it.

Expected: Build completes and the deployment URL is shown. The `vercel.json` cron job (`/api/cron/contracts` at `0 6 * * *`) is registered automatically.

---

## Task 8: Post-Deployment Verification

- [ ] **Step 8.1: App loads**

Open `https://<your-app>.vercel.app` in a browser.

Expected: The sign-in / landing page renders. No blank screen, no 500 error.

- [ ] **Step 8.2: No CSP errors in the browser console**

Open DevTools → Console. Reload the page.

Expected: No `Content Security Policy` errors. If you see any, note the blocked URL and update the `connect-src` directive in `next.config.mjs` accordingly, then redeploy.

- [ ] **Step 8.3: Auth flow works**

Attempt to sign in with a valid email. Check that the magic link email arrives and that clicking it redirects to `https://<your-app>.vercel.app` (not `localhost`).

If it redirects to localhost, re-check Task 6 — the Site URL or Redirect URL is wrong.

- [ ] **Step 8.4: Verify cron endpoint**

```bash
curl -X GET https://<your-app>.vercel.app/api/cron/contracts \
  -H "Authorization: Bearer <CRON_SECRET>"
```

Expected: HTTP 200 response (not 401 or 404).

- [ ] **Step 8.5: Check Supabase Realtime (notifications)**

Log in to the app, navigate to any page that uses notifications, and confirm the notification bell works without console errors. Realtime uses a WebSocket to `wss://*.supabase.co`, which is covered by the production CSP.

---

## Future Schema Changes

For any new migration added to `supabase/migrations/`, push it to production with:

```bash
supabase db push
```

No redeployment of the Next.js app is needed for schema-only changes.
