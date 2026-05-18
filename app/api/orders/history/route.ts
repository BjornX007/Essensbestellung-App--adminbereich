// app/api/orders/history/route.ts

export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/app/lib/db";
import { withSecurity } from "@/app/lib/security";

export const GET = withSecurity(
  async (req: NextRequest) => {
    try {
      const { searchParams } = new URL(req.url);

      const q =
        searchParams.get("q")?.trim() ?? "";

      const status =
        searchParams.get("status") ??
        "all";

      const page = Math.max(
        1,
        Number(
          searchParams.get("page") ?? "1"
        )
      );

      const limit = 50;

      const offset =
        (page - 1) * limit;

      const allowedStatuses =
        status === "delivered"
          ? ["delivered"]
          : status === "out_for_delivery"
          ? ["out_for_delivery"]
          : status === "cancelled"
          ? ["cancelled"]
          : [
              "delivered",
              "out_for_delivery",
              "cancelled",
            ];

      const hasSearch =
        q.length > 0;

      // ─────────────────────────────
      // Orders
      // ─────────────────────────────
      const orders = hasSearch
        ? await sql`
            SELECT
              id,
              order_number,
              status,
              order_type,
              customer_name,
              customer_email,
              customer_phone,
              subtotal,
              tax,
              delivery_fee,
              total,
              payment_method,
              payment_status,
              created_at,
              updated_at

            FROM orders

            WHERE
              status = ANY(${allowedStatuses})

              AND (
                order_number::text ILIKE ${"%" + q + "%"}
                OR customer_name ILIKE ${"%" + q + "%"}
                OR customer_email ILIKE ${"%" + q + "%"}
                OR customer_phone ILIKE ${"%" + q + "%"}
              )

            ORDER BY created_at DESC

            LIMIT ${limit}
            OFFSET ${offset}
          `
        : await sql`
            SELECT
              id,
              order_number,
              status,
              order_type,
              customer_name,
              customer_email,
              customer_phone,
              subtotal,
              tax,
              delivery_fee,
              total,
              payment_method,
              payment_status,
              created_at,
              updated_at

            FROM orders

            WHERE
              status = ANY(${allowedStatuses})

            ORDER BY created_at DESC

            LIMIT ${limit}
            OFFSET ${offset}
          `;

      // ─────────────────────────────
      // Count
      // ─────────────────────────────
      const countResult =
        hasSearch
          ? await sql`
              SELECT
                COUNT(*)::int AS total

              FROM orders

              WHERE
                status = ANY(${allowedStatuses})

                AND (
                  order_number::text ILIKE ${"%" + q + "%"}
                  OR customer_name ILIKE ${"%" + q + "%"}
                  OR customer_email ILIKE ${"%" + q + "%"}
                  OR customer_phone ILIKE ${"%" + q + "%"}
                )
            `
          : await sql`
              SELECT
                COUNT(*)::int AS total

              FROM orders

              WHERE
                status = ANY(${allowedStatuses})
            `;

      const total =
        countResult[0]?.total ?? 0;

      if (
        !orders ||
        orders.length === 0
      ) {
        return NextResponse.json({
          orders: [],
          total,
          page,
          limit,
        });
      }

      const orderIds =
        orders.map(
          (o: any) => o.id
        );

      // ─────────────────────────────
      // Items
      // ─────────────────────────────
      const items = await sql`
        SELECT
          id,
          order_id,
          product_name_snapshot,
          quantity,
          unit_price_snapshot,
          item_note

        FROM order_items

        WHERE order_id = ANY(${orderIds})
      `;

      const itemsByOrder:
        Record<string, any[]> = {};

      for (const item of items) {
        if (
          !itemsByOrder[
            item.order_id
          ]
        ) {
          itemsByOrder[
            item.order_id
          ] = [];
        }

        itemsByOrder[
          item.order_id
        ].push(item);
      }

      // ─────────────────────────────
      // Final shape
      // ─────────────────────────────
      const enriched = orders.map(
        (o: any) => ({
          ...o,
          items:
            itemsByOrder[o.id] ??
            [],
        })
      );

      return NextResponse.json({
        orders: enriched,
        total,
        page,
        limit,
      });
    } catch (err) {
      console.error(
        "Order history GET error:",
        err
      );

      return NextResponse.json(
        {
          error:
            "Internal server error",
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
      maxRequests: 60,
      windowMs: 60_000,
    },
  }
);