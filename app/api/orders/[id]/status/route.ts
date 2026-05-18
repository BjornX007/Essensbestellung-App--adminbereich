// app/api/kitchen/orders/[id]/status/route.ts
import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/app/lib/db";
import { OrderStatus, NEXT_STATUS } from "@/app/(frontend)/orders/types";

const VALID_STATUSES: OrderStatus[] = [
  "pending", "confirmed", "preparing", "ready",
  "out_for_delivery", "delivered", "cancelled",
];

// PATCH /api/kitchen/orders/[id]/status
// Body: { to_status?: OrderStatus, changed_by?: string, note?: string }
// Omit to_status to auto-advance to the next logical status
export async function PATCH(
  req: NextRequest,
{ params }: { params: Promise<{ id: string }> }
) {
  try {
    const orderId = (await params).id;

    if (!orderId) {
      return NextResponse.json({ error: "Missing order ID" }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const {
      to_status,
      changed_by = "kitchen_staff",
      note = null,
    } = body as { to_status?: OrderStatus; changed_by?: string; note?: string };

    // Fetch current order status
    const [order] = await sql`
      SELECT id, status
      FROM orders
      WHERE id = ${orderId}::uuid
      LIMIT 1
    `;

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const currentStatus = order.status as OrderStatus;

    // Resolve target status (NEXT_STATUS can return null for terminal statuses)
    const targetStatus: OrderStatus | null | undefined = to_status ?? NEXT_STATUS[currentStatus];

    if (!targetStatus) {
      return NextResponse.json(
        { error: `No next status defined for '${currentStatus}'` },
        { status: 400 }
      );
    }

    if (!VALID_STATUSES.includes(targetStatus)) {
      return NextResponse.json(
        { error: `Invalid status '${targetStatus}'` },
        { status: 400 }
      );
    }

    // Update order status and updated_at in one query
    await sql`
      UPDATE orders
      SET
        status     = ${targetStatus}::order_status,
        updated_at = NOW()
      WHERE id = ${orderId}::uuid
    `;

    // Write audit log — non-fatal if it fails
    try {
      await sql`
        INSERT INTO order_status_log
          (order_id, from_status, to_status, changed_by, note)
        VALUES
          (
            ${orderId}::uuid,
            ${currentStatus}::order_status,
            ${targetStatus}::order_status,
            ${changed_by},
            ${note}
          )
      `;
    } catch (logErr) {
      console.error("order_status_log insert failed (non-fatal):", logErr);
    }

    return NextResponse.json({
      success: true,
      order_id: orderId,
      from_status: currentStatus,
      to_status: targetStatus,
    });
  } catch (err) {
    console.error("Status PATCH error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}