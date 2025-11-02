import { NextResponse } from "next/server";
import { verifyTokenMiddleware } from "./lib/jwt";
import { canAccessPath, ROLE_CONFIG } from "./lib/roles";

// ✅ Define route categories
const UNPROTECTED_API_ROUTES = [
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/forgot-password",
  "/api/auth/resend-verification",
  "/api/auth/verification-status",
  "/api/auth/verify-email",
  "/api/auth/forget-password",
  "/api/auth/reset-password",
  "/api/ai",
  "/api/sites",
  "/api/sites/:id*",
];

const PUBLIC_ROUTES = [
  "/",
  "/login",
  "/register",
  "/forgot-password",
  "/about",
  "/contact",
  "/verify-email",
  "/email-sent",
  "/reset-password",
  "/forgot-password",
  "/search",
  "/ai",
  "/cave/:path*",
];

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/api/protected",
  "/profile",
  "/settings",
];

export async function middleware(request) {
  const pathname = request.nextUrl.pathname;
  // console.log('🧭 Checking path:', pathname);

  // 🟢 Skip middleware for static files, Next internals, and images
  if (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/public/") ||
    pathname.endsWith(".ico") ||
    pathname.endsWith(".png") ||
    pathname.endsWith(".jpg")
  ) {
    return NextResponse.next();
  }

  // 🟢 Allow unprotected API routes (like login/register)
  if (UNPROTECTED_API_ROUTES.includes(pathname)) {
    // console.log('✅ Skipping unprotected API route:', pathname);
    return NextResponse.next();
  }

  // 🔐 Determine if route needs protection
  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);
  const isProtectedRoute = PROTECTED_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix)
  );

  // 🧩 Extract token from cookie or header
  const token =
    (await request.cookies.get("auth-token")?.value) ||
    request.headers.get("authorization")?.split(" ")[1];

  // 🔒 If no token but accessing a protected route → redirect
  if (!token && isProtectedRoute) {
    // console.log('🚫 No token found, redirecting to /login');
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // 🧾 If token exists, verify and check access
  if (token) {
    try {
      const decoded = await verifyTokenMiddleware(token);
      if (!decoded) {
        throw new Error("Invalid or expired token");
      }
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set("authorization", `Bearer ${token}`);

      // 🧠 Role-based access control
      if (!canAccessPath(decoded.role, pathname)) {
        // console.log('🚫 Access denied:', {
        //   user: decoded.email,
        //   role: decoded.role,
        //   path: pathname,
        // });

        const dashboardPath = ROLE_CONFIG[decoded.role]?.dashboardPath || "/";
        return NextResponse.redirect(new URL(dashboardPath, request.url));
      }

      // ✅ Allow access
      return NextResponse.next({
        request: { headers: requestHeaders },
      });
    } catch (error) {
      // console.error('Token verification failed:', error.message);
      if (!isPublicRoute) {
        return NextResponse.redirect(new URL("/login", request.url));
      }
    }
  }

  // // 🟢 Default: allow request
  // return NextResponse.next();
}

// ✅ Middleware runs only on these paths
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/api/:path*",
    "/profile/:path*",
    "/settings/:path*",
  ],
};
