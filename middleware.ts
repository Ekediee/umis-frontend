import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { decodeJwt } from 'jose'

function lecturerSessionValid(value: string | undefined) {
  if (!value) return false
  try {
    const { exp } = JSON.parse(atob(value.replace(/-/g, '+').replace(/_/g, '/')))
    return typeof exp === 'number' && exp > Date.now()
  } catch {
    return false
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Lecturer portal (BU Pulse for staff) has its own session, separate from students.
  if (pathname === '/lecturer' || pathname.startsWith('/lecturer/')) {
    const isLecturerAuthPage = pathname.startsWith('/lecturer/sign-in')
    const hasSession = lecturerSessionValid(request.cookies.get('lecturer_session')?.value)
    if (!hasSession && !isLecturerAuthPage) {
      const url = new URL('/lecturer/sign-in', request.url)
      if (request.cookies.get('lecturer_session')) url.searchParams.set('reason', 'expired')
      return NextResponse.redirect(url)
    }
    if (hasSession && isLecturerAuthPage) {
      return NextResponse.redirect(new URL('/lecturer', request.url))
    }
    return NextResponse.next()
  }
  const token = request.cookies.get('token')?.value

  // Both the landing page, login page, and forgot-password pages are accessible without authentication
  const isAuthPage = request.nextUrl.pathname === '/' || request.nextUrl.pathname === '/login' || request.nextUrl.pathname.startsWith('/forgot-password')

  // Redirect unauthenticated users to the login page if they try to access protected routes
  if (!token && !isAuthPage) {
    const login = new URL('/login', request.url)
    // A check-in QR scanned while signed out should land back on check-in after login.
    if (pathname.startsWith('/attendance/check-in')) {
      login.searchParams.set('next', `${pathname}${request.nextUrl.search}`)
    }
    return NextResponse.redirect(login)
  }

  // Validate token expiry for authenticated requests to protected routes.
  // We decode the JWT to read the `exp` claim — we do NOT verify the signature
  // (that's the backend's responsibility). This simply prevents obviously-expired
  // tokens from reaching the dashboard and triggering a cascade of 401 errors.
  // if (token && !isAuthPage) {
  //   try {
  //     const payload = decodeJwt(token)
  //     const isExpired = payload.exp ? payload.exp * 1000 < Date.now() : false
  //     if (isExpired) {
  //       const response = NextResponse.redirect(
  //         new URL('/?reason=session_expired', request.url)
  //       )
  //       // Clear both auth cookies so the login page starts clean
  //       response.cookies.delete('token')
  //       response.cookies.delete('user_data')
  //       return response
  //     }
  //   } catch {
  //     // Malformed or non-JWT token — treat as expired and force re-login
  //     if (!isAuthPage) {
  //       const response = NextResponse.redirect(
  //         new URL('/?reason=session_expired', request.url)
  //       )
  //       response.cookies.delete('token')
  //       response.cookies.delete('user_data')
  //       return response
  //     }
  //   }
  // }

  // Redirect authenticated users to the dashboard if they visit auth pages
  if (token && isAuthPage) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

// Ensure the middleware is only applied to relevant paths
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - images (local images in public folder)
     * - icons (PWA icons: needed before sign-in, e.g. installing from /login)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|images|icons|favicon.ico|manifest.json|sw.js|swe-worker-).*)',
  ],
}
