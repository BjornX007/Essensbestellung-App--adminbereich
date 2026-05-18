"use client";

import { KitchenOrder } from "@/app/(frontend)/orders/types";
import { useTranslation } from "@/app/lib/i18n/context";

interface DispatchGridProps {
  orders: KitchenOrder[];
  onAdvance: (orderId: string, currentStatus: KitchenOrder["status"]) => Promise<void>;
  advancing: Set<string>;
}

function Spinner() {
  return <span style={{ width: 16, height: 16, border: "2.5px solid rgba(255,255,255,.3)", borderTopColor: "#fff", borderRadius: "50%", display: "inline-block", animation: "spin .7s linear infinite" }} />;
}

function StatusPill({ status, t }: { status: KitchenOrder["status"]; t: (k: string) => string }) {
  const map: Record<string, { bg: string; color: string; border: string; dot: string }> = {
    ready:      { bg: "#f0fdf4", color: "#16a34a", border: "#86efac", dot: "#22c55e" },
    dispatched: { bg: "#eff6ff", color: "#2563eb", border: "#bfdbfe", dot: "#3b82f6" },
  };
  const s = map[status] ?? map.ready;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, background: s.bg, border: `1px solid ${s.border}`, color: s.color, fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 999 }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: s.dot, display: "inline-block", animation: status === "out_for_delivery" ? "pulse 1.4s ease-in-out infinite" : "none" }} />
      {t(`status.${status}`)}
    </div>
  );
}

function DispatchCard({ order, onAdvance, advancing }: { order: KitchenOrder; onAdvance: DispatchGridProps["onAdvance"]; advancing: Set<string> }) {
  const { t } = useTranslation();
  const isAdv = advancing.has(order.id);

  const NEXT_LABEL: Record<string, string> = {
    ready:      t("orderCard.dispatch"),
    dispatched: t("orderCard.markDelivered"),
  };
  const nextLabel = NEXT_LABEL[order.status];

  const btnColor = order.status === "ready" ? "#f97316" : "#6366f1";
  const btnShadow = order.status === "ready" ? "rgba(249,115,22,.3)" : "rgba(99,102,241,.3)";

  const addr = order.delivery_address;

  return (
    <div style={{ background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 16, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,.05)", display: "flex", flexDirection: "column", animation: "cardIn .25s ease both", transition: "box-shadow .18s, transform .18s" }}>
      {/* Header */}
      <div style={{ padding: "14px 18px", borderBottom: "1.5px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={{ fontFamily: "'Sora',sans-serif", fontSize: 24, fontWeight: 900, color: "#0f172a", letterSpacing: -1.5, lineHeight: 1 }}>
            #{order.order_number}
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#64748b" }}>🛵 {t("orderType.delivery")}</span>
            {order.customer_name && <span style={{ fontSize: 12, color: "#94a3b8" }}>· {order.customer_name}</span>}
          </div>
        </div>
        <StatusPill status={order.status} t={t} />
      </div>

      {/* Customer info */}
      <div style={{ padding: "14px 18px", borderBottom: "1px solid #f1f5f9", display: "flex", flexDirection: "column", gap: 8 }}>
        {order.customer_phone && (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 14 }}>📞</span>
            <a href={`tel:${order.customer_phone}`} style={{ fontSize: 13, fontWeight: 600, color: "#334155", textDecoration: "none" }}>
              {order.customer_phone}
            </a>
          </div>
        )}
        {addr && (
          <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
            <span style={{ fontSize: 14, flexShrink: 0 }}>📍</span>
            <span style={{ fontSize: 13, fontWeight: 500, color: "#475569", lineHeight: 1.4 }}>
              {addr.street} {addr.house_number}, {addr.postal_code} {addr.city}
            </span>
          </div>
        )}
      </div>

      {/* Items */}
      <div style={{ padding: "12px 18px", borderBottom: "1px solid #f1f5f9", display: "flex", flexDirection: "column", gap: 6 }}>
        {order.items.map((item) => (
          <div key={item.id} style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: "#6366f1", minWidth: 24 }}>{item.quantity}×</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>{item.product_name_snapshot}</span>
          </div>
        ))}
      </div>

      {/* Customer note */}
      {order.customer_note && (
        <div style={{ display: "flex", alignItems: "flex-start", gap: 8, margin: "10px 18px 0", padding: "9px 12px", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 10, fontSize: 13, color: "#92400e", fontWeight: 500, lineHeight: 1.4 }}>
          <span>💬</span><span>{order.customer_note}</span>
        </div>
      )}

      {/* Footer */}
      <div style={{ padding: "14px 18px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "auto" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
          <span style={{ fontFamily: "'Sora',sans-serif", fontSize: 22, fontWeight: 900, color: "#0f172a", letterSpacing: -0.5 }}>€{Number(order.total).toFixed(2)}</span>
          <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 500 }}>{t(`orderCard.payment_${order.payment_method}`) || order.payment_method}</span>
        </div>
        {nextLabel && (
          <button
            onClick={() => onAdvance(order.id, order.status)}
            disabled={isAdv}
            style={{ background: btnColor, color: "#fff", border: "none", borderRadius: 10, padding: "10px 18px", fontSize: 13, fontWeight: 700, cursor: isAdv ? "not-allowed" : "pointer", opacity: isAdv ? 0.65 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, boxShadow: `0 3px 10px ${btnShadow}`, transition: "all .15s", fontFamily: "inherit", minWidth: 130, height: 40 }}
          >
            {isAdv ? <Spinner /> : nextLabel}
          </button>
        )}
      </div>
    </div>
  );
}

export default function DispatchGrid({ orders, onAdvance, advancing }: DispatchGridProps) {
  const { t } = useTranslation();

  const ready      = orders.filter((o) => o.status === "ready");
  const dispatched = orders.filter((o) => o.status === "out_for_delivery");

  return (
    <div style={{ height: "100%", overflowY: "auto", padding: "24px 28px 40px" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;700;800;900&display=swap');
        @keyframes spin   { to { transform: rotate(360deg); } }
        @keyframes pulse  { 0%,100%{opacity:1} 50%{opacity:.4} }
        @keyframes cardIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      {orders.length === 0 ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "60%", gap: 10 }}>
          <span style={{ fontSize: 52 }}>🛵</span>
          <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#334155" }}>{t("dispatch.noOrders")}</p>
          <p style={{ margin: 0, fontSize: 13, color: "#94a3b8" }}>{t("dispatch.noOrdersSubtitle")}</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>

          {/* Ready for dispatch */}
          {ready.length > 0 && (
            <section>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <h2 style={{ margin: 0, fontFamily: "'Sora',sans-serif", fontSize: 17, fontWeight: 900, color: "#0f172a", letterSpacing: -0.5 }}>
                  🟢 {t("dispatch.readyTitle") || "Ready for Dispatch"}
                </h2>
                <span style={{ background: "#f0fdf4", color: "#16a34a", border: "1px solid #86efac", fontSize: 11, fontWeight: 800, padding: "3px 10px", borderRadius: 999 }}>
                  {ready.length}
                </span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
                {ready.map((order, i) => (
                  <div key={order.id} style={{ animationDelay: `${i * 40}ms` }}>
                    <DispatchCard order={order} onAdvance={onAdvance} advancing={advancing} />
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* On the way */}
          {dispatched.length > 0 && (
            <section>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <h2 style={{ margin: 0, fontFamily: "'Sora',sans-serif", fontSize: 17, fontWeight: 900, color: "#0f172a", letterSpacing: -0.5 }}>
                  🛵 {t("dispatch.onTheWayTitle") || "On the Way"}
                </h2>
                <span style={{ background: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe", fontSize: 11, fontWeight: 800, padding: "3px 10px", borderRadius: 999 }}>
                  {dispatched.length}
                </span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
                {dispatched.map((order, i) => (
                  <div key={order.id} style={{ animationDelay: `${i * 40}ms` }}>
                    <DispatchCard order={order} onAdvance={onAdvance} advancing={advancing} />
                  </div>
                ))}
              </div>
            </section>
          )}

        </div>
      )}
    </div>
  );
}