"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { KitchenOrder, KitchenStage, STAGE_STATUSES } from "@/app/(frontend)/orders/types";
import { useTranslation } from "@/app/lib/i18n/context";
import KitchenDisplay from "@/components/orders/KitchenDisplay";
import DispatchGrid from "@/components/orders/DispatchGrid";
import OrderHistoryPanel from "@/components/orders/OrderHistoryPanel";

const POLL_MS = 5000;

// ─── Toast ────────────────────────────────────────────────────────────────
interface Toast { id: string; message: string; type: "new" | "info" | "error"; }

function ToastStack({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: string) => void }) {
  return (
    <div style={{ position: "fixed", bottom: 24, right: 24, display: "flex", flexDirection: "column", gap: 8, zIndex: 999 }}>
      {toasts.map((toast) => (
        <div
          key={toast.id}
          onClick={() => onDismiss(toast.id)}
          style={{
            display: "flex", alignItems: "center", gap: 10,
            background: toast.type === "error" ? "#7f1d1d" : toast.type === "new" ? "#0f172a" : "#1e3a5f",
            color: "#fff", borderRadius: 12, padding: "12px 18px", cursor: "pointer",
            maxWidth: 320, boxShadow: "0 8px 28px rgba(0,0,0,.2)", animation: "toastIn .28s ease",
          }}
        >
          <span style={{ fontSize: 18, flexShrink: 0 }}>{toast.type === "new" ? "🔔" : toast.type === "error" ? "⚠️" : "ℹ️"}</span>
          <span style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.35 }}>{toast.message}</span>
        </div>
      ))}
      <style>{`@keyframes toastIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  );
}

// ─── Topbar ───────────────────────────────────────────────────────────────
type Stage = KitchenStage | "history";

const BADGE_COLORS: Record<KitchenStage, { bg: string; color: string }> = {
  incoming:  { bg: "#fee2e2", color: "#dc2626" },
  preparing: { bg: "#fef3c7", color: "#d97706" },
  dispatch:  { bg: "#dbeafe", color: "#2563eb" },
};

function Topbar({ stage, onChange, counts, initialLoad, clock, lastSynced }: {
  stage: Stage;
  onChange: (s: Stage) => void;
  counts: Record<KitchenStage, number>;
  initialLoad: boolean;
  clock: string;
  lastSynced: Date | null;
}) {
  const { t } = useTranslation();

  const STAGES: { key: Stage; icon: string; label: string }[] = [
    { key: "incoming",  icon: "📥", label: t("navOrders.incoming") },

    { key: "dispatch",  icon: "🛵", label: t("navOrders.dispatch") },
    { key: "history",   icon: "📋", label: t("navOrders.history") },
  ];

  return (
    <header style={{ position: "fixed", top: 0, left: 0, right: 0, height: 68, background: "#fff", borderBottom: "1.5px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", zIndex: 200, boxShadow: "0 1px 6px rgba(0,0,0,.06)" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@500;700;800;900&family=DM+Sans:wght@400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'DM Sans', sans-serif; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
      `}</style>

      {/* Brand */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, boxShadow: "0 2px 8px rgba(99,102,241,.3)" }}>🍴</div>
        <span style={{ fontFamily: "'Sora',sans-serif", fontSize: 17, fontWeight: 800, color: "#0f172a", letterSpacing: -0.5 }}>KitchenOS</span>
      </div>

      {/* Nav */}
      <nav style={{ display: "flex", alignItems: "center", gap: 3, background: "#f1f5f9", borderRadius: 14, padding: 4 }}>
        {STAGES.map((s) => {
          const bc = s.key !== "history" ? BADGE_COLORS[s.key as KitchenStage] : null;
          const count = s.key !== "history" ? counts[s.key as KitchenStage] : 0;
          const isActive = stage === s.key;
          return (
            <button
              key={s.key}
              onClick={() => onChange(s.key)}
              style={{
                display: "flex", alignItems: "center", gap: 7, padding: "8px 18px",
                border: "none", borderRadius: 10, cursor: "pointer",
                fontFamily: "'DM Sans',sans-serif", fontSize: 14, fontWeight: 600,
                background: isActive ? "#fff" : "transparent",
                color: isActive ? "#0f172a" : "#64748b",
                boxShadow: isActive ? "0 1px 6px rgba(0,0,0,.1)" : "none",
                transition: "all .15s",
                ...(s.key === "history" ? { borderLeft: "1px solid #e2e8f0", marginLeft: 4, paddingLeft: 20 } : {}),
              }}
            >
              <span style={{ fontSize: 15 }}>{s.icon}</span>
              <span>{s.label}</span>
              {bc && count > 0 && (
                <span style={{ fontSize: 11, fontWeight: 800, padding: "2px 7px", borderRadius: 999, background: bc.bg, color: bc.color, lineHeight: 1.4 }}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Right */}
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        {/* Only shown once on first load, then replaced by last-synced timestamp */}
        {initialLoad
          ? <span style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600 }}>{t("topbar.syncing")}</span>
          : lastSynced && (
              <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 500 }}>
                {lastSynced.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
              </span>
            )
        }
        <span style={{ fontFamily: "'Sora',monospace", fontSize: 16, fontWeight: 700, color: "#0f172a", letterSpacing: -0.3 }}>{clock}</span>
        <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 12px", borderRadius: 999, fontSize: 12, fontWeight: 700, background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#16a34a" }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: "currentColor", animation: "pulse 1.4s ease-in-out infinite", display: "inline-block" }} />
          {t("topbar.live")}
        </div>
      </div>
    </header>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────
export default function KitchenPage() {
  const { t } = useTranslation();

  const [orders, setOrders]           = useState<KitchenOrder[]>([]);
  const [stage, setStage]             = useState<Stage>("incoming");
  const [initialLoad, setInitialLoad] = useState(true);   // true only until first fetch completes
  const [advancing, setAdvancing]     = useState<Set<string>>(new Set());
  const [toasts, setToasts]           = useState<Toast[]>([]);
  const [clock, setClock]             = useState("");
  const [lastSynced, setLastSynced]   = useState<Date | null>(null);

  // Refs — no re-renders needed for these
  const knownIds      = useRef<Set<string>>(new Set());
  const knownStatuses = useRef<Map<string, string>>(new Map());
  const isFetching    = useRef(false); // guard against concurrent requests

  const addToast = useCallback((message: string, type: Toast["type"] = "info") => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((p) => [...p, { id, message, type }]);
    setTimeout(() => setToasts((p) => p.filter((tt) => tt.id !== id)), 5000);
  }, []);

  // Clock — updates every 10s, no heavy re-render
  useEffect(() => {
    const tick = () => setClock(new Date().toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }));
    tick();
    const iv = setInterval(tick, 10000);
    return () => clearInterval(iv);
  }, []);

  // ── Core fetch ───────────────────────────────────────────────────────────
  const fetchOrders = useCallback(async (isBackground: boolean) => {
    if (isFetching.current) return; // skip if already in flight
    isFetching.current = true;

    try {
      const res = await fetch("/api/orders", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const incoming: KitchenOrder[] = data.orders ?? [];

      if (isBackground) {
        // Toast for brand-new order IDs
        for (const o of incoming) {
          if (!knownIds.current.has(o.id)) {
            addToast(
              t("toast.newOrder")
                .replace("{number}", o.order_number)
                .replace("{name}", o.customer_name ?? t("orderCard.guest")),
              "new"
            );
          }
        }

        // Toast for status changes from another session
        for (const o of incoming) {
          const prev = knownStatuses.current.get(o.id);
          if (prev !== undefined && prev !== o.status) {
            addToast(`#${o.order_number} → ${o.status.replace(/_/g, " ")}`, "info");
          }
        }
      }

      // Sync tracking refs
      const incomingIds = new Set(incoming.map((o) => o.id));
      for (const o of incoming) {
        knownIds.current.add(o.id);
        knownStatuses.current.set(o.id, o.status);
      }
      for (const id of [...knownIds.current]) {
        if (!incomingIds.has(id)) {
          knownIds.current.delete(id);
          knownStatuses.current.delete(id);
        }
      }

      setOrders(incoming);
      setLastSynced(new Date());
    } catch (err) {
      console.error("Poll error:", err);
      if (isBackground) addToast(t("toast.loadError"), "error");
    } finally {
      isFetching.current = false;
      // Flip initialLoad exactly once — subsequent polls never touch it
      if (initialLoad) setInitialLoad(false);
    }
  }, [addToast, t, initialLoad]);

  // Initial load
  useEffect(() => { fetchOrders(false); }, [fetchOrders]);

  // Background poll — setInterval never causes re-renders by itself
  useEffect(() => {
    const iv = setInterval(() => fetchOrders(true), POLL_MS);
    return () => clearInterval(iv);
  }, [fetchOrders]);

  // ── Advance status ───────────────────────────────────────────────────────
  const advanceOrder = useCallback(async (orderId: string, currentStatus: KitchenOrder["status"]) => {
    setAdvancing((p) => new Set(p).add(orderId));
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ changed_by: "kitchen_staff" }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error ?? `HTTP ${res.status}`);
      }
      const data = await res.json() as { to_status: KitchenOrder["status"] };

      // Optimistic update — instant UI, confirmed by next poll
      setOrders((prev) =>
        prev.map((o) => o.id === orderId ? { ...o, status: data.to_status, updated_at: new Date().toISOString() } : o)
      );
      knownStatuses.current.set(orderId, data.to_status);

      // Remove terminal orders after a brief visual delay
      if (data.to_status === "delivered" || data.to_status === "cancelled") {
        setTimeout(() => {
          setOrders((prev) => prev.filter((o) => o.id !== orderId));
          knownIds.current.delete(orderId);
          knownStatuses.current.delete(orderId);
        }, 800);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      addToast(t("toast.updateError").replace("{message}", message), "error");
      fetchOrders(false); // re-sync on failure
    } finally {
      setAdvancing((p) => { const next = new Set(p); next.delete(orderId); return next; });
    }
  }, [addToast, fetchOrders, t]);

  // ── Derived ──────────────────────────────────────────────────────────────
  const counts: Record<KitchenStage, number> = {
    incoming:  orders.filter((o) => (STAGE_STATUSES.incoming  as readonly string[]).includes(o.status)).length,
    preparing: orders.filter((o) => (STAGE_STATUSES.preparing as readonly string[]).includes(o.status)).length,
    dispatch:  orders.filter((o) => (STAGE_STATUSES.dispatch  as readonly string[]).includes(o.status)).length,
  };

  const dispatchOrders = orders.filter((o) => (STAGE_STATUSES.dispatch as readonly string[]).includes(o.status));

  return (
    <>
      <Topbar
        stage={stage}
        onChange={setStage}
        counts={counts}
        initialLoad={initialLoad}
        clock={clock}
        lastSynced={lastSynced}
      />

      <main style={{ marginTop: 68, height: "calc(100vh - 68px)", overflow: "hidden", display: "flex", flexDirection: "column", background: "#f1f5f9" }}>
        {stage === "incoming"  && <KitchenDisplay orders={orders} onAdvance={advanceOrder} advancing={advancing} />}
        {stage === "preparing" && <KitchenDisplay orders={orders} onAdvance={advanceOrder} advancing={advancing} />}
        {stage === "dispatch"  && <DispatchGrid   orders={dispatchOrders} onAdvance={advanceOrder} advancing={advancing} />}
        {stage === "history"   && <OrderHistoryPanel />}
      </main>

      <ToastStack toasts={toasts} onDismiss={(id) => setToasts((p) => p.filter((tt) => tt.id !== id))} />
    </>
  );
}