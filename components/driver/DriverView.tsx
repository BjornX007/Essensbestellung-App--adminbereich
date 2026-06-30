"use client";
import { authClient } from "@/app/lib/auth/client";
import { useRouter } from "next/navigation";
import {
  useState,
  useEffect,
  useTransition,
  useMemo,
  useCallback,
} from "react";
import {
  Phone,
  MapPin,
  Navigation,
  CheckCircle2,
  Clock,
  Package,
  Search,
  X,
  ChevronRight,
  Bike,
  Map,
  AlertCircle,
  Filter,
  CircleDot,
  RotateCcw,
  Banknote,
} from "lucide-react";
import {
  getDriverOrders,
  markDelivered,
  markOutForDelivery,
  DriverOrder,
  markCashDeposited,
} from "@/app/api/driver/actions";

/* ─── types ───────────────────────────────────────────────── */

type DoneFilter = "today" | "3days" | "week" | "month";

/* ─── helpers ─────────────────────────────────────────────── */

function buildMapsUrl(orders: DriverOrder[]): string {
  const active = orders.filter(
    (o) => o.status === "ready" || o.status === "out_for_delivery"
  );
  if (active.length === 0) return "";
  const waypoints = active
    .slice(0, -1)
    .map((o) => {
      const a = o.delivery_address;
      if (!a) return "";
      return encodeURIComponent(
        `${a.street} ${a.house_number}, ${a.postal_code} ${a.city}`
      );
    })
    .filter(Boolean)
    .join("|");
  const last = active[active.length - 1].delivery_address;
  const dest = last
    ? encodeURIComponent(
        `${last.street} ${last.house_number}, ${last.postal_code} ${last.city}`
      )
    : "";
  if (!dest) return "";
  const base = `https://www.google.com/maps/dir/?api=1&travelmode=driving&destination=${dest}`;
  return waypoints ? `${base}&waypoints=${waypoints}` : base;
}

function fmt(iso: string) {
  return new Date(iso).toLocaleTimeString("de-DE", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function elapsedLabel(iso: string) {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 60) return `vor ${mins} Min.`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `vor ${h} Std. ${m} Min.` : `vor ${h} Std.`;
}

function filterDone(orders: DriverOrder[], filter: DoneFilter): DriverOrder[] {
  const now = Date.now();
  const cutoff: Record<DoneFilter, number> = {
    today: new Date().setHours(0, 0, 0, 0),
    "3days": now - 3 * 24 * 60 * 60 * 1000,
    week: now - 7 * 24 * 60 * 60 * 1000,
    month: now - 30 * 24 * 60 * 60 * 1000,
  };
  return orders.filter(
    (o) =>
      o.status === "delivered" &&
      new Date(o.created_at).getTime() >= cutoff[filter]
  );
}
/* ─── primitives ──────────────────────────────────────────── */

function Spinner({ size = 16, light = false }: { size?: number; light?: boolean }) {
  return (
    <span
      style={{
        width: size,
        height: size,
        border: `2px solid ${light ? "rgba(255,255,255,.3)" : "rgba(0,0,0,.1)"}`,
        borderTopColor: light ? "#fff" : "#334155",
        borderRadius: "50%",
        display: "inline-block",
        animation: "drv-spin .65s linear infinite",
        flexShrink: 0,
      }}
    />
  );
}

function StatusPill({ status }: { status: DriverOrder["status"] }) {
  const configs = {
    ready: {
      bg: "#fff4e6",
      color: "#c2410c",
      border: "#fed7aa",
      dot: "#f97316",
      label: "Bereit",
      pulse: false,
    },
    out_for_delivery: {
      bg: "#eff6ff",
      color: "#1d4ed8",
      border: "#bfdbfe",
      dot: "#3b82f6",
      label: "Unterwegs",
      pulse: true,
    },
    delivered: {
      bg: "#f0fdf4",
      color: "#15803d",
      border: "#86efac",
      dot: "#22c55e",
      label: "Geliefert",
      pulse: false,
    },
  } as const;

  const c = configs[status as keyof typeof configs];
  if (!c) return null;

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        background: c.bg,
        color: c.color,
        border: `1px solid ${c.border}`,
        fontSize: 11,
        fontWeight: 700,
        padding: "3px 9px",
        borderRadius: 99,
        letterSpacing: 0.1,
        flexShrink: 0,
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          background: c.dot,
          borderRadius: "50%",
          display: "inline-block",
          animation: c.pulse ? "drv-pulse 1.4s ease-in-out infinite" : "none",
        }}
      />
      {c.label}
    </span>
  );
}

/* ─── order card ──────────────────────────────────────────── */

interface CardProps {
  order: DriverOrder;
  index?: number;
  onDeliver: (id: string) => void;
  onDispatch: (id: string) => void;
  pending: boolean;
}

function OrderCard({ order, index, onDeliver, onDispatch, pending }: CardProps) {
  const addr = order.delivery_address;
  const mapsAddr = addr
    ? `https://maps.google.com/?q=${encodeURIComponent(
        `${addr.street} ${addr.house_number}, ${addr.postal_code} ${addr.city}`
      )}`
    : null;

  const isReady = order.status === "ready";
  const isOtd = order.status === "out_for_delivery";
  const isDone = order.status === "delivered";

  return (
    <div
      className="drv-card"
      style={{
        background: isDone ? "#fafafa" : "#fff",
        border: `1.5px solid ${
          isDone ? "#e8ecf2" : isOtd ? "#bfdbfe" : "#e8ecf2"
        }`,
        borderRadius: 16,
        overflow: "hidden",
        opacity: isDone ? 0.72 : 1,
      }}
    >
      {/* header */}
      <div
        style={{
          padding: "13px 15px 11px",
          borderBottom: "1px solid #f1f5f9",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 10,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {index !== undefined && (
              <span
                style={{
                  background: "#0f172a",
                  color: "#fff",
                  fontSize: 10,
                  fontWeight: 800,
                  padding: "2px 7px",
                  borderRadius: 6,
                  letterSpacing: 0.2,
                  flexShrink: 0,
                }}
              >
                {index + 1}
              </span>
            )}
            <span
              style={{
                fontFamily: "'Sora', system-ui, sans-serif",
                fontSize: 22,
                fontWeight: 900,
                color: "#0f172a",
                letterSpacing: -1,
                lineHeight: 1,
              }}
            >
              #{order.order_number}
            </span>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              color: "#64748b",
              fontSize: 12,
              fontWeight: 500,
            }}
          >
            <Clock size={11} strokeWidth={2.2} />
            <span>{fmt(order.created_at)}</span>
            <span style={{ color: "#cbd5e1" }}>·</span>
            <span style={{ color: "#94a3b8" }}>{elapsedLabel(order.created_at)}</span>
            {order.customer_name && (
              <>
                <span style={{ color: "#cbd5e1" }}>·</span>
                <span style={{ color: "#475569", fontWeight: 600 }}>
                  {order.customer_name}
                </span>
              </>
            )}
          </div>
        </div>
        <StatusPill status={order.status} />
      </div>

      {/* contact + address */}
      <div
        style={{
          padding: "10px 15px",
          borderBottom: "1px solid #f1f5f9",
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        {order.customer_phone && (
          <a
            href={`tel:${order.customer_phone}`}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 9,
              textDecoration: "none",
            }}
          >
            <span
              style={{
                width: 28,
                height: 28,
                background: "#f1f5f9",
                borderRadius: 8,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Phone size={13} color="#334155" strokeWidth={2.2} />
            </span>
            <span
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "#1d4ed8",
                letterSpacing: 0.1,
              }}
            >
              {order.customer_phone}
            </span>
          </a>
        )}
        {addr && (
          <a
            href={mapsAddr ?? "#"}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 9,
              textDecoration: "none",
            }}
          >
            <span
              style={{
                width: 28,
                height: 28,
                background: "#f1f5f9",
                borderRadius: 8,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                marginTop: 1,
              }}
            >
              <MapPin size={13} color="#334155" strokeWidth={2.2} />
            </span>
            <span
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: mapsAddr ? "#1e40af" : "#475569",
                lineHeight: 1.45,
                borderBottom: mapsAddr ? "1px dashed #93c5fd" : "none",
              }}
            >
              {addr.street} {addr.house_number}, {addr.postal_code} {addr.city}
            </span>
          </a>
        )}
      </div>

      {/* items */}
      <div
        style={{
          padding: "10px 15px",
          borderBottom: "1px solid #f1f5f9",
          display: "flex",
          flexDirection: "column",
          gap: 5,
        }}
      >
        {order.items.map((item: { id: string; quantity: number; product_name_snapshot: string }) => (
          <div
            key={item.id}
            style={{ display: "flex", alignItems: "baseline", gap: 7 }}
          >
            <span
              style={{
                fontSize: 12,
                fontWeight: 900,
                color: "#6366f1",
                minWidth: 22,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {item.quantity}×
            </span>
            <span
              style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}
            >
              {item.product_name_snapshot}
            </span>
          </div>
        ))}
      </div>

      {/* customer note */}
      {order.customer_note && (
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 8,
            margin: "8px 15px 0",
            padding: "8px 10px",
            background: "#fffbeb",
            border: "1px solid #fde68a",
            borderRadius: 8,
            fontSize: 12,
            color: "#92400e",
            lineHeight: 1.4,
            fontWeight: 500,
          }}
        >
          <AlertCircle
            size={13}
            color="#d97706"
            strokeWidth={2.2}
            style={{ flexShrink: 0, marginTop: 1 }}
          />
          <span>{order.customer_note}</span>
        </div>
      )}

      {/* footer */}
      {!isDone ? (
        <div
          style={{
            padding: "12px 15px 14px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
            <span
              style={{
                fontFamily: "'Sora', system-ui, sans-serif",
                fontSize: 20,
                fontWeight: 900,
                color: "#0f172a",
                letterSpacing: -0.5,
              }}
            >
              €{Number(order.total).toFixed(2)}
            </span>
           {order.payment_method === "cash_on_delivery" ? (
  <span style={{
    fontSize: 11, fontWeight: 800, padding: "2px 8px", borderRadius: 6,
    background: "#fef08a", color: "#854d0e", border: "1px solid #fde047",
    letterSpacing: 0.1,
  }}>
    BARGELD KASSIEREN
  </span>
) : (
  <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 500 }}>
    {order.payment_method === "card" ? "Karte" : "PayPal"}
  </span>
)}
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {order.customer_phone && (
              <a
                href={`tel:${order.customer_phone}`}
                style={{
                  width: 40,
                  height: 40,
                  background: "#f1f5f9",
                  borderRadius: 10,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  textDecoration: "none",
                  flexShrink: 0,
                }}
              >
                <Phone size={15} color="#334155" strokeWidth={2.2} />
              </a>
            )}
            {isReady ? (
              <button
                onClick={() => onDispatch(order.id)}
                disabled={pending}
                style={{
                  background: "#f97316",
                  color: "#fff",
                  border: "none",
                  borderRadius: 10,
                  padding: "0 16px",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: pending ? "not-allowed" : "pointer",
                  opacity: pending ? 0.7 : 1,
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  height: 40,
                  minWidth: 130,
                  boxShadow: "0 3px 10px rgba(249,115,22,.3)",
                  fontFamily: "inherit",
                  letterSpacing: -0.1,
                }}
              >
                {pending ? (
                  <Spinner light />
                ) : (
                  <>
                    <Bike size={15} strokeWidth={2.2} />
                    Losfahren
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={() => onDeliver(order.id)}
                disabled={pending}
                style={{
                  background: "#16a34a",
                  color: "#fff",
                  border: "none",
                  borderRadius: 10,
                  padding: "0 16px",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: pending ? "not-allowed" : "pointer",
                  opacity: pending ? 0.7 : 1,
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  height: 40,
                  minWidth: 130,
                  boxShadow: "0 3px 10px rgba(22,163,74,.28)",
                  fontFamily: "inherit",
                  letterSpacing: -0.1,
                }}
              >
                {pending ? (
                  <Spinner light />
                ) : (
                  <>
                    <CheckCircle2 size={15} strokeWidth={2.2} />
                    Zugestellt
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      ) : (
        <div style={{ padding: "10px 15px 13px" }}>
          <span
            style={{
              fontFamily: "'Sora', system-ui, sans-serif",
              fontSize: 19,
              fontWeight: 900,
              color: "#94a3b8",
              letterSpacing: -0.5,
            }}
          >
            €{Number(order.total).toFixed(2)}
          </span>
        </div>
      )}
    </div>
  );
}

/* ─── done filter bar ─────────────────────────────────────── */

const DONE_FILTERS: { key: DoneFilter; label: string }[] = [
  { key: "today", label: "Heute" },
  { key: "3days", label: "3 Tage" },
  { key: "week", label: "7 Tage" },
  { key: "month", label: "30 Tage" },
];

function DoneFilterBar({
  active,
  onChange,
  counts,
}: {
  active: DoneFilter;
  onChange: (f: DoneFilter) => void;
  counts: Record<DoneFilter, number>;
}) {
  return (
    <div
      style={{
        display: "flex",
        gap: 6,
        padding: "12px 14px 0",
        overflowX: "auto",
        flexShrink: 0,
      }}
    >
      {DONE_FILTERS.map((f) => {
        const isActive = f.key === active;
        return (
          <button
            key={f.key}
            onClick={() => onChange(f.key)}
            style={{
              flexShrink: 0,
              background: isActive ? "#0f172a" : "#fff",
              color: isActive ? "#fff" : "#64748b",
              border: `1.5px solid ${isActive ? "#0f172a" : "#e2e8f0"}`,
              borderRadius: 99,
              padding: "6px 13px",
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 5,
              transition: "all .15s",
              fontFamily: "inherit",
              letterSpacing: -0.1,
            }}
          >
            {f.label}
            {counts[f.key] > 0 && (
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  background: isActive
                    ? "rgba(255,255,255,.18)"
                    : "#f1f5f9",
                  color: isActive ? "#fff" : "#64748b",
                  padding: "1px 6px",
                  borderRadius: 99,
                  lineHeight: 1.5,
                }}
              >
                {counts[f.key]}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/* ─── summary bar (active tab) ────────────────────────────── */

function SummaryBar({ orders }: { orders: DriverOrder[] }) {
  const total = orders.reduce((s, o) => s + Number(o.total), 0);
  const otd = orders.filter((o) => o.status === "out_for_delivery").length;
  const ready = orders.filter((o) => o.status === "ready").length;

  return (
    <div
      style={{
        display: "flex",
        gap: 8,
        padding: "10px 14px 0",
        flexShrink: 0,
      }}
    >
      {[
        {
          label: "Bereit",
          value: String(ready),
          color: "#f97316",
          bg: "#fff4e6",
        },
        {
          label: "Unterwegs",
          value: String(otd),
          color: "#1d4ed8",
          bg: "#eff6ff",
        },
        {
          label: "Gesamt",
          value: `€${total.toFixed(2)}`,
          color: "#0f172a",
          bg: "#f8fafc",
        },
      ].map((s) => (
        <div
          key={s.label}
          style={{
            flex: 1,
            background: s.bg,
            borderRadius: 10,
            padding: "8px 10px",
            display: "flex",
            flexDirection: "column",
            gap: 2,
          }}
        >
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: "#94a3b8",
              textTransform: "uppercase",
              letterSpacing: 0.5,
            }}
          >
            {s.label}
          </span>
          <span
            style={{
              fontSize: 16,
              fontWeight: 900,
              color: s.color,
              fontFamily: "'Sora', system-ui, sans-serif",
              letterSpacing: -0.5,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {s.value}
          </span>
        </div>
      ))}
    </div>
  );
}

//cashpannel
function CashPanel({ orders, onReset }: { orders: DriverOrder[]; onReset: () => void }): import("react/jsx-runtime").JSX.Element {
  const [resetting, setResetting] = useState(false);
  const [resetDone, setResetDone] = useState(false);

 const cashOrders = orders.filter(
  (o) =>
    o.payment_method === "cash_on_delivery" &&
    o.status === "delivered" &&
    o.payment_status !== "paid"   // ← only unpaid
);
  const total = cashOrders.reduce((s, o) => s + Number(o.total), 0);

  async function handleReset() {
    setResetting(true);
    await onReset();
    setResetDone(true);
    setResetting(false);
    setTimeout(() => setResetDone(false), 3000);
  }

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "14px 14px 0" }}>
      {/* Total banner */}
      <div style={{ background: total > 0 ? "#fef08a" : "#f1f5f9", border: `1.5px solid ${total > 0 ? "#fde047" : "#e2e8f0"}`, borderRadius: 14, padding: "16px 18px", marginBottom: 14, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 4 }}>Zu übergeben</div>
          <div style={{ fontFamily: "'Sora', system-ui, sans-serif", fontSize: 32, fontWeight: 900, color: total > 0 ? "#854d0e" : "#94a3b8", letterSpacing: -1, fontVariantNumeric: "tabular-nums" }}>
            €{total.toFixed(2)}
          </div>
        </div>
        <button
          onClick={handleReset}
          disabled={resetting || total === 0}
          style={{ background: total > 0 ? "#0f172a" : "#e2e8f0", color: total > 0 ? "#fff" : "#94a3b8", border: "none", borderRadius: 10, padding: "10px 16px", fontSize: 13, fontWeight: 700, cursor: total > 0 && !resetting ? "pointer" : "not-allowed", display: "flex", alignItems: "center", gap: 6, fontFamily: "inherit" }}
        >
          {resetting ? <Spinner /> : resetDone ? "✓ Erledigt" : "Übergeben"}
        </button>
      </div>

      {/* Orders table */}
      {cashOrders.length === 0 ? (
        <div style={{ textAlign: "center", paddingTop: 48 }}>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#334155" }}>Keine Barauszahlungen heute</p>
          <p style={{ margin: 0, fontSize: 13, color: "#94a3b8", marginTop: 6 }}>Abgeschlossene Bargeldbestellungen erscheinen hier</p>
        </div>
      ) : (
        <div style={{ background: "#fff", borderRadius: 12, overflow: "hidden", border: "1px solid #e8ecf0" }}>
          {cashOrders.map((o, i) => (
            <div key={o.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 15px", borderBottom: i < cashOrders.length - 1 ? "1px solid #f1f5f9" : "none" }}>
              <span style={{ fontFamily: "'Sora', system-ui, sans-serif", fontSize: 14, fontWeight: 800, color: "#0f172a" }}>#{o.order_number}</span>
              <span style={{ fontFamily: "'Sora', system-ui, sans-serif", fontSize: 15, fontWeight: 900, color: "#854d0e", fontVariantNumeric: "tabular-nums" }}>€{Number(o.total).toFixed(2)}</span>
            </div>
          ))}
          {/* Total row */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 15px", background: "#f8fafc", borderTop: "2px solid #e8ecf0" }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#64748b" }}>Gesamt ({cashOrders.length})</span>
            <span style={{ fontFamily: "'Sora', system-ui, sans-serif", fontSize: 17, fontWeight: 900, color: "#0f172a", fontVariantNumeric: "tabular-nums" }}>€{total.toFixed(2)}</span>
          </div>
        </div>
      )}
      <div style={{ height: 20 }} />
    </div>
  );
}
/* ─── main driver view ────────────────────────────────────── */

type Tab = "active" | "done" | "cash";

export default function DriverView() {
  const { data: session } = authClient.useSession();
  const router = useRouter();
  const driverName = session?.user?.name ?? session?.user?.email ?? "Fahrer";
  const [orders, setOrders] = useState<DriverOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("active");
  const [search, setSearch] = useState("");
  const [doneFilter, setDoneFilter] = useState<DoneFilter>("today");
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const [, startTransition] = useTransition();

  const load = useCallback(async () => {
    try {
      const data = await getDriverOrders();
      setOrders(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 20_000);
    return () => clearInterval(id);
  }, [load]);

  const active = useMemo(
    () =>
      orders.filter(
        (o) =>
          (o.status === "ready" || o.status === "out_for_delivery") &&
          (!search || String(o.order_number).includes(search.trim()))
      ),
    [orders, search]
  );

  const doneOrders = useMemo(
    () =>
      filterDone(orders, doneFilter).filter(
        (o) =>
          !search || String(o.order_number).includes(search.trim())
      ),
    [orders, doneFilter, search]
  );

  const doneCounts = useMemo(
    () =>
      Object.fromEntries(
        DONE_FILTERS.map((f) => [f.key, filterDone(orders, f.key).length])
      ) as Record<DoneFilter, number>,
    [orders]
  );

  const mapsUrl = useMemo(() => buildMapsUrl(orders), [orders]);

  const handleDispatch = useCallback(
    (id: string) => {
      setPendingIds((s) => new Set(s).add(id));
      startTransition(async () => {
        await markOutForDelivery(id);
        await load();
        setPendingIds((s) => {
          const n = new Set(s);
          n.delete(id);
          return n;
        });
      });
    },
    [load]
  );

  const handleDeliver = useCallback(
    (id: string) => {
      setPendingIds((s) => new Set(s).add(id));
      startTransition(async () => {
        await markDelivered(id);
        await load();
        setPendingIds((s) => {
          const n = new Set(s);
          n.delete(id);
          return n;
        });
      });
    },
    [load]
  );
const handleCashReset = useCallback(async () => {
  // marks all delivered cash orders as paid for this driver
  await markCashDeposited();
  await load();
}, [load]);
  const currentList = tab === "active" ? active : doneOrders;
function UserMenu({ name }: { name: string }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const initials = name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "?";

  const handleSignOut = async () => {
    await authClient.signOut();
    router.push("/auth/sign-in");
  };

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          background: "#f1f5f9", border: "none", borderRadius: 99,
          display: "flex", alignItems: "center", gap: 7,
          padding: "5px 10px 5px 5px", cursor: "pointer",
        }}
      >
        <div style={{
          width: 28, height: 28, borderRadius: "50%",
          background: "#0f172a", color: "#fff",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 11, fontWeight: 800,
        }}>
          {initials}
        </div>
        <span style={{ fontSize: 12, fontWeight: 700, color: "#334155" }}>
          {name.split(" ")[0]}
        </span>
      </button>

      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 50 }} />
          <div style={{
            position: "absolute", top: "calc(100% + 8px)", right: 0,
            background: "#fff", border: "1px solid #e8ecf0",
            borderRadius: 12, padding: 6, zIndex: 100,
            boxShadow: "0 8px 24px rgba(0,0,0,.10)",
            minWidth: 160,
          }}>
            <div style={{ padding: "8px 12px 10px", borderBottom: "1px solid #f1f5f9", marginBottom: 4 }}>
              <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: "#0f172a" }}>{name}</p>
              <p style={{ margin: 0, fontSize: 11, color: "#94a3b8" }}>Fahrer</p>
            </div>
            <button
              onClick={handleSignOut}
              style={{
                width: "100%", display: "flex", alignItems: "center", gap: 9,
                padding: "9px 12px", background: "none", border: "none",
                borderRadius: 8, cursor: "pointer", color: "#dc2626",
                fontSize: 13, fontWeight: 600, fontFamily: "inherit",
              }}
            >
              Abmelden
            </button>
          </div>
        </>
      )}
    </div>
  );
}
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800;900&display=swap');
        @keyframes drv-spin    { to { transform: rotate(360deg); } }
        @keyframes drv-pulse   { 0%,100%{opacity:1} 50%{opacity:.3} }
        @keyframes drv-card-in { from{opacity:0;transform:translateY(5px)} to{opacity:1;transform:none} }
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        body { margin: 0; background: #f4f6f9; }
        .drv-card { animation: drv-card-in .2s ease both; }
        .drv-tab-btn:active { opacity: .7; }
        .drv-filter-scroll { scrollbar-width: none; }
        .drv-filter-scroll::-webkit-scrollbar { display: none; }
        .drv-scroll::-webkit-scrollbar { width: 3px; }
        .drv-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 2px; }
      `}</style>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          height: "100dvh",
          maxWidth: 480,
          margin: "0 auto",
          background: "#f4f6f9",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        {/* ── header ── */}
        <div
          style={{
            background: "#fff",
            borderBottom: "1px solid #eef0f3",
            padding: "14px 15px 12px",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 12,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
              <div
                style={{
                  width: 34,
                  height: 34,
                  background: "#0f172a",
                  borderRadius: 10,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Bike size={17} color="#fff" strokeWidth={2} />
              </div>
              <span
                style={{
                  fontFamily: "'Sora', system-ui, sans-serif",
                  fontSize: 18,
                  fontWeight: 900,
                  color: "#0f172a",
                  letterSpacing: -0.5,
                }}
              >
                Lieferungen
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {loading && <Spinner size={13} />}
              <button
                onClick={load}
                style={{
                  background: "#f1f5f9",
                  border: "none",
                  borderRadius: 8,
                  width: 32,
                  height: 32,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
                title="Aktualisieren"
              >
                <RotateCcw size={13} color="#64748b" strokeWidth={2.2} />
              </button>
              {active.length > 0 && (
               
               <span
                  style={{
                    background: "#fff4e6",
                    color: "#c2410c",
                    border: "1px solid #fed7aa",
                    fontSize: 12,
                    fontWeight: 700,
                    padding: "3px 10px",
                    borderRadius: 99,
                    letterSpacing: -0.1,
                  }}
                >
                               {active.length} bestellung
               
                </span>
              )}
             
                <UserMenu name={driverName} />
             
             </div>
          </div>

          {/* search */}
          <div
            style={{
              background: "#f1f5f9",
              borderRadius: 11,
              padding: "9px 12px",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Search size={14} color="#94a3b8" strokeWidth={2.2} />
            <input
              type="number"
              inputMode="numeric"
              placeholder="Bestellnummer suchen…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                border: "none",
                background: "transparent",
                outline: "none",
                fontSize: 14,
                color: "#334155",
                width: "100%",
                fontFamily: "inherit",
              }}
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                style={{
                  border: "none",
                  background: "none",
                  cursor: "pointer",
                  padding: 0,
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <X size={14} color="#94a3b8" strokeWidth={2.5} />
              </button>
            )}
          </div>
        </div>

        {/* ── summary (active only) ── */}
        {tab === "active" && orders.length > 0 && (
          <SummaryBar orders={orders} />
        )}

        {/* ── done filters ── */}
        {tab === "done" && (
          <DoneFilterBar
            active={doneFilter}
            onChange={setDoneFilter}
            counts={doneCounts}
          />
        )}

        {/* ── maps button ── */}
        {tab === "active" && mapsUrl && active.length > 0 && (
          <div style={{ padding: "10px 14px 0", flexShrink: 0 }}>
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                background: "#1d4ed8",
                color: "#fff",
                borderRadius: 12,
                padding: "11px 16px",
                fontSize: 13,
                fontWeight: 700,
                textDecoration: "none",
                boxShadow: "0 3px 12px rgba(29,78,216,.25)",
              }}
            >
              <Navigation size={14} strokeWidth={2.2} />
              {active.length > 1
                ? `Route öffnen · ${active.length} Stopps`
                : "Zur Lieferadresse navigieren"}
              <ChevronRight size={14} strokeWidth={2.5} style={{ marginLeft: "auto" }} />
            </a>
          </div>
        )}

        {/* ── section label ── */}
        {currentList.length > 0 && (
          <div
            style={{
              padding: "12px 15px 6px",
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            {tab === "done" ? (
              <Filter size={11} color="#94a3b8" strokeWidth={2.2} />
            ) : (
              <CircleDot size={11} color="#94a3b8" strokeWidth={2.2} />
            )}
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "#94a3b8",
                textTransform: "uppercase",
                letterSpacing: "0.7px",
              }}
            >
              {tab === "active"
                ? `Zu liefern · älteste zuerst`
                : `${doneOrders.length} Bestellung${doneOrders.length !== 1 ? "en" : ""} · ${
                    DONE_FILTERS.find((f) => f.key === doneFilter)?.label
                  }`}
            </span>
          </div>
        )}

        {/* ── content ── */}
        {tab === "cash" ? (
  <CashPanel orders={orders} onReset={handleCashReset} />
) : (
  <div
    className="drv-scroll"
    style={{ flex: 1, overflowY: "auto", padding: "4px 14px 0" }}
  >
    {!loading && currentList.length === 0 && (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          paddingTop: 72,
          gap: 10,
          textAlign: "center",
        }}
      >
        {tab === "active" ? (
          <Package size={44} color="#cbd5e1" strokeWidth={1.2} />
        ) : (
          <CheckCircle2 size={44} color="#cbd5e1" strokeWidth={1.2} />
        )}
        <p
          style={{
            margin: 0,
            fontSize: 15,
            fontWeight: 700,
            color: "#334155",
          }}
        >
          {tab === "active"
            ? search
              ? "Keine Treffer"
              : "Keine aktiven Lieferungen"
            : search
            ? "Keine Treffer"
            : "Keine abgeschlossenen Lieferungen"}
        </p>
        <p
          style={{
            margin: 0,
            fontSize: 13,
            color: "#94a3b8",
            lineHeight: 1.5,
            maxWidth: 240,
          }}
        >
          {tab === "active"
            ? search
              ? "Andere Bestellnummer versuchen"
              : "Bestellungen erscheinen hier, sobald sie bereit sind"
            : search
            ? "Andere Bestellnummer versuchen"
            : "Abgeschlossene Lieferungen erscheinen hier"}
        </p>
      </div>
    )}

    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {currentList.map((order, i) => (
        <OrderCard
          key={order.id}
          order={order}
          index={tab === "active" ? i : undefined}
          onDeliver={handleDeliver}
          onDispatch={handleDispatch}
          pending={pendingIds.has(order.id)}
        />
      ))}
    </div>

    <div style={{ height: 20 }} />
  </div>
)}
        {/* ── bottom tab bar ── */}
        <div
          style={{
            background: "#fff",
            borderTop: "1px solid #e8ecf2",
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            flexShrink: 0,
            paddingBottom: "env(safe-area-inset-bottom, 0px)",
          }}
        >
          {(
           [
  { key: "active" as Tab, label: "Liefern", icon: <Bike size={20} strokeWidth={2} />, count: active.length },
  { key: "done" as Tab, label: "Abgeschlossen", icon: <Map size={20} strokeWidth={2} />, count: doneCounts.today },
  { key: "cash" as Tab, label: "Kasse", icon: <Banknote size={20} strokeWidth={2} />, count: 0 },
] as const
          ).map(({ key, label, icon, count }) => {
            const isActive = tab === key;
            return (
              <button
                key={key}
                className="drv-tab-btn"
                onClick={() => setTab(key)}
                style={{
                  background: "none",
                  border: "none",
                  padding: "10px 8px 13px",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 4,
                  color: isActive ? "#0f172a" : "#94a3b8",
                  fontFamily: "system-ui, sans-serif",
                  transition: "color .15s",
                  position: "relative",
                  borderTop: isActive
                    ? "2.5px solid #0f172a"
                    : "2.5px solid transparent",
                }}
              >
                {icon}
                <span style={{ fontSize: 11, fontWeight: 700 }}>{label}</span>
                {count > 0 && (
                  <span
                    style={{
                      position: "absolute",
                      top: 6,
                      right: "calc(50% - 18px)",
                      width: 16,
                      height: 16,
                      background: isActive ? "#0f172a" : "#e2e8f0",
                      color: isActive ? "#fff" : "#64748b",
                      borderRadius: "50%",
                      fontSize: 9,
                      fontWeight: 800,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {count > 9 ? "9+" : count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}


