"use client";

import { useEffect, useState, useCallback } from "react";
import { KitchenOrder } from "@/app/(frontend)/orders/types";

// ─── Types ─────────────────────────────────────────────────────────────────

interface Driver { id: string; name: string; email: string; }

// ─── Helpers ───────────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const secs = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (secs < 60) return `${secs}s ago`;
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  return `${Math.floor(secs / 3600)}h ago`;
}

function urgencyLevel(iso: string): "fresh" | "warn" | "urgent" {
  const mins = (Date.now() - new Date(iso).getTime()) / 60000;
  if (mins >= 12) return "urgent";
  if (mins >= 6) return "warn";
  return "fresh";
}

function useElapsed(iso: string) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const update = () => setElapsed(Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
    update();
    const iv = setInterval(update, 1000);
    return () => clearInterval(iv);
  }, [iso]);
  return elapsed;
}

// ─── Shared primitives ─────────────────────────────────────────────────────

function Spinner({ light = false }: { light?: boolean }) {
  return (
    <span style={{
      width: 15, height: 15,
      border: `2px solid ${light ? "rgba(255,255,255,.35)" : "rgba(0,0,0,.15)"}`,
      borderTopColor: light ? "#fff" : "#334155",
      borderRadius: "50%", display: "inline-block",
      animation: "ks-spin .65s linear infinite",
    }} />
  );
}

function ColHeader({ title, count, accent }: { title: string; count: number; accent: string }) {
  return (
    <div style={{ padding: "16px 18px 14px", borderBottom: "1px solid #e8ecf0", display: "flex", alignItems: "center", gap: 10, background: "#fff", flexShrink: 0 }}>
      <span style={{ fontSize: 13, fontWeight: 800, color: "#0f172a", letterSpacing: -0.2, fontFamily: "'Sora', sans-serif" }}>
        {title}
      </span>
      {count > 0 && (
        <span style={{ fontSize: 11, fontWeight: 800, padding: "2px 8px", borderRadius: 999, background: accent, color: "#fff", lineHeight: 1.5, fontVariantNumeric: "tabular-nums" }}>
          {count}
        </span>
      )}
    </div>
  );
}

function EmptyCol({ message, sub }: { message: string; sub: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 8, padding: "0 24px", textAlign: "center" }}>
      <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#64748b" }}>{message}</p>
      <p style={{ margin: 0, fontSize: 12, color: "#94a3b8", lineHeight: 1.5 }}>{sub}</p>
    </div>
  );
}

function TimerBadge({ startIso }: { startIso: string }) {
  const elapsed = useElapsed(startIso);
  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;
  const isUrgent = elapsed >= 600;
  const isWarn = elapsed >= 480;
  const color = isUrgent ? "#dc2626" : isWarn ? "#ea580c" : "#16a34a";
  const bg = isUrgent ? "#fef2f2" : isWarn ? "#fff7ed" : "#f0fdf4";
  const border = isUrgent ? "#fca5a5" : isWarn ? "#fdba74" : "#86efac";
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "6px 11px", borderRadius: 9, border: `1.5px solid ${border}`, background: bg, minWidth: 66, animation: isUrgent ? "ks-tblink 1s ease-in-out infinite" : "none" }}>
      <span style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8, color: "#94a3b8", marginBottom: 1 }}>prep</span>
      <span style={{ fontFamily: "'DM Mono','Courier New',monospace", fontSize: 17, fontWeight: 800, lineHeight: 1, color, fontVariantNumeric: "tabular-nums" }}>
        {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
      </span>
    </div>
  );
}

function ItemList({ items, compact = false }: { items: KitchenOrder["items"]; compact?: boolean }) {
  const visible = compact ? items.slice(0, 4) : items;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: compact ? 6 : 10 }}>
      {visible.map((item) => {
        const opts = Array.isArray(item.chosen_options) ? item.chosen_options.filter((o) => o.value_label_snapshot) : [];
        const adds = Array.isArray(item.additives) ? item.additives : [];
        return (
          <div key={item.id} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 7 }}>
              <span style={{ fontSize: 12, fontWeight: 900, color: "#6366f1", minWidth: 22, flexShrink: 0, fontVariantNumeric: "tabular-nums" }}>{item.quantity}×</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", lineHeight: 1.3 }}>{item.product_name_snapshot ?? "Item"}</span>
            </div>
            {opts.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4, paddingLeft: 29 }}>
                {opts.map((opt, i) => <span key={i} style={{ fontSize: 11, fontWeight: 700, padding: "2px 7px", borderRadius: 999, background: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe" }}>{opt.value_label_snapshot}</span>)}
              </div>
            )}
            {adds.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4, paddingLeft: 29 }}>
                {adds.map((a, i) => <span key={i} style={{ fontSize: 11, fontWeight: 700, padding: "2px 7px", borderRadius: 999, background: "#f0fdf4", color: "#15803d", border: "1px solid #86efac" }}>{a.additive_code_snapshot} · {a.additive_name_snapshot}</span>)}
              </div>
            )}
            {item.item_note && <div style={{ fontSize: 11, fontWeight: 600, color: "#ea580c", paddingLeft: 29 }}>Note: {item.item_note}</div>}
          </div>
        );
      })}
      {compact && items.length > 4 && <span style={{ fontSize: 11, color: "#94a3b8", paddingLeft: 29 }}>+{items.length - 4} more items</span>}
    </div>
  );
}

function CustomerNote({ note }: { note: string }) {
  return (
    <div style={{ display: "flex", gap: 8, background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 8, padding: "8px 10px" }}>
      <span style={{ fontSize: 11, fontWeight: 700, color: "#92400e", flexShrink: 0, paddingTop: 1 }}>NOTE</span>
      <span style={{ fontSize: 12, color: "#92400e", fontWeight: 500, lineHeight: 1.45 }}>{note}</span>
    </div>
  );
}

// ─── Driver Assignment Popup ───────────────────────────────────────────────

interface AssignPopupProps {
  order: KitchenOrder;
  onConfirm: (driverId: string) => Promise<void>;
  onClose: () => void;
}

function AssignDriverPopup({ order, onConfirm, onClose }: AssignPopupProps) {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/driver")
      .then((r) => r.json())
      .then((d) => { setDrivers(d.drivers ?? []); setLoading(false); })
      .catch(() => { setError("Could not load drivers"); setLoading(false); });
  }, []);

  async function handleConfirm() {
    if (!selected) return;
    setAssigning(true);
    setError(null);
    try {
      await onConfirm(selected);
    } catch {
      setError("Failed to assign driver. Try again.");
      setAssigning(false);
    }
  }

  return (
    // Backdrop
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,.45)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
    >
      {/* Modal */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: "#fff", borderRadius: 16, width: "100%", maxWidth: 400, overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,.2)", animation: "ks-popup-in .2s ease" }}
      >
        {/* Header */}
        <div style={{ padding: "18px 20px 14px", borderBottom: "1px solid #f1f5f9" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
            <span style={{ fontFamily: "'Sora',sans-serif", fontSize: 16, fontWeight: 900, color: "#0f172a", letterSpacing: -0.3 }}>
              Assign Driver
            </span>
            <button
              onClick={onClose}
              style={{ background: "#f1f5f9", border: "none", borderRadius: 8, width: 30, height: 30, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b", fontSize: 16, lineHeight: 1 }}
            >
              ×
            </button>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontFamily: "'Sora',sans-serif", fontSize: 18, fontWeight: 900, color: "#6366f1" }}>#{order.order_number}</span>
            <span style={{ fontSize: 12, color: "#64748b" }}>{order.customer_name ?? "Guest"}</span>
            <span style={{ fontSize: 12, color: "#64748b" }}>·</span>
            <span style={{ fontFamily: "'Sora',sans-serif", fontSize: 14, fontWeight: 800, color: "#0f172a" }}>€{Number(order.total).toFixed(2)}</span>
          </div>
        </div>

        {/* Driver list */}
        <div style={{ padding: "14px 20px", maxHeight: 280, overflowY: "auto" }}>
          {loading && (
            <div style={{ display: "flex", justifyContent: "center", padding: "20px 0" }}>
              <Spinner />
            </div>
          )}
          {!loading && drivers.length === 0 && (
            <p style={{ margin: 0, fontSize: 13, color: "#64748b", textAlign: "center", padding: "16px 0" }}>
              No drivers available. Add drivers first.
            </p>
          )}
          {!loading && drivers.map((driver) => (
            <button
              key={driver.id}
              onClick={() => setSelected(driver.id)}
              style={{
                width: "100%", display: "flex", alignItems: "center", gap: 12,
                padding: "11px 13px", borderRadius: 10, marginBottom: 6,
                border: `2px solid ${selected === driver.id ? "#6366f1" : "#e8ecf0"}`,
                background: selected === driver.id ? "#f5f3ff" : "#fff",
                cursor: "pointer", transition: "all .12s", textAlign: "left",
              }}
            >
              {/* Avatar */}
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: selected === driver.id ? "#6366f1" : "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "background .12s" }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: selected === driver.id ? "#fff" : "#334155" }}>
                  {driver.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                </span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{driver.name}</div>
                <div style={{ fontSize: 11, color: "#94a3b8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{driver.email}</div>
              </div>
              {/* Selection indicator */}
              <div style={{ width: 18, height: 18, borderRadius: "50%", border: `2px solid ${selected === driver.id ? "#6366f1" : "#d1d5db"}`, background: selected === driver.id ? "#6366f1" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all .12s" }}>
                {selected === driver.id && (
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M2 5l2.5 2.5L8 3" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div style={{ margin: "0 20px", padding: "8px 12px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, fontSize: 12, color: "#dc2626", fontWeight: 500 }}>
            {error}
          </div>
        )}

        {/* Footer */}
        <div style={{ padding: "14px 20px 18px", display: "flex", gap: 10 }}>
          <button
            onClick={onClose}
            style={{ flex: 1, padding: "10px", background: "#f1f5f9", color: "#334155", border: "none", borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selected || assigning}
            style={{ flex: 2, padding: "10px", background: selected ? "#f97316" : "#e2e8f0", color: selected ? "#fff" : "#94a3b8", border: "none", borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: selected && !assigning ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, boxShadow: selected ? "0 3px 10px rgba(249,115,22,.28)" : "none", transition: "all .15s", fontFamily: "inherit" }}
          >
            {assigning ? <Spinner light /> : "Send for delivery"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Card props ────────────────────────────────────────────────────────────

interface CardProps {
  order: KitchenOrder;
  onAdvance: (id: string, status: KitchenOrder["status"]) => Promise<void>;
  advancing: Set<string>;
}

interface ReadyCardProps extends CardProps {
  onAssignDriver: (order: KitchenOrder) => void;
}

// ─── Incoming card ─────────────────────────────────────────────────────────

function IncomingCard({ order, onAdvance, advancing }: CardProps) {
  const urgency = urgencyLevel(order.created_at);
  const urgencyColors = {
    fresh: { bg: "#f0fdf4", color: "#16a34a" },
    warn: { bg: "#fff7ed", color: "#ea580c" },
    urgent: { bg: "#fef2f2", color: "#dc2626" },
  }[urgency];
  const statusLabel = order.status === "pending" ? "Pending" : "Confirmed";
  const statusColors = order.status === "pending"
    ? { bg: "#fef3c7", color: "#d97706" }
    : { bg: "#dbeafe", color: "#2563eb" };
  const nextLabel = order.status === "pending" ? "Confirm order" : "Start preparing";
  const isAdv = advancing.has(order.id);

  return (
    <div className="ks-card" style={{ background: "#fff", border: "1.5px solid #e8ecf0", borderRadius: 13, padding: "14px 15px", display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontFamily: "'Sora',sans-serif", fontSize: 20, fontWeight: 900, color: "#0f172a", letterSpacing: -0.8 }}>#{order.order_number}</span>
          <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 999, background: statusColors.bg, color: statusColors.color }}>{statusLabel}</span>
        </div>
        <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 999, background: urgencyColors.bg, color: urgencyColors.color }}>{timeAgo(order.created_at)}</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: "#334155" }}>{order.customer_name ?? "Guest"}</span>
        <span style={{ fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "capitalize" }}>{order.order_type.replace("_", " ")}</span>
      </div>
      <div style={{ background: "#f8fafc", borderRadius: 8, padding: "9px 11px" }}>
        <ItemList items={order.items} compact />
      </div>
      {order.customer_note && <CustomerNote note={order.customer_note} />}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 2 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
          <span style={{ fontFamily: "'Sora',sans-serif", fontSize: 18, fontWeight: 900, color: "#0f172a", letterSpacing: -0.4 }}>€{Number(order.total).toFixed(2)}</span>
          <span style={{ fontSize: 11, color: "#94a3b8" }}>{order.items.reduce((s, i) => s + i.quantity, 0)} items</span>
        </div>
        <button
          onClick={() => onAdvance(order.id, order.status)}
          disabled={isAdv}
          style={{ background: "#6366f1", color: "#fff", border: "none", borderRadius: 9, padding: "10px 16px", fontSize: 13, fontWeight: 700, cursor: isAdv ? "not-allowed" : "pointer", opacity: isAdv ? 0.65 : 1, display: "flex", alignItems: "center", gap: 6, boxShadow: "0 3px 10px rgba(99,102,241,.25)", fontFamily: "inherit", minWidth: 120, height: 38 }}
        >
          {isAdv ? <Spinner light /> : nextLabel}
        </button>
      </div>
    </div>
  );
}

// ─── Preparing card ────────────────────────────────────────────────────────

function PreparingCard({ order, onAdvance, advancing }: CardProps) {
  const isAdv = advancing.has(order.id);
  return (
    <div className="ks-card" style={{ background: "#fff", border: "1.5px solid #e8ecf0", borderRadius: 13, overflow: "hidden", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "13px 15px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <span style={{ fontFamily: "'Sora',sans-serif", fontSize: 22, fontWeight: 900, color: "#0f172a", letterSpacing: -1, lineHeight: 1 }}>#{order.order_number}</span>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "capitalize" }}>{order.order_type.replace("_", " ")}</span>
            {order.customer_name && <span style={{ fontSize: 11, color: "#94a3b8" }}>· {order.customer_name}</span>}
          </div>
        </div>
        <TimerBadge startIso={order.updated_at} />
      </div>
      <div style={{ padding: "12px 15px", display: "flex", flexDirection: "column", gap: 10, borderBottom: "1px solid #f1f5f9" }}>
        <ItemList items={order.items} />
      </div>
      {order.customer_note && <div style={{ margin: "10px 15px 0" }}><CustomerNote note={order.customer_note} /></div>}
      <button
        onClick={() => onAdvance(order.id, order.status)}
        disabled={isAdv}
        style={{ margin: "12px 15px 14px", background: "#22c55e", color: "#fff", border: "none", borderRadius: 9, padding: "11px", fontSize: 13, fontWeight: 800, cursor: isAdv ? "not-allowed" : "pointer", opacity: isAdv ? 0.65 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, boxShadow: "0 3px 10px rgba(34,197,94,.28)", fontFamily: "inherit" }}
      >
        {isAdv ? <Spinner light /> : "Mark as ready"}
      </button>
    </div>
  );
}

// ─── Ready card ────────────────────────────────────────────────────────────

function ReadyCard({ order, advancing, onAssignDriver }: ReadyCardProps) {
  const isAdv = advancing.has(order.id);
  const addr = order.delivery_address;

  return (
    <div className="ks-card" style={{ background: "#fff", border: "1.5px solid #bbf7d0", borderRadius: 13, overflow: "hidden", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{ padding: "13px 15px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, background: "#f0fdf4" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <span style={{ fontFamily: "'Sora',sans-serif", fontSize: 22, fontWeight: 900, color: "#0f172a", letterSpacing: -1, lineHeight: 1 }}>#{order.order_number}</span>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            {order.customer_name && <span style={{ fontSize: 11, color: "#64748b" }}>{order.customer_name}</span>}
          </div>
        </div>
        <span style={{ fontSize: 11, fontWeight: 800, padding: "4px 10px", borderRadius: 999, background: "#16a34a", color: "#fff" }}>Ready</span>
      </div>

      {/* Address */}
      {addr && (
        <div style={{ padding: "10px 15px", borderBottom: "1px solid #f1f5f9", display: "flex", flexDirection: "column", gap: 5 }}>
          {order.customer_phone && (
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.6, minWidth: 36 }}>Phone</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: "#334155" }}>{order.customer_phone}</span>
            </div>
          )}
          <div style={{ display: "flex", alignItems: "flex-start", gap: 7 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.6, minWidth: 36, paddingTop: 1 }}>Addr</span>
            <span style={{ fontSize: 12, fontWeight: 500, color: "#334155", lineHeight: 1.45 }}>
              {addr.street} {addr.house_number}, {addr.postal_code} {addr.city}
            </span>
          </div>
        </div>
      )}

      {/* Items */}
      <div style={{ padding: "11px 15px", borderBottom: "1px solid #f1f5f9" }}>
        <ItemList items={order.items} compact />
      </div>

      {order.customer_note && <div style={{ margin: "10px 15px 0" }}><CustomerNote note={order.customer_note} /></div>}

      {/* Footer */}
      <div style={{ padding: "12px 15px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "auto" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
          <span style={{ fontFamily: "'Sora',sans-serif", fontSize: 18, fontWeight: 900, color: "#0f172a", letterSpacing: -0.4 }}>€{Number(order.total).toFixed(2)}</span>
          <span style={{ fontSize: 11, color: "#94a3b8", textTransform: "capitalize" }}>{order.payment_method.replace(/_/g, " ")}</span>
        </div>
        <button
          onClick={() => onAssignDriver(order)}
          disabled={isAdv}
          style={{ background: "#f97316", color: "#fff", border: "none", borderRadius: 9, padding: "10px 16px", fontSize: 13, fontWeight: 700, cursor: isAdv ? "not-allowed" : "pointer", opacity: isAdv ? 0.65 : 1, display: "flex", alignItems: "center", gap: 6, boxShadow: "0 3px 10px rgba(249,115,22,.28)", fontFamily: "inherit", minWidth: 130, height: 38 }}
        >
          {isAdv ? <Spinner light /> : "Send for delivery"}
        </button>
      </div>
    </div>
  );
}

// ─── Main export ───────────────────────────────────────────────────────────

interface KitchenDisplayProps {
  orders: KitchenOrder[];
  onAdvance: (orderId: string, currentStatus: KitchenOrder["status"]) => Promise<void>;
  advancing: Set<string>;
  onOrderDispatched: (orderId: string) => void;
}

export default function KitchenDisplay({ orders, onAdvance, advancing, onOrderDispatched }: KitchenDisplayProps) {
  const [, tick] = useState(0);
  const [assigningOrder, setAssigningOrder] = useState<KitchenOrder | null>(null);

  useEffect(() => {
    const iv = setInterval(() => tick((n) => n + 1), 30_000);
    return () => clearInterval(iv);
  }, []);

  const handleAssignConfirm = useCallback(async (driverId: string) => {
    if (!assigningOrder) return;
    const res = await fetch(`/api/orders/${assigningOrder.id}/assign`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ driver_id: driverId }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error((err as { error?: string }).error ?? "Failed to assign driver");
    }
    setAssigningOrder(null);
    onOrderDispatched(assigningOrder.id);
  }, [assigningOrder, onOrderDispatched]);

  const incoming  = orders.filter((o) => o.status === "pending" || o.status === "confirmed");
  const preparing = orders.filter((o) => o.status === "preparing");
  const ready     = orders.filter((o) => o.status === "ready");

  const COL = [
    { key: "incoming",  title: "Incoming",   accent: "#3b82f6" },
    { key: "preparing", title: "Preparing",  accent: "#d97706" },
    { key: "ready",     title: "Ready",      accent: "#16a34a" },
  ];

  const colOrders = [incoming, preparing, ready];
  const emptyMessages = [
    { message: "No new orders",          sub: "New orders will appear here" },
    { message: "Nothing in preparation", sub: "Confirmed orders move here" },
    { message: "Nothing ready yet",      sub: "Orders move here when prep is done" },
  ];

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", height: "100%", overflow: "hidden" }}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Sora:wght@700;800;900&family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@500&display=swap');
          @keyframes ks-spin    { to { transform: rotate(360deg); } }
          @keyframes ks-tblink  { 0%,100%{border-color:#fca5a5} 50%{border-color:#ef4444} }
          @keyframes ks-in      { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
          @keyframes ks-popup-in{ from{opacity:0;transform:scale(.96)} to{opacity:1;transform:scale(1)} }
          .ks-card { animation: ks-in .22s ease both; }
          .ks-col::-webkit-scrollbar { width: 4px; }
          .ks-col::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 2px; }
        `}</style>

        {COL.map((col, ci) => (
          <div key={col.key} style={{ display: "flex", flexDirection: "column", borderRight: ci < 2 ? "1.5px solid #e8ecf0" : "none", overflow: "hidden", background: ci === 2 ? "#f7fef9" : ci === 1 ? "#fffdf7" : "#fff" }}>
            <ColHeader title={col.title} count={colOrders[ci].length} accent={col.accent} />
            <div className="ks-col" style={{ flex: 1, overflowY: "auto", padding: colOrders[ci].length === 0 ? 0 : "12px 14px 28px", display: "flex", flexDirection: "column", gap: colOrders[ci].length === 0 ? 0 : 10 }}>
              {colOrders[ci].length === 0 ? (
                <EmptyCol message={emptyMessages[ci].message} sub={emptyMessages[ci].sub} />
              ) : ci === 2 ? (
                ready.map((order) => (
                  <div key={order.id}>
                    <ReadyCard
                      order={order}
                      onAdvance={onAdvance}
                      advancing={advancing}
                      onAssignDriver={setAssigningOrder}
                    />
                  </div>
                ))
              ) : (
                colOrders[ci].map((order) => (
                  <div key={order.id}>
                    {ci === 0
                      ? <IncomingCard order={order} onAdvance={onAdvance} advancing={advancing} />
                      : <PreparingCard order={order} onAdvance={onAdvance} advancing={advancing} />
                    }
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Driver assignment popup */}
      {assigningOrder && (
        <AssignDriverPopup
          order={assigningOrder}
          onConfirm={handleAssignConfirm}
          onClose={() => setAssigningOrder(null)}
        />
      )}
    </>
  );
}