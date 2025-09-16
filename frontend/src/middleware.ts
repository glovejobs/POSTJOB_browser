import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Define protected routes
  const isProtectedRoute = path.startsWith('/dashboard') || 
                          path.startsWith('/status') || 
                          path.startsWith('/payment');

  // Define public routes
  const isPublicRoute = path === '/login' || 
                       path === '/register' ||
                       path === '/forgot-password' ||
                       path === '/reset-password';

  // Get the API key from cookies (if you set it there) or we'll rely on client-side check
  // For now, we'll let the client-side handle the redirect since API key is in localStorage

  // If accessing login while potentially logged in, let client-side handle it
  if (isPublicRoute) {
    return NextResponse.next();
  }

  // For protected routes, let client-side handle auth check
  if (isProtectedRoute) {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};