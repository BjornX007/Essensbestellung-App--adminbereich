"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "@/app/lib/i18n/context";

interface HistoryItem {
  id: string;
  product_name_snapshot: string;
  quantity: number;
  unit_price_snapshot: number;
  item_note?: string;
  option_values?: string | null;
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
  tax?: number;
  delivery_fee: number;
  total: number;
  payment_method: string;
  payment_status: string;
  created_at: string;
  updated_at: string;
  assigned_driver_id?: string;
  delivered_by?: string | null;
  delivery_address?: string | null;
  items: HistoryItem[];
}

type StatusFilter = "all" | "delivered" | "out_for_delivery" | "cancelled";
type DateFilter   = "all" | "today" | "yesterday" | "custom";

const PAYMENT_STATUS_PILL: Record<string, { bg: string; color: string }> = {
  paid:     { bg: "#f0fdf4", color: "#16a34a" },
  pending:  { bg: "#fefce8", color: "#ca8a04" },
  failed:   { bg: "#fef2f2", color: "#dc2626" },
  refunded: { bg: "#f5f3ff", color: "#7c3aed" },
};

function fmt(n: number | string) {
  return Number(n).toFixed(2);
}

function toLocalDateString(date: Date): string {
  // YYYY-MM-DD in local timezone
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function fmtDate(iso: string, locale: string) {
  const d   = new Date(iso);
  const loc = locale === "de" ? "de-DE" : "en-GB";
  return (
    d.toLocaleDateString(loc, { day: "2-digit", month: "2-digit", year: "numeric" }) +
    " " +
    d.toLocaleTimeString(loc, { hour: "2-digit", minute: "2-digit" })
  );
}

function ExpandedRow({
  order,
  t,
  locale,
}: {
  order: HistoryOrder;
  t: (k: string) => string;
  locale: string;
}) {
  const statusKey =
    order.order_type === "delivery" ? "orderHistory.typeDelivery"
    : order.order_type === "pickup" ? "orderHistory.typePickup"
    : order.order_type;

  return (
    <tr className="hist-expanded-row">
      <td colSpan={10}>
        <div className="hist-expanded">
          <div className="hist-expanded-section">
            <p className="hist-exp-label">{t("orderHistory.expandItems")}</p>
            <div className="hist-items">
              {order.items.length === 0 && <span className="hist-empty-items">—</span>}
              {order.items.map((item) => (
                <div key={item.id} className="hist-item">
                  <span className="hist-item-qty">{item.quantity}×</span>
                  <span className="hist-item-name">{item.product_name_snapshot}</span>
                  {item.item_note && (
                    <span className="hist-item-note">"{item.item_note}"</span>
                  )}
                  <span className="hist-item-price">
                    €{fmt(item.unit_price_snapshot * item.quantity)}
                  </span>
                  {item.option_values && (
                    <span className="hist-option-values">({item.option_values})</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="hist-expanded-section">
            <p className="hist-exp-label">{t("orderHistory.expandBreakdown")}</p>
            <div className="hist-breakdown">
              <div className="hist-brow">
                <span>{t("orderHistory.subtotal")}</span>
                <span>€{fmt(order.subtotal)}</span>
              </div>
              {Number(order.delivery_fee) > 0 && (
                <div className="hist-brow">
                  <span>{t("orderHistory.deliveryFee")}</span>
                  <span>€{fmt(order.delivery_fee)}</span>
                </div>
              )}
              <div className="hist-brow hist-brow-total">
                <span>{t("orderHistory.total")}</span>
                <span>€{fmt(order.total)}</span>
              </div>
              <div className="hist-brow hist-brow-meta">
                <span>{t("orderHistory.payment")}</span>
                <span>
                  {order.payment_method} · {order.payment_status}
                </span>
              </div>
              <div className="hist-brow hist-brow-meta">
                <span>{t("orderHistory.type")}</span>
                <span>{t(statusKey)}</span>
              </div>
            </div>
          </div>

          {(order.customer_email || order.customer_phone || order.delivery_address) && (
            <div className="hist-expanded-section">
              <p className="hist-exp-label">{t("orderHistory.expandContact")}</p>
              {order.customer_email && (
                <p className="hist-contact">{order.customer_email}</p>
              )}
              {order.customer_phone && (
                <p className="hist-contact">{order.customer_phone}</p>
              )}
              {order.delivery_address && (
                <p className="hist-contact">{order.delivery_address}</p>
              )}
            </div>
          )}
        </div>
      </td>
    </tr>
  );
}

export default function OrderHistoryPanel() {
  const { t, locale } = useTranslation();

  const [orders, setOrders]           = useState<HistoryOrder[]>([]);
  const [total, setTotal]             = useState(0);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const [q, setQ]                     = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [dateFilter, setDateFilter]   = useState<DateFilter>("all");
  const [customFrom, setCustomFrom]   = useState("");
  const [customTo, setCustomTo]       = useState("");
  const [expandedId, setExpandedId]   = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const statusPill = (status: string) => {
    const map: Record<string, { label: string; bg: string; color: string }> = {
      delivered:        { label: t("orderHistory.statusDelivered"),        bg: "#f0fdf4", color: "#16a34a" },
      out_for_delivery: { label: t("orderHistory.statusOutForDelivery"),   bg: "#eff6ff", color: "#2563eb" },
      cancelled:        { label: t("orderHistory.statusCancelled"),        bg: "#fef2f2", color: "#dc2626" },
    };
    return map[status] ?? { label: status, bg: "#f1f5f9", color: "#64748b" };
  };

  const fetchHistory = useCallback(
    async (
      query: string,
      status: StatusFilter,
      date: DateFilter,
      from: string,
      to: string,
    ) => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({ q: query, limit: "10000" });

        if (status !== "all") params.set("status", status);

        if (date === "today") {
          const d = toLocalDateString(new Date());
          params.set("date_from", d);
          params.set("date_to", d);
        } else if (date === "yesterday") {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const d = toLocalDateString(yesterday);
          params.set("date_from", d);
          params.set("date_to", d);
        } else if (date === "custom") {
          if (from) params.set("date_from", from);
          if (to)   params.set("date_to", to);
        }

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
        setError(msg);
        setOrders([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(
      () => fetchHistory(q, statusFilter, dateFilter, customFrom, customTo),
      300,
    );
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [q, statusFilter, dateFilter, customFrom, customTo, fetchHistory]);

  const orderCountLabel = (n: number) =>
    `${n} ${n === 1 ? t("orderHistory.orderCount_one") : t("orderHistory.orderCount_other")}`;

  const itemCountLabel = (n: number) =>
    `${n} ${n === 1 ? t("orderHistory.itemCount_one") : t("orderHistory.itemCount_other")}`;

  const orderTypeLabel = (type: string) =>
    type === "delivery" ? t("orderHistory.typeDelivery")
    : type === "pickup" ? t("orderHistory.typePickup")
    : type;

  return (
    <div className="hist-panel">
      {/* ── Toolbar ── */}
      <div className="hist-toolbar">
        <div className="hist-search-wrap">
          <span className="hist-search-icon">🔍</span>
          <input
            className="hist-search"
            placeholder={t("orderHistory.searchPlaceholder")}
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          {q && (
            <button className="hist-search-clear" onClick={() => setQ("")}>
              ✕
            </button>
          )}
        </div>

        <div className="hist-filters">
          {(["all", "delivered", "out_for_delivery", "cancelled"] as StatusFilter[]).map((s) => (
            <button
              key={s}
              className={`hist-filter-btn ${statusFilter === s ? "active" : ""}`}
              onClick={() => setStatusFilter(s)}
            >
              {s === "all"
                ? t("orderHistory.filterAll")
                : s === "delivered"
                ? t("orderHistory.filterDelivered")
                : s === "out_for_delivery"
                ? t("orderHistory.filterOutForDelivery")
                : t("orderHistory.filterCancelled")}
            </button>
          ))}
        </div>

        <div className="hist-date-filters">
          {(["all", "today", "yesterday", "custom"] as DateFilter[]).map((d) => (
            <button
              key={d}
              className={`hist-filter-btn ${dateFilter === d ? "active" : ""}`}
              onClick={() => setDateFilter(d)}
            >
              {d === "all"
                ? t("orderHistory.dateAll")
                : d === "today"
                ? t("orderHistory.dateToday")
                : d === "yesterday"
                ? t("orderHistory.dateYesterday")
                : t("orderHistory.dateCustom")}
            </button>
          ))}
        </div>

        {dateFilter === "custom" && (
          <div className="hist-date-range">
            <input
              type="date"
              className="hist-date-input"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
            />
            <span className="hist-date-sep">→</span>
            <input
              type="date"
              className="hist-date-input"
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
            />
          </div>
        )}

        <div className="hist-meta">
          {loading ? (
            <span className="hist-loading">{t("orderHistory.loading")}</span>
          ) : (
            <span className="hist-count">{orderCountLabel(total)}</span>
          )}
        </div>
      </div>

      {/* ── Table ── */}
      <div className="hist-table-wrap">
        <table className="hist-table">
          <thead>
            <tr>
              <th></th>
              <th>{t("orderHistory.colNumber")}</th>
              <th>{t("orderHistory.colDate")}</th>
              <th>{t("orderHistory.colCustomer")}</th>
              <th>{t("orderHistory.colPayment")}</th>
              <th>{t("orderHistory.colItems")}</th>
              <th>{t("orderHistory.colTotal")}</th>
              <th>{t("orderHistory.colPayment")}</th>
              <th>{t("orderHistory.colStatus")}</th>
              <th>{t("orderHistory.colDeliveredBy")}</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={10} className="hist-empty">
                  <div className="hist-empty-inner">
                    <span className="hist-empty-icon">⏳</span>
                    <span>{t("orderHistory.loading")}</span>
                  </div>
                </td>
              </tr>
            )}
            {!loading && error && (
              <tr>
                <td colSpan={10} className="hist-empty">
                  <div className="hist-empty-inner hist-empty-error">
                    <span className="hist-empty-icon">⚠️</span>
                    <span className="hist-err-title">{t("orderHistory.errorTitle")}</span>
                    <span className="hist-err-detail">{error}</span>
                    <button
                      className="hist-retry-btn"
                      onClick={() =>
                        fetchHistory(q, statusFilter, dateFilter, customFrom, customTo)
                      }
                    >
                      {t("orderHistory.retry")}
                    </button>
                  </div>
                </td>
              </tr>
            )}
            {!loading && !error && orders.length === 0 && (
              <tr>
                <td colSpan={10} className="hist-empty">
                  <div className="hist-empty-inner">
                    <span className="hist-empty-icon">📭</span>
                    <span>{t("orderHistory.noOrders")}</span>
                    {(statusFilter !== "all" || dateFilter !== "all") && (
                      <span className="hist-err-detail">
                        {t("orderHistory.noOrdersFilterHint")}
                      </span>
                    )}
                  </div>
                </td>
              </tr>
            )}
            {!loading &&
              !error &&
              orders.map((order) => {
                const isExpanded = expandedId === order.id;
                const sp = statusPill(order.status);
                const pp =
                  PAYMENT_STATUS_PILL[order.payment_status] ?? {
                    bg: "#f1f5f9",
                    color: "#64748b",
                  };
                return [
                  <tr
                    key={order.id}
                    className={`hist-row ${isExpanded ? "expanded" : ""}`}
                    onClick={() => setExpandedId(isExpanded ? null : order.id)}
                  >
                    <td className="hist-chevron">{isExpanded ? "▾" : "▸"}</td>
                    <td className="hist-ordernr">#{order.order_number}</td>
                    <td className="hist-date">{fmtDate(order.created_at, locale)}</td>
                    <td className="hist-customer">
                      {order.customer_name ?? (
                        <span className="hist-anon">{t("orderHistory.guest")}</span>
                      )}
                    </td>
                   <td className="hist-type">
  <span className="hist-type-badge">
{t(`orderHistory.paymentMethod_${order.payment_method}`) !== `orderHistory.paymentMethod_${order.payment_method}`
  ? t(`orderHistory.paymentMethod_${order.payment_method}`)
  : order.payment_method.replace(/_/g, " ")}
  </span>
</td>
                    <td className="hist-itemcount">
                      {itemCountLabel(order.items.length)}
                    </td>
                    <td className="hist-total">€{fmt(order.total)}</td>
                    <td>
                      <span
                        className="hist-pill"
                        style={{ background: pp.bg, color: pp.color }}
                      >
                        {order.payment_status}
                      </span>
                    </td>
                    <td>
                      <span
                        className="hist-pill"
                        style={{ background: sp.bg, color: sp.color }}
                      >
                        {sp.label}
                      </span>
                    </td>
                    <td className="hist-delivered-by">
                      {order.status === "delivered" ? (
                        <span>{order.delivered_by ?? t("orderHistory.notDelivered")}</span>
                      ) : (
                        <span>{t("orderHistory.notDelivered")}</span>
                      )}
                    </td>
                  </tr>,
                  isExpanded && (
                    <ExpandedRow
                      key={`${order.id}-exp`}
                      order={order}
                      t={t}
                      locale={locale}
                    />
                  ),
                ];
              })}
          </tbody>
        </table>
      </div>

      <style>{`
        .hist-panel {
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          height: calc(100vh - 68px);
          overflow: hidden;
        }
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
        .hist-filters { display: flex; gap: 6px; }
        .hist-date-filters { display: flex; gap: 6px; }
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
        .hist-filter-btn.active { background: #0f172a; border-color: #0f172a; color: #fff; }
        .hist-date-range {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 7px 12px;
          border: 1.5px solid #6366f1;
          border-radius: 8px;
          background: #fff;
        }
        .hist-date-input {
          border: none;
          outline: none;
          font-size: 13px;
          font-family: 'DM Sans', sans-serif;
          color: #0f172a;
          cursor: pointer;
          background: transparent;
        }
        .hist-date-sep { color: #94a3b8; font-size: 13px; }
        .hist-meta { margin-left: auto; }
        .hist-count { font-size: 13px; font-weight: 600; color: #64748b; }
        .hist-loading { font-size: 13px; color: #94a3b8; font-weight: 600; }
        .hist-table-wrap {
          background: #fff;
          border-radius: 16px;
          border: 1.5px solid #e2e8f0;
          overflow-y: auto;
          overflow-x: auto;
          box-shadow: 0 1px 4px rgba(0,0,0,.05);
          flex: 1;
          min-height: 0;
        }
        .hist-table { width: 100%; border-collapse: collapse; font-size: 13.5px; }
        .hist-table thead tr { background: #f8fafc; border-bottom: 1.5px solid #e2e8f0; }
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
        .hist-row { border-bottom: 1px solid #f1f5f9; cursor: pointer; transition: background .1s; }
        .hist-row:hover { background: #f8fafc; }
        .hist-row.expanded { background: #f8fafc; }
        .hist-row td { padding: 12px 14px; color: #1e293b; vertical-align: middle; }
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
        .hist-item { display: flex; align-items: center; gap: 7px; font-size: 13px; }
        .hist-item-qty { font-weight: 700; color: #6366f1; min-width: 22px; }
        .hist-item-name { color: #1e293b; font-weight: 500; }
        .hist-item-note { color: #94a3b8; font-style: italic; font-size: 12px; }
        .hist-item-price { margin-left: auto; font-weight: 600; color: #475569; }
        .hist-option-values { color: #94a3b8; font-size: 12px; }
        .hist-empty-items { color: #cbd5e1; font-size: 13px; }
        .hist-breakdown { display: flex; flex-direction: column; gap: 4px; }
        .hist-brow { display: flex; justify-content: space-between; gap: 24px; font-size: 13px; color: #64748b; }
        .hist-brow-meta { font-size: 12px; color: #94a3b8; }
        .hist-brow-total {
          font-weight: 700;
          color: #0f172a;
          border-top: 1px solid #e2e8f0;
          margin-top: 4px;
          padding-top: 4px;
        }
        .hist-contact { font-size: 13px; color: #475569; margin-top: 4px; }
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
      `}</style>
    </div>
  );
}