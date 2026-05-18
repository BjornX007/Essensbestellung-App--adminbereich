"use client";

import { useEffect, useState } from "react";

interface OpeningHour {
  id: string;
  day_of_week: number;
  open_time: string | null;
  close_time: string | null;
  is_closed: boolean;
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function to12h(t: string | null) {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}

function TimeInput({ value, onChange, disabled }: { value: string; onChange: (v: string) => void; disabled?: boolean }) {
  return (
    <input
      type="time"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      style={{
        padding: "7px 10px", borderRadius: "8px", border: "1px solid #e5e7eb",
        fontSize: "13px", color: disabled ? "#d1d5db" : "#111827",
        background: disabled ? "#f9fafb" : "#ffffff", outline: "none",
        cursor: disabled ? "not-allowed" : "auto", fontFamily: "inherit",
        width: "120px", transition: "border-color 0.15s",
      }}
      onFocus={(e) => (e.currentTarget.style.borderColor = "#111827")}
      onBlur={(e) => (e.currentTarget.style.borderColor = "#e5e7eb")}
    />
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <span
      onClick={() => onChange(!checked)}
      style={{
        display: "inline-flex", width: "36px", height: "20px", borderRadius: "99px",
        background: checked ? "#111827" : "#e5e7eb", position: "relative",
        transition: "background 0.2s", flexShrink: 0, cursor: "pointer",
      }}
    >
      <span style={{
        position: "absolute", top: "3px", left: checked ? "19px" : "3px",
        width: "14px", height: "14px", borderRadius: "50%", background: "#ffffff",
        transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
      }} />
    </span>
  );
}

interface RowState {
  id: string;
  open_time: string;
  close_time: string;
  is_closed: boolean;
}

export default function OpeningHoursPage() {
  const [rows, setRows] = useState<RowState[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/opening-hours")
      .then((r) => r.json())
      .then((data: OpeningHour[]) =>
        setRows(data.map((h) => ({
          id: h.id,
          open_time: h.open_time ?? "",
          close_time: h.close_time ?? "",
          is_closed: h.is_closed,
        })))
      )
      .catch(() => setError("Failed to load opening hours."))
      .finally(() => setLoading(false));
  }, []);

  const patch = (idx: number, partial: Partial<RowState>) =>
    setRows((prev) => prev.map((r, i) => i === idx ? { ...r, ...partial } : r));

  const saveAll = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await Promise.all(
        rows.map((row) =>
          fetch(`/api/opening-hours/${row.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              open_time: row.is_closed ? null : row.open_time || null,
              close_time: row.is_closed ? null : row.close_time || null,
              is_closed: row.is_closed,
            }),
          })
        )
      );
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: "680px", margin: "0 auto", padding: "40px 24px 80px", fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif" }}>
      {/* Header */}
      <div style={{ marginBottom: "32px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
          <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "#111827", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>
          <h1 style={{ fontSize: "20px", fontWeight: 700, color: "#111827", margin: 0 }}>Opening Hours</h1>
        </div>
        <p style={{ fontSize: "13.5px", color: "#6b7280", margin: 0 }}>Set your weekly schedule.</p>
      </div>

      {/* Card */}
      <div style={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #e5e7eb", padding: "8px 24px", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
        {loading && <div style={{ padding: "40px 0", textAlign: "center", color: "#9ca3af", fontSize: "13.5px" }}>Loading…</div>}
        {error && <div style={{ padding: "40px 0", textAlign: "center", color: "#ef4444", fontSize: "13.5px" }}>{error}</div>}

        {!loading && !error && rows.map((row, idx) => (
          <div
            key={row.id}
            style={{
              display: "grid", gridTemplateColumns: "110px 1fr",
              borderBottom: idx < 6 ? "1px solid #f3f4f6" : "none",
              padding: "14px 0", alignItems: "center",
            }}
          >
            <div style={{ fontSize: "13.5px", fontWeight: 600, color: row.is_closed ? "#9ca3af" : "#111827" }}>
              {DAYS[idx]}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <Toggle checked={row.is_closed} onChange={(v) => patch(idx, { is_closed: v })} />
                <span style={{ fontSize: "12.5px", color: "#6b7280" }}>Closed</span>
              </div>

              {!row.is_closed && (
                <>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <TimeInput value={row.open_time} onChange={(v) => patch(idx, { open_time: v })} />
                    <span style={{ fontSize: "12px", color: "#9ca3af" }}>to</span>
                    <TimeInput value={row.close_time} onChange={(v) => patch(idx, { close_time: v })} />
                  </div>
                  {row.open_time && row.close_time && (
                    <span style={{ fontSize: "12px", color: "#9ca3af", whiteSpace: "nowrap" }}>
                      {to12h(row.open_time)} – {to12h(row.close_time)}
                    </span>
                  )}
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Save button */}
      {!loading && !error && (
        <div style={{ marginTop: "20px", display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "12px" }}>
          {saved && <span style={{ fontSize: "13px", color: "#6b7280" }}>✓ Saved</span>}
          <button
            onClick={saveAll}
            disabled={saving}
            style={{
              padding: "9px 24px", borderRadius: "8px", border: "none",
              background: "#111827", color: "#ffffff",
              fontSize: "13.5px", fontWeight: 600,
              cursor: saving ? "not-allowed" : "pointer",
              opacity: saving ? 0.7 : 1,
              transition: "opacity 0.15s", fontFamily: "inherit",
            }}
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      )}
    </div>
  );
}