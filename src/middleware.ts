import { NextResponse, type NextRequest } from 'next/server';

/**
 * Simplified middleware - authentication disabled for demo mode
 * All routes are publicly accessible
 */
export async function middleware(request: NextRequest) {
  // Just pass through all requests - no auth required for demo
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes that don't need auth
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
