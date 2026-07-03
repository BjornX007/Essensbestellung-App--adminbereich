// app/api/delivery-tiers/[id]/route.ts
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/app/lib/db";
import { withSecurity } from "@/app/lib/security";

function extractId(req: NextRequest): number | null {
  const segments = new URL(req.url).pathname.split("/");
  const id = parseInt(segments[segments.length - 1], 10);
  return isNaN(id) ? null : id;
}

// ─────────────────────────────────────────────────────────────────────────────
// PATCH — update a tier
// ─────────────────────────────────────────────────────────────────────────────
export const PATCH = withSecurity(
  async (req: NextRequest) => {
    try {
      const id = extractId(req);
      if (id === null) {
        return NextResponse.json({ error: "Invalid tier id" }, { status: 400 });
      }

      const body = (await req.json()) as {
        max_distance_km?: number;
        min_order_eur?: number;
        delivery_fee_eur?: number;
        sort_order?: number;
      };

      const [current] = await sql`SELECT * FROM delivery_tiers WHERE id = ${id}`;
      if (!current) {
        return NextResponse.json({ error: "Tier not found" }, { status: 404 });
      }

      const max_distance_km  = body.max_distance_km  ?? current.max_distance_km;
      const min_order_eur    = body.min_order_eur    ?? current.min_order_eur;
      const delivery_fee_eur = body.delivery_fee_eur ?? current.delivery_fee_eur;
      const sort_order       = body.sort_order       ?? current.sort_order;

      const [row] = await sql`
        UPDATE delivery_tiers
        SET
          max_distance_km  = ${max_distance_km},
          min_order_eur    = ${min_order_eur},
          delivery_fee_eur = ${delivery_fee_eur},
          sort_order       = ${sort_order}
        WHERE id = ${id}
        RETURNING id, max_distance_km, min_order_eur, delivery_fee_eur, sort_order
      `;

      return NextResponse.json({ tier: row });
    } catch (e) {
      console.error("delivery-tiers PATCH:", e);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  },
  { allowedMethods: ["PATCH"], rateLimit: { maxRequests: 30, windowMs: 60_000 } }
);

// ─────────────────────────────────────────────────────────────────────────────
// DELETE — remove a tier
// ─────────────────────────────────────────────────────────────────────────────
export const DELETE = withSecurity(
  async (req: NextRequest) => {
    try {
      const id = extractId(req);
      if (id === null) {
        return NextResponse.json({ error: "Invalid tier id" }, { status: 400 });
      }

      const [deleted] = await sql`
        DELETE FROM delivery_tiers WHERE id = ${id} RETURNING id
      `;

      if (!deleted) {
        return NextResponse.json({ error: "Tier not found" }, { status: 404 });
      }

      return NextResponse.json({ deleted: true });
    } catch (e) {
      console.error("delivery-tiers DELETE:", e);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  },
  { allowedMethods: ["DELETE"], rateLimit: { maxRequests: 30, windowMs: 60_000 } }
);