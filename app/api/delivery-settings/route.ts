// app/api/delivery-settings/route.ts

export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/app/lib/db";
import { withSecurity } from "@/app/lib/security";

// ─────────────────────────────────────────────────────────────────────────────
// GET
// ─────────────────────────────────────────────────────────────────────────────
export const GET = withSecurity(
  async () => {
    try {
      const [row] = await sql`
        SELECT
          id,
          is_accepting,
          order_time_rule,
          fee_per_km,
          max_distance_km,
          allowed_postals
        FROM delivery_settings
        WHERE id = 1
      `;

      if (!row) {
        return NextResponse.json(
          { error: "Settings not found" },
          { status: 404 }
        );
      }

      return NextResponse.json({
        settings: row,
      });
    } catch (err) {
      console.error(
        "delivery-settings GET:",
        err
      );

      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  },
  {
    allowedMethods: ["GET"],
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// PATCH
// ─────────────────────────────────────────────────────────────────────────────
export const PATCH = withSecurity(
  async (req: NextRequest) => {
    try {
      const body = (await req.json()) as {
        is_accepting?: boolean;
        order_time_rule?: string;
        fee_per_km?: number;
        max_distance_km?: number;
        allowed_postals?: string[];
      };

      // Keep existing values if omitted
      const [current] = await sql`
        SELECT *
        FROM delivery_settings
        WHERE id = 1
      `;

      if (!current) {
        return NextResponse.json(
          { error: "Settings not found" },
          { status: 404 }
        );
      }

      const is_accepting =
        body.is_accepting ??
        current.is_accepting;

      const order_time_rule =
        body.order_time_rule ??
        current.order_time_rule;

      const fee_per_km =
        body.fee_per_km ??
        current.fee_per_km;

      const max_distance_km =
        body.max_distance_km ??
        current.max_distance_km;

      const allowed_postals =
        body.allowed_postals ??
        current.allowed_postals;

      const [row] = await sql`
        UPDATE delivery_settings
        SET
          is_accepting    = ${is_accepting},
          order_time_rule = ${order_time_rule},
          fee_per_km      = ${fee_per_km},
          max_distance_km = ${max_distance_km},
          allowed_postals = ${allowed_postals}
        WHERE id = 1
        RETURNING
          id,
          is_accepting,
          order_time_rule,
          fee_per_km,
          max_distance_km,
          allowed_postals
      `;

      return NextResponse.json({
        settings: row,
      });
    } catch (err) {
      console.error(
        "delivery-settings PATCH:",
        err
      );

      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  },
  {
    allowedMethods: ["PATCH"],

    // Optional stricter rate limit
    rateLimit: {
      maxRequests: 30,
      windowMs: 60_000,
    },
  }
);