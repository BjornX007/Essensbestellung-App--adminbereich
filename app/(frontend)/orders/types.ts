// app/(frontend)/orders/types.ts

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "preparing"
  | "ready"
  | "out_for_delivery"
  | "delivered"
  | "cancelled";

export type KitchenStage = "incoming" | "preparing" | "dispatch";

export const STAGE_STATUSES: Record<KitchenStage, readonly OrderStatus[]> = {
  incoming:  ["pending", "confirmed"],
  preparing: ["preparing"],
  dispatch:  ["ready", "out_for_delivery"],
};

export const NEXT_STATUS: Record<OrderStatus, OrderStatus | null> = {
  pending:    "confirmed",
  confirmed:  "preparing",
  preparing:  "ready",
  ready:      "out_for_delivery",
  out_for_delivery: "delivered",
  delivered:  null,
  cancelled:  null,
};

export const NEXT_STATUS_LABEL: Record<OrderStatus, string | null> = {
  pending:    "Confirm",
  confirmed:  "Start Preparing",
  preparing:  "Mark as Ready",
  ready:      "Dispatch",
  out_for_delivery: "Mark Delivered",
  delivered:  null,
  cancelled:  null,
};

export interface OrderItemOption {
  id: string;
  option_name_snapshot: string;
  value_label_snapshot: string;
  price_delta_snapshot: number;
}

export interface OrderItemAdditive {
  id: string;
  additive_code_snapshot: string;
  additive_name_snapshot: string;
}

export interface KitchenOrderItem {
  id: string;
  product_id: string;
  product_name_snapshot: string;
  unit_price: number;
  quantity: number;
  item_note?: string | null;
  chosen_options: OrderItemOption[];
  additives: OrderItemAdditive[];
}

export interface DeliveryAddress {
  street: string;
  house_number: string;
  city: string;
  postal_code: string;
  country: string;
}

export type OrderType = "delivery" | "dine_in" | "pickup";
export type PaymentMethod = "card" | "cash_on_delivery" | "paypal";
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

export interface KitchenOrder {
  id: string;
  order_number: string;
  status: OrderStatus;
  order_type: OrderType;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  customer_note: string | null;
  delivery_address: DeliveryAddress | null;
  subtotal: number;
  delivery_fee: number;
  tax: number;
  total: number;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  items: KitchenOrderItem[];
  created_at: string;
  updated_at: string;
}