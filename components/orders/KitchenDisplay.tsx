"use client";

import { useEffect, useState } from "react";
import { KitchenOrder } from "@/app/(frontend)/orders/types";
import { useTranslation } from "@/app/lib/i18n/context";

// ─── Helpers ───────────────────────────────────────────────────────────────
function timeAgo(iso: string, t: (k: string) => string): string {
  const secs = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (secs < 60)   return t("time.secsAgo").replace("{n}", String(secs));
  if (secs < 3600) return t("time.minsAgo").replace("{n}", String(Math.floor(secs / 60)));
  return t("time.hoursAgo").replace("{n}", String(Math.floor(secs / 3600)));
}

function urgencyLevel(iso: string): "fresh" | "warn" | "urgent" {
  const mins = (Date.now() - new Date(iso).getTime()) / 60000;
  if (mins >= 12) return "urgent";
  if (mins >= 6)  return "warn";
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

function orderTypeMeta(type: string, t: (k: string) => string) {
  if (type === "dine_in")  return { icon: "🍽️", label: t("orderType.dine_in") };
  if (type === "delivery") return { icon: "🛵",  label: t("orderType.delivery") };
  return { icon: "🏠", label: t("orderType.pickup") };
}

function TimerBadge({ startIso }: { startIso: string }) {
  const { t } = useTranslation();
  const elapsed = useElapsed(startIso);
  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;
  const isUrgent = elapsed >= 600;
  const isWarn   = elapsed >= 480;
  const color  = isUrgent ? "#dc2626" : isWarn ? "#ea580c" : "#16a34a";
  const bg     = isUrgent ? "#fef2f2" : isWarn ? "#fff7ed" : "#f0fdf4";
  const border = isUrgent ? "#fca5a5" : isWarn ? "#fdba74" : "#86efac";
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "7px 12px", borderRadius: 10, border: `2px solid ${border}`, background: bg, minWidth: 72, animation: isUrgent ? "tblink 1s ease-in-out infinite" : "none" }}>
      <span style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: "#94a3b8", marginBottom: 2 }}>⏱ {t("orderCard.prepTime")}</span>
      <span style={{ fontFamily: "'DM Mono','Courier New',monospace", fontSize: 19, fontWeight: 800, lineHeight: 1, color }}>
        {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
      </span>
    </div>
  );
}

function Spinner() {
  return <span style={{ width: 16, height: 16, border: "2.5px solid rgba(255,255,255,.3)", borderTopColor: "#fff", borderRadius: "50%", display: "inline-block", animation: "spin .7s linear infinite" }} />;
}

interface CardProps {
  order: KitchenOrder;
  onAdvance: (id: string, status: KitchenOrder["status"]) => Promise<void>;
  advancing: Set<string>;
}

// ─── Incoming Card ─────────────────────────────────────────────────────────
function IncomingCard({ order, onAdvance, advancing }: CardProps) {
  const { t } = useTranslation();
  const urgency = urgencyLevel(order.created_at);
  const uc = { fresh: { bg: "#f0fdf4", color: "#16a34a", dot: "#22c55e" }, warn: { bg: "#fff7ed", color: "#ea580c", dot: "#f97316" }, urgent: { bg: "#fef2f2", color: "#dc2626", dot: "#ef4444" } }[urgency];
  const sc = ({ pending: { bg: "#fef3c7", color: "#d97706", label: t("status.pending") }, confirmed: { bg: "#dbeafe", color: "#2563eb", label: t("status.confirmed") } } as Record<string, { bg: string; color: string; label: string }>)[order.status] ?? { bg: "#fef3c7", color: "#d97706", label: t("status.pending") };
  const NEXT_LABEL: Record<string, string> = { pending: t("orderCard.confirm"), confirmed: t("orderCard.startPreparing") };
  const totalItems = order.items.reduce((s, it) => s + it.quantity, 0);
  const typeMeta = orderTypeMeta(order.order_type, t);
  const isAdv = advancing.has(order.id);
  const nextLabel = NEXT_LABEL[order.status];

  return (
    <div style={{ background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 14, padding: "15px 16px", display: "flex", flexDirection: "column", gap: 10, boxShadow: "0 1px 4px rgba(0,0,0,.04)", transition: "box-shadow .18s, transform .18s" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontFamily: "'Sora',sans-serif", fontSize: 22, fontWeight: 900, color: "#0f172a", letterSpacing: -1 }}>#{order.order_number}</span>
          <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 999, background: sc.bg, color: sc.color }}>{sc.label}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 999, background: uc.bg, color: uc.color }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: uc.dot, display: "inline-block" }} />
          {timeAgo(order.created_at, t)}
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: "#334155" }}>{order.customer_name ?? t("orderCard.guest")}</span>
        <span style={{ fontSize: 12, color: "#64748b" }}>{typeMeta.icon} {typeMeta.label}</span>
      </div>
      <div style={{ background: "#f8fafc", borderRadius: 9, padding: "9px 11px", display: "flex", flexDirection: "column", gap: 8 }}>
        {order.items.slice(0, 4).map((item) => {
          const opts = Array.isArray(item.chosen_options) ? item.chosen_options.filter((o) => o.value_label_snapshot) : [];
          const adds = Array.isArray(item.additives) ? item.additives : [];
          return (
            <div key={item.id} style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: "#6366f1", minWidth: 22 }}>{item.quantity}×</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#334155", flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.product_name_snapshot ?? "Item"}</span>
                {item.item_note && <span style={{ fontSize: 11 }} title={item.item_note}>📝</span>}
              </div>
              {opts.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4, paddingLeft: 28 }}>
                  {opts.map((opt, i) => (
                    <span key={i} style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 999, background: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe" }}>
                      {opt.value_label_snapshot}
                    </span>
                  ))}
                </div>
              )}
              {adds.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4, paddingLeft: 28 }}>
                  {adds.map((a, i) => (
                    <span key={i} style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 999, background: "#f0fdf4", color: "#15803d", border: "1px solid #86efac" }}>
                      {a.additive_code_snapshot} · {a.additive_name_snapshot}
                    </span>
                  ))}
                </div>
              )}
              {item.item_note && (
                <div style={{ fontSize: 11, fontWeight: 600, color: "#ea580c", paddingLeft: 28 }}>✏️ {item.item_note}</div>
              )}
            </div>
          );
        })}
        {order.items.length > 4 && <span style={{ fontSize: 11, color: "#94a3b8" }}>+{order.items.length - 4} {t("orderCard.moreItems")}</span>}
      </div>
      {order.customer_note && (
        <div style={{ display: "flex", gap: 7, background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 8, padding: "7px 10px" }}>
          <span style={{ fontSize: 13, flexShrink: 0 }}>💬</span>
          <span style={{ fontSize: 12, color: "#92400e", fontWeight: 500, lineHeight: 1.4 }}>{order.customer_note}</span>
        </div>
      )}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 2 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
          <span style={{ fontFamily: "'Sora',sans-serif", fontSize: 20, fontWeight: 900, color: "#0f172a", letterSpacing: -0.5 }}>€{Number(order.total).toFixed(2)}</span>
          <span style={{ fontSize: 11, color: "#94a3b8" }}>{totalItems} {totalItems === 1 ? t("orderCard.item") : t("orderCard.items")}</span>
        </div>
        {nextLabel && (
          <button onClick={() => onAdvance(order.id, order.status)} disabled={isAdv} style={{ background: "#6366f1", color: "#fff", border: "none", borderRadius: 10, padding: "9px 16px", fontSize: 13, fontWeight: 700, cursor: isAdv ? "not-allowed" : "pointer", opacity: isAdv ? 0.65 : 1, minWidth: 110, height: 38, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, boxShadow: "0 3px 10px rgba(99,102,241,.25)", transition: "all .15s", fontFamily: "inherit" }}>
            {isAdv ? <Spinner /> : nextLabel}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Preparing Card ────────────────────────────────────────────────────────
function PreparingCard({ order, onAdvance, advancing }: CardProps) {
  const { t } = useTranslation();
  const isAdv = advancing.has(order.id);
  const typeMeta = orderTypeMeta(order.order_type, t);

  return (
    <div style={{ background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 16, display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,.05)", transition: "box-shadow .18s, transform .18s" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "14px 16px", borderBottom: "1.5px solid #f1f5f9" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <span style={{ fontFamily: "'Sora',sans-serif", fontSize: 24, fontWeight: 900, color: "#0f172a", letterSpacing: -1.5, lineHeight: 1 }}>#{order.order_number}</span>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#64748b" }}>{typeMeta.icon} {typeMeta.label}</span>
            {order.customer_name && <span style={{ fontSize: 12, color: "#94a3b8" }}>· {order.customer_name}</span>}
          </div>
        </div>
        <TimerBadge startIso={order.updated_at} />
      </div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        {order.items.map((item) => {
          const opts = Array.isArray(item.chosen_options) ? item.chosen_options.filter((o) => o.value_label_snapshot) : [];
          const adds = Array.isArray(item.additives) ? item.additives : [];
          return (
            <div key={item.id} style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: 7, borderBottom: "1px solid #f1f5f9" }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 900, color: "#6366f1", minWidth: 26, flexShrink: 0 }}>{item.quantity}×</span>
                <span style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", letterSpacing: -0.2, lineHeight: 1.2 }}>{item.product_name_snapshot ?? "Item"}</span>
              </div>
              {opts.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4, paddingLeft: 34 }}>
                  {opts.map((opt, i) => <span key={i} style={{ fontSize: 12, fontWeight: 700, padding: "3px 10px", borderRadius: 999, background: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe" }}>{opt.value_label_snapshot}</span>)}
                </div>
              )}
              {adds.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4, paddingLeft: 34 }}>
                  {adds.map((a, i) => <span key={i} style={{ fontSize: 12, fontWeight: 700, padding: "3px 10px", borderRadius: 999, background: "#f0fdf4", color: "#15803d", border: "1px solid #86efac" }}>{a.additive_code_snapshot} · {a.additive_name_snapshot}</span>)}
                </div>
              )}
              {item.item_note && <div style={{ fontSize: 12, fontWeight: 600, color: "#ea580c", paddingLeft: 34 }}>✏️ {item.item_note}</div>}
            </div>
          );
        })}
      </div>
      {order.customer_note && (
        <div style={{ display: "flex", alignItems: "flex-start", gap: 8, margin: "10px 16px 0", padding: "9px 12px", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 10, fontSize: 13, color: "#92400e", fontWeight: 500, lineHeight: 1.4 }}>
          <span>💬</span><span>{order.customer_note}</span>
        </div>
      )}
      <button onClick={() => onAdvance(order.id, order.status)} disabled={isAdv} style={{ margin: "12px 16px 16px", background: "#22c55e", color: "#fff", border: "none", borderRadius: 10, padding: "12px", fontSize: 14, fontWeight: 800, cursor: isAdv ? "not-allowed" : "pointer", opacity: isAdv ? 0.65 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: "0 3px 10px rgba(34,197,94,.3)", transition: "all .15s", fontFamily: "inherit" }}>
        {isAdv ? <Spinner /> : `✓  ${t("orderCard.markReady")}`}
      </button>
    </div>
  );
}

// ─── Main export ───────────────────────────────────────────────────────────
interface KitchenDisplayProps {
  orders: KitchenOrder[];
  onAdvance: (orderId: string, currentStatus: KitchenOrder["status"]) => Promise<void>;
  advancing: Set<string>;
}

export default function KitchenDisplay({ orders, onAdvance, advancing }: KitchenDisplayProps) {
  const { t } = useTranslation();
  const [, forceUpdate] = useState(0);
  useEffect(() => { const iv = setInterval(() => forceUpdate((n) => n + 1), 10000); return () => clearInterval(iv); }, []);

  const incoming  = orders.filter((o) => o.status === "pending" || o.status === "confirmed");
  const preparing = orders.filter((o) => o.status === "preparing");

  return (
    <div style={{ display: "flex", height: "100%", overflow: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;700;800;900&family=DM+Mono:wght@500&display=swap');
        @keyframes spin   { to { transform: rotate(360deg); } }
        @keyframes pulse  { 0%,100%{opacity:1} 50%{opacity:.4} }
        @keyframes tblink { 0%,100%{border-color:#fca5a5} 50%{border-color:#ef4444} }
        @keyframes cardIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .kd-card { animation: cardIn .25s ease both; }
        .kd-card:hover > div { box-shadow: 0 6px 22px rgba(0,0,0,.1) !important; transform: translateY(-1px); }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
      `}</style>

      {/* LEFT — Incoming */}
      <div style={{ width: 340, minWidth: 300, maxWidth: 380, flexShrink: 0, display: "flex", flexDirection: "column", borderRight: "1.5px solid #e2e8f0", background: "#fff" }}>
        <div style={{ padding: "18px 18px 12px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: "#0f172a", letterSpacing: -0.5 }}>{t("incoming.title")}</h2>
            {incoming.length > 0 && <span style={{ background: "#eff6ff", color: "#3b82f6", border: "1px solid #bfdbfe", fontSize: 11, fontWeight: 800, padding: "3px 10px", borderRadius: 999 }}>{incoming.length}</span>}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#16a34a", fontSize: 10, fontWeight: 700, letterSpacing: 0.6, textTransform: "uppercase", padding: "4px 10px", borderRadius: 999 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", animation: "pulse 1.4s ease-in-out infinite", display: "inline-block" }} />
            {t("incoming.live")}
          </div>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "10px 14px 24px" }}>
          {incoming.length === 0 ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "55%", gap: 10, paddingTop: 60 }}>
              <span style={{ fontSize: 44 }}>📥</span>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#334155" }}>{t("incoming.noOrders")}</p>
              <p style={{ margin: 0, fontSize: 12, color: "#94a3b8", textAlign: "center", lineHeight: 1.5 }}>{t("incoming.noOrdersSubtitle")}</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {incoming.map((order, i) => (
                <div key={order.id} className="kd-card" style={{ animationDelay: `${i * 40}ms` }}>
                  <IncomingCard order={order} onAdvance={onAdvance} advancing={advancing} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT — Preparing */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, background: "#f8fafc" }}>
        <div style={{ padding: "18px 24px 12px", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: 12, background: "#fff" }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: "#0f172a", letterSpacing: -0.5 }}>{t("preparing.title")}</h2>
          {preparing.length > 0 && <span style={{ background: "#fef3c7", color: "#d97706", border: "1px solid #fde68a", fontSize: 11, fontWeight: 800, padding: "3px 10px", borderRadius: 999 }}>{preparing.length} {t("preparing.active")}</span>}
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "18px 24px 28px" }}>
          {preparing.length === 0 ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "55%", gap: 10, paddingTop: 60 }}>
              <span style={{ fontSize: 44 }}>👨‍🍳</span>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#334155" }}>{t("preparing.noOrders")}</p>
              <p style={{ margin: 0, fontSize: 12, color: "#94a3b8", textAlign: "center", lineHeight: 1.5 }}>{t("preparing.noOrdersSubtitle")}</p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
              {preparing.map((order, i) => (
                <div key={order.id} className="kd-card" style={{ animationDelay: `${i * 40}ms` }}>
                  <PreparingCard order={order} onAdvance={onAdvance} advancing={advancing} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}