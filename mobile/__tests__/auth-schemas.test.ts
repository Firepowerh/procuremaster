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
