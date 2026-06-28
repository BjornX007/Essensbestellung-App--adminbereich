"use server";

import { auth } from "@/app/lib/auth";
import { sql } from "@/app/lib/db";
import { revalidatePath } from "next/cache";

async function assertDriver() {
  const { data, error } = await auth.getSession();

  if (error || !data?.user) {
    throw new Error("Unauthorized");
  }

  const role = (data.user as { role?: string }).role;

  if (role !== "driver") {
    throw new Error("Forbidden");
  }

  return data.user;
}

export interface DriverOrder {
  id: string;
  order_number: number;
  status: "ready" | "out_for_delivery" | "delivered";
  created_at: string;
  customer_name: string | null;
  customer_phone: string | null;
  customer_note: string | null;
  total: string;
  payment_method: string;
  payment_status: string;
  delivery_address: {
    street: string;
    house_number: string;
    postal_code: string;
    city: string;
  } | null;
  items: Array<{
    id: string;
    product_name_snapshot: string;
    quantity: number;
  }>;
}

export async function getDriverOrders(): Promise<DriverOrder[]> {
  const user = await assertDriver();

  const rows = (await sql`
    SELECT
      o.id,
      o.order_number,
      o.status,
      o.created_at,
      o.customer_name,
      o.customer_phone,
      o.customer_note,
      o.total,
      o.payment_method,
      o.payment_status,
      CASE
        WHEN da.id IS NULL THEN NULL
        ELSE json_build_object(
          'street', da.street,
          'house_number', da.house_number,
          'postal_code', da.postal_code,
          'city', da.city
        )
      END AS delivery_address,

      COALESCE(
        json_agg(
          json_build_object(
            'id', oi.id,
            'product_name_snapshot', oi.product_name_snapshot,
            'quantity', oi.quantity
          )
          ORDER BY oi.id
        ) FILTER (WHERE oi.id IS NOT NULL),
        '[]'
      ) AS items

    FROM orders o

    LEFT JOIN order_items oi
      ON oi.order_id = o.id

    LEFT JOIN delivery_addresses da
      ON da.id = o.delivery_address_id

    WHERE o.assigned_driver_id = ${user.id}
      AND o.status IN ('out_for_delivery', 'delivered')

    GROUP BY
      o.id,
      da.id,
      da.street,
      da.house_number,
      da.postal_code,
      da.city

    ORDER BY
      CASE o.status
        WHEN 'out_for_delivery' THEN 1
        WHEN 'delivered' THEN 2
      END,
      o.created_at ASC
  `) as DriverOrder[];

  return rows;
}

export async function markDelivered(orderId: string): Promise<void> {
  const user = await assertDriver();

  await sql`
    UPDATE orders
    SET status = 'delivered', updated_at = NOW()
    WHERE id = ${orderId}
      AND assigned_driver_id = ${user.id}
      AND status = 'out_for_delivery'
  `;

  revalidatePath("/driver");
}

export async function markOutForDelivery(orderId: string): Promise<void> {
  const user = await assertDriver();

  await sql`
    UPDATE orders
    SET status = 'out_for_delivery', updated_at = NOW()
    WHERE id = ${orderId}
      AND assigned_driver_id = ${user.id}
      AND status = 'ready'
  `;

  revalidatePath("/driver");
}
export async function markCashDeposited(): Promise<void> {
  const user = await assertDriver();

  await sql`
    UPDATE orders
    SET payment_status = 'paid',
        updated_at = NOW()
    WHERE assigned_driver_id = ${user.id}
      AND payment_method = 'cash_on_delivery'
      AND status = 'delivered'
      AND payment_status = 'pending'
  `;

  revalidatePath("/driver");
}