import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
          // Story 1.104 (@supabase/ssr 0.12): a response that sets the sign-in cookies carries the
          // library's no-cache headers, so no cache in front of the app can hand one person's
          // session to another
          Object.entries(headers ?? {}).forEach(([key, value]) =>
            supabaseResponse.headers.set(key, value)
          )
        },
      },
    }
  )

  // Verify user authentication - required for Server Components
  let user = null
  try {
    const response = await supabase.auth.getUser()
    user = response.data.user
  } catch (error) {
    // If Supabase is unreachable, treat as unauthenticated
    // This prevents middleware from crashing on network errors
    console.error('Middleware: Failed to verify user with Supabase:', error)
  }

  // Story 1.82: the Dashboard is gone; old bookmarks land on Searches, the app's home.
  if (
    request.nextUrl.pathname === '/dashboard' ||
    request.nextUrl.pathname.startsWith('/dashboard/')
  ) {
    return NextResponse.redirect(new URL('/searches', request.url))
  }

  // Protect authenticated routes
  if (
    request.nextUrl.pathname.startsWith('/searches') ||
    request.nextUrl.pathname.startsWith('/alerts') ||
    request.nextUrl.pathname.startsWith('/reports') ||
    request.nextUrl.pathname.startsWith('/settings') ||
    // Story 1.106 (code review): the plan page and the pick screen are signed-in pages too
    request.nextUrl.pathname.startsWith('/plan')
  ) {
    if (!user) {
      // Preserve the original URL (with query params) for redirect after login
      const redirectUrl = new URL('/login', request.url)
      redirectUrl.searchParams.set('redirectTo', request.nextUrl.pathname + request.nextUrl.search)
      return NextResponse.redirect(redirectUrl)
    }
  }

  // Redirect root to /login or /searches based on auth state
  if (request.nextUrl.pathname === '/') {
    if (user) {
      return NextResponse.redirect(new URL('/searches', request.url))
    } else {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  // Redirect /register to /login?tab=signup (registration now on login page)
  if (request.nextUrl.pathname.startsWith('/register')) {
    const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set('tab', 'signup')
    // Preserve any existing query params like redirectTo
    const existingRedirectTo = request.nextUrl.searchParams.get('redirectTo')
    if (existingRedirectTo) {
      redirectUrl.searchParams.set('redirectTo', existingRedirectTo)
    }
    return NextResponse.redirect(redirectUrl)
  }

  // Redirect authenticated users away from auth pages
  if (request.nextUrl.pathname.startsWith('/login')) {
    if (user) {
      return NextResponse.redirect(new URL('/searches', request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/',
    '/dashboard/:path*',
    '/searches/:path*',
    '/alerts/:path*',
    '/reports/:path*',
    '/settings/:path*',
    '/plan/:path*',
    '/login',
    '/register/:path*',
    // Story 1.105 (code review): the legal pages read the session to choose their header, so the
    // session is refreshed and its cookies saved here first (lib/supabase/currentUser.ts)
    '/terms',
    '/privacy',
    '/heritage-terms',
    // Story 1.106 (U-18): the pages that read the session on the server: reset password, the
    // guards' steps, and /welcome (Story 1.89, which was missing here)
    '/reset-password',
    '/welcome',
    '/choose-plan',
    '/verify-phone',
  ],
}
