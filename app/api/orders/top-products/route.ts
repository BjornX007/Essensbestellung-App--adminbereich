
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";
import { withSecurity } from "@/app/lib/security";

const sql = neon(process.env.DATABASE_URL!);

export const GET = withSecurity(
  async () => {
    try {
      const rows = await sql`
        SELECT
          oi.product_name_snapshot                        AS name,
          SUM(oi.quantity)::int                           AS total_quantity,
          COUNT(DISTINCT oi.order_id)::int                AS order_count,
          COALESCE(SUM(oi.quantity * oi.unit_price_snapshot), 0)::text AS revenue
        FROM order_items oi
        JOIN orders o ON o.id = oi.order_id
        WHERE o.status != 'cancelled'
        GROUP BY oi.product_name_snapshot
        ORDER BY total_quantity DESC
        LIMIT 10
      `;

      return NextResponse.json({ success: true, data: rows });
    } catch (error) {
      console.error("[top-products] error:", error);
      return NextResponse.json(
        { success: false, error: String(error) },
        { status: 500 }
      );
    }
  },
  {
    allowedMethods: ["GET"],
    rateLimit: { maxRequests: 30, windowMs: 60_000 },
  }
);