import { describe, it, expect } from 'vitest'

// ── Currency formatting (mirrors reports page logic) ──────────────────────────

function fmt(value: number, currency = 'USD') {
  if (value >= 1_000_000)
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 1,
      notation: 'compact',
    }).format(value)
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value)
}

// ── Days-left calculation (mirrors contracts page logic) ──────────────────────

function daysLeft(endDateStr: string, now = new Date()): number {
  return Math.ceil(
    (new Date(endDateStr).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  )
}

// ── Status label helpers ──────────────────────────────────────────────────────

function humanizeStatus(status: string): string {
  return status.replace(/_/g, ' ')
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('fmt()', () => {
  it('formats values under 1M with no decimal', () => {
    expect(fmt(50000)).toBe('$50,000')
    expect(fmt(999999)).toBe('$999,999')
  })

  it('formats values ≥ 1M as compact with 1 decimal', () => {
    const result = fmt(1_500_000)
    expect(result).toContain('1.5')
    expect(result).toContain('M')
  })

  it('uses the supplied currency code', () => {
    expect(fmt(10000, 'EUR')).toContain('10,000')
    expect(fmt(10000, 'EUR')).toContain('€')
  })

  it('formats zero correctly', () => {
    expect(fmt(0)).toBe('$0')
  })
})

describe('daysLeft()', () => {
  it('returns positive days for a future date', () => {
    const future = new Date()
    future.setDate(future.getDate() + 30)
    expect(daysLeft(future.toISOString())).toBe(30)
  })

  it('returns negative days for a past date', () => {
    const past = new Date()
    past.setDate(past.getDate() - 10)
    expect(daysLeft(past.toISOString())).toBe(-10)
  })

  it('returns 1 for a date that is exactly one day away', () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    // Use a fixed "now" to avoid off-by-one at midnight
    const fixedNow = new Date(tomorrow)
    fixedNow.setDate(fixedNow.getDate() - 1)
    expect(daysLeft(tomorrow.toISOString(), fixedNow)).toBe(1)
  })
})

describe('humanizeStatus()', () => {
  it('replaces underscores with spaces', () => {
    expect(humanizeStatus('expiring_soon')).toBe('expiring soon')
    expect(humanizeStatus('under_evaluation')).toBe('under evaluation')
    expect(humanizeStatus('rfp_created')).toBe('rfp created')
  })

  it('leaves statuses with no underscores unchanged', () => {
    expect(humanizeStatus('active')).toBe('active')
    expect(humanizeStatus('contracted')).toBe('contracted')
  })

  it('handles multiple underscores', () => {
    expect(humanizeStatus('approval_pending_review')).toBe('approval pending review')
  })
})
