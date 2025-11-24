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
  "/api/sites/home",
  "/api/sites",
  "/api/sites/:id",
  "/api/ai",
  "/api/ai/chat",
  "/api/contact",
  "api/v1/:path*",
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
  "/api/auth/verify-apikey",
];

const PROTECTED_ROUTES = ["/dashboard/:path*", "/api/:path*"];

function matchRoutePattern(pathname, patterns) {
  return patterns.some((route) => {
    const pattern = route.replace(/:[^/]+/g, "[^/]+").replace(/\*/g, ".*");
    return new RegExp(`^${pattern}$`).test(pathname);
  });
}

const ADMIN_API_ROUTES = ["/api/admins"];

const allowedOrigins = [process.env.NEXT_PUBLIC_APP_URL];

async function internalApiAuth(request) {
  const token = process.env.X_ACCESS_TOKEN_INTERNAL;
  if (!token) {
    console.error(
      "X_ACCESS_TOKEN_INTERNAL is not set in environment variables."
    );
    return new NextResponse(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500 }
    );
  }

  const requestToken = request.headers.get("x-access-token-internal");

  if (!requestToken) {
    return new NextResponse(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
    });
  }

  // Helper function to convert string to ArrayBuffer
  const textToArrayBuffer = (str) => {
    const encoder = new TextEncoder();
    return encoder.encode(str);
  };

  // Helper function to hash a string using SHA-256
  const sha256 = async (str) => {
    const buffer = textToArrayBuffer(str);
    const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  };

  const hashedRequestToken = await sha256(requestToken);
  const hashedToken = await sha256(token);

  if (hashedRequestToken !== hashedToken) {
    return new NextResponse(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
    });
  }

  return null;
}

export async function middleware(request) {
  const pathname = request.nextUrl.pathname;
  console.log(pathname);
  const origin = request.headers.get("origin");

  // CORS pre-flight request
  if (request.method === "OPTIONS" && pathname.startsWith("/api/")) {
    const headers = new Headers();
    headers.set(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, OPTIONS"
    );
    headers.set(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, x-access-token-internal"
    );

    if (pathname.startsWith("/api/v1/")) {
      headers.set("Access-Control-Allow-Origin", "*");
    } else if (origin && allowedOrigins.includes(origin)) {
      headers.set("Access-Control-Allow-Origin", origin);
    }

    return new NextResponse(null, { status: 204, headers });
  }

  const authHeader = request.headers.get("Authorization");

  if (pathname.startsWith("/api/v1/")) {
    if (authHeader?.startsWith("ApiKey ")) {
      console.log("API Key:", authHeader);
      const apiKey = authHeader.split(" ")[1];
      console.log(apiKey);
      const res = await fetch(
        new URL("/api/auth/verify-apikey", request.url).toString(),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-access-token-internal": process.env.X_ACCESS_TOKEN_INTERNAL,
          },
          body: JSON.stringify({ apiKey }),
        }
      );

      if (res.ok) {
        const data = await res.json();
        console.log(data);
        if (data.user) {
          const response = NextResponse.next();
          response.headers.set("Access-Control-Allow-Origin", "*");
          response.headers.set(
            "Access-Control-Allow-Headers",
            "Content-Type, Authorization, x-access-token-internal"
          );
          return response;
        }
      }
    }
    return new NextResponse(
      JSON.stringify({
        success: false,
        message: "Authentication failed: Invalid or missing API key",
      }),
      {
        status: 401,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }

  if (pathname.startsWith("/api/") && !pathname.startsWith("/api/v1/")) {
    if (!authHeader?.startsWith("ApiKey ")) {
      const authResponse = await internalApiAuth(request);
      if (authResponse) {
        return authResponse;
      }
    }
  }

  const response = NextResponse.next();

  // Set CORS headers for actual requests
  if (pathname.startsWith("/api/")) {
    if (origin && allowedOrigins.includes(origin)) {
      response.headers.set("Access-Control-Allow-Origin", origin);
    }
    response.headers.set(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, x-access-token-internal"
    );
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

  let user = null;

  try {
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      const decoded = await verifyTokenMiddleware(token);
      if (decoded) user = decoded;
    } else if (
      authHeader?.startsWith("ApiKey ") &&
      !pathname.startsWith("/api/v1/")
    ) {
      const apiKey = authHeader.split(" ")[1];
      const res = await fetch(
        new URL("/api/auth/verify-apikey", request.url).toString(),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-access-token-internal": process.env.X_ACCESS_TOKEN_INTERNAL,
          },
          body: JSON.stringify({ apiKey }),
        }
      );
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          user = data.user;
        }
      }
    }
  } catch (err) {}

  if (!user && isProtected) {
    if (pathname.startsWith("/api/") && !pathname.startsWith("/api/v1/")) {
      return new NextResponse(
        JSON.stringify({ success: false, message: "Authentication failed" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }
    if (!pathname.startsWith("/api/")) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
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
