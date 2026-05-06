import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value

  const isAuthPage = request.nextUrl.pathname === '/'

  // Redirect unauthenticated users to the login page if they try to access protected routes
  // if (!token && !isAuthPage) {
  //   return NextResponse.redirect(new URL('/', request.url))
  // }

  // // Redirect authenticated users to the dashboard if they visit the login page
  // if (token && isAuthPage) {
  //   return NextResponse.redirect(new URL('/dashboard', request.url))
  // }

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
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|images|favicon.ico).*)',
  ],
}
