# Mobile App — Phase 1: Foundation Design

**Date:** 2026-04-22  
**Scope:** Expo React Native app, Phase 1 of 5 — Foundation, Auth, Dashboard  
**Repo location:** `mobile/` folder at repo root (alongside the Next.js webapp)

---

## Overview

ProcureMaster is being extended with a React Native mobile app using Expo. The mobile app targets full feature parity with the webapp across 5 build phases. This document covers Phase 1 only: project scaffold, navigation architecture, authentication flows, and the role-aware dashboard.

**Key constraints:**
- Frontend-only — no backend changes. All API calls go to the same Supabase Cloud instance and Gemini API already powering the webapp.
- Both iOS and Android targets.
- Tested via Expo Go on a physical device during development.

**Tech decisions made:**
| Concern | Decision |
|---|---|
| Navigation | Expo Router (file-based, mirrors Next.js `app/` pattern) |
| Styling | NativeWind (Tailwind utility classes on React Native) |
| Supabase client | `@supabase/supabase-js` + AsyncStorage adapter |
| Types | `supabase gen types typescript` (generated from cloud schema) + Zod schemas copied from webapp |
| State | Zustand (matches webapp's `ui-store.ts` pattern) |

---

## Phase Roadmap (for context)

| Phase | Scope |
|---|---|
| **1 — Foundation** ← this doc | Scaffold, navigation, auth, dashboard |
| 2 — Core Procurement | Requirements, RFPs, Vendors |
| 3 — Evaluation & AI | Evaluations, AI scoring, document upload |
| 4 — Approvals & Contracts | Approvals, Contracts, Reports, Settings |
| 5 — Notifications & Polish | Real-time notifications, role gates, UX polish |

---

## Project Structure

```
mobile/                          ← new folder at repo root
├── app/
│   ├── _layout.tsx              # Root layout: session init + auth guard
│   ├── (auth)/
│   │   ├── _layout.tsx          # Stack navigator for auth screens
│   │   ├── login.tsx
│   │   ├── signup.tsx
│   │   └── reset-password.tsx
│   ├── (app)/
│   │   ├── _layout.tsx          # Role-aware tab navigator
│   │   ├── dashboard/
│   │   │   └── index.tsx
│   │   ├── requirements/
│   │   │   ├── index.tsx
│   │   │   ├── new.tsx
│   │   │   └── [id].tsx
│   │   ├── rfps/
│   │   │   ├── index.tsx
│   │   │   ├── new.tsx
│   │   │   └── [id].tsx
│   │   ├── approvals/
│   │   │   └── index.tsx
│   │   ├── contracts/
│   │   │   ├── index.tsx
│   │   │   └── [id].tsx
│   │   ├── vendors/
│   │   │   └── index.tsx
│   │   └── settings/
│   │       └── index.tsx
│   ├── onboarding/
│   │   └── index.tsx
│   └── invite/
│       └── [token].tsx
├── src/
│   ├── components/
│   │   ├── ui/                  # Button, Input, Card, Badge, Skeleton, etc.
│   │   └── layout/              # Header, screen wrapper
│   ├── lib/
│   │   ├── supabase/
│   │   │   └── client.ts        # RN Supabase client (AsyncStorage)
│   │   └── schemas/
│   │       └── auth.ts          # Zod validation schemas (copied from webapp)
│   ├── types/
│   │   └── database.ts          # Generated: supabase gen types typescript
│   ├── stores/
│   │   └── auth-store.ts        # Zustand: session, profile, role, org_id
│   └── hooks/
│       └── use-auth.ts          # Auth state + redirect logic
├── assets/
│   └── images/                  # App icon, splash screen
├── .env                         # EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY
├── .env.example                 # Committed reference, no real values
├── app.json                     # Expo config (name, slug, bundle IDs)
├── babel.config.js              # Expo preset + NativeWind plugin
├── tailwind.config.js           # NativeWind config
├── tsconfig.json                # Extends expo/tsconfig.base
└── package.json
```

---

## Navigation Architecture

### Route groups

**`(auth)/`** — unauthenticated stack. Login, Signup, Reset Password. No tab bar.

**`(app)/`** — authenticated tab navigator. Tabs adapt per role (see below). Inaccessible without a valid session.

**`onboarding/`** — shown once after signup, before the main app. Sets `onboarding_complete = true` on the profile row.

**`invite/[token]`** — vendor invite deep link. Accepts the invite token, creates a vendor session.

### Auth guard (root `_layout.tsx`)

```
mount → initialise Supabase session listener → populate Zustand store
  └─ no session          → <Redirect href="/(auth)/login" />
  └─ session + incomplete onboarding → <Redirect href="/onboarding" />
  └─ session + complete  → render (app)/ tabs
```

Uses `supabase.auth.onAuthStateChange` — no polling needed.

### Role-aware tabs

Tab configuration is derived from the authenticated user's role at mount time:

| Role | Tabs |
|---|---|
| `procurement_manager` | Dashboard · Requirements · RFPs · Vendors · Settings |
| `department_head` | Dashboard · Requirements · RFPs · Settings |
| `finance_approver` | Dashboard · Approvals · Contracts · Settings |
| `vendor` | Portal · Settings |

Implemented as a single `(app)/_layout.tsx` that reads `role` from the Zustand auth store and renders the appropriate `<Tabs.Screen>` set. Screens not in the current role's tab list are hidden via `href: null` (Expo Router convention).

---

## Shared Infrastructure

### Supabase client

```ts
// mobile/src/lib/supabase/client.ts
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/database'

export const supabase = createClient<Database>(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
)
```

`EXPO_PUBLIC_` prefix is Expo's convention for client-exposed env vars (equivalent to `NEXT_PUBLIC_` in Next.js). Values are identical to the webapp's Supabase credentials.

### Type generation

Run once after initial setup, and again after any migration:

```bash
supabase gen types typescript --project-id ozciqmydakcdyhnughga \
  > mobile/src/types/database.ts
```

### Auth store (Zustand)

```ts
// mobile/src/stores/auth-store.ts
interface AuthState {
  session: Session | null
  profile: Profile | null   // row from public.profiles
  role: string | null       // 'procurement_manager' | 'department_head' | 'finance_approver' | 'vendor'
  orgId: string | null
  isLoading: boolean
  setSession: (s: Session | null) => void
  setProfile: (p: Profile | null) => void
  signOut: () => Promise<void>
}
```

On `onAuthStateChange`, if a session exists the store fetches the matching `profiles` row (`id = auth.uid()`) to populate `role` and `orgId`. This mirrors the webapp's JWT claims approach but works without SSR.

### Environment variables

`mobile/.env` (gitignored):
```
EXPO_PUBLIC_SUPABASE_URL=https://ozciqmydakcdyhnughga.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon key>
EXPO_PUBLIC_GEMINI_API_KEY=<gemini key>
EXPO_PUBLIC_APP_URL=https://procuremaster.vercel.app
```

`mobile/.env.example` (committed):
```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_GEMINI_API_KEY=
EXPO_PUBLIC_APP_URL=
```

---

## Auth Flows

### Login

- Fields: Email, Password (Zod: email format, min 6 chars password)
- Action: `supabase.auth.signInWithPassword({ email, password })`
- On success: root layout redirects automatically via `onAuthStateChange`
- On error: inline error message below the form (wrong credentials, email not confirmed)
- Links: "Forgot password?" → reset-password, "Create account" → signup

### Signup

- Fields: Full name, Email, Password, Organisation name, Currency (USD/EUR/GBP/AUD/CAD picker)
- Actions (sequential):
  1. `supabase.auth.signUp` → creates auth user
  2. Insert row into `public.organisations` (name, slug, currency)
  3. Insert row into `public.profiles` (id = auth uid, org_id, full_name, role = procurement_manager)
- On success: root layout redirects to onboarding
- Note: First user in an org always gets `procurement_manager` role (matches webapp behaviour)

### Reset Password

- Field: Email
- Action: `supabase.auth.resetPasswordForEmail(email, { redirectTo: '<deep link>' })`
- Deep link opens the app and navigates to an update-password screen (Phase 5 polish — for now shows success message with instructions to check email)

### Onboarding

- Single screen confirming the user's name and role
- Tapping "Get started" calls: `UPDATE profiles SET onboarding_complete = true WHERE id = auth.uid()`
- Root layout then renders the full `(app)/` tabs

---

## Dashboard

Role-aware summary cards. Data fetched from Supabase on mount with a loading skeleton while in-flight.

### procurement_manager
| Card | Data source |
|---|---|
| Active RFPs | `COUNT(*) FROM rfps WHERE status NOT IN ('contracts_signed') AND org_id = ?` |
| Pending evaluations | `COUNT(*) FROM evaluations WHERE evaluation_status IN ('criteria_pending','scoring_in_progress')` |
| Open requirements | `COUNT(*) FROM requirements WHERE status IN ('submitted','approved')` |

### department_head
| Card | Data source |
|---|---|
| My requirements | `COUNT(*) FROM requirements WHERE raised_by = auth.uid()` grouped by status |
| Active RFPs | `COUNT(*) FROM rfps WHERE status NOT IN ('contracts_signed')` |

### finance_approver
| Card | Data source |
|---|---|
| Pending approvals | `COUNT(*) FROM approval_requests WHERE status = 'pending'` |
| Active contracts | `COUNT(*) FROM contracts WHERE status = 'active'` |

### vendor
| Card | Data source |
|---|---|
| My submissions | `COUNT(*) FROM rfp_vendor_entries WHERE vendor_account_id = (SELECT id FROM vendor_accounts WHERE auth_user_id = auth.uid())` |
| Invite status | Status of most recent `rfp_vendor_entries` row |

Each card navigates to the corresponding list screen on tap.

---

## UI Components (Phase 1 set)

Minimal set needed for Phase 1. Built with NativeWind, matching the webapp's design language (indigo/slate palette, rounded-xl cards, consistent spacing).

| Component | Used in |
|---|---|
| `Button` | Auth forms, onboarding CTA |
| `Input` | Login, signup, reset-password forms |
| `Card` | Dashboard summary cards |
| `Badge` | Status indicators on cards |
| `Skeleton` | Loading state for dashboard cards |
| `ScreenHeader` | Consistent top bar with title and optional back button |
| `KeyboardAvoidingWrapper` | Wraps auth forms to handle keyboard on iOS/Android |

---

## Out of Scope for Phase 1

The following are explicitly deferred to later phases:
- Requirements list/create/detail screens (Phase 2)
- RFP list/create/detail screens (Phase 2)
- Vendor management (Phase 2)
- Evaluations, AI scoring, document upload (Phase 3)
- Approvals, contracts, reports (Phase 4)
- Real-time notifications (Phase 5)
- Biometric login / Face ID (not planned)
- Offline support (not planned)
