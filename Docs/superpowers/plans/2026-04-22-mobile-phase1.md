# Mobile App Phase 1 — Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scaffold a production-ready Expo React Native app in `mobile/` with Expo Router, NativeWind, Supabase auth, role-aware tab navigation, and a data-driven dashboard.

**Architecture:** Expo SDK 55 with Expo Router (file-based routing mirroring the Next.js webapp). Supabase session stored via AsyncStorage. Zustand holds auth state. NativeWind v4 provides Tailwind utility classes on native. Role is read from the `profiles` table after sign-in and gates which tabs are visible.

**Tech Stack:** Expo SDK 55, Expo Router v4, React Native, NativeWind v4, Tailwind CSS, Zustand v5, Zod v3, React Hook Form v7, @supabase/supabase-js v2, AsyncStorage, lucide-react-native

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `mobile/` | New Expo project root |
| Create | `mobile/app/_layout.tsx` | Root layout: session init + auth guard |
| Create | `mobile/app/(auth)/_layout.tsx` | Stack navigator for auth screens |
| Create | `mobile/app/(auth)/login.tsx` | Sign-in screen |
| Create | `mobile/app/(auth)/signup.tsx` | Sign-up screen |
| Create | `mobile/app/(auth)/reset-password.tsx` | Password reset screen |
| Create | `mobile/app/(app)/_layout.tsx` | Role-aware tab navigator |
| Create | `mobile/app/(app)/dashboard/index.tsx` | Role-aware dashboard with stat cards |
| Create | `mobile/app/(app)/requirements/index.tsx` | Placeholder (Phase 2) |
| Create | `mobile/app/(app)/rfps/index.tsx` | Placeholder (Phase 2) |
| Create | `mobile/app/(app)/approvals/index.tsx` | Placeholder (Phase 4) |
| Create | `mobile/app/(app)/contracts/index.tsx` | Placeholder (Phase 4) |
| Create | `mobile/app/(app)/vendors/index.tsx` | Placeholder (Phase 2) |
| Create | `mobile/app/(app)/settings/index.tsx` | Sign-out + profile info |
| Create | `mobile/app/onboarding/index.tsx` | One-time onboarding wizard |
| Create | `mobile/app/invite/[token].tsx` | Vendor invite deep link (placeholder) |
| Create | `mobile/global.css` | NativeWind v4 CSS entry |
| Create | `mobile/metro.config.js` | Metro + NativeWind |
| Create | `mobile/tailwind.config.js` | Tailwind content paths |
| Create | `mobile/src/lib/supabase/client.ts` | Supabase RN client |
| Create | `mobile/src/lib/schemas/auth.ts` | Zod auth schemas |
| Create | `mobile/src/types/database.ts` | Generated Supabase types |
| Create | `mobile/src/stores/auth-store.ts` | Zustand auth state |
| Create | `mobile/src/hooks/use-auth.ts` | Auth redirect hook |
| Create | `mobile/src/hooks/use-dashboard-stats.ts` | Dashboard data hook |
| Create | `mobile/src/components/ui/Button.tsx` | Pressable button |
| Create | `mobile/src/components/ui/Input.tsx` | Text input with label |
| Create | `mobile/src/components/ui/Card.tsx` | Surface card |
| Create | `mobile/src/components/ui/Badge.tsx` | Status badge |
| Create | `mobile/src/components/ui/Skeleton.tsx` | Loading placeholder |
| Create | `mobile/src/components/layout/ScreenHeader.tsx` | Screen title bar |
| Create | `mobile/src/components/layout/KeyboardAvoidingWrapper.tsx` | iOS keyboard fix |
| Create | `mobile/__tests__/auth-schemas.test.ts` | Zod schema unit tests |
| Create | `mobile/__tests__/auth-store.test.ts` | Zustand store unit tests |
| Create | `mobile/.env` | Local env vars (gitignored) |
| Create | `mobile/.env.example` | Env template (committed) |

---

## Task 1: Scaffold Expo Project

Run all commands from the **repo root** (`c:\Users\user\Desktop\AI Procurement Platform\AI Procurement Platform`).

**Files:** Creates `mobile/` with Expo SDK 55 default template

- [ ] **Step 1.1: Create the Expo project**

```bash
npx create-expo-app@latest mobile --template default@sdk-55
```

Expected: `mobile/` directory created with `app/`, `assets/`, `package.json`, `app.json`.

- [ ] **Step 1.2: Remove default template boilerplate**

Delete the files that come from the template but aren't needed:

```bash
cd mobile
Remove-Item -Recurse -Force app/(tabs)
Remove-Item -Force app/+not-found.tsx
Remove-Item -Recurse -Force components/
Remove-Item -Recurse -Force constants/
Remove-Item -Recurse -Force hooks/
Remove-Item -Recurse -Force scripts/
```

Expected: `mobile/app/` is now empty except for `_layout.tsx` (keep it — we'll replace its contents).

- [ ] **Step 1.3: Update `mobile/app.json`**

Replace the contents of `mobile/app.json` with:

```json
{
  "expo": {
    "name": "ProcureMaster",
    "slug": "procuremaster",
    "version": "1.0.0",
    "orientation": "portrait",
    "scheme": "procuremaster",
    "platforms": ["ios", "android"],
    "icon": "./assets/images/icon.png",
    "splash": {
      "image": "./assets/images/splash-icon.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "ios": {
      "supportsTablet": false,
      "bundleIdentifier": "tech.storygraph.procuremaster"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/images/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "package": "tech.storygraph.procuremaster"
    },
    "plugins": ["expo-router"],
    "experiments": {
      "typedRoutes": true
    }
  }
}
```

- [ ] **Step 1.4: Update `mobile/package.json` main entry**

Open `mobile/package.json`. Find the `"main"` field (or add it if missing) and ensure it reads:

```json
"main": "expo-router/entry"
```

- [ ] **Step 1.5: Create the `src/` directory structure**

```bash
mkdir -p src/components/ui
mkdir -p src/components/layout
mkdir -p src/lib/supabase
mkdir -p src/lib/schemas
mkdir -p src/types
mkdir -p src/stores
mkdir -p src/hooks
mkdir -p __tests__
```

- [ ] **Step 1.6: Create `.env.example`**

Create `mobile/.env.example`:

```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_GEMINI_API_KEY=
EXPO_PUBLIC_APP_URL=
```

- [ ] **Step 1.7: Create `.env` with real values**

Create `mobile/.env` (this file is gitignored by default in Expo projects):

```
EXPO_PUBLIC_SUPABASE_URL=https://ozciqmydakcdyhnughga.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<copy from webapp .env.local>
EXPO_PUBLIC_GEMINI_API_KEY=<copy from webapp .env.local>
EXPO_PUBLIC_APP_URL=https://procuremaster.vercel.app
```

- [ ] **Step 1.8: Commit**

```bash
cd ..
git add mobile/
git commit -m "feat(mobile): scaffold Expo SDK 55 project with Expo Router"
```

---

## Task 2: Install Dependencies

**Files:** Modifies `mobile/package.json` and `mobile/package-lock.json`

- [ ] **Step 2.1: Install NativeWind and Tailwind**

```bash
cd mobile
npm install nativewind@^4.1.6 tailwindcss@^3.4.0
```

- [ ] **Step 2.2: Install Supabase + AsyncStorage + URL polyfill**

```bash
npx expo install @supabase/supabase-js @react-native-async-storage/async-storage react-native-url-polyfill
```

- [ ] **Step 2.3: Install state management + validation**

```bash
npm install zustand@^5.0.0 zod@^3.22.4 react-hook-form@^7.49.3 @hookform/resolvers@^3.3.4
```

- [ ] **Step 2.4: Install icons**

```bash
npm install lucide-react-native
npx expo install react-native-svg
```

- [ ] **Step 2.5: Verify no peer dependency errors**

```bash
npx expo-doctor
```

Expected: No critical errors. Warnings about minor version mismatches are acceptable.

- [ ] **Step 2.6: Commit**

```bash
cd ..
git add mobile/package.json mobile/package-lock.json
git commit -m "feat(mobile): install NativeWind, Supabase, Zustand, Zod, icons"
```

---

## Task 3: Configure NativeWind v4

**Files:**
- Create: `mobile/metro.config.js`
- Create: `mobile/tailwind.config.js`
- Create: `mobile/global.css`
- Modify: `mobile/tsconfig.json`

- [ ] **Step 3.1: Create `mobile/metro.config.js`**

```js
const { getDefaultConfig } = require('expo/metro-config')
const { withNativewind } = require('nativewind/metro')

const config = getDefaultConfig(__dirname)

module.exports = withNativewind(config, { input: './global.css' })
```

- [ ] **Step 3.2: Create `mobile/tailwind.config.js`**

```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eef2ff',
          100: '#e0e7ff',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
        },
      },
    },
  },
  plugins: [],
}
```

- [ ] **Step 3.3: Create `mobile/global.css`**

```css
@import "tailwindcss/theme.css" layer(theme);
@import "tailwindcss/preflight.css" layer(base);
@import "tailwindcss/utilities.css";
@import "nativewind/theme";
```

- [ ] **Step 3.4: Update `mobile/tsconfig.json`**

Replace `mobile/tsconfig.json` with:

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": [
    "**/*.ts",
    "**/*.tsx",
    ".expo/types/**/*.d.ts",
    "nativewind-env.d.ts"
  ]
}
```

- [ ] **Step 3.5: Commit**

```bash
cd ..
git add mobile/metro.config.js mobile/tailwind.config.js mobile/global.css mobile/tsconfig.json
git commit -m "feat(mobile): configure NativeWind v4 with Tailwind"
```

---

## Task 4: Supabase Types + Client + Auth Schemas

**Files:**
- Create: `mobile/src/types/database.ts`
- Create: `mobile/src/lib/supabase/client.ts`
- Create: `mobile/src/lib/schemas/auth.ts`

- [ ] **Step 4.1: Generate Supabase TypeScript types**

Run from the **repo root** (not `mobile/`):

```bash
supabase gen types typescript --project-id ozciqmydakcdyhnughga > mobile/src/types/database.ts
```

Expected: `mobile/src/types/database.ts` is created with a `Database` type containing all table definitions.

- [ ] **Step 4.2: Create `mobile/src/lib/supabase/client.ts`**

```ts
import 'react-native-url-polyfill/auto'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '../../types/database'

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

- [ ] **Step 4.3: Create `mobile/src/lib/schemas/auth.ts`**

```ts
import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export const signupSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  orgName: z.string().min(2, 'Organisation name must be at least 2 characters'),
  currency: z.enum(['USD', 'EUR', 'GBP', 'AUD', 'CAD']),
})

export const resetPasswordSchema = z.object({
  email: z.string().email('Enter a valid email address'),
})

export type LoginFormData = z.infer<typeof loginSchema>
export type SignupFormData = z.infer<typeof signupSchema>
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>
```

- [ ] **Step 4.4: Write auth schema tests**

Create `mobile/__tests__/auth-schemas.test.ts`:

```ts
import { loginSchema, signupSchema, resetPasswordSchema } from '../src/lib/schemas/auth'

describe('loginSchema', () => {
  it('passes with valid email and password', () => {
    const result = loginSchema.safeParse({ email: 'test@example.com', password: 'password123' })
    expect(result.success).toBe(true)
  })

  it('fails with invalid email', () => {
    const result = loginSchema.safeParse({ email: 'not-an-email', password: 'password123' })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].message).toBe('Enter a valid email address')
  })

  it('fails with password under 6 characters', () => {
    const result = loginSchema.safeParse({ email: 'test@example.com', password: 'abc' })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].message).toBe('Password must be at least 6 characters')
  })
})

describe('signupSchema', () => {
  const valid = {
    fullName: 'Alex Manager',
    email: 'alex@example.com',
    password: 'password123',
    orgName: 'Acme Corp',
    currency: 'USD' as const,
  }

  it('passes with all valid fields', () => {
    expect(signupSchema.safeParse(valid).success).toBe(true)
  })

  it('fails with invalid currency', () => {
    const result = signupSchema.safeParse({ ...valid, currency: 'JPY' })
    expect(result.success).toBe(false)
  })

  it('fails with short org name', () => {
    const result = signupSchema.safeParse({ ...valid, orgName: 'A' })
    expect(result.success).toBe(false)
  })
})

describe('resetPasswordSchema', () => {
  it('passes with valid email', () => {
    expect(resetPasswordSchema.safeParse({ email: 'test@example.com' }).success).toBe(true)
  })

  it('fails with invalid email', () => {
    expect(resetPasswordSchema.safeParse({ email: 'bad' }).success).toBe(false)
  })
})
```

- [ ] **Step 4.5: Run schema tests**

```bash
cd mobile
npx jest __tests__/auth-schemas.test.ts --no-coverage
```

Expected: 7 tests pass.

- [ ] **Step 4.6: Commit**

```bash
cd ..
git add mobile/src/ mobile/__tests__/auth-schemas.test.ts
git commit -m "feat(mobile): add Supabase client, generated types, Zod auth schemas"
```

---

## Task 5: Auth Store + Hook

**Files:**
- Create: `mobile/src/stores/auth-store.ts`
- Create: `mobile/src/hooks/use-auth.ts`
- Create: `mobile/__tests__/auth-store.test.ts`

- [ ] **Step 5.1: Create `mobile/src/stores/auth-store.ts`**

```ts
import { create } from 'zustand'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase/client'

interface Profile {
  id: string
  org_id: string
  full_name: string
  role: string
  onboarding_complete: boolean
}

interface AuthState {
  session: Session | null
  profile: Profile | null
  isLoading: boolean
  setSession: (session: Session | null) => void
  setProfile: (profile: Profile | null) => void
  fetchProfile: (userId: string) => Promise<void>
  signOut: () => Promise<void>
  reset: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  profile: null,
  isLoading: true,

  setSession: (session) => set({ session }),

  setProfile: (profile) => set({ profile }),

  fetchProfile: async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, org_id, full_name, role, onboarding_complete')
      .eq('id', userId)
      .single()

    if (!error && data) {
      set({ profile: data as Profile })
    }
  },

  signOut: async () => {
    await supabase.auth.signOut()
    set({ session: null, profile: null })
  },

  reset: () => set({ session: null, profile: null, isLoading: false }),
}))
```

- [ ] **Step 5.2: Create `mobile/src/hooks/use-auth.ts`**

```ts
import { useEffect } from 'react'
import { useRouter, useSegments } from 'expo-router'
import { supabase } from '../lib/supabase/client'
import { useAuthStore } from '../stores/auth-store'

export function useAuth() {
  const { session, profile, isLoading, setSession, fetchProfile, reset } = useAuthStore()
  const router = useRouter()
  const segments = useSegments()

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        setSession(newSession)

        if (newSession?.user) {
          await fetchProfile(newSession.user.id)
        } else {
          reset()
        }

        useAuthStore.setState({ isLoading: false })
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (isLoading) return

    const inAuthGroup = segments[0] === '(auth)'
    const inOnboarding = segments[0] === 'onboarding'

    if (!session) {
      if (!inAuthGroup) router.replace('/(auth)/login')
    } else if (profile && !profile.onboarding_complete) {
      if (!inOnboarding) router.replace('/onboarding')
    } else if (profile?.onboarding_complete) {
      if (inAuthGroup || inOnboarding) router.replace('/(app)/dashboard')
    }
  }, [session, profile, isLoading, segments])

  return { session, profile, isLoading }
}
```

- [ ] **Step 5.3: Write auth store tests**

Create `mobile/__tests__/auth-store.test.ts`:

```ts
import { useAuthStore } from '../src/stores/auth-store'

jest.mock('../src/lib/supabase/client', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({
            data: {
              id: 'user-1',
              org_id: 'org-1',
              full_name: 'Test User',
              role: 'procurement_manager',
              onboarding_complete: true,
            },
            error: null,
          })),
        })),
      })),
    })),
    auth: {
      signOut: jest.fn(() => Promise.resolve({ error: null })),
    },
  },
}))

describe('useAuthStore', () => {
  beforeEach(() => {
    useAuthStore.setState({
      session: null,
      profile: null,
      isLoading: true,
    })
  })

  it('setSession updates session', () => {
    const fakeSession = { user: { id: 'user-1' } } as any
    useAuthStore.getState().setSession(fakeSession)
    expect(useAuthStore.getState().session).toEqual(fakeSession)
  })

  it('setProfile updates profile', () => {
    const fakeProfile = {
      id: 'user-1',
      org_id: 'org-1',
      full_name: 'Test',
      role: 'procurement_manager',
      onboarding_complete: true,
    }
    useAuthStore.getState().setProfile(fakeProfile)
    expect(useAuthStore.getState().profile?.role).toBe('procurement_manager')
  })

  it('fetchProfile populates profile from Supabase', async () => {
    await useAuthStore.getState().fetchProfile('user-1')
    expect(useAuthStore.getState().profile?.full_name).toBe('Test User')
    expect(useAuthStore.getState().profile?.role).toBe('procurement_manager')
  })

  it('signOut clears session and profile', async () => {
    useAuthStore.setState({
      session: { user: { id: 'user-1' } } as any,
      profile: { id: 'user-1', org_id: 'org-1', full_name: 'Test', role: 'pm', onboarding_complete: true },
    })
    await useAuthStore.getState().signOut()
    expect(useAuthStore.getState().session).toBeNull()
    expect(useAuthStore.getState().profile).toBeNull()
  })

  it('reset clears all state', () => {
    useAuthStore.setState({ session: { user: {} } as any, profile: { id: '1' } as any })
    useAuthStore.getState().reset()
    expect(useAuthStore.getState().session).toBeNull()
    expect(useAuthStore.getState().profile).toBeNull()
  })
})
```

- [ ] **Step 5.4: Run auth store tests**

```bash
cd mobile
npx jest __tests__/auth-store.test.ts --no-coverage
```

Expected: 5 tests pass.

- [ ] **Step 5.5: Commit**

```bash
cd ..
git add mobile/src/stores/ mobile/src/hooks/ mobile/__tests__/auth-store.test.ts
git commit -m "feat(mobile): add Zustand auth store and useAuth hook"
```

---

## Task 6: UI Component Library

**Files:**
- Create: `mobile/src/components/ui/Button.tsx`
- Create: `mobile/src/components/ui/Input.tsx`
- Create: `mobile/src/components/ui/Card.tsx`
- Create: `mobile/src/components/ui/Badge.tsx`
- Create: `mobile/src/components/ui/Skeleton.tsx`
- Create: `mobile/src/components/layout/ScreenHeader.tsx`
- Create: `mobile/src/components/layout/KeyboardAvoidingWrapper.tsx`

- [ ] **Step 6.1: Create `mobile/src/components/ui/Button.tsx`**

```tsx
import { Pressable, Text, ActivityIndicator } from 'react-native'

interface ButtonProps {
  onPress: () => void
  label: string
  variant?: 'primary' | 'outline' | 'ghost'
  loading?: boolean
  disabled?: boolean
  fullWidth?: boolean
}

export function Button({
  onPress,
  label,
  variant = 'primary',
  loading = false,
  disabled = false,
  fullWidth = true,
}: ButtonProps) {
  const base = 'rounded-xl py-3.5 px-6 items-center justify-center flex-row gap-2'
  const variants = {
    primary: 'bg-primary-600 active:bg-primary-700',
    outline: 'border border-primary-600 active:bg-primary-50',
    ghost: 'active:bg-slate-100',
  }
  const textVariants = {
    primary: 'text-white font-semibold text-base',
    outline: 'text-primary-600 font-semibold text-base',
    ghost: 'text-slate-700 font-medium text-base',
  }

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      className={`${base} ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${disabled || loading ? 'opacity-50' : ''}`}
    >
      {loading && <ActivityIndicator size="small" color={variant === 'primary' ? '#fff' : '#4f46e5'} />}
      <Text className={textVariants[variant]}>{label}</Text>
    </Pressable>
  )
}
```

- [ ] **Step 6.2: Create `mobile/src/components/ui/Input.tsx`**

```tsx
import { View, Text, TextInput, TextInputProps } from 'react-native'

interface InputProps extends TextInputProps {
  label?: string
  error?: string
}

export function Input({ label, error, ...props }: InputProps) {
  return (
    <View className="gap-1.5">
      {label && (
        <Text className="text-sm font-medium text-slate-700">{label}</Text>
      )}
      <TextInput
        {...props}
        className={`border rounded-xl px-4 py-3 text-base text-slate-900 bg-white
          ${error ? 'border-red-400' : 'border-slate-200'}
          ${props.editable === false ? 'bg-slate-50 text-slate-400' : ''}`}
        placeholderTextColor="#94a3b8"
      />
      {error && (
        <Text className="text-xs text-red-500">{error}</Text>
      )}
    </View>
  )
}
```

- [ ] **Step 6.3: Create `mobile/src/components/ui/Card.tsx`**

```tsx
import { View, Text, Pressable } from 'react-native'

interface CardProps {
  title: string
  value: string | number
  subtitle?: string
  onPress?: () => void
}

export function Card({ title, value, subtitle, onPress }: CardProps) {
  const Wrapper = onPress ? Pressable : View

  return (
    <Wrapper
      onPress={onPress}
      className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 active:bg-slate-50"
    >
      <Text className="text-sm font-medium text-slate-500 mb-1">{title}</Text>
      <Text className="text-3xl font-bold text-slate-900">{value}</Text>
      {subtitle && (
        <Text className="text-xs text-slate-400 mt-1">{subtitle}</Text>
      )}
    </Wrapper>
  )
}
```

- [ ] **Step 6.4: Create `mobile/src/components/ui/Badge.tsx`**

```tsx
import { View, Text } from 'react-native'

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info'

interface BadgeProps {
  label: string
  variant?: BadgeVariant
}

const variantStyles: Record<BadgeVariant, { container: string; text: string }> = {
  default: { container: 'bg-slate-100', text: 'text-slate-600' },
  success: { container: 'bg-green-100', text: 'text-green-700' },
  warning: { container: 'bg-amber-100', text: 'text-amber-700' },
  danger: { container: 'bg-red-100', text: 'text-red-700' },
  info: { container: 'bg-blue-100', text: 'text-blue-700' },
}

export function Badge({ label, variant = 'default' }: BadgeProps) {
  const styles = variantStyles[variant]
  return (
    <View className={`rounded-full px-2.5 py-0.5 self-start ${styles.container}`}>
      <Text className={`text-xs font-medium ${styles.text}`}>{label}</Text>
    </View>
  )
}
```

- [ ] **Step 6.5: Create `mobile/src/components/ui/Skeleton.tsx`**

```tsx
import { useEffect, useRef } from 'react'
import { Animated, View } from 'react-native'

interface SkeletonProps {
  className?: string
  width?: number | string
  height?: number
}

export function Skeleton({ className = '', height = 20 }: SkeletonProps) {
  const opacity = useRef(new Animated.Value(0.3)).current

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 700, useNativeDriver: true }),
      ])
    ).start()
  }, [])

  return (
    <Animated.View
      style={{ opacity, height }}
      className={`bg-slate-200 rounded-lg ${className}`}
    />
  )
}

export function CardSkeleton() {
  return (
    <View className="bg-white rounded-2xl p-5 border border-slate-100">
      <Skeleton className="w-24" height={14} />
      <View className="mt-2">
        <Skeleton className="w-16" height={32} />
      </View>
    </View>
  )
}
```

- [ ] **Step 6.6: Create `mobile/src/components/layout/ScreenHeader.tsx`**

```tsx
import { View, Text, Pressable } from 'react-native'
import { useRouter } from 'expo-router'
import { ArrowLeft } from 'lucide-react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

interface ScreenHeaderProps {
  title: string
  showBack?: boolean
}

export function ScreenHeader({ title, showBack = false }: ScreenHeaderProps) {
  const router = useRouter()
  const insets = useSafeAreaInsets()

  return (
    <View
      style={{ paddingTop: insets.top }}
      className="bg-white border-b border-slate-100 px-4 pb-3"
    >
      <View className="flex-row items-center gap-3 mt-2">
        {showBack && (
          <Pressable onPress={() => router.back()} className="p-1 -ml-1">
            <ArrowLeft size={22} color="#475569" />
          </Pressable>
        )}
        <Text className="text-xl font-bold text-slate-900">{title}</Text>
      </View>
    </View>
  )
}
```

- [ ] **Step 6.7: Create `mobile/src/components/layout/KeyboardAvoidingWrapper.tsx`**

```tsx
import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native'

interface KeyboardAvoidingWrapperProps {
  children: React.ReactNode
}

export function KeyboardAvoidingWrapper({ children }: KeyboardAvoidingWrapperProps) {
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1"
    >
      <ScrollView
        contentContainerClassName="flex-grow"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
```

- [ ] **Step 6.8: Commit**

```bash
cd ..
git add mobile/src/components/
git commit -m "feat(mobile): add UI component library (Button, Input, Card, Badge, Skeleton, layout)"
```

---

## Task 7: Root Layout + Auth Guard

**Files:**
- Modify: `mobile/app/_layout.tsx`
- Create: `mobile/app/(auth)/_layout.tsx`

- [ ] **Step 7.1: Replace `mobile/app/_layout.tsx`**

```tsx
import '../global.css'
import { useEffect } from 'react'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { useAuth } from '@/src/hooks/use-auth'

function RootLayoutInner() {
  useAuth()

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(app)" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="invite" />
    </Stack>
  )
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <RootLayoutInner />
      <StatusBar style="dark" />
    </SafeAreaProvider>
  )
}
```

- [ ] **Step 7.2: Create `mobile/app/(auth)/_layout.tsx`**

```tsx
import { Stack } from 'expo-router'

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="signup" />
      <Stack.Screen name="reset-password" />
    </Stack>
  )
}
```

- [ ] **Step 7.3: Verify Expo starts without errors**

```bash
cd mobile
npx expo start
```

Expected: QR code appears. Scan with Expo Go. The app loads without crashing (it will show a blank screen since auth screens don't exist yet — that's fine).

- [ ] **Step 7.4: Commit**

```bash
cd ..
git add mobile/app/_layout.tsx mobile/app/(auth)/_layout.tsx
git commit -m "feat(mobile): add root layout with auth guard and SafeAreaProvider"
```

---

## Task 8: Login Screen

**Files:**
- Create: `mobile/app/(auth)/login.tsx`

- [ ] **Step 8.1: Create `mobile/app/(auth)/login.tsx`**

```tsx
import { View, Text, Pressable, Alert } from 'react-native'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { supabase } from '@/src/lib/supabase/client'
import { loginSchema, type LoginFormData } from '@/src/lib/schemas/auth'
import { Button } from '@/src/components/ui/Button'
import { Input } from '@/src/components/ui/Input'
import { KeyboardAvoidingWrapper } from '@/src/components/layout/KeyboardAvoidingWrapper'

export default function LoginScreen() {
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  async function onSubmit({ email, password }: LoginFormData) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      Alert.alert('Sign in failed', error.message)
    }
    // Success: useAuth hook handles redirect automatically
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingWrapper>
        <View className="flex-1 px-6 pt-16 pb-8 justify-between">
          <View className="gap-8">
            <View className="gap-2">
              <Text className="text-3xl font-bold text-slate-900">Welcome back</Text>
              <Text className="text-base text-slate-500">Sign in to ProcureMaster</Text>
            </View>

            <View className="gap-4">
              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="Email"
                    placeholder="you@company.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.email?.message}
                  />
                )}
              />

              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="Password"
                    placeholder="••••••••"
                    secureTextEntry
                    autoComplete="current-password"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.password?.message}
                  />
                )}
              />

              <Link href="/(auth)/reset-password" asChild>
                <Pressable>
                  <Text className="text-sm text-primary-600 font-medium text-right">Forgot password?</Text>
                </Pressable>
              </Link>
            </View>

            <Button
              label="Sign in"
              onPress={handleSubmit(onSubmit)}
              loading={isSubmitting}
            />
          </View>

          <View className="flex-row justify-center gap-1">
            <Text className="text-slate-500 text-sm">Don't have an account?</Text>
            <Link href="/(auth)/signup" asChild>
              <Pressable>
                <Text className="text-primary-600 font-medium text-sm">Create one</Text>
              </Pressable>
            </Link>
          </View>
        </View>
      </KeyboardAvoidingWrapper>
    </SafeAreaView>
  )
}
```

- [ ] **Step 8.2: Test on device**

With `npx expo start` running, scan with Expo Go. The login screen should appear with email/password fields. Try submitting empty fields — validation errors should appear inline.

- [ ] **Step 8.3: Commit**

```bash
cd ..
git add mobile/app/(auth)/login.tsx
git commit -m "feat(mobile): add login screen with Zod validation"
```

---

## Task 9: Signup Screen

**Files:**
- Create: `mobile/app/(auth)/signup.tsx`

- [ ] **Step 9.1: Create `mobile/app/(auth)/signup.tsx`**

```tsx
import { View, Text, Pressable, Alert, ScrollView } from 'react-native'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { supabase } from '@/src/lib/supabase/client'
import { signupSchema, type SignupFormData } from '@/src/lib/schemas/auth'
import { Button } from '@/src/components/ui/Button'
import { Input } from '@/src/components/ui/Input'

const CURRENCIES = ['USD', 'EUR', 'GBP', 'AUD', 'CAD'] as const

export default function SignupScreen() {
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      orgName: '',
      currency: 'USD',
    },
  })

  async function onSubmit({ fullName, email, password, orgName, currency }: SignupFormData) {
    // 1. Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({ email, password })
    if (authError || !authData.user) {
      Alert.alert('Sign up failed', authError?.message ?? 'Unknown error')
      return
    }

    const userId = authData.user.id
    const slug = orgName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

    // 2. Create organisation
    const { data: org, error: orgError } = await supabase
      .from('organisations')
      .insert({ name: orgName, slug, currency })
      .select('id')
      .single()

    if (orgError || !org) {
      Alert.alert('Setup failed', 'Could not create organisation. Please try again.')
      return
    }

    // 3. Create profile
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        org_id: org.id,
        full_name: fullName,
        role: 'procurement_manager',
        onboarding_complete: false,
      })

    if (profileError) {
      Alert.alert('Setup failed', 'Could not create profile. Please try again.')
      return
    }

    // Success: useAuth hook picks up the new session and redirects to onboarding
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView
        contentContainerClassName="px-6 pt-12 pb-10 gap-8"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="gap-2">
          <Text className="text-3xl font-bold text-slate-900">Create account</Text>
          <Text className="text-base text-slate-500">Set up your procurement workspace</Text>
        </View>

        <View className="gap-4">
          <Controller
            control={control}
            name="fullName"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Full name"
                placeholder="Alex Manager"
                autoComplete="name"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.fullName?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Work email"
                placeholder="you@company.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.email?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Password"
                placeholder="Min. 6 characters"
                secureTextEntry
                autoComplete="new-password"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.password?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="orgName"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Organisation name"
                placeholder="Acme Corp"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.orgName?.message}
              />
            )}
          />

          <View className="gap-1.5">
            <Text className="text-sm font-medium text-slate-700">Currency</Text>
            <Controller
              control={control}
              name="currency"
              render={({ field: { onChange, value } }) => (
                <View className="flex-row gap-2 flex-wrap">
                  {CURRENCIES.map((c) => (
                    <Pressable
                      key={c}
                      onPress={() => onChange(c)}
                      className={`px-4 py-2 rounded-lg border ${
                        value === c
                          ? 'bg-primary-600 border-primary-600'
                          : 'bg-white border-slate-200'
                      }`}
                    >
                      <Text className={`font-medium text-sm ${value === c ? 'text-white' : 'text-slate-700'}`}>
                        {c}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              )}
            />
          </View>
        </View>

        <Button
          label="Create account"
          onPress={handleSubmit(onSubmit)}
          loading={isSubmitting}
        />

        <View className="flex-row justify-center gap-1">
          <Text className="text-slate-500 text-sm">Already have an account?</Text>
          <Link href="/(auth)/login" asChild>
            <Pressable>
              <Text className="text-primary-600 font-medium text-sm">Sign in</Text>
            </Pressable>
          </Link>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
```

- [ ] **Step 9.2: Test on device**

Navigate to the signup screen from login. Verify all fields render, currency buttons toggle correctly, and validation messages appear on empty submit.

- [ ] **Step 9.3: Commit**

```bash
cd ..
git add mobile/app/(auth)/signup.tsx
git commit -m "feat(mobile): add signup screen with org creation"
```

---

## Task 10: Reset Password Screen

**Files:**
- Create: `mobile/app/(auth)/reset-password.tsx`

- [ ] **Step 10.1: Create `mobile/app/(auth)/reset-password.tsx`**

```tsx
import { View, Text, Pressable, Alert } from 'react-native'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { supabase } from '@/src/lib/supabase/client'
import { resetPasswordSchema, type ResetPasswordFormData } from '@/src/lib/schemas/auth'
import { Button } from '@/src/components/ui/Button'
import { Input } from '@/src/components/ui/Input'
import { ScreenHeader } from '@/src/components/layout/ScreenHeader'
import { KeyboardAvoidingWrapper } from '@/src/components/layout/KeyboardAvoidingWrapper'

export default function ResetPasswordScreen() {
  const router = useRouter()
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { email: '' },
  })

  async function onSubmit({ email }: ResetPasswordFormData) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'procuremaster://update-password',
    })

    if (error) {
      Alert.alert('Error', error.message)
      return
    }

    Alert.alert(
      'Check your email',
      'We sent a password reset link to ' + email,
      [{ text: 'OK', onPress: () => router.back() }]
    )
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScreenHeader title="Reset password" showBack />
      <KeyboardAvoidingWrapper>
        <View className="flex-1 px-6 pt-8 gap-6">
          <Text className="text-slate-500 text-base">
            Enter your work email and we'll send you a link to reset your password.
          </Text>

          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Email"
                placeholder="you@company.com"
                keyboardType="email-address"
                autoCapitalize="none"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.email?.message}
              />
            )}
          />

          <Button
            label="Send reset link"
            onPress={handleSubmit(onSubmit)}
            loading={isSubmitting}
          />
        </View>
      </KeyboardAvoidingWrapper>
    </SafeAreaView>
  )
}
```

- [ ] **Step 10.2: Test on device**

Navigate from login → "Forgot password?" → verify the reset screen renders with a back button and email field.

- [ ] **Step 10.3: Commit**

```bash
cd ..
git add mobile/app/(auth)/reset-password.tsx
git commit -m "feat(mobile): add reset password screen"
```

---

## Task 11: Onboarding Screen

**Files:**
- Create: `mobile/app/onboarding/index.tsx`

- [ ] **Step 11.1: Create `mobile/app/onboarding/index.tsx`**

```tsx
import { View, Text, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { supabase } from '@/src/lib/supabase/client'
import { useAuthStore } from '@/src/stores/auth-store'
import { Button } from '@/src/components/ui/Button'
import { useState } from 'react'

export default function OnboardingScreen() {
  const { profile, setProfile } = useAuthStore()
  const [loading, setLoading] = useState(false)

  const roleLabel: Record<string, string> = {
    procurement_manager: 'Procurement Manager',
    department_head: 'Department Head',
    finance_approver: 'Finance Approver',
    vendor: 'Vendor',
  }

  async function handleGetStarted() {
    if (!profile) return
    setLoading(true)

    const { error } = await supabase
      .from('profiles')
      .update({ onboarding_complete: true })
      .eq('id', profile.id)

    if (error) {
      Alert.alert('Error', 'Could not complete setup. Please try again.')
      setLoading(false)
      return
    }

    setProfile({ ...profile, onboarding_complete: true })
    // useAuth hook detects onboarding_complete: true and redirects to dashboard
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 px-6 pt-16 pb-10 justify-between">
        <View className="gap-6">
          <View className="w-16 h-16 rounded-2xl bg-primary-600 items-center justify-center">
            <Text className="text-white text-2xl font-bold">P</Text>
          </View>

          <View className="gap-3">
            <Text className="text-3xl font-bold text-slate-900">
              Welcome, {profile?.full_name?.split(' ')[0]}!
            </Text>
            <Text className="text-base text-slate-500 leading-relaxed">
              Your workspace is ready. You're set up as{' '}
              <Text className="font-semibold text-slate-700">
                {roleLabel[profile?.role ?? ''] ?? profile?.role}
              </Text>
              .
            </Text>
          </View>

          <View className="bg-slate-50 rounded-2xl p-5 gap-3">
            <Text className="font-semibold text-slate-900">What you can do:</Text>
            {profile?.role === 'procurement_manager' && (
              <View className="gap-2">
                <Text className="text-slate-600">• Create and manage RFPs</Text>
                <Text className="text-slate-600">• Invite and evaluate vendors</Text>
                <Text className="text-slate-600">• Track the full procurement lifecycle</Text>
              </View>
            )}
            {profile?.role === 'department_head' && (
              <View className="gap-2">
                <Text className="text-slate-600">• Submit procurement requirements</Text>
                <Text className="text-slate-600">• Track RFP progress</Text>
                <Text className="text-slate-600">• View evaluation results</Text>
              </View>
            )}
            {profile?.role === 'finance_approver' && (
              <View className="gap-2">
                <Text className="text-slate-600">• Review and approve vendor selections</Text>
                <Text className="text-slate-600">• Manage contracts</Text>
                <Text className="text-slate-600">• Track spend commitments</Text>
              </View>
            )}
            {profile?.role === 'vendor' && (
              <View className="gap-2">
                <Text className="text-slate-600">• View RFP invitations</Text>
                <Text className="text-slate-600">• Submit your proposals</Text>
                <Text className="text-slate-600">• Track your evaluation status</Text>
              </View>
            )}
          </View>
        </View>

        <Button label="Get started" onPress={handleGetStarted} loading={loading} />
      </View>
    </SafeAreaView>
  )
}
```

- [ ] **Step 11.2: Test on device**

Sign up as a new user. After signup, the onboarding screen should appear. Tapping "Get started" should redirect to the dashboard.

- [ ] **Step 11.3: Commit**

```bash
cd ..
git add mobile/app/onboarding/
git commit -m "feat(mobile): add onboarding screen"
```

---

## Task 12: Role-Aware Tab Navigator + Placeholder Screens

**Files:**
- Create: `mobile/app/(app)/_layout.tsx`
- Create: `mobile/app/(app)/requirements/index.tsx`
- Create: `mobile/app/(app)/rfps/index.tsx`
- Create: `mobile/app/(app)/approvals/index.tsx`
- Create: `mobile/app/(app)/contracts/index.tsx`
- Create: `mobile/app/(app)/vendors/index.tsx`
- Create: `mobile/app/invite/[token].tsx`

- [ ] **Step 12.1: Create `mobile/app/(app)/_layout.tsx`**

```tsx
import { Tabs } from 'expo-router'
import { useAuthStore } from '@/src/stores/auth-store'
import {
  LayoutDashboard,
  FileText,
  ClipboardList,
  Users,
  Settings,
  CheckSquare,
  FileCheck,
} from 'lucide-react-native'

const ROLE_TABS: Record<string, string[]> = {
  procurement_manager: ['dashboard', 'requirements', 'rfps', 'vendors', 'settings'],
  department_head: ['dashboard', 'requirements', 'rfps', 'settings'],
  finance_approver: ['dashboard', 'approvals', 'contracts', 'settings'],
  vendor: ['dashboard', 'settings'],
}

export default function AppLayout() {
  const { profile } = useAuthStore()
  const allowed = ROLE_TABS[profile?.role ?? ''] ?? ['dashboard', 'settings']

  const show = (name: string) => (allowed.includes(name) ? undefined : null)

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#4f46e5',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarStyle: {
          borderTopColor: '#f1f5f9',
          backgroundColor: '#ffffff',
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '500' },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          href: show('dashboard'),
          tabBarIcon: ({ color }) => <LayoutDashboard size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="requirements"
        options={{
          title: 'Requirements',
          href: show('requirements'),
          tabBarIcon: ({ color }) => <FileText size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="rfps"
        options={{
          title: 'RFPs',
          href: show('rfps'),
          tabBarIcon: ({ color }) => <ClipboardList size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="vendors"
        options={{
          title: 'Vendors',
          href: show('vendors'),
          tabBarIcon: ({ color }) => <Users size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="approvals"
        options={{
          title: 'Approvals',
          href: show('approvals'),
          tabBarIcon: ({ color }) => <CheckSquare size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="contracts"
        options={{
          title: 'Contracts',
          href: show('contracts'),
          tabBarIcon: ({ color }) => <FileCheck size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          href: show('settings'),
          tabBarIcon: ({ color }) => <Settings size={22} color={color} />,
        }}
      />
    </Tabs>
  )
}
```

- [ ] **Step 12.2: Create placeholder screens**

Create `mobile/app/(app)/requirements/index.tsx`:

```tsx
import { View, Text } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ScreenHeader } from '@/src/components/layout/ScreenHeader'

export default function RequirementsScreen() {
  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <ScreenHeader title="Requirements" />
      <View className="flex-1 items-center justify-center gap-2">
        <Text className="text-slate-400 text-base">Coming in Phase 2</Text>
      </View>
    </SafeAreaView>
  )
}
```

Create `mobile/app/(app)/rfps/index.tsx`:

```tsx
import { View, Text } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ScreenHeader } from '@/src/components/layout/ScreenHeader'

export default function RfpsScreen() {
  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <ScreenHeader title="RFPs" />
      <View className="flex-1 items-center justify-center gap-2">
        <Text className="text-slate-400 text-base">Coming in Phase 2</Text>
      </View>
    </SafeAreaView>
  )
}
```

Create `mobile/app/(app)/vendors/index.tsx`:

```tsx
import { View, Text } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ScreenHeader } from '@/src/components/layout/ScreenHeader'

export default function VendorsScreen() {
  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <ScreenHeader title="Vendors" />
      <View className="flex-1 items-center justify-center gap-2">
        <Text className="text-slate-400 text-base">Coming in Phase 2</Text>
      </View>
    </SafeAreaView>
  )
}
```

Create `mobile/app/(app)/approvals/index.tsx`:

```tsx
import { View, Text } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ScreenHeader } from '@/src/components/layout/ScreenHeader'

export default function ApprovalsScreen() {
  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <ScreenHeader title="Approvals" />
      <View className="flex-1 items-center justify-center gap-2">
        <Text className="text-slate-400 text-base">Coming in Phase 4</Text>
      </View>
    </SafeAreaView>
  )
}
```

Create `mobile/app/(app)/contracts/index.tsx`:

```tsx
import { View, Text } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ScreenHeader } from '@/src/components/layout/ScreenHeader'

export default function ContractsScreen() {
  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <ScreenHeader title="Contracts" />
      <View className="flex-1 items-center justify-center gap-2">
        <Text className="text-slate-400 text-base">Coming in Phase 4</Text>
      </View>
    </SafeAreaView>
  )
}
```

Create `mobile/app/invite/[token].tsx`:

```tsx
import { View, Text } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams } from 'expo-router'

export default function InviteScreen() {
  const { token } = useLocalSearchParams<{ token: string }>()
  return (
    <SafeAreaView className="flex-1 bg-white items-center justify-center px-6">
      <Text className="text-xl font-bold text-slate-900 text-center">Vendor Invite</Text>
      <Text className="text-slate-500 text-center mt-2">Token: {token}</Text>
      <Text className="text-slate-400 text-center mt-4">Full implementation in Phase 2</Text>
    </SafeAreaView>
  )
}
```

- [ ] **Step 12.3: Test on device**

Sign in and verify:
- A procurement_manager sees: Dashboard, Requirements, RFPs, Vendors, Settings tabs
- Tapping Requirements/RFPs/Vendors shows "Coming in Phase 2"

To test other roles quickly, create a test user with a different role directly in the Supabase Dashboard → Table Editor → profiles table.

- [ ] **Step 12.4: Commit**

```bash
cd ..
git add mobile/app/(app)/ mobile/app/invite/
git commit -m "feat(mobile): add role-aware tab navigator and placeholder screens"
```

---

## Task 13: Dashboard Screen

**Files:**
- Create: `mobile/src/hooks/use-dashboard-stats.ts`
- Create: `mobile/app/(app)/dashboard/index.tsx`

- [ ] **Step 13.1: Create `mobile/src/hooks/use-dashboard-stats.ts`**

```ts
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase/client'
import { useAuthStore } from '../stores/auth-store'

interface ProcurementManagerStats {
  activeRfps: number
  pendingEvaluations: number
  openRequirements: number
}

interface DepartmentHeadStats {
  myRequirements: number
  activeRfps: number
}

interface FinanceApproverStats {
  pendingApprovals: number
  activeContracts: number
}

interface VendorStats {
  mySubmissions: number
}

export type DashboardStats =
  | { role: 'procurement_manager'; data: ProcurementManagerStats }
  | { role: 'department_head'; data: DepartmentHeadStats }
  | { role: 'finance_approver'; data: FinanceApproverStats }
  | { role: 'vendor'; data: VendorStats }
  | null

export function useDashboardStats() {
  const { profile } = useAuthStore()
  const [stats, setStats] = useState<DashboardStats>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!profile) return
    fetchStats()
  }, [profile?.role, profile?.org_id])

  async function fetchStats() {
    setLoading(true)
    setError(null)

    try {
      if (profile?.role === 'procurement_manager') {
        const [rfpRes, evalRes, reqRes] = await Promise.all([
          supabase
            .from('rfps')
            .select('id', { count: 'exact', head: true })
            .eq('org_id', profile.org_id)
            .not('status', 'eq', 'contracts_signed'),
          supabase
            .from('evaluations')
            .select('id', { count: 'exact', head: true })
            .in('evaluation_status', ['criteria_pending', 'scoring_in_progress']),
          supabase
            .from('requirements')
            .select('id', { count: 'exact', head: true })
            .eq('org_id', profile.org_id)
            .in('status', ['submitted', 'approved']),
        ])
        setStats({
          role: 'procurement_manager',
          data: {
            activeRfps: rfpRes.count ?? 0,
            pendingEvaluations: evalRes.count ?? 0,
            openRequirements: reqRes.count ?? 0,
          },
        })
      } else if (profile?.role === 'department_head') {
        const [myReqRes, rfpRes] = await Promise.all([
          supabase
            .from('requirements')
            .select('id', { count: 'exact', head: true })
            .eq('raised_by', profile.id),
          supabase
            .from('rfps')
            .select('id', { count: 'exact', head: true })
            .eq('org_id', profile.org_id)
            .not('status', 'eq', 'contracts_signed'),
        ])
        setStats({
          role: 'department_head',
          data: {
            myRequirements: myReqRes.count ?? 0,
            activeRfps: rfpRes.count ?? 0,
          },
        })
      } else if (profile?.role === 'finance_approver') {
        const [approvalRes, contractRes] = await Promise.all([
          supabase
            .from('approval_requests')
            .select('id', { count: 'exact', head: true })
            .eq('status', 'pending'),
          supabase
            .from('contracts')
            .select('id', { count: 'exact', head: true })
            .eq('status', 'active'),
        ])
        setStats({
          role: 'finance_approver',
          data: {
            pendingApprovals: approvalRes.count ?? 0,
            activeContracts: contractRes.count ?? 0,
          },
        })
      } else if (profile?.role === 'vendor') {
        const vendorRes = await supabase
          .from('vendor_accounts')
          .select('id')
          .eq('auth_user_id', profile.id)
          .single()

        const count = vendorRes.data
          ? (await supabase
              .from('rfp_vendor_entries')
              .select('id', { count: 'exact', head: true })
              .eq('vendor_account_id', vendorRes.data.id)).count ?? 0
          : 0

        setStats({ role: 'vendor', data: { mySubmissions: count } })
      }
    } catch {
      setError('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  return { stats, loading, error, refetch: fetchStats }
}
```

- [ ] **Step 13.2: Create `mobile/app/(app)/dashboard/index.tsx`**

```tsx
import { View, Text, ScrollView, RefreshControl } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useAuthStore } from '@/src/stores/auth-store'
import { useDashboardStats } from '@/src/hooks/use-dashboard-stats'
import { Card } from '@/src/components/ui/Card'
import { CardSkeleton } from '@/src/components/ui/Skeleton'

export default function DashboardScreen() {
  const { profile } = useAuthStore()
  const { stats, loading, refetch } = useDashboardStats()
  const router = useRouter()

  const greeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <ScrollView
        contentContainerClassName="px-4 pt-6 pb-10 gap-6"
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refetch} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="gap-1">
          <Text className="text-2xl font-bold text-slate-900">
            {greeting()}, {profile?.full_name?.split(' ')[0]}
          </Text>
          <Text className="text-slate-500 text-sm capitalize">
            {profile?.role?.replace(/_/g, ' ')}
          </Text>
        </View>

        {/* Stats */}
        <View className="gap-3">
          <Text className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
            Overview
          </Text>

          {loading && (
            <View className="gap-3">
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
            </View>
          )}

          {!loading && stats?.role === 'procurement_manager' && (
            <View className="gap-3">
              <Card
                title="Active RFPs"
                value={stats.data.activeRfps}
                subtitle="In progress"
                onPress={() => router.push('/(app)/rfps')}
              />
              <Card
                title="Pending Evaluations"
                value={stats.data.pendingEvaluations}
                subtitle="Awaiting scoring"
              />
              <Card
                title="Open Requirements"
                value={stats.data.openRequirements}
                subtitle="Submitted or approved"
                onPress={() => router.push('/(app)/requirements')}
              />
            </View>
          )}

          {!loading && stats?.role === 'department_head' && (
            <View className="gap-3">
              <Card
                title="My Requirements"
                value={stats.data.myRequirements}
                subtitle="Total submitted"
                onPress={() => router.push('/(app)/requirements')}
              />
              <Card
                title="Active RFPs"
                value={stats.data.activeRfps}
                subtitle="In progress"
                onPress={() => router.push('/(app)/rfps')}
              />
            </View>
          )}

          {!loading && stats?.role === 'finance_approver' && (
            <View className="gap-3">
              <Card
                title="Pending Approvals"
                value={stats.data.pendingApprovals}
                subtitle="Awaiting your review"
                onPress={() => router.push('/(app)/approvals')}
              />
              <Card
                title="Active Contracts"
                value={stats.data.activeContracts}
                subtitle="Currently live"
                onPress={() => router.push('/(app)/contracts')}
              />
            </View>
          )}

          {!loading && stats?.role === 'vendor' && (
            <Card
              title="My Submissions"
              value={stats.data.mySubmissions}
              subtitle="Total proposals"
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
```

- [ ] **Step 13.3: Test on device**

Sign in as a `procurement_manager`. Dashboard should show 3 stat cards with counts from the Supabase Cloud database. Pull down to refresh. Tapping a card should navigate to the corresponding placeholder screen.

- [ ] **Step 13.4: Commit**

```bash
cd ..
git add mobile/src/hooks/use-dashboard-stats.ts mobile/app/(app)/dashboard/
git commit -m "feat(mobile): add role-aware dashboard with live Supabase stats"
```

---

## Task 14: Settings Screen

**Files:**
- Create: `mobile/app/(app)/settings/index.tsx`

- [ ] **Step 14.1: Create `mobile/app/(app)/settings/index.tsx`**

```tsx
import { View, Text, Pressable, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ScreenHeader } from '@/src/components/layout/ScreenHeader'
import { useAuthStore } from '@/src/stores/auth-store'
import { Badge } from '@/src/components/ui/Badge'
import { LogOut, User, Building2 } from 'lucide-react-native'

const ROLE_LABELS: Record<string, string> = {
  procurement_manager: 'Procurement Manager',
  department_head: 'Department Head',
  finance_approver: 'Finance Approver',
  vendor: 'Vendor',
}

export default function SettingsScreen() {
  const { profile, signOut } = useAuthStore()

  function handleSignOut() {
    Alert.alert(
      'Sign out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign out', style: 'destructive', onPress: signOut },
      ]
    )
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <ScreenHeader title="Settings" />
      <View className="px-4 pt-4 gap-4">

        {/* Profile card */}
        <View className="bg-white rounded-2xl p-5 gap-4 border border-slate-100">
          <View className="flex-row items-center gap-3">
            <View className="w-12 h-12 rounded-full bg-primary-100 items-center justify-center">
              <User size={22} color="#4f46e5" />
            </View>
            <View className="flex-1 gap-0.5">
              <Text className="font-semibold text-slate-900 text-base">{profile?.full_name}</Text>
              <Badge label={ROLE_LABELS[profile?.role ?? ''] ?? profile?.role ?? ''} variant="info" />
            </View>
          </View>
        </View>

        {/* Org info */}
        <View className="bg-white rounded-2xl px-5 py-4 border border-slate-100">
          <View className="flex-row items-center gap-3">
            <Building2 size={20} color="#94a3b8" />
            <View className="gap-0.5">
              <Text className="text-xs text-slate-400 font-medium">Organisation ID</Text>
              <Text className="text-slate-700 text-sm font-mono">{profile?.org_id}</Text>
            </View>
          </View>
        </View>

        {/* Sign out */}
        <Pressable
          onPress={handleSignOut}
          className="bg-white rounded-2xl px-5 py-4 border border-slate-100 flex-row items-center gap-3 active:bg-slate-50"
        >
          <LogOut size={20} color="#ef4444" />
          <Text className="text-red-500 font-semibold text-base">Sign out</Text>
        </Pressable>

      </View>
    </SafeAreaView>
  )
}
```

- [ ] **Step 14.2: Test on device**

Navigate to Settings tab. Verify profile name and role display correctly. Tap "Sign out" → confirm dialog → app should redirect to login screen.

- [ ] **Step 14.3: Push to GitHub**

```bash
cd ..
git add mobile/app/(app)/settings/
git commit -m "feat(mobile): add settings screen with profile info and sign-out"
git push origin master
```

Expected: All commits pushed. Vercel deploys the webapp (mobile changes don't affect it).

---

## Post-Phase-1 Verification Checklist

After completing all tasks, verify the following flows end-to-end on a physical device:

- [ ] **Auth flow:** Open app → login screen → sign in with valid credentials → dashboard loads with correct stats
- [ ] **Role-aware tabs:** `procurement_manager` sees 5 tabs; `finance_approver` sees 4 tabs (Dashboard, Approvals, Contracts, Settings)
- [ ] **Signup flow:** Create new account → onboarding screen → tap "Get started" → dashboard loads
- [ ] **Pull to refresh:** Dashboard cards refresh with latest counts
- [ ] **Sign out:** Settings → Sign out → redirected to login, session cleared
- [ ] **Validation:** Submit empty login form → inline error messages appear
- [ ] **Back button:** Reset password screen shows back arrow, returns to login
