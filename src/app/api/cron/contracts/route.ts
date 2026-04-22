import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * Cron job: daily contract status maintenance.
 * Scheduled via vercel.json at 06:00 UTC daily.
 *
 * Responsibilities:
 *  1. Mark contracts as `expired` when end_date has passed
 *  2. Mark active contracts as `expiring_soon` when within their alert_days window
 *
 * Protected by CRON_SECRET — Vercel sets the Authorization header automatically.
 */
export async function GET(req: NextRequest) {
  // Verify the request comes from the scheduler
  const authHeader = req.headers.get('authorization')
  const secret = process.env.CRON_SECRET

  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: 'Missing Supabase credentials' }, { status: 500 })
  }

  // Use service role to bypass RLS for background maintenance
  const supabase = createClient(supabaseUrl, serviceKey)

  const today = new Date().toISOString().split('T')[0]

  // 1. Expire contracts whose end_date has passed
  const { data: expired, error: expireError } = await supabase
    .from('contracts')
    .update({ status: 'expired', updated_at: new Date().toISOString() })
    .in('status', ['active', 'expiring_soon'])
    .lt('end_date', today)
    .select('id')

  if (expireError) {
    console.error('[cron/contracts] expire error:', expireError.message)
    return NextResponse.json({ error: expireError.message }, { status: 500 })
  }

  // 2. Flag active contracts that are within their individual alert_days window
  //    Uses a raw SQL condition: end_date <= today + alert_days
  const { data: flagged, error: flagError } = await supabase
    .from('contracts')
    .update({ status: 'expiring_soon', updated_at: new Date().toISOString() })
    .eq('status', 'active')
    .gte('end_date', today) // not yet expired
    .filter('end_date', 'lte', `now() + (alert_days || ' days')::interval`)
    .select('id')

  if (flagError) {
    // Non-fatal: log and continue
    console.error('[cron/contracts] flag error:', flagError.message)
  }

  const result = {
    expired: expired?.length ?? 0,
    flagged_expiring_soon: flagged?.length ?? 0,
    ran_at: new Date().toISOString(),
  }

  console.log('[cron/contracts]', result)
  return NextResponse.json(result)
}
