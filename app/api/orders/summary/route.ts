// app/api/orders/summary/route.ts

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
          COUNT(*)::int AS total_orders,

          COALESCE(SUM(total), 0)::text AS total_revenue,
          COALESCE(SUM(subtotal), 0)::text AS total_subtotal,
          COALESCE(SUM(delivery_fee), 0)::text AS total_delivery,
          COALESCE(SUM(tax), 0)::text AS total_tax,

          SUM(
            CASE
              WHEN payment_method = 'paypal'
              THEN 1
              ELSE 0
            END
          )::int AS paypal_orders,

          COALESCE(
            SUM(
              CASE
                WHEN payment_method = 'paypal'
                THEN total
                ELSE 0
              END
            ),
            0
          )::text AS paypal_revenue,

          SUM(
            CASE
              WHEN payment_method = 'cash_on_delivery'
              THEN 1
              ELSE 0
            END
          )::int AS cash_on_delivery_orders,

          COALESCE(
            SUM(
              CASE
                WHEN payment_method = 'cash_on_delivery'
                THEN total
                ELSE 0
              END
            ),
            0
          )::text AS cash_on_delivery_revenue,

          SUM(
            CASE
              WHEN payment_method = 'card'
              THEN 1
              ELSE 0
            END
          )::int AS card_orders,

          COALESCE(
            SUM(
              CASE
                WHEN payment_method = 'card'
                THEN total
                ELSE 0
              END
            ),
            0
          )::text AS card_revenue,

          SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END)::int AS pending_orders,
          SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END)::int AS confirmed_orders,
          SUM(CASE WHEN status = 'preparing' THEN 1 ELSE 0 END)::int AS preparing_orders,
          SUM(CASE WHEN status = 'ready' THEN 1 ELSE 0 END)::int AS ready_orders,
          SUM(CASE WHEN status = 'out_for_delivery' THEN 1 ELSE 0 END)::int AS out_for_delivery_orders,
          SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END)::int AS delivered_orders,
          SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END)::int AS cancelled_orders

        FROM orders
      `;

      return NextResponse.json({
        success: true,
        data: rows[0],
      });

    } catch (error) {
      console.error(
        "[summary] FULL ERROR:",
        error
      );

      return NextResponse.json(
        {
          success: false,
          error: String(error),
        },
        {
          status: 500,
        }
      );
    }
  },
  {
    allowedMethods: ["GET"],

    rateLimit: {
      maxRequests: 30,
      windowMs: 60_000,
    },
  }
);