// app/api/delivery-settings/route.ts
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/app/lib/db";
import { withSecurity } from "@/app/lib/security";

// ─────────────────────────────────────────────────────────────────────────────
// GET — returns settings + tiers together
// ─────────────────────────────────────────────────────────────────────────────
export const GET = withSecurity(
  async () => {
    try {
      const [settingsRows, tierRows] = await Promise.all([
        sql`
          SELECT id, is_accepting, order_time_rule, allowed_postals
          FROM delivery_settings
          WHERE id = 1
        `,
        sql`
          SELECT id, max_distance_km, min_order_eur, delivery_fee_eur, sort_order
          FROM delivery_tiers
          ORDER BY sort_order ASC, max_distance_km ASC
        `,
      ]);

      if (!settingsRows[0]) {
        return NextResponse.json(
          { error: "Settings not found" },
          { status: 404 }
        );
      }

      return NextResponse.json({
        settings: settingsRows[0],
        tiers: tierRows,
      });
    } catch (err) {
      console.error("delivery-settings GET:", err);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  },
  { allowedMethods: ["GET"] }
);

// ─────────────────────────────────────────────────────────────────────────────
// PATCH — only updates is_accepting, order_time_rule, allowed_postals
//         (fee_per_km / max_distance_km are now managed via delivery_tiers)
// ─────────────────────────────────────────────────────────────────────────────
export const PATCH = withSecurity(
  async (req: NextRequest) => {
    try {
      const body = (await req.json()) as {
        is_accepting?: boolean;
        order_time_rule?: string;
        allowed_postals?: string[];
      };

      const [current] = await sql`
        SELECT * FROM delivery_settings WHERE id = 1
      `;

      if (!current) {
        return NextResponse.json(
          { error: "Settings not found" },
          { status: 404 }
        );
      }

      const is_accepting    = body.is_accepting    ?? current.is_accepting;
      const order_time_rule = body.order_time_rule ?? current.order_time_rule;
      const allowed_postals = body.allowed_postals ?? current.allowed_postals;

      const [row] = await sql`
        UPDATE delivery_settings
        SET
          is_accepting    = ${is_accepting},
          order_time_rule = ${order_time_rule},
          allowed_postals = ${allowed_postals}
        WHERE id = 1
        RETURNING id, is_accepting, order_time_rule, allowed_postals
      `;

      return NextResponse.json({ settings: row });
    } catch (err) {
      console.error("delivery-settings PATCH:", err);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  },
  {
    allowedMethods: ["PATCH"],
    rateLimit: { maxRequests: 30, windowMs: 60_000 },
  }
);
