"use client";

import { useEffect, useState, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface DeliverySettings {
  id: number;
  is_accepting: boolean;
  order_time_rule: string;
  allowed_postals: string[];
}

interface DeliveryTier {
  id: number;
  max_distance_km: number;
  min_order_eur: number;
  delivery_fee_eur: number;
  sort_order: number;
}

// ─── Small components ─────────────────────────────────────────────────────────

function Spinner({ size = 16 }: { size?: number }) {
  return (
    <span style={{
      width: size, height: size,
      border: "2px solid rgba(255,255,255,.3)",
      borderTopColor: "#fff", borderRadius: "50%",
      display: "inline-block", animation: "spin .7s linear infinite",
      flexShrink: 0,
    }} />
  );
}

function Toggle({
  checked, onChange, disabled,
}: {
  checked: boolean; onChange: (v: boolean) => void; disabled?: boolean;
}) {
  return (
    <button
      role="switch" aria-checked={checked} disabled={disabled}
      onClick={() => onChange(!checked)}
      style={{
        width: 52, height: 28, borderRadius: 999, border: "none",
        background: checked ? "#22c55e" : "#cbd5e1",
        position: "relative", cursor: disabled ? "not-allowed" : "pointer",
        transition: "background .2s", flexShrink: 0, opacity: disabled ? 0.6 : 1,
      }}
    >
      <span style={{
        position: "absolute", top: 3, left: checked ? 27 : 3,
        width: 22, height: 22, borderRadius: "50%", background: "#fff",
        boxShadow: "0 1px 4px rgba(0,0,0,.2)", transition: "left .2s",
      }} />
    </button>
  );
}

function Section({
  title, subtitle, children,
}: {
  title: string; subtitle?: string; children: React.ReactNode;
}) {
  return (
    <div style={{ background: "#fff", borderRadius: 16, border: "1.5px solid #e2e8f0", overflow: "hidden" }}>
      <div style={{ padding: "18px 24px", borderBottom: "1px solid #f1f5f9" }}>
        <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "#0f172a", letterSpacing: -0.2 }}>{title}</p>
        {subtitle && <p style={{ margin: "3px 0 0", fontSize: 12, color: "#94a3b8", fontWeight: 500 }}>{subtitle}</p>}
      </div>
      <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 20 }}>
        {children}
      </div>
    </div>
  );
}

function Row({
  label, hint, children,
}: {
  label: string; hint?: string; children: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
      <div>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#334155" }}>{label}</p>
        {hint && <p style={{ margin: "2px 0 0", fontSize: 11, color: "#94a3b8" }}>{hint}</p>}
      </div>
      {children}
    </div>
  );
}

function NumInput({
  value, onChange, min, step, unit, width = 90,
}: {
  value: number; onChange: (v: number) => void;
  min?: number; step?: number; unit?: string; width?: number;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <input
        type="number" value={value} min={min ?? 0} step={step ?? 0.5}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{
          width, padding: "7px 10px", borderRadius: 8,
          border: "1.5px solid #e2e8f0", fontSize: 13, fontWeight: 700,
          color: "#0f172a", fontFamily: "inherit", outline: "none",
          background: "#f8fafc", textAlign: "right", transition: "border-color .15s",
        }}
        onFocus={(e) => (e.target.style.borderColor = "#6366f1")}
        onBlur={(e)  => (e.target.style.borderColor = "#e2e8f0")}
      />
      {unit && <span style={{ fontSize: 11, color: "#64748b", fontWeight: 600, flexShrink: 0 }}>{unit}</span>}
    </div>
  );
}

// ─── Tier row (edit in place) ─────────────────────────────────────────────────

function TierRow({
  tier, onSave, onDelete, saving,
}: {
  tier: DeliveryTier;
  onSave: (id: number, patch: Partial<DeliveryTier>) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  saving: boolean;
}) {
  const [draft, setDraft] = useState({ ...tier });
  const [dirty, setDirty] = useState(false);
  const [localSaving, setLocalSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function set<K extends keyof DeliveryTier>(k: K, v: DeliveryTier[K]) {
    setDraft((d) => ({ ...d, [k]: v }));
    setDirty(true);
    setSaved(false);
  }

  async function save() {
    setLocalSaving(true);
    await onSave(tier.id, {
      max_distance_km: draft.max_distance_km,
      min_order_eur: draft.min_order_eur,
      delivery_fee_eur: draft.delivery_fee_eur,
    });
    setDirty(false);
    setSaved(true);
    setLocalSaving(false);
    setTimeout(() => setSaved(false), 2000);
  }

  const isBusy = saving || localSaving;

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "1fr 1fr 1fr auto",
      gap: 10,
      alignItems: "center",
      padding: "14px 16px",
      background: "#f8fafc",
      borderRadius: 10,
      border: "1.5px solid #e2e8f0",
    }}>
      {/* Max distance */}
      <div>
        <p style={{ margin: "0 0 4px", fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5 }}>
          Up to
        </p>
        <NumInput
          value={Number(draft.max_distance_km)}
          step={0.5} min={0.5} unit="km" width={72}
          onChange={(v) => set("max_distance_km", v)}
        />
      </div>

      {/* Min order */}
      <div>
        <p style={{ margin: "0 0 4px", fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5 }}>
          Min order
        </p>
        <NumInput
          value={Number(draft.min_order_eur)}
          step={0.5} min={0} unit="€" width={72}
          onChange={(v) => set("min_order_eur", v)}
        />
      </div>

      {/* Delivery fee */}
      <div>
        <p style={{ margin: "0 0 4px", fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5 }}>
          Delivery fee
        </p>
        <NumInput
          value={Number(draft.delivery_fee_eur)}
          step={0.10} min={0} unit="€" width={72}
          onChange={(v) => set("delivery_fee_eur", v)}
        />
      </div>

      {/* Actions */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, paddingTop: 18 }}>
        {saved && <span style={{ fontSize: 11, color: "#16a34a", fontWeight: 700, whiteSpace: "nowrap" }}>Saved ✓</span>}
        {dirty && !isBusy && (
          <button onClick={save} disabled={isBusy} style={{
            padding: "6px 12px", borderRadius: 7, border: "none",
            background: "#6366f1", color: "#fff", fontSize: 12, fontWeight: 700,
            cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap",
          }}>
            Save
          </button>
        )}
        {localSaving && (
          <span style={{
            width: 16, height: 16, border: "2px solid #e2e8f0",
            borderTopColor: "#6366f1", borderRadius: "50%",
            display: "inline-block", animation: "spin .7s linear infinite",
          }} />
        )}
        <button
          onClick={() => onDelete(tier.id)} disabled={isBusy}
          style={{
            padding: "6px 10px", borderRadius: 7,
            border: "1.5px solid #fecaca", background: "#fef2f2",
            color: "#dc2626", fontSize: 12, fontWeight: 700,
            cursor: isBusy ? "not-allowed" : "pointer", fontFamily: "inherit",
            opacity: isBusy ? 0.5 : 1,
          }}
        >
          ✕
        </button>
      </div>
    </div>
  );
}

// ─── Add tier form ────────────────────────────────────────────────────────────

function AddTierForm({
  onAdd, saving,
}: {
  onAdd: (t: { max_distance_km: number; min_order_eur: number; delivery_fee_eur: number }) => Promise<void>;
  saving: boolean;
}) {
  const [form, setForm] = useState({ max_distance_km: 0, min_order_eur: 0, delivery_fee_eur: 0 });
  const [localSaving, setLocalSaving] = useState(false);

  function set<K extends keyof typeof form>(k: K, v: number) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function submit() {
    if (!form.max_distance_km) return;
    setLocalSaving(true);
    await onAdd(form);
    setForm({ max_distance_km: 0, min_order_eur: 0, delivery_fee_eur: 0 });
    setLocalSaving(false);
  }

  const isBusy = saving || localSaving;
  const canSubmit = form.max_distance_km > 0 && !isBusy;

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "1fr 1fr 1fr auto",
      gap: 10,
      alignItems: "end",
      padding: "14px 16px",
      background: "#f0f9ff",
      borderRadius: 10,
      border: "1.5px dashed #93c5fd",
    }}>
      <div>
        <p style={{ margin: "0 0 4px", fontSize: 10, fontWeight: 700, color: "#60a5fa", textTransform: "uppercase", letterSpacing: 0.5 }}>Up to</p>
        <NumInput value={form.max_distance_km} step={0.5} min={0.5} unit="km" width={72} onChange={(v) => set("max_distance_km", v)} />
      </div>
      <div>
        <p style={{ margin: "0 0 4px", fontSize: 10, fontWeight: 700, color: "#60a5fa", textTransform: "uppercase", letterSpacing: 0.5 }}>Min order</p>
        <NumInput value={form.min_order_eur} step={0.5} min={0} unit="€" width={72} onChange={(v) => set("min_order_eur", v)} />
      </div>
      <div>
        <p style={{ margin: "0 0 4px", fontSize: 10, fontWeight: 700, color: "#60a5fa", textTransform: "uppercase", letterSpacing: 0.5 }}>Delivery fee</p>
        <NumInput value={form.delivery_fee_eur} step={0.10} min={0} unit="€" width={72} onChange={(v) => set("delivery_fee_eur", v)} />
      </div>
      <button
        onClick={submit} disabled={!canSubmit}
        style={{
          padding: "7px 14px", borderRadius: 7, border: "none",
          background: canSubmit ? "#6366f1" : "#e2e8f0",
          color: canSubmit ? "#fff" : "#94a3b8",
          fontSize: 12, fontWeight: 700, cursor: canSubmit ? "pointer" : "not-allowed",
          fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6,
          whiteSpace: "nowrap",
        }}
      >
        {localSaving ? <Spinner /> : "+ Add tier"}
      </button>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DeliverySettingsPage() {
  const [settings, setSettings] = useState<DeliverySettings | null>(null);
  const [tiers, setTiers]       = useState<DeliveryTier[]>([]);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState<string | null>(null);
  const [error, setError]       = useState<string | null>(null);
  const [saved, setSaved]       = useState<string | null>(null);
  const [tierSaving, setTierSaving] = useState(false);
  const [postalInput, setPostalInput] = useState("");

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchSettings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/delivery-settings");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setSettings(data.settings);
      setTiers(data.tiers ?? []);
    } catch {
      setError("Could not load delivery settings.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  // ── Patch settings ─────────────────────────────────────────────────────────
  const patch = async (field: string, value: unknown) => {
    if (!settings) return;
    setSaving(field);
    setError(null);
    try {
      const res = await fetch("/api/delivery-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setSettings(data.settings);
      setSaved(field);
      setTimeout(() => setSaved(null), 2000);
    } catch {
      setError("Failed to save. Please try again.");
    } finally {
      setSaving(null);
    }
  };

  // ── Tier actions ───────────────────────────────────────────────────────────
  const saveTier = async (id: number, updates: Partial<DeliveryTier>) => {
    setTierSaving(true);
    try {
      const res = await fetch(`/api/delivery-tiers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setTiers((ts) => ts.map((t) => (t.id === id ? data.tier : t)));
    } catch {
      setError("Failed to update tier.");
    } finally {
      setTierSaving(false);
    }
  };

  const deleteTier = async (id: number) => {
    setTierSaving(true);
    try {
      const res = await fetch(`/api/delivery-tiers/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setTiers((ts) => ts.filter((t) => t.id !== id));
    } catch {
      setError("Failed to delete tier.");
    } finally {
      setTierSaving(false);
    }
  };

  const addTier = async (body: { max_distance_km: number; min_order_eur: number; delivery_fee_eur: number }) => {
    setTierSaving(true);
    try {
      const res = await fetch("/api/delivery-tiers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setTiers((ts) => [...ts, data.tier].sort((a, b) => a.sort_order - b.sort_order));
    } catch {
      setError("Failed to add tier.");
    } finally {
      setTierSaving(false);
    }
  };

  // ── Postal codes ───────────────────────────────────────────────────────────
  const addPostal = () => {
    const code = postalInput.trim();
    if (!code || !settings) return;
    if (settings.allowed_postals.includes(code)) { setPostalInput(""); return; }
    setPostalInput("");
    patch("allowed_postals", [...settings.allowed_postals, code]);
  };

  const removePostal = (code: string) => {
    if (!settings) return;
    patch("allowed_postals", settings.allowed_postals.filter((p) => p !== code));
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh", gap: 12, color: "#94a3b8", fontSize: 14, fontWeight: 600 }}>
        <span style={{ width: 20, height: 20, border: "2.5px solid #e2e8f0", borderTopColor: "#6366f1", borderRadius: "50%", display: "inline-block", animation: "spin .7s linear infinite" }} />
        Loading settings…
      </div>
    );
  }

  if (!settings) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "60vh", gap: 10 }}>
        <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#dc2626" }}>{error ?? "Settings not found"}</p>
        <button onClick={fetchSettings} style={{ marginTop: 8, padding: "8px 20px", borderRadius: 8, border: "1.5px solid #e2e8f0", background: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 680, margin: "0 auto", padding: "32px 24px 60px" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@700;800;900&family=DM+Sans:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        body { font-family: 'DM Sans', sans-serif; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } }
        input[type=number]::-webkit-inner-spin-button { opacity: 1; }
      `}</style>

      <div style={{ marginBottom: 28 }}>
        <h1 style={{ margin: 0, fontFamily: "'Sora',sans-serif", fontSize: 22, fontWeight: 900, color: "#0f172a", letterSpacing: -0.5 }}>
          Delivery Settings
        </h1>
        <p style={{ margin: "4px 0 0", fontSize: 13, color: "#94a3b8" }}>
          Control delivery availability, pricing zones, and allowed areas
        </p>
      </div>

      {error && (
        <div style={{ marginBottom: 16, padding: "12px 16px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, fontSize: 13, color: "#dc2626", fontWeight: 600 }}>
          ⚠️ {error}
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

        {/* ── Order Acceptance ── */}
        <Section title="Order Acceptance" subtitle="Toggle whether the restaurant is currently accepting delivery orders">
          <Row label="Accepting orders" hint={settings.is_accepting ? "Customers can place orders" : "Orders are paused"}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {saving === "is_accepting" && <Spinner />}
              {saved === "is_accepting" && <span style={{ fontSize: 11, color: "#16a34a", fontWeight: 700 }}>Saved ✓</span>}
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{
                  fontSize: 11, fontWeight: 800, padding: "3px 10px", borderRadius: 999,
                  background: settings.is_accepting ? "#f0fdf4" : "#fef2f2",
                  color: settings.is_accepting ? "#16a34a" : "#dc2626",
                  border: `1px solid ${settings.is_accepting ? "#86efac" : "#fca5a5"}`,
                }}>
                  {settings.is_accepting ? "OPEN" : "CLOSED"}
                </span>
                <Toggle checked={settings.is_accepting} onChange={(v) => patch("is_accepting", v)} disabled={saving === "is_accepting"} />
              </div>
            </div>
          </Row>

          <Row label="Order time rule" hint="When orders are allowed relative to opening hours">
            <select
              value={settings.order_time_rule} disabled={!!saving}
              onChange={(e) => patch("order_time_rule", e.target.value)}
              style={{ padding: "8px 12px", borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize: 13, fontWeight: 600, color: "#334155", fontFamily: "inherit", background: "#f8fafc", cursor: "pointer", outline: "none" }}
            >
              <option value="opening_hours">During opening hours</option>
              <option value="always">Always</option>
              <option value="never">Never</option>
            </select>
          </Row>
        </Section>

        {/* ── Delivery Tiers ── */}
        <Section
          title="Delivery Zones"
          subtitle="Each zone defines a distance cap, minimum order, and flat delivery fee. The cheapest matching zone is applied."
        >
          {/* Legend */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: 10, padding: "0 16px" }}>
            {["Distance cap", "Min order", "Delivery fee", ""].map((h) => (
              <p key={h} style={{ margin: 0, fontSize: 10, fontWeight: 700, color: "#cbd5e1", textTransform: "uppercase", letterSpacing: 0.5 }}>{h}</p>
            ))}
          </div>

          {tiers.length === 0 && (
            <div style={{ padding: 20, textAlign: "center", fontSize: 13, color: "#94a3b8", background: "#f8fafc", borderRadius: 10, border: "1.5px solid #e2e8f0" }}>
              No zones configured — all distances rejected. Add at least one zone below.
            </div>
          )}

          {tiers.map((tier) => (
            <TierRow
              key={tier.id}
              tier={tier}
              onSave={saveTier}
              onDelete={deleteTier}
              saving={tierSaving}
            />
          ))}

          <AddTierForm onAdd={addTier} saving={tierSaving} />

          {tiers.length > 0 && (
            <div style={{ padding: "10px 16px", background: "#f8fafc", borderRadius: 8, border: "1px solid #e2e8f0" }}>
              <p style={{ margin: 0, fontSize: 11, color: "#94a3b8", fontWeight: 500, lineHeight: 1.6 }}>
                Current zones: {tiers
                  .slice()
                  .sort((a, b) => a.max_distance_km - b.max_distance_km)
                  .map((t) => `up to ${t.max_distance_km} km → min. ${Number(t.min_order_eur).toFixed(2)} € + ${Number(t.delivery_fee_eur).toFixed(2)} € fee`)
                  .join(" · ")}
              </p>
            </div>
          )}
        </Section>

        {/* ── Allowed Postals ── */}
        <Section
          title="Allowed Postal Codes"
          subtitle={settings.allowed_postals.length === 0
            ? "No restrictions — all postal codes accepted"
            : `${settings.allowed_postals.length} postal code${settings.allowed_postals.length !== 1 ? "s" : ""} in the allowed list`}
        >
          <div style={{ display: "flex", gap: 8 }}>
            <input
              value={postalInput}
              onChange={(e) => setPostalInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addPostal()}
              placeholder="e.g. 50667"
              maxLength={10}
              style={{ flex: 1, padding: "9px 14px", borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize: 14, fontWeight: 600, color: "#0f172a", fontFamily: "inherit", outline: "none", background: "#f8fafc", transition: "border-color .15s" }}
              onFocus={(e) => (e.target.style.borderColor = "#6366f1")}
              onBlur={(e)  => (e.target.style.borderColor = "#e2e8f0")}
            />
            <button
              onClick={addPostal} disabled={!postalInput.trim() || !!saving}
              style={{ padding: "9px 18px", borderRadius: 8, border: "none", background: "#6366f1", color: "#fff", fontSize: 13, fontWeight: 700, cursor: (!postalInput.trim() || !!saving) ? "not-allowed" : "pointer", opacity: (!postalInput.trim() || !!saving) ? 0.6 : 1, fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6 }}
            >
              {saving === "allowed_postals" ? <Spinner /> : "+ Add"}
            </button>
          </div>

          {settings.allowed_postals.length === 0 ? (
            <div style={{ padding: 16, background: "#f8fafc", borderRadius: 10, textAlign: "center", fontSize: 12, color: "#94a3b8", fontWeight: 500 }}>
              No postal codes added — all areas accepted
            </div>
          ) : (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {settings.allowed_postals.map((code) => (
                <div key={code} style={{ display: "flex", alignItems: "center", gap: 6, background: "#f1f5f9", border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "5px 10px 5px 12px", fontSize: 13, fontWeight: 700, color: "#334155", animation: "fadeIn .2s ease both" }}>
                  {code}
                  <button onClick={() => removePostal(code)} disabled={!!saving} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", fontSize: 14, padding: "0 2px", lineHeight: 1, display: "flex", alignItems: "center" }}>
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </Section>

      </div>
    </div>
  );
}