import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/app/lib/db";
import { withSecurity } from "@/app/lib/security";

export const PATCH = withSecurity(
  async (req: NextRequest, ctx: unknown) => {
    try {
      const { params } = ctx as { params: Promise<{ id: string }> };
      const orderId = (await params).id;
      const body = await req.json().catch(() => ({}));
      const { driver_id } = body as { driver_id?: string };

      if (!orderId) {
        return NextResponse.json({ error: "Missing order ID" }, { status: 400 });
      }

      if (!driver_id) {
        return NextResponse.json({ error: "Missing driver_id" }, { status: 400 });
      }

      // Verify driver exists
      const [driver] = await sql`
        SELECT id, name FROM neon_auth."user"
        WHERE id = ${driver_id}::uuid
          AND role = 'driver'
        LIMIT 1
      `;

      if (!driver) {
        return NextResponse.json({ error: "Driver not found" }, { status: 404 });
      }

      // Verify order is in ready status
      const [order] = await sql`
        SELECT id, status FROM orders
        WHERE id = ${orderId}::uuid
        LIMIT 1
      `;

      if (!order) {
        return NextResponse.json({ error: "Order not found" }, { status: 404 });
      }

      if (order.status !== "ready") {
        return NextResponse.json(
          { error: `Order must be ready, current: ${order.status}` },
          { status: 400 }
        );
      }

      // Assign driver + advance status atomically
      await sql`
        UPDATE orders
        SET
          assigned_driver_id = ${driver_id},
          status             = 'out_for_delivery',
          updated_at         = NOW()
        WHERE id = ${orderId}::uuid
          AND status = 'ready'
      `;

      // Audit log — non-fatal
      try {
        await sql`
          INSERT INTO order_status_log (order_id, from_status, to_status, changed_by, note)
          VALUES (
            ${orderId}::uuid,
            'ready'::order_status,
            'out_for_delivery'::order_status,
            'kitchen_staff',
            ${'Assigned to: ' + driver.name}
          )
        `;
      } catch (logErr) {
        console.error("audit log failed (non-fatal):", logErr);
      }

      return NextResponse.json({
        success: true,
        order_id: orderId,
        driver_id,
        driver_name: driver.name,
        status: "out_for_delivery",
      });
    } catch (err) {
      console.error("Assign driver PATCH error:", err);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  },
  {
    allowedMethods: ["PATCH"],
    rateLimit: { maxRequests: 60, windowMs: 60_000 },
  }
);