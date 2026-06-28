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

      const q = searchParams.get("q")?.trim() ?? "";
      const status = searchParams.get("status") ?? "all";
      const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
      const limit = 50;
      const offset = (page - 1) * limit;

      const allowedStatuses =
        status === "delivered"
          ? ["delivered"]
          : status === "out_for_delivery"
          ? ["out_for_delivery"]
          : status === "cancelled"
          ? ["cancelled"]
          : ["delivered", "out_for_delivery", "cancelled"];

      const hasSearch = q.length > 0;

      // ─────────────────────────────
      // Orders + driver name + address
      // ─────────────────────────────
      const orders = hasSearch
        ? await sql`
            SELECT
              o.id,
              o.order_number,
              o.status,
              o.order_type,
              o.customer_name,
              o.customer_email,
              o.customer_phone,
              o.subtotal,
              o.tax,
              o.delivery_fee,
              o.total,
              o.payment_method,
              o.payment_status,
              o.created_at,
              o.updated_at,
              o.assigned_driver_id,
              u.name AS delivered_by,
              CASE
                WHEN da.id IS NULL THEN NULL
                ELSE da.street || ' ' || da.house_number || ', ' || da.postal_code || ' ' || da.city
              END AS delivery_address

            FROM orders o
            LEFT JOIN neon_auth."user" u  ON u.id::text = o.assigned_driver_id::text
            LEFT JOIN delivery_addresses da ON da.id = o.delivery_address_id

            WHERE
              o.status = ANY(${allowedStatuses})
              AND (
                o.order_number::text ILIKE ${"%" + q + "%"}
                OR o.customer_name   ILIKE ${"%" + q + "%"}
                OR o.customer_email  ILIKE ${"%" + q + "%"}
                OR o.customer_phone  ILIKE ${"%" + q + "%"}
              )

            ORDER BY o.created_at DESC
            LIMIT ${limit}
            OFFSET ${offset}
          `
        : await sql`
            SELECT
              o.id,
              o.order_number,
              o.status,
              o.order_type,
              o.customer_name,
              o.customer_email,
              o.customer_phone,
              o.subtotal,
              o.tax,
              o.delivery_fee,
              o.total,
              o.payment_method,
              o.payment_status,
              o.created_at,
              o.updated_at,
              o.assigned_driver_id,
              u.name AS delivered_by,
              CASE
                WHEN da.id IS NULL THEN NULL
                ELSE da.street || ' ' || da.house_number || ', ' || da.postal_code || ' ' || da.city
              END AS delivery_address

            FROM orders o
            LEFT JOIN neon_auth."user" u  ON u.id::text = o.assigned_driver_id::text
            LEFT JOIN delivery_addresses da ON da.id = o.delivery_address_id

            WHERE
              o.status = ANY(${allowedStatuses})

            ORDER BY o.created_at DESC
            LIMIT ${limit}
            OFFSET ${offset}
          `;

      // ─────────────────────────────
      // Count
      // ─────────────────────────────
      const countResult = hasSearch
        ? await sql`
            SELECT COUNT(*)::int AS total
            FROM orders
            WHERE
              status = ANY(${allowedStatuses})
              AND (
                order_number::text ILIKE ${"%" + q + "%"}
                OR customer_name   ILIKE ${"%" + q + "%"}
                OR customer_email  ILIKE ${"%" + q + "%"}
                OR customer_phone  ILIKE ${"%" + q + "%"}
              )
          `
        : await sql`
            SELECT COUNT(*)::int AS total
            FROM orders
            WHERE status = ANY(${allowedStatuses})
          `;

      const total = countResult[0]?.total ?? 0;

      if (!orders || orders.length === 0) {
        return NextResponse.json({ orders: [], total, page, limit });
      }

      const orderIds = orders.map((o: any) => o.id);

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

      // ─────────────────────────────
      // Chosen options per item
      // ─────────────────────────────
      const itemIds = items.map((i: any) => i.id);

      const chosenOptions = itemIds.length > 0
        ? await sql`
           SELECT DISTINCT ON (order_item_id, option_value_id)
  order_item_id,
  option_value_id,
  option_name_snapshot,
  value_label_snapshot
FROM order_item_options
WHERE order_item_id = ANY(${itemIds})
ORDER BY order_item_id, option_value_id
          `
        : [];

      // Dedup by "order_item_id + option_name" key to prevent duplicates
      const optionsByItem: Record<string, Map<string, string>> = {};
      for (const opt of chosenOptions) {
        if (!optionsByItem[opt.order_item_id]) {
          optionsByItem[opt.order_item_id] = new Map();
        }
       optionsByItem[opt.order_item_id].set(
  opt.option_value_id,              // ← dedup key (unique per row)
  opt.value_label_snapshot          // ← just the value, no "name: name"
);
      }

      // ─────────────────────────────
      // Build items map
      // ─────────────────────────────
      const itemsByOrder: Record<string, any[]> = {};
      for (const item of items) {
        if (!itemsByOrder[item.order_id]) {
          itemsByOrder[item.order_id] = [];
        }
        const optMap = optionsByItem[item.id];
const option_values = optMap
  ? Array.from(optMap.values()).join(", ")  // ← values only, no keys
  : null;

        itemsByOrder[item.order_id].push({
          ...item,
          option_values,
        });
      }

      // ─────────────────────────────
      // Final shape
      // ─────────────────────────────
      const enriched = orders.map((o: any) => ({
        ...o,
        items: itemsByOrder[o.id] ?? [],
      }));

      return NextResponse.json({ orders: enriched, total, page, limit });
    } catch (err) {
      console.error("Order history GET error:", err);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  },
  {
    allowedMethods: ["GET"],
    rateLimit: { maxRequests: 60, windowMs: 60_000 },
  }
);