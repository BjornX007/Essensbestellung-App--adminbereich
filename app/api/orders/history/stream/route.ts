// app/api/orders/stream/route.ts

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { withSecurity } from "@/app/lib/security";

const ACTIVE_STATUSES = [
  "pending",
  "confirmed",
  "preparing",
  "ready",
  "out_for_delivery",
];

function getSQL() {
  return neon(process.env.DATABASE_URL!);
}

// ─────────────────────────────────────────────────────────────────────────────
// SECURED SSE STREAM
// ─────────────────────────────────────────────────────────────────────────────
export const GET = withSecurity(
  async (req: NextRequest) => {
    const encoder = new TextEncoder();
    const sql = getSQL();

    let lastChecked = new Date(
      Date.now() - 1000
    ).toISOString();

    const stream = new ReadableStream({
      async start(controller) {
        let closed = false;

        const send = (
          event: string,
          data: unknown
        ) => {
          if (closed) return;

          try {
            controller.enqueue(
              encoder.encode(
                `event: ${event}\ndata: ${JSON.stringify(
                  data
                )}\n\n`
              )
            );
          } catch {
            // stream closed
          }
        };

        // Connected event
        send("connected", {
          message:
            "Kitchen stream connected",
          timestamp:
            new Date().toISOString(),
        });

        // ─────────────────────────────
        // Poll function
        // ─────────────────────────────
        const poll = async () => {
          if (closed) return;

          try {
            const snapshotTime =
              lastChecked;

            lastChecked =
              new Date().toISOString();

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
                  WHEN da.id IS NOT NULL THEN jsonb_build_object(
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
                      'product_name_snapshot', oi.product_name_snapshot,
                      'quantity',              oi.quantity,
                      'unit_price',            oi.unit_price,
                      'chosen_options',        COALESCE(oi.chosen_options, '[]'::jsonb),
                      'item_note',             oi.item_note,

                      'additives', COALESCE((
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
                  ) FILTER (WHERE oi.id IS NOT NULL),
                  '[]'::jsonb
                ) AS items

              FROM orders o

              LEFT JOIN delivery_addresses da
                ON da.id = o.delivery_address_id

              LEFT JOIN order_items oi
                ON oi.order_id = o.id

              WHERE
                o.status = ANY(${ACTIVE_STATUSES}::order_status[])
                AND o.updated_at > ${snapshotTime}::timestamptz

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

              ORDER BY o.created_at ASC
            `;

            for (const order of rows) {
              const ageMs =
                Date.now() -
                new Date(
                  order.created_at
                ).getTime();

              const isNew =
                ageMs < 8000;

              send(
                isNew
                  ? "new_order"
                  : "order_updated",
                order
              );
            }
          } catch (err) {
            console.error(
              "SSE poll error:",
              err
            );
          }
        };

        // First poll immediately
        await poll();

        // Poll every 5s
        const interval =
          setInterval(
            poll,
            5000
          );

        // Keepalive
        const keepalive =
          setInterval(() => {
            send("ping", {
              ts: Date.now(),
            });
          }, 25000);

        // Cleanup
        req.signal.addEventListener(
          "abort",
          () => {
            closed = true;

            clearInterval(
              interval
            );

            clearInterval(
              keepalive
            );

            try {
              controller.close();
            } catch {}
          }
        );
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type":
          "text/event-stream",

        "Cache-Control":
          "no-cache, no-transform",

        Connection:
          "keep-alive",

        "X-Accel-Buffering":
          "no",
      },
    });
  },
  {
    allowedMethods: ["GET"],

    rateLimit: {
      maxRequests: 30,
      windowMs: 60_000,
    },
  }
);