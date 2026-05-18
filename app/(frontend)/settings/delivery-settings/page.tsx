"use client";

import { useEffect, useState, useCallback } from "react";

interface DeliverySettings {
  id: number;
  is_accepting: boolean;
  order_time_rule: string;
  fee_per_km: number;
  max_distance_km: number;
  allowed_postals: string[];
}

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

function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      disabled={disabled}
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

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
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

function Row({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
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

function NumInput({ value, onChange, min, step, unit }: {
  value: number; onChange: (v: number) => void;
  min?: number; step?: number; unit?: string;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <input
        type="number"
        value={value}
        min={min ?? 0}
        step={step ?? 0.5}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{
          width: 90, padding: "8px 12px", borderRadius: 8,
          border: "1.5px solid #e2e8f0", fontSize: 14, fontWeight: 700,
          color: "#0f172a", fontFamily: "inherit", outline: "none",
          background: "#f8fafc", textAlign: "right",
          transition: "border-color .15s",
        }}
        onFocus={(e) => (e.target.style.borderColor = "#6366f1")}
        onBlur={(e)  => (e.target.style.borderColor = "#e2e8f0")}
      />
      {unit && <span style={{ fontSize: 12, color: "#64748b", fontWeight: 600, flexShrink: 0 }}>{unit}</span>}
    </div>
  );
}

export default function DeliverySettingsPage() {
  const [settings, setSettings] = useState<DeliverySettings | null>(null);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState<string | null>(null); // field key being saved
  const [error, setError]       = useState<string | null>(null);
  const [saved, setSaved]       = useState<string | null>(null); // field key just saved

  // Postal code input state
  const [postalInput, setPostalInput] = useState("");

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/delivery-settings");
      if (!res.ok) throw new Error("Failed to load settings");
      const data = await res.json();
      setSettings(data.settings);
    } catch (e) {
      setError("Could not load delivery settings.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

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
      if (!res.ok) throw new Error("Failed to save");
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

  const addPostal = () => {
    const code = postalInput.trim();
    if (!code || !settings) return;
    if (settings.allowed_postals.includes(code)) { setPostalInput(""); return; }
    const updated = [...settings.allowed_postals, code];
    setPostalInput("");
    patch("allowed_postals", updated);
  };

  const removePostal = (code: string) => {
    if (!settings) return;
    patch("allowed_postals", settings.allowed_postals.filter((p) => p !== code));
  };

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
        <span style={{ fontSize: 40 }}>⚠️</span>
        <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#dc2626" }}>{error ?? "Settings not found"}</p>
        <button onClick={fetchSettings} style={{ marginTop: 8, padding: "8px 20px", borderRadius: 8, border: "1.5px solid #e2e8f0", background: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 640, margin: "0 auto", padding: "32px 24px 60px" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@700;800;900&family=DM+Sans:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        body { font-family: 'DM Sans', sans-serif; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
        input[type=number]::-webkit-inner-spin-button { opacity: 1; }
      `}</style>

      {/* Page header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ margin: 0, fontFamily: "'Sora',sans-serif", fontSize: 22, fontWeight: 900, color: "#0f172a", letterSpacing: -0.5 }}>
          🛵 Delivery Settings
        </h1>
        <p style={{ margin: "4px 0 0", fontSize: 13, color: "#94a3b8" }}>
          Control delivery availability, pricing, and zones
        </p>
      </div>

      {/* Error banner */}
      {error && (
        <div style={{ marginBottom: 16, padding: "12px 16px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, fontSize: 13, color: "#dc2626", fontWeight: 600 }}>
          ⚠️ {error}
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

        {/* ── Accepting Orders ── */}
        <Section title="Order Acceptance" subtitle="Toggle whether the restaurant is currently accepting delivery orders">
          <Row label="Accepting orders" hint={settings.is_accepting ? "Customers can place orders" : "Orders are paused for customers"}>
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
                <Toggle
                  checked={settings.is_accepting}
                  onChange={(v) => patch("is_accepting", v)}
                  disabled={saving === "is_accepting"}
                />
              </div>
            </div>
          </Row>

          <Row label="Order time rule" hint="When orders are allowed relative to opening hours">
            <select
              value={settings.order_time_rule}
              disabled={!!saving}
              onChange={(e) => patch("order_time_rule", e.target.value)}
              style={{
                padding: "8px 12px", borderRadius: 8, border: "1.5px solid #e2e8f0",
                fontSize: 13, fontWeight: 600, color: "#334155", fontFamily: "inherit",
                background: "#f8fafc", cursor: "pointer", outline: "none",
              }}
            >
              <option value="opening_hours">During opening hours</option>
              <option value="always">Always</option>
              <option value="never">Never</option>
            </select>
          </Row>
        </Section>

        {/* ── Pricing & Distance ── */}
        <Section title="Pricing & Distance" subtitle="Set the delivery fee and maximum range">
          <Row label="Fee per km" hint="Charged per kilometre of delivery distance">
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {saved === "fee_per_km" && <span style={{ fontSize: 11, color: "#16a34a", fontWeight: 700 }}>Saved ✓</span>}
              {saving === "fee_per_km" && <Spinner />}
              <NumInput
                value={Number(settings.fee_per_km)}
                step={0.10}
                unit="€ / km"
                onChange={(v) => setSettings((s) => s ? { ...s, fee_per_km: v } : s)}
              />
              <button
                onClick={() => patch("fee_per_km", settings.fee_per_km)}
                disabled={!!saving}
                style={{ padding: "8px 14px", borderRadius: 8, border: "none", background: "#6366f1", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
              >
                Save
              </button>
            </div>
          </Row>

          <Row label="Max distance" hint="Orders beyond this distance are rejected">
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {saved === "max_distance_km" && <span style={{ fontSize: 11, color: "#16a34a", fontWeight: 700 }}>Saved ✓</span>}
              {saving === "max_distance_km" && <Spinner />}
              <NumInput
                value={Number(settings.max_distance_km)}
                step={0.5}
                unit="km"
                onChange={(v) => setSettings((s) => s ? { ...s, max_distance_km: v } : s)}
              />
              <button
                onClick={() => patch("max_distance_km", settings.max_distance_km)}
                disabled={!!saving}
                style={{ padding: "8px 14px", borderRadius: 8, border: "none", background: "#6366f1", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
              >
                Save
              </button>
            </div>
          </Row>
        </Section>

        {/* ── Allowed Postals ── */}
        <Section
          title="Allowed Postal Codes"
          subtitle={settings.allowed_postals.length === 0
            ? "No restrictions — all postal codes accepted"
            : `${settings.allowed_postals.length} postal code${settings.allowed_postals.length !== 1 ? "s" : ""} allowed`}
        >
          {/* Add postal */}
          <div style={{ display: "flex", gap: 8 }}>
            <input
              value={postalInput}
              onChange={(e) => setPostalInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addPostal()}
              placeholder="e.g. 50667"
              maxLength={10}
              style={{
                flex: 1, padding: "9px 14px", borderRadius: 8,
                border: "1.5px solid #e2e8f0", fontSize: 14, fontWeight: 600,
                color: "#0f172a", fontFamily: "inherit", outline: "none",
                background: "#f8fafc", transition: "border-color .15s",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#6366f1")}
              onBlur={(e)  => (e.target.style.borderColor = "#e2e8f0")}
            />
            <button
              onClick={addPostal}
              disabled={!postalInput.trim() || !!saving}
              style={{
                padding: "9px 18px", borderRadius: 8, border: "none",
                background: "#6366f1", color: "#fff", fontSize: 13, fontWeight: 700,
                cursor: (!postalInput.trim() || !!saving) ? "not-allowed" : "pointer",
                opacity: (!postalInput.trim() || !!saving) ? 0.6 : 1,
                fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6,
              }}
            >
              {saving === "allowed_postals" ? <Spinner /> : "+ Add"}
            </button>
          </div>

          {/* Postal chips */}
          {settings.allowed_postals.length === 0 ? (
            <div style={{ padding: "16px", background: "#f8fafc", borderRadius: 10, textAlign: "center", fontSize: 12, color: "#94a3b8", fontWeight: 500 }}>
              No postal codes added — all areas accepted
            </div>
          ) : (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {settings.allowed_postals.map((code) => (
                <div
                  key={code}
                  style={{
                    display: "flex", alignItems: "center", gap: 6,
                    background: "#f1f5f9", border: "1.5px solid #e2e8f0",
                    borderRadius: 8, padding: "5px 10px 5px 12px",
                    fontSize: 13, fontWeight: 700, color: "#334155",
                    animation: "fadeIn .2s ease both",
                  }}
                >
                  📮 {code}
                  <button
                    onClick={() => removePostal(code)}
                    disabled={!!saving}
                    style={{
                      background: "none", border: "none", cursor: "pointer",
                      color: "#94a3b8", fontSize: 14, padding: "0 2px",
                      lineHeight: 1, display: "flex", alignItems: "center",
                    }}
                  >
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