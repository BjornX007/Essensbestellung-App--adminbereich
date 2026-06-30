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

      const q          = searchParams.get("q")?.trim() ?? "";
      const status     = searchParams.get("status") ?? "all";
      const dateFrom   = searchParams.get("date_from") ?? "";
      const dateTo     = searchParams.get("date_to") ?? "";
      const page       = Math.max(1, Number(searchParams.get("page") ?? "1"));
      const limitParam = Math.min(10000, Math.max(1, Number(searchParams.get("limit") ?? "50")));
      const offset     = (page - 1) * limitParam;

      const allowedStatuses =
        status === "delivered"        ? ["delivered"]
        : status === "out_for_delivery" ? ["out_for_delivery"]
        : status === "cancelled"      ? ["cancelled"]
        : ["delivered", "out_for_delivery", "cancelled"];

      // Build date range as timestamps
      // date_from = start of that day UTC, date_to = end of that day UTC
      const hasDateFrom = dateFrom.length === 10;
      const hasDateTo   = dateTo.length === 10;

      // We pass these as strings; Postgres will cast to timestamptz
      const tsFrom = hasDateFrom ? `${dateFrom}T00:00:00.000Z` : null;
      const tsTo   = hasDateTo   ? `${dateTo}T23:59:59.999Z`   : null;

      const hasSearch = q.length > 0;

      const selectCols = sql`
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
      `;

      // Build WHERE conditions as fragments
      const statusCond  = sql`o.status = ANY(${allowedStatuses})`;
      const searchCond  = hasSearch
        ? sql`AND (
            o.order_number::text ILIKE ${"%" + q + "%"}
            OR o.customer_name   ILIKE ${"%" + q + "%"}
            OR o.customer_email  ILIKE ${"%" + q + "%"}
            OR o.customer_phone  ILIKE ${"%" + q + "%"}
          )`
        : sql``;
      const dateFromCond = tsFrom ? sql`AND o.created_at >= ${tsFrom}::timestamptz` : sql``;
      const dateToCond   = tsTo   ? sql`AND o.created_at <= ${tsTo}::timestamptz`   : sql``;

      const orders = await sql`
        ${selectCols}
        WHERE ${statusCond}
          ${searchCond}
          ${dateFromCond}
          ${dateToCond}
        ORDER BY o.created_at DESC
        LIMIT ${limitParam}
        OFFSET ${offset}
      `;

      const countResult = await sql`
        SELECT COUNT(*)::int AS total
        FROM orders o
        WHERE ${statusCond}
          ${searchCond}
          ${dateFromCond}
          ${dateToCond}
      `;

      const total = countResult[0]?.total ?? 0;

      if (!orders || orders.length === 0) {
        return NextResponse.json({ orders: [], total, page, limit: limitParam });
      }

      const orderIds = orders.map((o: any) => o.id);

      // Items
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

      // Options
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

      const optionsByItem: Record<string, Map<string, string>> = {};
      for (const opt of chosenOptions) {
        if (!optionsByItem[opt.order_item_id]) {
          optionsByItem[opt.order_item_id] = new Map();
        }
        optionsByItem[opt.order_item_id].set(opt.option_value_id, opt.value_label_snapshot);
      }

      const itemsByOrder: Record<string, any[]> = {};
      for (const item of items) {
        if (!itemsByOrder[item.order_id]) itemsByOrder[item.order_id] = [];
        const optMap = optionsByItem[item.id];
        const option_values = optMap ? Array.from(optMap.values()).join(", ") : null;
        itemsByOrder[item.order_id].push({ ...item, option_values });
      }

      const enriched = orders.map((o: any) => ({
        ...o,
        items: itemsByOrder[o.id] ?? [],
      }));

      return NextResponse.json({ orders: enriched, total, page, limit: limitParam });
    } catch (err) {
      console.error("Order history GET error:", err);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  },
  {
    allowedMethods: ["GET"],
    rateLimit: { maxRequests: 60, windowMs: 60_000 },
  }
);