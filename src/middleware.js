import { NextResponse } from 'next/server';
import { verifyToken } from './lib/jwt';
import { canAccessPath, ROLE_CONFIG } from './lib/roles';

export async function middleware(request) {
  const pathname = request.nextUrl.pathname;
  console.log('Middleware checking path:', pathname);

  // ✅ Unprotected API routes inside /api/auth/*
  const unprotectedApiRoutes = ['/api/auth/login', '/api/auth/register', '/api/auth/forgot-password'];
  if (unprotectedApiRoutes.includes(pathname)) {
    // Skip token verification for these routes
    return NextResponse.next();
  }

  // Get token from cookie or header
  const token =
    request.cookies.get('auth-token')?.value ||
    request.headers.get('authorization')?.split(' ')[1];

  // Public pages (frontend routes)
  const publicPaths = ['/', '/login', '/register', '/forgot-password', '/about', '/contact'];
  const isPublicPath =
    publicPaths.includes(pathname) ||
    pathname.startsWith('/public/') ||
    pathname.startsWith('/_next/') ||
    pathname.endsWith('.ico');

  // Routes that require authentication
  const isProtectedRoute =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/api/protected') ||
    pathname.startsWith('/profile') ||
    pathname.startsWith('/settings');

  if (!token && isProtectedRoute) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (token) {
    try {
      const decoded = verifyToken(token);

      // Add user info to request headers
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set('user', JSON.stringify(decoded));

      // Check if user has access to the requested path
      if (!canAccessPath(decoded.role, pathname)) {
        console.log('Access denied:', {
          user: decoded.email,
          role: decoded.role,
          path: pathname,
        });

        // Redirect to appropriate dashboard based on role
        const dashboardPath =
          ROLE_CONFIG[decoded.role]?.dashboardPath || '/dashboard';
        return NextResponse.redirect(new URL(dashboardPath, request.url));
      }

      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    } catch (error) {
      if (!isPublicPath) {
        return NextResponse.redirect(new URL('/login', request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/api/protected/:path*',
    '/api/auth/:path*',
    '/profile/:path*',
    '/settings/:path*',
  ],
};
