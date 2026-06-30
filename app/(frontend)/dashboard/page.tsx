//app/dashboard/page.tsx
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

  pending_orders: number;
  delivered_orders: number;
  cancelled_orders: number;
  preparing_orders: number;
}

interface TopProduct {
  name: string;
  total_quantity: number;
  order_count: number;
  revenue: string;
}

type FilterKey =
  | "all" | "paypal" | "cash_on_delivery" | "card"
  | "pending" | "completed" | "cancelled" | "processing";

/* ─── Helpers ────────────────────────────────────────────────────────── */
const fmt = (n: string | number, locale: string) =>
  "€" + Number(n).toLocaleString(locale === "de" ? "de-DE" : "en-DE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
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

/* ─── Animated integer ───────────────────────────────────────────────── */
function AnimatedInt({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);
  const raf = useRef<number | null>(null);

  useEffect(() => {
    const dur = 700, t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - t0) / dur, 1);
      const ep = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(ep * value));
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [value]);

  return <>{display}</>;
}

/* ─── Bar ────────────────────────────────────────────────────────────── */
function Bar({ pct, color }: { pct: number; color: string }) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setWidth(pct), 80);
    return () => clearTimeout(t);
  }, [pct]);
  return (
    <div style={{ height: 4, background: "#f0eee9", borderRadius: 99, overflow: "hidden", flex: 1 }}>
      <div style={{
        height: "100%", width: `${width}%`, background: color,
        borderRadius: 99, transition: "width .7s cubic-bezier(.16,1,.3,1)",
      }} />
    </div>
  );
}

/* ─── Main page ──────────────────────────────────────────────────────── */
export default function DashboardPage() {
  const { t, locale } = useTranslation();

  const [summary, setSummary]           = useState<OrderSummary | null>(null);
  const [topProducts, setTopProducts]   = useState<TopProduct[]>([]);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/orders/summary")
      .then(r => r.json())
      .then(d => { if (d.success) setSummary(d.data); else setError(d.error); })
      .catch(() => setError("Failed to load summary"))
      .finally(() => setLoadingSummary(false));

    fetch("/api/orders/top-products")
      .then(r => r.json())
      .then(d => { if (d.success) setTopProducts(d.data); else setError(d.error); })
      .catch(() => setError("Failed to load top products"))
      .finally(() => setLoadingProducts(false));
  }, []);

  const maxQty = topProducts[0]?.total_quantity ?? 1;

  /* rank colors — cycle through a muted palette */
  const RANK_COLORS = [
    "#c2440e", "#0369a1", "#7c3aed", "#0f766e",
    "#b45309", "#be185d", "#0e7490", "#4d7c0f",
    "#6d28d9", "#9f1239",
  ];

  return (
    <>
      <link
        rel="stylesheet"
        href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css"
      />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; }
        .d-root {
          font-family: 'Plus Jakarta Sans', sans-serif;
          background: #f5f4f1;
          min-height: 100vh;
          color: #1a1a2e;
        }
        .mono { font-family: 'JetBrains Mono', monospace; }

        /* KPI cards */
        .kpi-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
          margin-bottom: 24px;
        }
        @media (min-width: 600px) {
          .kpi-grid { grid-template-columns: repeat(4, 1fr); }
        }
        .kpi {
          background: #fff;
          border: 0.5px solid #e2e0da;
          border-radius: 12px;
          padding: 14px 14px 12px;
          position: relative;
          overflow: hidden;
        }
        .kpi-bar {
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 2px;
          border-radius: 12px 12px 0 0;
        }
        .kpi-label {
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 0.8px;
          text-transform: uppercase;
          color: #9998a0;
          margin-bottom: 10px;
          display: flex;
          align-items: center;
          gap: 5px;
        }
        .kpi-label i { font-size: 13px; }

        /* Top products */
        .products-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 8px;
        }
        @media (min-width: 720px) {
          .products-grid { grid-template-columns: 1fr 1fr; }
        }

        .prod-card {
          background: #fff;
          border: 0.5px solid #e2e0da;
          border-radius: 12px;
          overflow: hidden;
        }
        .prod-row {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 11px 16px;
          border-bottom: 0.5px solid #f4f2ee;
          transition: background .12s;
        }
        .prod-row:last-child { border-bottom: none; }
        .prod-row:hover { background: #faf9f7; }

        /* Skeleton */
        @keyframes shimmer { 0%,100%{opacity:.45} 50%{opacity:.9} }
        .skel { background: #eeece8; border-radius: 4px; animation: shimmer 1.3s ease-in-out infinite; }

        /* Error banner */
        .err-banner {
          margin-bottom: 16px;
          padding: 10px 14px;
          border-radius: 8px;
          background: #fff5f5;
          border: 0.5px solid #fecaca;
          color: #dc2626;
          font-size: 13px;
          font-weight: 500;
        }

        /* Section header */
        .section-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 10px;
        }
        .section-title {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 1px;
          text-transform: uppercase;
          color: #9998a0;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .section-title i { font-size: 14px; color: #c2440e; }
      `}</style>

      <div className="d-root">
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 16px 60px" }}>

          {/* ── Header ── */}
          <div style={{ marginBottom: 28 }}>
            <div style={{
              fontSize: 10, fontWeight: 500, letterSpacing: 2, color: "#c2440e",
              textTransform: "uppercase", marginBottom: 4,
            }}>
              {t("dashboard.brand")}
            </div>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
              <h1 style={{ fontSize: 20, fontWeight: 500, color: "#12121e", lineHeight: 1.2 }}>
                {t("dashboard.title")}
              </h1>
              <div style={{
                background: "#fff", border: "0.5px solid #e2e0da", borderRadius: 8,
                padding: "6px 12px", fontSize: 11, color: "#9998a0", fontWeight: 500,
                fontFamily: "'JetBrains Mono', monospace", flexShrink: 0,
              }}>
                {new Date().toLocaleDateString(locale === "de" ? "de-DE" : "en-GB", {
                  weekday: "long", day: "2-digit", month: "long", year: "numeric",
                })}
              </div>
            </div>
          </div>

          {/* ── Error ── */}
          {error && (
            <div className="err-banner">
              {t("dashboard.error_prefix")} {error}
            </div>
          )}

          {/* ── KPI cards ── */}
          <div className="kpi-grid">
            {([
              { labelKey: "dashboard.kpi.total_revenue",    value: summary?.total_revenue            ?? "0", sub: summary?.total_orders            ?? 0, color: "#c2440e", icon: "ti-chart-bar" },
              { labelKey: "dashboard.kpi.paypal",           value: summary?.paypal_revenue           ?? "0", sub: summary?.paypal_orders           ?? 0, color: "#0369a1", icon: "ti-brand-paypal" },
      
              { labelKey: "dashboard.kpi.cash_on_delivery", value: summary?.cash_on_delivery_revenue ?? "0", sub: summary?.cash_on_delivery_orders ?? 0, color: "#0f766e", icon: "ti-cash" },
            ]).map(c => (
              <div key={c.labelKey} className="kpi">
                <div className="kpi-bar" style={{ background: c.color }} />
                <div className="kpi-label">
                  <i className={`ti ${c.icon}`} aria-hidden="true" />
                  {t(c.labelKey as any)}
                </div>
                {loadingSummary ? (
                  <>
                    <div className="skel" style={{ height: 24, width: 100, marginBottom: 8 }} />
                    <div className="skel" style={{ height: 11, width: 60 }} />
                  </>
                ) : (
                  <>
                    <div className="mono" style={{ fontSize: 20, fontWeight: 500, color: "#12121e", letterSpacing: -0.5 }}>
                      <AnimatedValue value={c.value} locale={locale} />
                    </div>
                    <div style={{ marginTop: 4, fontSize: 11, color: "#aaa8b4" }}>
                      {c.sub} {Number(c.sub) === 1 ? t("dashboard.orders_singular") : t("dashboard.orders_plural")}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>

          {/* ── Top Products ── */}
          <div className="section-head">
            <div className="section-title">
              <i className="ti ti-trophy" />
              Top Produkte
            </div>
            {!loadingProducts && topProducts.length > 0 && (
              <span className="mono" style={{ fontSize: 10, color: "#c8c5be" }}>
                {topProducts.length} items
              </span>
            )}
          </div>

          <div className="products-grid">
            {/* ── Left: ranked bar list ── */}
            <div className="prod-card">
              <div style={{
                padding: "10px 16px 9px",
                borderBottom: "0.5px solid #f0eee9",
                background: "#faf9f7",
                display: "grid",
                gridTemplateColumns: "1fr auto auto auto",
                gap: 12,
              }}>
                {["Product", "Bestellungen", "Menge", "Umsatz"].map((h, i) => (
                  <span key={h} style={{
                    fontSize: 9, fontWeight: 600, letterSpacing: 0.8,
                    textTransform: "uppercase", color: "#bbb9c4",
                    textAlign: i > 0 ? "right" : "left",
                  }}>{h}</span>
                ))}
              </div>

              {loadingProducts
                ? Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="prod-row">
                      <div className="skel" style={{ height: 12, flex: 1 }} />
                      <div className="skel" style={{ height: 12, width: 32 }} />
                      <div className="skel" style={{ height: 12, width: 24 }} />
                      <div className="skel" style={{ height: 12, width: 52 }} />
                    </div>
                  ))
                : topProducts.length === 0
                ? (
                  <div style={{ padding: "36px 16px", textAlign: "center", color: "#ccc9c0", fontSize: 13 }}>
                   Keine Bestellungen gefunden
                  </div>
                )
                : topProducts.map((p, i) => (
                  <div key={p.name} className="prod-row">
                    {/* rank + name */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                        <span style={{
                          fontSize: 9, fontWeight: 800, color: RANK_COLORS[i] ?? "#aaa",
                          minWidth: 16, fontFamily: "'JetBrains Mono', monospace",
                          letterSpacing: -0.5,
                        }}>
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <span style={{
                          fontSize: 13, fontWeight: 500, color: "#12121e",
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                        }}>
                          {p.name}
                        </span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 9, fontWeight: 600, color: RANK_COLORS[i] ?? "#aaa", minWidth: 16 }} />
                        <Bar pct={(p.total_quantity / maxQty) * 100} color={RANK_COLORS[i] ?? "#e2e0da"} />
                      </div>
                    </div>
                    {/* orders */}
                    <span className="mono" style={{ fontSize: 12, color: "#888690", textAlign: "right", minWidth: 36 }}>
                      {p.order_count}
                    </span>
                    {/* qty */}
                    <span className="mono" style={{
                      fontSize: 13, fontWeight: 500,
                      color: RANK_COLORS[i] ?? "#aaa",
                      textAlign: "right", minWidth: 28,
                    }}>
                      <AnimatedInt value={p.total_quantity} />
                    </span>
                    {/* revenue */}
                    <span className="mono" style={{ fontSize: 12, color: "#12121e", textAlign: "right", minWidth: 68 }}>
                      {fmt(p.revenue, locale)}
                    </span>
                  </div>
                ))}
            </div>

            {/* ── Right: summary stats + podium ── */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>

              {/* total items sold + unique products */}
              <div style={{
                display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8,
              }}>
                {[
                  {
                    label: "Verkaufte Produkte",
                    icon: "ti-shopping-bag",
                    value: topProducts.reduce((s, p) => s + p.total_quantity, 0),
                    color: "#c2440e",
                  },
                  {
                    label: "Einzigartige Produkte",
                    icon: "ti-box",
                    value: topProducts.length,
                    color: "#0369a1",
                  },
                ].map(s => (
                  <div key={s.label} className="kpi" style={{ padding: "12px 14px" }}>
                    <div className="kpi-bar" style={{ background: s.color }} />
                    <div className="kpi-label">
                      <i className={`ti ${s.icon}`} />
                      {s.label}
                    </div>
                    {loadingProducts
                      ? <div className="skel" style={{ height: 22, width: 60 }} />
                      : (
                        <div className="mono" style={{ fontSize: 22, fontWeight: 500, color: "#12121e", letterSpacing: -0.5 }}>
                          <AnimatedInt value={s.value} />
                        </div>
                      )}
                  </div>
                ))}
              </div>

              {/* Podium top-3 */}
              {!loadingProducts && topProducts.length >= 3 && (
                <div className="prod-card" style={{ padding: "16px" }}>
                  <div style={{
                    fontSize: 9, fontWeight: 600, letterSpacing: 0.8,
                    textTransform: "uppercase", color: "#bbb9c4", marginBottom: 14,
                  }}>
                    Top 3 Produkte
                  </div>
                  <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 110 }}>
                    {/* 2nd */}
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                      <span className="mono" style={{ fontSize: 11, fontWeight: 500, color: "#0369a1" }}>
                        <AnimatedInt value={topProducts[1].total_quantity} />
                      </span>
                      <div style={{
                        width: "100%", height: 60,
                        background: "linear-gradient(180deg, #dbeafe 0%, #eff6ff 100%)",
                        borderRadius: "6px 6px 0 0",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 18,
                      }}>🥈</div>
                      <span style={{
                        fontSize: 10, fontWeight: 500, color: "#64748b",
                        textAlign: "center", lineHeight: 1.3,
                        overflow: "hidden", textOverflow: "ellipsis",
                        display: "-webkit-box", WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical" as const,
                        maxWidth: "100%",
                      }}>
                        {topProducts[1].name}
                      </span>
                    </div>
                    {/* 1st */}
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                      <span className="mono" style={{ fontSize: 13, fontWeight: 500, color: "#c2440e" }}>
                        <AnimatedInt value={topProducts[0].total_quantity} />
                      </span>
                      <div style={{
                        width: "100%", height: 90,
                        background: "linear-gradient(180deg, #fee2e2 0%, #fff5f0 100%)",
                        borderRadius: "6px 6px 0 0",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 22,
                      }}>🥇</div>
                      <span style={{
                        fontSize: 10, fontWeight: 600, color: "#12121e",
                        textAlign: "center", lineHeight: 1.3,
                        overflow: "hidden", textOverflow: "ellipsis",
                        display: "-webkit-box", WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical" as const,
                        maxWidth: "100%",
                      }}>
                        {topProducts[0].name}
                      </span>
                    </div>
                    {/* 3rd */}
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                      <span className="mono" style={{ fontSize: 11, fontWeight: 500, color: "#0f766e" }}>
                        <AnimatedInt value={topProducts[2].total_quantity} />
                      </span>
                      <div style={{
                        width: "100%", height: 45,
                        background: "linear-gradient(180deg, #d1fae5 0%, #f0fdf4 100%)",
                        borderRadius: "6px 6px 0 0",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 16,
                      }}>🥉</div>
                      <span style={{
                        fontSize: 10, fontWeight: 500, color: "#64748b",
                        textAlign: "center", lineHeight: 1.3,
                        overflow: "hidden", textOverflow: "ellipsis",
                        display: "-webkit-box", WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical" as const,
                        maxWidth: "100%",
                      }}>
                        {topProducts[2].name}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Revenue share of top product */}
              {!loadingProducts && topProducts.length > 0 && (() => {
                const totalRev = topProducts.reduce((s, p) => s + Number(p.revenue), 0);
                const topRev   = Number(topProducts[0]?.revenue ?? 0);
                const pct      = totalRev > 0 ? Math.round((topRev / totalRev) * 100) : 0;
                return (
                  <div className="prod-card" style={{ padding: "14px 16px" }}>
                    <div style={{
                      fontSize: 9, fontWeight: 600, letterSpacing: 0.8,
                      textTransform: "uppercase", color: "#bbb9c4", marginBottom: 10,
                    }}>
                      Top Produkt Umsatzanteil
                    </div>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 10 }}>
                      <span className="mono" style={{ fontSize: 28, fontWeight: 500, color: "#c2440e", letterSpacing: -1 }}>
                        {pct}%
                      </span>
                      <span style={{ fontSize: 11, color: "#aaa8b4" }}>
                        von Umsatz der Top-10 Produkte
                      </span>
                    </div>
                    <Bar pct={pct} color="#c2440e" />
                    <div style={{ marginTop: 6, fontSize: 11, color: "#aaa8b4", fontFamily: "'JetBrains Mono', monospace" }}>
                      {topProducts[0]?.name} · {fmt(topProducts[0]?.revenue ?? "0", locale)}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

        </div>
      </div>
    </>
  );
}