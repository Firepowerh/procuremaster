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
