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
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
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

  // Protect authenticated routes
  if (
    request.nextUrl.pathname.startsWith('/dashboard') ||
    request.nextUrl.pathname.startsWith('/searches') ||
    request.nextUrl.pathname.startsWith('/alerts') ||
    request.nextUrl.pathname.startsWith('/settings')
  ) {
    if (!user) {
      // Preserve the original URL (with query params) for redirect after login
      const redirectUrl = new URL('/login', request.url)
      redirectUrl.searchParams.set('redirectTo', request.nextUrl.pathname + request.nextUrl.search)
      return NextResponse.redirect(redirectUrl)
    }
  }

  // Redirect root to /login or /dashboard based on auth state
  if (request.nextUrl.pathname === '/') {
    if (user) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
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
      return NextResponse.redirect(new URL('/dashboard', request.url))
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
    '/settings/:path*',
    '/login',
    '/register/:path*',
  ],
}
