import { describe, it, expect } from 'vitest'
import { z } from 'zod'

// ── Mirrors the schemas used in server actions ─────────────────────────────────
// These schemas are co-located here so we can test validation rules independently
// of the Supabase/Next.js server context.

const requirementSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  department: z.string().min(1, 'Department is required'),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  budget_estimate: z.string().optional(),
  required_by: z.string().optional(),
  submit: z.enum(['draft', 'submitted']).optional(),
})

const rfpSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  department: z.string().min(1),
  budget_min: z.string().optional(),
  budget_max: z.string().optional(),
  submission_deadline: z.string().optional(),
  requirement_id: z.string().uuid().optional().or(z.literal('')),
})

const contractEditSchema = z.object({
  title: z.string().min(1).optional(),
  value: z.string().optional(),
  currency: z.string().length(3).optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  payment_terms: z.string().optional(),
  alert_days: z.string().optional(),
})

const settingsProfileSchema = z.object({
  full_name: z.string().min(1).max(120),
})

const settingsOrgSchema = z.object({
  name: z.string().min(1).max(120),
  currency: z.string().length(3),
})

// ── Requirement schema ─────────────────────────────────────────────────────────

describe('requirementSchema', () => {
  const valid = {
    title: 'Office Supplies',
    description: 'We need pens, paper, and printer cartridges for Q3.',
    department: 'Operations',
    priority: 'medium' as const,
  }

  it('accepts a valid requirement', () => {
    expect(requirementSchema.safeParse(valid).success).toBe(true)
  })

  it('rejects title shorter than 3 characters', () => {
    const result = requirementSchema.safeParse({ ...valid, title: 'AB' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.title).toBeDefined()
    }
  })

  it('rejects description shorter than 10 characters', () => {
    const result = requirementSchema.safeParse({ ...valid, description: 'Too short' })
    expect(result.success).toBe(false)
  })

  it('rejects an empty department', () => {
    const result = requirementSchema.safeParse({ ...valid, department: '' })
    expect(result.success).toBe(false)
  })

  it('rejects an invalid priority value', () => {
    const result = requirementSchema.safeParse({ ...valid, priority: 'urgent' })
    expect(result.success).toBe(false)
  })

  it('accepts all valid priority values', () => {
    for (const priority of ['low', 'medium', 'high', 'critical'] as const) {
      expect(requirementSchema.safeParse({ ...valid, priority }).success).toBe(true)
    }
  })

  it('accepts optional fields when omitted', () => {
    expect(requirementSchema.safeParse(valid).success).toBe(true)
  })

  it('accepts submit enum values', () => {
    expect(requirementSchema.safeParse({ ...valid, submit: 'draft' }).success).toBe(true)
    expect(requirementSchema.safeParse({ ...valid, submit: 'submitted' }).success).toBe(true)
  })

  it('rejects invalid submit value', () => {
    expect(requirementSchema.safeParse({ ...valid, submit: 'publish' }).success).toBe(false)
  })
})

// ── RFP schema ─────────────────────────────────────────────────────────────────

describe('rfpSchema', () => {
  const valid = {
    title: 'Cloud Storage Vendor',
    description: 'Seeking a cloud storage solution for the engineering department.',
    department: 'Engineering',
  }

  it('accepts a valid RFP', () => {
    expect(rfpSchema.safeParse(valid).success).toBe(true)
  })

  it('rejects title shorter than 3 characters', () => {
    expect(rfpSchema.safeParse({ ...valid, title: 'AB' }).success).toBe(false)
  })

  it('rejects description shorter than 10 characters', () => {
    expect(rfpSchema.safeParse({ ...valid, description: 'Short' }).success).toBe(false)
  })

  it('accepts a valid UUID as requirement_id', () => {
    const result = rfpSchema.safeParse({
      ...valid,
      requirement_id: '123e4567-e89b-12d3-a456-426614174000',
    })
    expect(result.success).toBe(true)
  })

  it('accepts empty string as requirement_id (no linked requirement)', () => {
    expect(rfpSchema.safeParse({ ...valid, requirement_id: '' }).success).toBe(true)
  })

  it('rejects a non-UUID, non-empty requirement_id', () => {
    expect(rfpSchema.safeParse({ ...valid, requirement_id: 'not-a-uuid' }).success).toBe(false)
  })
})

// ── Contract edit schema ───────────────────────────────────────────────────────

describe('contractEditSchema', () => {
  it('accepts an empty object (all fields optional)', () => {
    expect(contractEditSchema.safeParse({}).success).toBe(true)
  })

  it('accepts partial updates', () => {
    expect(contractEditSchema.safeParse({ title: 'New title' }).success).toBe(true)
    expect(contractEditSchema.safeParse({ value: '50000' }).success).toBe(true)
  })

  it('rejects currency that is not exactly 3 characters', () => {
    expect(contractEditSchema.safeParse({ currency: 'US' }).success).toBe(false)
    expect(contractEditSchema.safeParse({ currency: 'USDD' }).success).toBe(false)
  })

  it('accepts a valid 3-letter currency', () => {
    expect(contractEditSchema.safeParse({ currency: 'EUR' }).success).toBe(true)
  })

  it('rejects an empty title (min 1)', () => {
    expect(contractEditSchema.safeParse({ title: '' }).success).toBe(false)
  })
})

// ── Settings schemas ───────────────────────────────────────────────────────────

describe('settingsProfileSchema', () => {
  it('accepts a valid name', () => {
    expect(settingsProfileSchema.safeParse({ full_name: 'Jane Smith' }).success).toBe(true)
  })

  it('rejects an empty name', () => {
    expect(settingsProfileSchema.safeParse({ full_name: '' }).success).toBe(false)
  })

  it('rejects a name over 120 characters', () => {
    expect(settingsProfileSchema.safeParse({ full_name: 'A'.repeat(121) }).success).toBe(false)
  })
})

describe('settingsOrgSchema', () => {
  it('accepts valid org details', () => {
    expect(settingsOrgSchema.safeParse({ name: 'Acme Corp', currency: 'USD' }).success).toBe(true)
  })

  it('rejects empty org name', () => {
    expect(settingsOrgSchema.safeParse({ name: '', currency: 'USD' }).success).toBe(false)
  })

  it('rejects currency not exactly 3 chars', () => {
    expect(settingsOrgSchema.safeParse({ name: 'Acme', currency: 'US' }).success).toBe(false)
    expect(settingsOrgSchema.safeParse({ name: 'Acme', currency: 'EURO' }).success).toBe(false)
  })
})
