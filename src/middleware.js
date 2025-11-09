import { NextResponse } from "next/server";
import { verifyTokenMiddleware } from "./lib/jwt";
import { canAccessPath, ROLE_CONFIG } from "./lib/roles";
// ✅ PUBLIC routes (no token needed)
const PUBLIC_ROUTES = [
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/forgot-password",
  "/api/auth/resend-verification",
  "/api/auth/verification-status",
  "/api/auth/verify-email",
  "/api/auth/forget-password",
  "/api/auth/reset-password",
  "/api/sites",
  "/api/sites/:id",
  "/api/sites/home",
  "/api/ai",
  "/",
  "/search",
  "/login",
  "/register",
  "/forgot-password",
  "/about",
  "/contact",
  "/verify-email",
  "/email-sent",
  "/reset-password",
  "/cave/:path*",
];

// ✅ Protected prefixes (token required)
const PROTECTED_ROUTES = [
  "/dashboard/:path*",
  "/api/:path*", // protect all /api except explicit public ones
];

// 🚫 Block unauthenticated access

function matchRoutePattern(pathname, patterns) {
  return patterns.some((route) => {
    const pattern = route.replace(/:[^/]+/g, "[^/]+").replace(/\*/g, ".*");
    return new RegExp(`^${pattern}$`).test(pathname);
  });
}

const ADMIN_API_ROUTES = ["/api/admins", "/api/research-requests"];

export async function middleware(request) {
  const pathname = request.nextUrl.pathname;

  // Skip static assets
  if (
    pathname.startsWith("/_next/") ||
    pathname.match(/\.(ico|png|jpg|jpeg|svg)$/)
  ) {
    return NextResponse.next();
  }

  const isPublic = matchRoutePattern(pathname, PUBLIC_ROUTES);
  if (isPublic) {
    return NextResponse.next();
  }

  const isProtected = matchRoutePattern(pathname, PROTECTED_ROUTES);

  // 🔑 Try token or API key
  const authHeader = request.headers.get("Authorization");
  let user = null;

  try {
    if (authHeader?.startsWith("Bearer ")) {
      // JWT
      const token = authHeader.split(" ")[1];
      const decoded = await verifyTokenMiddleware(token);
      if (decoded) user = decoded;
    } else if (authHeader?.startsWith("ApiKey ")) {
      // API Key
      const apiKey = authHeader.split(" ")[1];
      const response = await fetch(
        new URL("/api/auth/verify-apikey", request.url).toString(),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ apiKey }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        user = data.user;
      }
    }
  } catch (err) {}

  if (!user && isProtected) {
    if (pathname.startsWith("/api/")) {
      return new NextResponse(
        JSON.stringify({ success: false, message: "Authentication failed" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (user) {
    const isAdminRoute = matchRoutePattern(pathname, ADMIN_API_ROUTES);
    if (isAdminRoute && user.role !== "admin") {
      return new NextResponse(
        JSON.stringify({ success: false, message: "Forbidden" }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!canAccessPath(user.role, pathname)) {
      const redirectPath = ROLE_CONFIG[user.role]?.dashboardPath || "/";
      return NextResponse.redirect(new URL(redirectPath, request.url));
    }
  }

  return NextResponse.next();
}
// ✅ Apply middleware only on these paths
export const config = {
  matcher: ["/:path*"],
};
