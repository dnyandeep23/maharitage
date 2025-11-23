import { NextResponse } from "next/server";
import { verifyTokenMiddleware } from "./lib/jwt";
import { canAccessPath, ROLE_CONFIG } from "./lib/roles";

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
  "/api/contact",
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

const PROTECTED_ROUTES = [
  "/dashboard/:path*",
  "/api/:path*", 
];

function matchRoutePattern(pathname, patterns) {
  return patterns.some((route) => {
    const pattern = route.replace(/:[^/]+/g, "[^/]+").replace(/\*/g, ".*");
    return new RegExp(`^${pattern}$`).test(pathname);
  });
}

const ADMIN_API_ROUTES = ["/api/admins"];

const allowedOrigins = [process.env.NEXT_PUBLIC_APP_URL];

export async function middleware(request) {
  const pathname = request.nextUrl.pathname;
  const origin = request.headers.get("origin");

  // CORS pre-flight request
  if (request.method === "OPTIONS" && pathname.startsWith("/api/")) {
    const headers = new Headers();
    headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

    if (pathname.startsWith("/api/v1/")) {
      headers.set("Access-Control-Allow-Origin", "*");
    } else if (origin && allowedOrigins.includes(origin)) {
      headers.set("Access-Control-Allow-Origin", origin);
    }

    return new NextResponse(null, { status: 204, headers });
  }

  const response = NextResponse.next();

  // Set CORS headers for actual requests
  if (pathname.startsWith("/api/")) {
    if (pathname.startsWith("/api/v1/")) {
      response.headers.set("Access-Control-Allow-Origin", "*");
    } else if (origin && allowedOrigins.includes(origin)) {
      response.headers.set("Access-Control-Allow-Origin", origin);
    }
  }


  if (
    pathname.startsWith("/_next/") ||
    pathname.match(/\.(ico|png|jpg|jpeg|svg)$/)
  ) {
    return response;
  }

  const isPublic = matchRoutePattern(pathname, PUBLIC_ROUTES);
  if (isPublic) {
    return response;
  }

  const isProtected = matchRoutePattern(pathname, PROTECTED_ROUTES);

  const authHeader = request.headers.get("Authorization");
  let user = null;

  try {
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      const decoded = await verifyTokenMiddleware(token);
      if (decoded) user = decoded;
    } else if (authHeader?.startsWith("ApiKey ")) {
      const apiKey = authHeader.split(" ")[1];
      const res = await fetch(
        new URL("/api/auth/verify-apikey", request.url).toString(),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ apiKey }),
        }
      );

      if (res.ok) {
        const data = await res.json();
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

  return response;
}
export const config = {
  matcher: ["/:path*"],
};
