// app/api/orders/route.ts

export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/app/lib/db";
import { withSecurity } from "@/app/lib/security";
import { OrderStatus } from "@/app/(frontend)/orders/types";

const STAGE_STATUSES: Record<string, OrderStatus[]> = {
  incoming: ["pending", "confirmed"],
  preparing: ["preparing"],
  dispatch: ["ready", "out_for_delivery"],
};

const ALL_ACTIVE: OrderStatus[] = [
  "pending",
  "confirmed",
  "preparing",
  "ready",
  "out_for_delivery",
];

// GET /api/orders?stage=incoming|preparing|dispatch
export const GET = withSecurity(
  async (req: NextRequest) => {
    try {
      const { searchParams } = new URL(req.url);

      const stage =
        searchParams.get("stage");

      const statuses: OrderStatus[] =
        stage
          ? (
              STAGE_STATUSES[stage] ??
              ALL_ACTIVE
            )
          : ALL_ACTIVE;

      const rows = await sql`
        SELECT
          o.id,
          o.order_number,
          o.status,
          o.order_type,
          o.customer_name,
          o.customer_email,
          o.customer_phone,
          o.customer_note,
          o.subtotal,
          o.tax,
          o.delivery_fee,
          o.total,
          o.payment_method,
          o.payment_status,
          o.created_at,
          o.updated_at,

          CASE
            WHEN da.id IS NOT NULL THEN
              jsonb_build_object(
                'id',           da.id,
                'street',       da.street,
                'house_number', da.house_number,
                'city',         da.city,
                'postal_code',  da.postal_code,
                'country',      da.country,
                'notes',        da.notes
              )
            ELSE NULL
          END AS delivery_address,

          COALESCE(
            jsonb_agg(
              DISTINCT jsonb_build_object(
                'id',                    oi.id,
                'product_id',            oi.product_id,
                'product_name_snapshot', oi.product_name_snapshot,
                'quantity',              oi.quantity,
                'unit_price',            oi.unit_price,
                'unit_price_snapshot',   oi.unit_price_snapshot,

                'chosen_options',
                COALESCE((
                  SELECT jsonb_agg(
                    jsonb_build_object(
                      'option_name_snapshot', oio.option_name_snapshot,
                      'value_label_snapshot', oio.value_label_snapshot,
                      'price_delta_snapshot', oio.price_delta_snapshot
                    )
                  )
                  FROM order_item_options oio
                  WHERE oio.order_item_id = oi.id
                ), '[]'::jsonb),

                'item_note', oi.item_note,

                'additives',
                COALESCE((
                  SELECT jsonb_agg(
                    jsonb_build_object(
                      'additive_code_snapshot', oia.additive_code_snapshot,
                      'additive_name_snapshot', oia.additive_name_snapshot
                    )
                  )
                  FROM order_item_additives oia
                  WHERE oia.order_item_id = oi.id
                ), '[]'::jsonb)
              )
            ) FILTER (
              WHERE oi.id IS NOT NULL
            ),
            '[]'::jsonb
          ) AS items

        FROM orders o

        LEFT JOIN delivery_addresses da
          ON da.id = o.delivery_address_id

        LEFT JOIN order_items oi
          ON oi.order_id = o.id

        WHERE
          o.status = ANY(
            ${statuses}::order_status[]
          )

        GROUP BY
          o.id,
          o.order_number,
          o.status,
          o.order_type,
          o.customer_name,
          o.customer_email,
          o.customer_phone,
          o.customer_note,
          o.subtotal,
          o.tax,
          o.delivery_fee,
          o.total,
          o.payment_method,
          o.payment_status,
          o.created_at,
          o.updated_at,
          da.id,
          da.street,
          da.house_number,
          da.city,
          da.postal_code,
          da.country,
          da.notes

        ORDER BY
          o.created_at ASC
      `;

      return NextResponse.json({
        orders: rows,
      });

    } catch (err) {
      console.error(
        "Kitchen orders GET error:",
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