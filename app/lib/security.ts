/**
 * app/lib/security.ts
 *
 * Universal API security wrapper for Next.js route handlers.
 * Supports:
 * - Neon Auth session cookies
 * - Bearer token auth
 * - Rate limiting
 * - Method restriction
 * - Optional CORS
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/lib/auth";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export type SecurityOptions = {
  requireAuth?: boolean;

  allowedMethods?: string[];

  rateLimit?: {
    maxRequests: number;
    windowMs: number;
  };

  cors?: {
    origins: string[];
    methods?: string[];
    headers?: string[];
  };
};

export type RouteHandler = (
  req: NextRequest,
  ctx?: unknown
) =>
  | Promise<Response | NextResponse>
  | Response
  | NextResponse;

// ─────────────────────────────────────────────
// Defaults
// ─────────────────────────────────────────────

const DEFAULTS: Required<
  Omit<SecurityOptions, "allowedMethods" | "cors">
> = {
  requireAuth: true,

  rateLimit: {
    maxRequests: 120,
    windowMs: 60_000,
  },
};

// ─────────────────────────────────────────────
// In-memory rate limit store
// ─────────────────────────────────────────────

const rateLimitStore = new Map<
  string,
  {
    count: number;
    resetAt: number;
  }
>();

// ─────────────────────────────────────────────
// Method guard
// ─────────────────────────────────────────────

function checkMethod(
  req: NextRequest,
  allowed: string[]
): NextResponse | null {
  const ok = allowed
    .map((m) => m.toUpperCase())
    .includes(req.method.toUpperCase());

  if (!ok) {
    return NextResponse.json(
      {
        error: `Method ${req.method} not allowed`,
      },
      {
        status: 405,
        headers: {
          Allow: allowed.join(", "),
        },
      }
    );
  }

  return null;
}

// ─────────────────────────────────────────────
// Auth guard
// ─────────────────────────────────────────────

async function checkAuth(
  req: NextRequest
): Promise<NextResponse | null> {
  try {
    // ── Neon Auth session ────────────────────

    const session = await auth.getSession();
if (session?.data?.user) {
      return null;
    }

    // ── Bearer token fallback ────────────────

    const header =
      req.headers.get("authorization") ?? "";

    const token = header.startsWith("Bearer ")
      ? header.slice(7).trim()
      : null;

    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const secret = process.env.API_SECRET_TOKEN;

    if (secret && token !== secret) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    return null;
  } catch (err) {
    console.error("Auth error:", err);

    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }
}

// ─────────────────────────────────────────────
// Rate limiting
// ─────────────────────────────────────────────

function checkRateLimit(
  req: NextRequest,
  maxRequests: number,
  windowMs: number
): NextResponse | null {
  const ip =
    req.headers
      .get("x-forwarded-for")
      ?.split(",")[0]
      .trim() ?? "unknown";

  const now = Date.now();

  const entry = rateLimitStore.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(ip, {
      count: 1,
      resetAt: now + windowMs,
    });

    return null;
  }

  if (entry.count >= maxRequests) {
    return NextResponse.json(
      {
        error: "Too many requests",
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(
            Math.ceil((entry.resetAt - now) / 1000)
          ),
        },
      }
    );
  }

  entry.count++;

  return null;
}

// ─────────────────────────────────────────────
// CORS
// ─────────────────────────────────────────────

function applyCors(
  req: NextRequest,
  res: Response | NextResponse,
  cors: NonNullable<SecurityOptions["cors"]>
): Response | NextResponse {
  const origin =
    req.headers.get("origin") ?? "";

  const allowed =
    cors.origins.includes("*") ||
    cors.origins.includes(origin);

  if (!allowed) {
    return res;
  }

  res.headers.set(
    "Access-Control-Allow-Origin",
    origin || "*"
  );

  res.headers.set(
    "Access-Control-Allow-Methods",
    (
      cors.methods ?? [
        "GET",
        "POST",
        "PUT",
        "PATCH",
        "DELETE",
        "OPTIONS",
      ]
    ).join(", ")
  );

  res.headers.set(
    "Access-Control-Allow-Headers",
    (
      cors.headers ?? [
        "Content-Type",
        "Authorization",
      ]
    ).join(", ")
  );

  res.headers.set(
    "Access-Control-Max-Age",
    "86400"
  );

  return res;
}

// ─────────────────────────────────────────────
// Main wrapper
// ─────────────────────────────────────────────

export function withSecurity(
  handler: RouteHandler,
  options: SecurityOptions = {}
): RouteHandler {
  const requireAuth =
    options.requireAuth ??
    DEFAULTS.requireAuth;

  const rateLimit =
    options.rateLimit ??
    DEFAULTS.rateLimit;

  const { allowedMethods, cors } = options;

  return async (req, ctx) => {
    // ── CORS preflight ───────────────────────

    if (req.method === "OPTIONS" && cors) {
      return applyCors(
        req,
        new NextResponse(null, {
          status: 204,
        }),
        cors
      );
    }

    // ── Method restriction ──────────────────

    if (allowedMethods) {
      const err = checkMethod(
        req,
        allowedMethods
      );

      if (err) {
        return err;
      }
    }

    // ── Rate limit ──────────────────────────

    if (rateLimit) {
      const err = checkRateLimit(
        req,
        rateLimit.maxRequests,
        rateLimit.windowMs
      );

      if (err) {
        return err;
      }
    }

    // ── Auth ────────────────────────────────

    if (requireAuth) {
      const err = await checkAuth(req);

      if (err) {
        return err;
      }
    }

    // ── Run actual route handler ────────────

    let response = await handler(req, ctx);

    // ── Attach CORS headers ─────────────────

    if (cors) {
      response = applyCors(
        req,
        response,
        cors
      );
    }

    return response;
  };
}