import { NextRequest, NextResponse } from "next/server";
import { auth } from "./app/lib/auth/server";

// ─── Route definitions ────────────────────────────────────────────────────

const ADMIN_ROUTES = [
  "/dashboard",
  "/orders",
  "/products",
  "/settings",
  "/users",
  "/lieferant",
];

const DRIVER_ROUTES = ["/driver"];

const PUBLIC_ROUTES = ["/auth"];

// ─── Helpers ──────────────────────────────────────────────────────────────

function matchesAny(pathname: string, routes: string[]) {
  return routes.some((r) => pathname === r || pathname.startsWith(r + "/"));
}

function isAdminRoute(p: string)  { return matchesAny(p, ADMIN_ROUTES);  }
function isDriverRoute(p: string) { return matchesAny(p, DRIVER_ROUTES); }
function isPublicRoute(p: string) { return matchesAny(p, PUBLIC_ROUTES); }

// ─── Middleware ────────────────────────────────────────────────────────────

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Always allow public routes through (auth pages, etc.)
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  // Not a protected route — allow through
  if (!isAdminRoute(pathname) && !isDriverRoute(pathname)) {
    return NextResponse.next();
  }

  // Validate session
  const { data, error } = await auth.getSession({ request } as never);
  const user = !error && data?.user ? data.user : null;

  // Not logged in → sign-in, preserving intended destination
  if (!user) {
    const signIn = new URL("/auth/sign-in", request.url);
    signIn.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signIn);
  }

  const role = (user as { role?: string }).role ?? "user";

  // ── Admin routes ──────────────────────────────────────────────────────
  if (isAdminRoute(pathname)) {
    if (role === "admin") return NextResponse.next();
    if (role === "driver") return NextResponse.redirect(new URL("/driver", request.url));
    // Any other role (user, unknown) → forbidden, NOT sign-in (avoids loop)
    return NextResponse.redirect(new URL("/auth/forbidden", request.url));
  }

  // ── Driver routes ─────────────────────────────────────────────────────
  if (isDriverRoute(pathname)) {
    if (role === "driver") return NextResponse.next();
    if (role === "admin") return NextResponse.redirect(new URL("/dashboard", request.url));
    // Any other role → forbidden
    return NextResponse.redirect(new URL("/auth/forbidden", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/orders/:path*",
    "/products/:path*",
    "/settings/:path*",
    "/users/:path*",
    "/lieferant/:path*",
    "/driver/:path*",
  ],
};