/**
 * Runtime environment variable validation.
 * Validated once at module load time — missing required vars throw immediately
 * rather than causing cryptic failures deep in request handlers.
 *
 * Import this at the top of any server-side module that needs env vars,
 * or ensure it is imported by the app's entry point.
 */

import { z } from 'zod'

const serverEnvSchema = z.object({
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('NEXT_PUBLIC_SUPABASE_URL must be a valid URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'NEXT_PUBLIC_SUPABASE_ANON_KEY is required'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'SUPABASE_SERVICE_ROLE_KEY is required'),

  // Google Gemini
  GEMINI_API_KEY: z.string().min(1, 'GEMINI_API_KEY is required'),

  // Resend email
  RESEND_API_KEY: z.string().min(1, 'RESEND_API_KEY is required'),
  RESEND_FROM_EMAIL: z.string().email('RESEND_FROM_EMAIL must be a valid email'),

  // App
  NEXT_PUBLIC_APP_URL: z.string().url('NEXT_PUBLIC_APP_URL must be a valid URL'),

  // Cron job secret (used to protect /api/cron/* routes)
  CRON_SECRET: z.string().min(16, 'CRON_SECRET must be at least 16 characters'),
})

// Only validate on the server side — client bundles don't have access to secret vars
function validateEnv() {
  if (typeof window !== 'undefined') return

  const result = serverEnvSchema.safeParse(process.env)

  if (!result.success) {
    const missing = result.error.errors.map((e) => `  • ${e.path.join('.')}: ${e.message}`)
    throw new Error(
      `Missing or invalid environment variables:\n${missing.join('\n')}\n\nCheck .env.local or your deployment environment.`
    )
  }
}

// Run validation immediately when this module is imported server-side
validateEnv()

// Typed, validated env object for use throughout server code
export const env = {
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY as string,
  },
  gemini: {
    apiKey: process.env.GEMINI_API_KEY as string,
  },
  resend: {
    apiKey: process.env.RESEND_API_KEY as string,
    fromEmail: process.env.RESEND_FROM_EMAIL as string,
  },
  app: {
    url: process.env.NEXT_PUBLIC_APP_URL as string,
  },
  cron: {
    secret: process.env.CRON_SECRET as string,
  },
} as const
