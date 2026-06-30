// app/api/delivery-tiers/route.ts
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/app/lib/db";
import { withSecurity } from "@/app/lib/security";

// ─────────────────────────────────────────────────────────────────────────────
// POST — create a new tier
// ─────────────────────────────────────────────────────────────────────────────
export const POST = withSecurity(
  async (req: NextRequest) => {
    try {
      const body = (await req.json()) as {
        max_distance_km: number;
        min_order_eur: number;
        delivery_fee_eur: number;
        sort_order?: number;
      };

      if (
        typeof body.max_distance_km !== "number" ||
        typeof body.min_order_eur !== "number" ||
        typeof body.delivery_fee_eur !== "number"
      ) {
        return NextResponse.json(
          { error: "max_distance_km, min_order_eur and delivery_fee_eur are required numbers" },
          { status: 400 }
        );
      }

      // Default sort_order: place after current last tier
      let sortOrder = body.sort_order;
      if (sortOrder === undefined) {
        const [last] = await sql`SELECT COALESCE(MAX(sort_order), 0) AS max FROM delivery_tiers`;
        sortOrder = (last.max as number) + 1;
      }

      const [row] = await sql`
        INSERT INTO delivery_tiers (max_distance_km, min_order_eur, delivery_fee_eur, sort_order)
        VALUES (${body.max_distance_km}, ${body.min_order_eur}, ${body.delivery_fee_eur}, ${sortOrder})
        RETURNING id, max_distance_km, min_order_eur, delivery_fee_eur, sort_order
      `;

      return NextResponse.json({ tier: row }, { status: 201 });
    } catch (e) {
      console.error("delivery-tiers POST:", e);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  },
  { allowedMethods: ["POST"], rateLimit: { maxRequests: 30, windowMs: 60_000 } }
);