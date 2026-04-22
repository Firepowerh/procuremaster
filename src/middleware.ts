import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/middleware'

// Routes that don't require authentication
const PUBLIC_PREFIXES = ['/login', '/signup', '/auth', '/invite']

export async function middleware(request: NextRequest) {
  const { supabase, supabaseResponse } = createClient(request)

  // IMPORTANT: do not add code between createClient and getUser —
  // the cookie refresh must happen immediately after the client is created.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl
  const isPublic = PUBLIC_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + '/')
  )

  // ── Unauthenticated ────────────────────────────────────────────────────────
  if (!user) {
    if (!isPublic) {
      const loginUrl = new URL('/login', request.url)
      if (pathname !== '/') loginUrl.searchParams.set('next', pathname)
      return NextResponse.redirect(loginUrl)
    }
    return supabaseResponse
  }

  // ── Authenticated — redirect away from pure auth pages ────────────────────
  if (pathname === '/login' || pathname === '/signup') {
    const userType = user.app_metadata?.user_type as string | undefined
    const dest = userType === 'vendor' ? '/vendor/portal' : '/dashboard'
    return NextResponse.redirect(new URL(dest, request.url))
  }

  // ── Vendor route isolation ─────────────────────────────────────────────────
  const userType = user.app_metadata?.user_type as string | undefined
  if (
    userType === 'vendor' &&
    !pathname.startsWith('/vendor') &&
    !pathname.startsWith('/auth') &&
    !pathname.startsWith('/invite')
  ) {
    return NextResponse.redirect(new URL('/vendor/portal', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    // Run on all paths except Next.js internals and static assets
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
