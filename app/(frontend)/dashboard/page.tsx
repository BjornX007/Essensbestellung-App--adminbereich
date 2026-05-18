// app/dashboard/page.tsx
"use client";

import { useEffect, useState, useRef } from "react";
import { useTranslation } from "@/app/lib/i18n/context";

/* ─── Types ──────────────────────────────────────────────────────────── */
interface OrderSummary {
  total_orders: number;
  total_revenue: string;
  total_subtotal: string;
  total_delivery: string;
  total_tax: string;
  paypal_orders: number;
  paypal_revenue: string;
  cash_on_delivery_orders: number;
  cash_on_delivery_revenue: string;
  card_orders: number;
  card_revenue: string;
  pending_orders: number;
  completed_orders: number;
  cancelled_orders: number;
  processing_orders: number;
}

interface Order {
  id: string;
  order_number: string;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  status: string;
  order_type: string;
  subtotal: string;
  tax: string;
  delivery_fee: string;
  total: string;
  payment_method: string;
  payment_status: string;
  created_at: string;
}

type FilterKey =
  | "all" | "paypal" | "cash_on_delivery" | "card"
  | "pending" | "completed" | "cancelled" | "processing";

/* ─── Style maps ─────────────────────────────────────────────────────── */
const STATUS_STYLE: Record<string, { bg: string; text: string; dot: string }> = {
  pending:    { bg: "#fffbeb", text: "#d97706", dot: "#f59e0b" },
  processing: { bg: "#eff6ff", text: "#1d4ed8", dot: "#3b82f6" },
  completed:  { bg: "#f0fdf4", text: "#15803d", dot: "#22c55e" },
  cancelled:  { bg: "#fff5f5", text: "#dc2626", dot: "#ef4444" },
};

const PAY_STYLE: Record<string, { bg: string; text: string; icon: string }> = {
  paypal:           { bg: "#f0f9ff", text: "#0369a1", icon: "🅿" },
  cash_on_delivery: { bg: "#fff7ed", text: "#c2410c", icon: "💵" },
  card:             { bg: "#faf5ff", text: "#7c3aed", icon: "💳" },
};

/* ─── Helpers ────────────────────────────────────────────────────────── */
const fmt = (n: string | number, locale: string) =>
  "€" + Number(n).toLocaleString(locale === "de" ? "de-DE" : "en-DE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const fmtDate = (iso: string, locale: string) =>
  new Date(iso).toLocaleDateString(locale === "de" ? "de-DE" : "en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

/* ─── Animated counter ───────────────────────────────────────────────── */
function AnimatedValue({ value, locale }: { value: string; locale: string }) {
  const [display, setDisplay] = useState("0,00");
  const target = Number(value);
  const raf = useRef<number | null>(null);

  useEffect(() => {
    if (isNaN(target)) { setDisplay(value); return; }
    const dur = 900, t0 = performance.now();
    const tick = (now: number) => {
      const p  = Math.min((now - t0) / dur, 1);
      const ep = 1 - Math.pow(1 - p, 4);
      setDisplay(
        "€" + (ep * target).toLocaleString(locale === "de" ? "de-DE" : "en-DE", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })
      );
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [target, value, locale]);

  return <>{display}</>;
}

/* ─── Main page ──────────────────────────────────────────────────────── */
export default function DashboardPage() {
  const { t, locale } = useTranslation();

  const [summary, setSummary] = useState<OrderSummary | null>(null);
  const [orders,  setOrders]  = useState<Order[]>([]);
  const [filter,  setFilter]  = useState<FilterKey>("all");
  const [sortKey, setSortKey] = useState<keyof Order>("created_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [loadingOrders,  setLoadingOrders]  = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // ✅ Read translated error strings once on mount, before async callbacks
    const errSummary = t("dashboard.errors.summary");
    const errOrders  = t("dashboard.errors.orders");

    fetch("/api/orders/summary")
      .then(r => r.json())
      .then(d => { if (d.success) setSummary(d.data); else setError(d.error); })
      .catch(() => setError(errSummary))
      .finally(() => setLoadingSummary(false));

    fetch("/api/orders")
      .then(r => r.json())
      .then(d => { if (d.success) setOrders(d.data); else setError(d.error); })
      .catch(() => setError(errOrders))
      .finally(() => setLoadingOrders(false));
  }, []);

  const filtered = orders.filter(o => {
    if (filter === "all") return true;
    if (["paypal", "cash_on_delivery", "card"].includes(filter)) return o.payment_method === filter;
    return o.status === filter;
  });

  const sorted = [...filtered].sort((a, b) => {
    let av: string | number = a[sortKey] ?? "";
    let bv: string | number = b[sortKey] ?? "";
    if (["subtotal", "delivery_fee", "total", "tax"].includes(sortKey as string)) {
      av = Number(av); bv = Number(bv);
    }
    return av < bv ? (sortDir === "asc" ? -1 : 1) : av > bv ? (sortDir === "asc" ? 1 : -1) : 0;
  });

  const handleSort = (key: keyof Order) => {
    if (key === sortKey) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  };

  const sumSub = filtered.reduce((a, o) => a + Number(o.subtotal), 0);
  const sumDel = filtered.reduce((a, o) => a + Number(o.delivery_fee), 0);
  const sumTax = filtered.reduce((a, o) => a + Number(o.tax), 0);
  const sumTot = filtered.reduce((a, o) => a + Number(o.total), 0);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; }
        .d-root {
          font-family: 'Plus Jakarta Sans', sans-serif;
          background: #f5f4f1;
          min-height: 100vh;
          color: #1a1a2e;
        }
        .mono { font-family: 'JetBrains Mono', monospace; }
        .kpi {
          background: #fff;
          border: 1px solid #e8e6e0;
          border-radius: 14px;
          padding: 20px 22px 18px;
          position: relative;
          overflow: hidden;
          transition: box-shadow .2s, transform .2s;
        }
        .kpi:hover { box-shadow: 0 6px 24px rgba(0,0,0,.07); transform: translateY(-1px); }
        .kpi-bar { position: absolute; top: 0; left: 0; right: 0; height: 3px; border-radius: 14px 14px 0 0; }
        .stat-chip {
          background: #fff;
          border: 1px solid #e8e6e0;
          border-radius: 12px;
          padding: 14px 18px;
          cursor: pointer;
          transition: all .15s;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .stat-chip:hover { box-shadow: 0 4px 16px rgba(0,0,0,.06); }
        .tbl-card {
          background: #fff;
          border: 1px solid #e8e6e0;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0,0,0,.04);
        }
        .tbl-scroll { overflow-x: auto; }
        .tbl-scroll::-webkit-scrollbar { height: 4px; }
        .tbl-scroll::-webkit-scrollbar-thumb { background: #d8d5cd; border-radius: 4px; }
        table { width: 100%; border-collapse: collapse; font-size: 13px; }
        thead th {
          padding: 10px 16px;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: .7px;
          text-transform: uppercase;
          color: #9998a0;
          background: #faf9f7;
          border-bottom: 1px solid #eeece8;
          cursor: pointer;
          user-select: none;
          white-space: nowrap;
        }
        thead th:hover { color: #4a4860; }
        tbody td { padding: 11px 16px; border-bottom: 1px solid #f4f2ee; vertical-align: middle; }
        tbody tr:last-child td { border-bottom: none; }
        tbody tr { transition: background .12s; }
        tbody tr:hover { background: #faf9f7; }
        .fpill {
          padding: 5px 13px;
          border-radius: 99px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all .15s;
          border: 1.5px solid #e4e2dc;
          background: transparent;
          color: #888690;
          font-family: 'Plus Jakarta Sans', sans-serif;
        }
        .fpill:hover { border-color: #c8c5be; color: #444260; }
        .fpill.active { background: #1a1a2e; border-color: #1a1a2e; color: #fff; }
        .spill {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 3px 9px;
          border-radius: 99px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: .2px;
        }
        .spill-dot { width: 5px; height: 5px; border-radius: 50%; flex-shrink: 0; }
        @keyframes shimmer { 0%,100%{opacity:.5} 50%{opacity:1} }
        .skel { background: #eeece8; border-radius: 6px; animation: shimmer 1.3s ease-in-out infinite; }
        @keyframes rowIn { from{opacity:0;transform:translateY(5px)} to{opacity:1;transform:translateY(0)} }
        .row-in { animation: rowIn .25s ease both; }
      `}</style>

      <div className="d-root">
        <div style={{ maxWidth: 1360, margin: "0 auto", padding: "36px 24px 60px" }}>

          {/* ── Header ── */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 32 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                <span style={{ fontSize: 18 }}>🍽</span>
                <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: 2, color: "#e07030", textTransform: "uppercase" }}>
                  {t("dashboard.brand")}
                </span>
              </div>
              <h1 style={{ fontSize: 26, fontWeight: 800, color: "#12121e", lineHeight: 1.1 }}>
                {t("dashboard.title")}
              </h1>
              <p style={{ marginTop: 4, fontSize: 13, color: "#9998a0" }}>
                {t("dashboard.subtitle")}
              </p>
            </div>
            <div style={{
              background: "#fff", border: "1px solid #e8e6e0", borderRadius: 10,
              padding: "9px 16px", fontSize: 12, color: "#9998a0", fontWeight: 600,
              fontFamily: "'JetBrains Mono', monospace",
            }}>
              {new Date().toLocaleDateString(locale === "de" ? "de-DE" : "en-GB", {
                weekday: "long", day: "2-digit", month: "long", year: "numeric",
              })}
            </div>
          </div>

          {/* ── Error ── */}
          {error && (
            <div style={{
              marginBottom: 20, padding: "11px 16px", borderRadius: 10,
              background: "#fff5f5", border: "1px solid #fecaca", color: "#dc2626", fontSize: 13, fontWeight: 500,
            }}>
              {t("dashboard.error_prefix")} {error}
            </div>
          )}

          {/* ── KPI cards ── */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 12, marginBottom: 12 }}>
            {([
              { labelKey: "dashboard.kpi.total_revenue",    value: summary?.total_revenue            ?? "0", sub: `${summary?.total_orders            ?? 0}`, color: "#e07030", icon: "📊" },
              { labelKey: "dashboard.kpi.paypal",           value: summary?.paypal_revenue           ?? "0", sub: `${summary?.paypal_orders           ?? 0}`, color: "#0ea5e9", icon: "🅿" },
              { labelKey: "dashboard.kpi.cash_on_delivery", value: summary?.cash_on_delivery_revenue ?? "0", sub: `${summary?.cash_on_delivery_orders ?? 0}`, color: "#f97316", icon: "💵" },
              { labelKey: "dashboard.kpi.card",             value: summary?.card_revenue             ?? "0", sub: `${summary?.card_orders             ?? 0}`, color: "#8b5cf6", icon: "💳" },
            ]).map(c => (
              <div key={c.labelKey} className="kpi">
                <div className="kpi-bar" style={{ background: c.color }} />
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: .7, color: "#aaa8b4", textTransform: "uppercase" }}>
                    {t(c.labelKey as any)}
                  </span>
                  <span style={{ fontSize: 18 }}>{c.icon}</span>
                </div>
                {loadingSummary ? (
                  <>
                    <div className="skel" style={{ height: 28, width: 110, marginBottom: 8 }} />
                    <div className="skel" style={{ height: 11, width: 70 }} />
                  </>
                ) : (
                  <>
                    <div className="mono" style={{ fontSize: 24, fontWeight: 700, color: "#12121e", letterSpacing: -0.5 }}>
                      <AnimatedValue value={c.value} locale={locale} />
                    </div>
                    <div style={{ marginTop: 5, fontSize: 11, color: "#aaa8b4", fontWeight: 600 }}>
                      {c.sub} {Number(c.sub) === 1 ? t("dashboard.orders_singular") : t("dashboard.orders_plural")}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>

          {/* ── Status chips ── */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 24 }}>
            {([
              { key: "pending",    countKey: "pending_orders",    color: "#d97706", bg: "#fffbeb", border: "#fde68a" },
              { key: "processing", countKey: "processing_orders", color: "#0284c7", bg: "#f0f9ff", border: "#bae6fd" },
              { key: "completed",  countKey: "completed_orders",  color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0" },
              { key: "cancelled",  countKey: "cancelled_orders",  color: "#dc2626", bg: "#fff5f5", border: "#fecaca" },
            ] as { key: FilterKey; countKey: keyof OrderSummary; color: string; bg: string; border: string }[]).map(s => (
              <div
                key={s.key}
                className="stat-chip"
                onClick={() => setFilter(filter === s.key ? "all" : s.key)}
                style={{ background: filter === s.key ? s.bg : "#fff", borderColor: filter === s.key ? s.border : "#e8e6e0" }}
              >
                <div>
                  <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: .7, textTransform: "uppercase", color: s.color, marginBottom: 4 }}>
                    {t(`dashboard.status.${s.key}` as any)}
                  </div>
                  <div className="mono" style={{ fontSize: 22, fontWeight: 700, color: "#12121e", lineHeight: 1 }}>
                    {loadingSummary
                      ? <span className="skel" style={{ display: "inline-block", width: 28, height: 20 }} />
                      : (summary?.[s.countKey] ?? 0) as number}
                  </div>
                </div>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: s.color, opacity: .7 }} />
              </div>
            ))}
          </div>

          {/* ── Table ── */}
          <div className="tbl-card">
            {/* Toolbar */}
            <div style={{
              padding: "14px 18px", borderBottom: "1px solid #eeece8",
              display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6,
              background: "#faf9f7",
            }}>
              <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: .7, color: "#bbb9c4", textTransform: "uppercase", marginRight: 4 }}>
                {t("dashboard.filter_label")}
              </span>
              {(["all", "paypal", "cash_on_delivery", "card", "pending", "processing", "completed", "cancelled"] as FilterKey[]).map(f => (
                <button key={f} className={`fpill${filter === f ? " active" : ""}`} onClick={() => setFilter(f)}>
                  {t(`dashboard.filter.${f}` as any)}
                </button>
              ))}
              <span className="mono" style={{ marginLeft: "auto", fontSize: 11, color: "#bbb9c4", fontWeight: 600 }}>
                {filtered.length} {filtered.length === 1 ? t("dashboard.orders_singular") : t("dashboard.orders_plural")}
              </span>
            </div>

            {/* Table */}
            <div className="tbl-scroll">
              <table>
                <thead>
                  <tr>
                    {([
                      { key: "order_number",   labelKey: "dashboard.table.order"    },
                      { key: "customer_name",  labelKey: "dashboard.table.customer" },
                      { key: "created_at",     labelKey: "dashboard.table.date"     },
                      { key: "status",         labelKey: "dashboard.table.status"   },
                      { key: "payment_method", labelKey: "dashboard.table.payment"  },
                      { key: "order_type",     labelKey: "dashboard.table.type"     },
                      { key: "subtotal",       labelKey: "dashboard.table.subtotal", right: true },
                      { key: "delivery_fee",   labelKey: "dashboard.table.delivery", right: true },
                      { key: "tax",            labelKey: "dashboard.table.tax",      right: true },
                      { key: "total",          labelKey: "dashboard.table.total",    right: true },
                    ] as { key: keyof Order; labelKey: string; right?: boolean }[]).map(col => (
                      <th key={col.key} style={{ textAlign: col.right ? "right" : "left" }} onClick={() => handleSort(col.key)}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
                          {t(col.labelKey as any)}
                          <span style={{ color: sortKey === col.key ? "#e07030" : "#d8d5ce", fontSize: 9 }}>
                            {sortKey === col.key ? (sortDir === "asc" ? "▲" : "▼") : "⇅"}
                          </span>
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loadingOrders
                    ? Array.from({ length: 6 }).map((_, i) => (
                        <tr key={i}>{Array.from({ length: 10 }).map((_, j) => (
                          <td key={j}><div className="skel" style={{ height: 13, width: `${50 + Math.random() * 40}%` }} /></td>
                        ))}</tr>
                      ))
                    : sorted.length === 0
                    ? <tr><td colSpan={10} style={{ textAlign: "center", padding: "48px 16px", color: "#ccc9c0", fontSize: 13 }}>{t("dashboard.no_orders")}</td></tr>
                    : sorted.map((o, i) => {
                        const sm = STATUS_STYLE[o.status];
                        const pm = PAY_STYLE[o.payment_method];
                        return (
                          <tr key={o.id} className="row-in" style={{ animationDelay: `${i * 20}ms` }}>
                            <td>
                              <span className="mono" style={{ fontWeight: 600, color: "#12121e", fontSize: 13 }}>{o.order_number}</span>
                              <br />
                              <span className="mono" style={{ fontSize: 10, color: "#ccc9c0" }}>{o.id.slice(0, 8)}…</span>
                            </td>
                            <td>
                              <span style={{ fontWeight: 600, color: "#2a2840" }}>{o.customer_name ?? "—"}</span>
                              {o.customer_email && <><br /><span style={{ fontSize: 11, color: "#aaa8b4" }}>{o.customer_email}</span></>}
                            </td>
                            <td>
                              <span className="mono" style={{ fontSize: 11, color: "#aaa8b4" }}>{fmtDate(o.created_at, locale)}</span>
                            </td>
                            <td>
                              <span className="spill" style={{ background: sm?.bg ?? "#f4f4f4", color: sm?.text ?? "#666" }}>
                                <span className="spill-dot" style={{ background: sm?.dot ?? "#999" }} />
                                {t(`dashboard.status.${o.status}` as any) || o.status}
                              </span>
                            </td>
                            <td>
                              {/* ✅ Fixed: was missing {} around t(), rendering as raw string */}
                              <span className="spill" style={{ background: pm?.bg ?? "#f4f4f4", color: pm?.text ?? "#666" }}>
                                {pm?.icon} {t(`dashboard.payment.${o.payment_method}` as any) || o.payment_method}
                              </span>
                            </td>
                            <td>
                              <span style={{ fontSize: 11, fontWeight: 700, color: "#aaa8b4", textTransform: "capitalize", letterSpacing: .2 }}>
                                {o.order_type}
                              </span>
                            </td>
                            <td style={{ textAlign: "right" }}>
                              <span className="mono" style={{ color: "#888690", fontSize: 13 }}>{fmt(o.subtotal, locale)}</span>
                            </td>
                            <td style={{ textAlign: "right" }}>
                              {Number(o.delivery_fee) > 0
                                ? <span className="mono" style={{ color: "#888690", fontSize: 13 }}>{fmt(o.delivery_fee, locale)}</span>
                                : <span className="mono" style={{ color: "#d4d1c8", fontSize: 11 }}>{t("dashboard.free")}</span>}
                            </td>
                            <td style={{ textAlign: "right" }}>
                              <span className="mono" style={{ color: "#aaa8b4", fontSize: 12 }}>{fmt(o.tax, locale)}</span>
                            </td>
                            <td style={{ textAlign: "right" }}>
                              <span className="mono" style={{ fontWeight: 700, color: "#12121e", fontSize: 14 }}>{fmt(o.total, locale)}</span>
                            </td>
                          </tr>
                        );
                      })}
                </tbody>
              </table>
            </div>

            {/* Totals footer */}
            {!loadingOrders && sorted.length > 0 && (
              <div style={{
                borderTop: "1px solid #eeece8", background: "#faf9f7",
                padding: "14px 20px",
                display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 16,
              }}>
                {([
                  { labelKey: "dashboard.footer.subtotal",    value: sumSub },
                  { labelKey: "dashboard.footer.delivery",    value: sumDel },
                  { labelKey: "dashboard.footer.tax",         value: sumTax },
                  { labelKey: "dashboard.footer.grand_total", value: sumTot, highlight: true },
                ] as { labelKey: string; value: number; highlight?: boolean }[]).map(tf => (
                  <div key={tf.labelKey}>
                    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: .7, textTransform: "uppercase", color: "#c8c5be", marginBottom: 3 }}>
                      {t(tf.labelKey as any)}
                    </div>
                    <div className="mono" style={{ fontSize: tf.highlight ? 16 : 13, fontWeight: tf.highlight ? 700 : 500, color: tf.highlight ? "#e07030" : "#888690" }}>
                      {fmt(tf.value, locale)}
                    </div>
                  </div>
                ))}
                <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "flex-end" }}>
                  <span className="mono" style={{ fontSize: 10, color: "#ccc9c0" }}>
                    {filtered.length} {t("dashboard.orders_shown")}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}