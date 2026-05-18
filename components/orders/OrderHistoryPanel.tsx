// components/orders/OrderHistoryPanel.tsx
"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface HistoryItem {
  id: string;
  product_name_snapshot: string;
  quantity: number;
  unit_price_snapshot: number;
  item_note?: string;
}

interface HistoryOrder {
  id: string;
  order_number: number;
  status: "delivered" | "cancelled" | "out_for_delivery";
  order_type: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  subtotal: number;
  tax: number;
  delivery_fee: number;
  total: number;
  payment_method: string;
  payment_status: string;
  created_at: string;
  updated_at: string;
  items: HistoryItem[];
}

type StatusFilter = "all" | "delivered" | "out_for_delivery" | "cancelled";

const STATUS_PILL: Record<string, { label: string; bg: string; color: string }> = {
  delivered:        { label: "Delivered",       bg: "#f0fdf4", color: "#16a34a" },
  out_for_delivery: { label: "Out for delivery", bg: "#eff6ff", color: "#2563eb" },
  cancelled:        { label: "Cancelled",        bg: "#fef2f2", color: "#dc2626" },
};

const PAYMENT_STATUS_PILL: Record<string, { bg: string; color: string }> = {
  paid:    { bg: "#f0fdf4", color: "#16a34a" },
  pending: { bg: "#fefce8", color: "#ca8a04" },
  failed:  { bg: "#fef2f2", color: "#dc2626" },
  refunded:{ bg: "#f5f3ff", color: "#7c3aed" },
};

function fmt(n: number | string) {
  return Number(n).toFixed(2);
}

function fmtDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("de-DE", {
    day: "2-digit", month: "2-digit", year: "numeric",
  }) + " " + d.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
}

function ExpandedRow({ order }: { order: HistoryOrder }) {
  return (
    <tr className="hist-expanded-row">
      <td colSpan={9}>
        <div className="hist-expanded">
          <div className="hist-expanded-section">
            <p className="hist-exp-label">Items</p>
            <div className="hist-items">
              {order.items.length === 0 && <span className="hist-empty-items">—</span>}
              {order.items.map((item) => (
                <div key={item.id} className="hist-item">
                  <span className="hist-item-qty">{item.quantity}×</span>
                  <span className="hist-item-name">{item.product_name_snapshot}</span>
                  {item.item_note && <span className="hist-item-note">"{item.item_note}"</span>}
                  <span className="hist-item-price">€{fmt(item.unit_price_snapshot * item.quantity)}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="hist-expanded-section">
            <p className="hist-exp-label">Breakdown</p>
            <div className="hist-breakdown">
              <div className="hist-brow"><span>Subtotal</span><span>€{fmt(order.subtotal)}</span></div>
              {Number(order.delivery_fee) > 0 && (
                <div className="hist-brow"><span>Delivery fee</span><span>€{fmt(order.delivery_fee)}</span></div>
              )}
              <div className="hist-brow"><span>Tax incl.</span><span>€{fmt(order.tax)}</span></div>
              <div className="hist-brow hist-brow-total"><span>Total</span><span>€{fmt(order.total)}</span></div>
              <div className="hist-brow hist-brow-meta">
                <span>Payment</span>
                <span>{order.payment_method} · {order.payment_status}</span>
              </div>
              <div className="hist-brow hist-brow-meta">
                <span>Type</span>
                <span>{order.order_type === "delivery" ? "🛵 Delivery" : order.order_type === "pickup" ? "🏃 Pickup" : order.order_type}</span>
              </div>
            </div>
          </div>
          {(order.customer_email || order.customer_phone) && (
            <div className="hist-expanded-section">
              <p className="hist-exp-label">Contact</p>
              {order.customer_email && <p className="hist-contact">{order.customer_email}</p>}
              {order.customer_phone && <p className="hist-contact">{order.customer_phone}</p>}
            </div>
          )}
        </div>
      </td>
    </tr>
  );
}

export default function OrderHistoryPanel() {
  const [orders, setOrders] = useState<HistoryOrder[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchHistory = useCallback(async (query: string, status: StatusFilter, pg: number) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ q: query, status, page: String(pg) });
      const res = await fetch(`/api/orders/history?${params}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      const data = await res.json();
      setOrders(data.orders ?? []);
      setTotal(data.total ?? 0);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      console.error("[OrderHistory] fetch failed:", msg);
      setError(msg);
      setOrders([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(1);
      fetchHistory(q, statusFilter, 1);
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [q, statusFilter, fetchHistory]);

  useEffect(() => {
    fetchHistory(q, statusFilter, page);
  }, [page]); // eslint-disable-line react-hooks/exhaustive-deps

  const totalPages = Math.ceil(total / 50);

  return (
    <div className="hist-panel">
      {/* ── Toolbar ── */}
      <div className="hist-toolbar">
        <div className="hist-search-wrap">
          <span className="hist-search-icon">🔍</span>
          <input
            className="hist-search"
            placeholder="Search order #, name, email, phone…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          {q && (
            <button className="hist-search-clear" onClick={() => setQ("")}>✕</button>
          )}
        </div>

        <div className="hist-filters">
          {(["all", "delivered", "out_for_delivery", "cancelled"] as StatusFilter[]).map((s) => (
            <button
              key={s}
              className={`hist-filter-btn ${statusFilter === s ? "active" : ""}`}
              onClick={() => setStatusFilter(s)}
            >
              {s === "all" ? "All"
                : s === "delivered" ? "✅ Delivered"
                : s === "out_for_delivery" ? "🛵 Out for delivery"
                : "❌ Cancelled"}
            </button>
          ))}
        </div>

        <div className="hist-meta">
          {loading ? (
            <span className="hist-loading">Loading…</span>
          ) : (
            <span className="hist-count">{total} order{total !== 1 ? "s" : ""}</span>
          )}
        </div>
      </div>

      {/* ── Table ── */}
      <div className="hist-table-wrap">
        <table className="hist-table">
          <thead>
            <tr>
              <th></th>
              <th>#</th>
              <th>Date</th>
              <th>Customer</th>
              <th>Type</th>
              <th>Items</th>
              <th>Total</th>
              <th>Payment</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {!loading && error && (
              <tr>
                <td colSpan={9} className="hist-empty">
                  <div className="hist-empty-inner hist-empty-error">
                    <span className="hist-empty-icon">⚠️</span>
                    <span className="hist-err-title">Could not load history</span>
                    <span className="hist-err-detail">{error}</span>
                    <button className="hist-retry-btn" onClick={() => fetchHistory(q, statusFilter, page)}>
                      Retry
                    </button>
                  </div>
                </td>
              </tr>
            )}
            {!loading && !error && orders.length === 0 && (
              <tr>
                <td colSpan={9} className="hist-empty">
                  <div className="hist-empty-inner">
                    <span className="hist-empty-icon">📭</span>
                    <span>No completed orders yet</span>
                    {statusFilter !== "all" && (
                      <span className="hist-err-detail">Try switching the filter to "All"</span>
                    )}
                  </div>
                </td>
              </tr>
            )}
            {orders.map((order) => {
              const isExpanded = expandedId === order.id;
              const sp = STATUS_PILL[order.status] ?? { label: order.status, bg: "#f1f5f9", color: "#64748b" };
              const pp = PAYMENT_STATUS_PILL[order.payment_status] ?? { bg: "#f1f5f9", color: "#64748b" };
              return [
                <tr
                  key={order.id}
                  className={`hist-row ${isExpanded ? "expanded" : ""}`}
                  onClick={() => setExpandedId(isExpanded ? null : order.id)}
                >
                  <td className="hist-chevron">{isExpanded ? "▾" : "▸"}</td>
                  <td className="hist-ordernr">#{order.order_number}</td>
                  <td className="hist-date">{fmtDate(order.created_at)}</td>
                  <td className="hist-customer">{order.customer_name ?? <span className="hist-anon">Guest</span>}</td>
                  <td className="hist-type">
                    <span className="hist-type-badge">
                      {order.order_type === "delivery" ? "🛵 Delivery" : order.order_type === "pickup" ? "🏃 Pickup" : order.order_type}
                    </span>
                  </td>
                  <td className="hist-itemcount">{order.items.length} item{order.items.length !== 1 ? "s" : ""}</td>
                  <td className="hist-total">€{fmt(order.total)}</td>
                  <td>
                    <span className="hist-pill" style={{ background: pp.bg, color: pp.color }}>
                      {order.payment_status}
                    </span>
                  </td>
                  <td>
                    <span className="hist-pill" style={{ background: sp.bg, color: sp.color }}>
                      {sp.label}
                    </span>
                  </td>
                </tr>,
                isExpanded && <ExpandedRow key={`${order.id}-exp`} order={order} />,
              ];
            })}
          </tbody>
        </table>
      </div>

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="hist-pagination">
          <button
            className="hist-page-btn"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            ← Prev
          </button>
          <span className="hist-page-info">Page {page} of {totalPages}</span>
          <button
            className="hist-page-btn"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Next →
          </button>
        </div>
      )}

      <style>{`
        .hist-panel {
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          min-height: calc(100vh - 68px);
        }

        /* ── Toolbar ── */
        .hist-toolbar {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }
        .hist-search-wrap {
          position: relative;
          flex: 1;
          min-width: 240px;
          max-width: 420px;
        }
        .hist-search-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 14px;
          pointer-events: none;
        }
        .hist-search {
          width: 100%;
          padding: 10px 36px 10px 36px;
          border: 1.5px solid #e2e8f0;
          border-radius: 10px;
          font-size: 14px;
          font-family: 'DM Sans', sans-serif;
          background: #fff;
          color: #0f172a;
          outline: none;
          transition: border-color .15s;
        }
        .hist-search:focus { border-color: #6366f1; }
        .hist-search-clear {
          position: absolute;
          right: 10px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          color: #94a3b8;
          font-size: 12px;
          padding: 2px 4px;
        }
        .hist-search-clear:hover { color: #475569; }

        .hist-filters {
          display: flex;
          gap: 6px;
        }
        .hist-filter-btn {
          padding: 8px 14px;
          border: 1.5px solid #e2e8f0;
          border-radius: 8px;
          background: #fff;
          font-size: 13px;
          font-weight: 600;
          color: #64748b;
          cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          transition: all .15s;
        }
        .hist-filter-btn:hover { border-color: #cbd5e1; color: #334155; }
        .hist-filter-btn.active {
          background: #0f172a;
          border-color: #0f172a;
          color: #fff;
        }

        .hist-meta { margin-left: auto; }
        .hist-count { font-size: 13px; font-weight: 600; color: #64748b; }
        .hist-loading { font-size: 13px; color: #94a3b8; font-weight: 600; }

        /* ── Table ── */
        .hist-table-wrap {
          background: #fff;
          border-radius: 16px;
          border: 1.5px solid #e2e8f0;
          overflow: hidden;
          box-shadow: 0 1px 4px rgba(0,0,0,.05);
        }
        .hist-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13.5px;
        }
        .hist-table thead tr {
          background: #f8fafc;
          border-bottom: 1.5px solid #e2e8f0;
        }
        .hist-table th {
          padding: 11px 14px;
          text-align: left;
          font-size: 11.5px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: .06em;
          color: #94a3b8;
          white-space: nowrap;
        }
        .hist-row {
          border-bottom: 1px solid #f1f5f9;
          cursor: pointer;
          transition: background .1s;
        }
        .hist-row:hover { background: #f8fafc; }
        .hist-row.expanded { background: #f8fafc; }
        .hist-row td {
          padding: 12px 14px;
          color: #1e293b;
          vertical-align: middle;
        }

        .hist-chevron { color: #94a3b8; font-size: 12px; width: 24px; }
        .hist-ordernr { font-weight: 700; color: #0f172a; font-family: 'Sora', sans-serif; }
        .hist-date { color: #64748b; white-space: nowrap; }
        .hist-customer { font-weight: 600; }
        .hist-anon { color: #94a3b8; font-style: italic; font-weight: 400; }
        .hist-type-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;
          font-weight: 600;
          background: #f1f5f9;
          color: #475569;
          padding: 3px 9px;
          border-radius: 6px;
        }
        .hist-itemcount { color: #64748b; }
        .hist-total { font-weight: 700; color: #0f172a; }
        .hist-pill {
          display: inline-block;
          padding: 3px 10px;
          border-radius: 999px;
          font-size: 11.5px;
          font-weight: 700;
          white-space: nowrap;
        }

        /* ── Expanded row ── */
        .hist-expanded-row td { padding: 0; }
        .hist-expanded {
          display: flex;
          gap: 32px;
          padding: 16px 20px 20px 52px;
          background: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
          flex-wrap: wrap;
        }
        .hist-expanded-section { min-width: 180px; }
        .hist-exp-label {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: .06em;
          color: #94a3b8;
          margin-bottom: 8px;
        }
        .hist-items { display: flex; flex-direction: column; gap: 5px; }
        .hist-item {
          display: flex;
          align-items: center;
          gap: 7px;
          font-size: 13px;
        }
        .hist-item-qty {
          font-weight: 700;
          color: #6366f1;
          min-width: 22px;
        }
        .hist-item-name { color: #1e293b; font-weight: 500; }
        .hist-item-note { color: #94a3b8; font-style: italic; font-size: 12px; }
        .hist-item-price { margin-left: auto; font-weight: 600; color: #475569; }
        .hist-empty-items { color: #cbd5e1; font-size: 13px; }

        .hist-breakdown { display: flex; flex-direction: column; gap: 4px; }
        .hist-brow {
          display: flex;
          justify-content: space-between;
          gap: 24px;
          font-size: 13px;
          color: #64748b;
        }
        .hist-brow-meta {
          font-size: 12px;
          color: #94a3b8;
          border-top: none;
          padding-top: 0;
        }
        .hist-brow-total {
          font-weight: 700;
          color: #0f172a;
          border-top: 1px solid #e2e8f0;
          margin-top: 4px;
          padding-top: 4px;
        }

        .hist-contact { font-size: 13px; color: #475569; margin-top: 4px; }

        /* ── Empty ── */
        .hist-empty td { padding: 60px 20px; }
        .hist-empty-error { gap: 8px; }
        .hist-err-title { font-size: 14px; font-weight: 700; color: #dc2626; }
        .hist-err-detail { font-size: 12px; color: #94a3b8; max-width: 320px; text-align: center; }
        .hist-retry-btn {
          margin-top: 4px; padding: 7px 18px;
          border: 1.5px solid #e2e8f0; border-radius: 8px;
          background: #fff; font-size: 13px; font-weight: 600;
          color: #475569; cursor: pointer; font-family: 'DM Sans', sans-serif;
        }
        .hist-retry-btn:hover { border-color: #6366f1; color: #6366f1; }
        .hist-empty-inner {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          color: #94a3b8;
          font-size: 14px;
          font-weight: 600;
        }
        .hist-empty-icon { font-size: 32px; }

        /* ── Pagination ── */
        .hist-pagination {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 16px;
          padding-bottom: 8px;
        }
        .hist-page-btn {
          padding: 8px 18px;
          border: 1.5px solid #e2e8f0;
          border-radius: 8px;
          background: #fff;
          font-size: 13px;
          font-weight: 600;
          color: #475569;
          cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          transition: all .15s;
        }
        .hist-page-btn:disabled { opacity: .4; cursor: not-allowed; }
        .hist-page-btn:not(:disabled):hover { border-color: #6366f1; color: #6366f1; }
        .hist-page-info { font-size: 13px; color: #64748b; font-weight: 600; }
      `}</style>
    </div>
  );
}