"use client";

// app/admin/settings/danger-zone/page.tsx

import { useState } from "react";

const S = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=DM+Serif+Display&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  .page-root { min-height: 100vh; background: #0a0a0a; color: #e2ddd5; font-family: 'DM Sans', sans-serif; }
  .page-topbar { padding: 1.25rem 2.5rem; border-bottom: 1px solid #161616; display: flex; align-items: center; gap: 0.6rem; }
  .page-back { font-size: 0.75rem; color: #444; text-decoration: none; text-transform: uppercase; letter-spacing: 0.08em; transition: color 0.15s; }
  .page-back:hover { color: #888; }
  .page-sep { color: #222; }
  .page-crumb { font-size: 0.75rem; color: #555; text-transform: uppercase; letter-spacing: 0.08em; }
  .page-body { max-width: 680px; margin: 0 auto; padding: 3rem 2.5rem 5rem; }
  .page-heading { margin-bottom: 2.5rem; }
  .page-heading h1 { font-family: 'DM Serif Display', serif; font-size: 2rem; font-weight: 400; color: #f0ece4; letter-spacing: -0.02em; }
  .page-heading p { margin-top: 0.5rem; font-size: 0.875rem; color: #5a3a3a; line-height: 1.6; }
  .warning-banner {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    background: #140a0a;
    border: 1px solid #2a1010;
    border-radius: 10px;
    padding: 1rem 1.1rem;
    margin-bottom: 1.5rem;
    font-size: 0.825rem;
    color: #7f3535;
    line-height: 1.55;
  }
  .warning-icon { font-size: 1rem; flex-shrink: 0; margin-top: 0.05rem; }
  .section-block { background: #111; border: 1px solid #1e1e1e; border-radius: 14px; overflow: hidden; margin-bottom: 1rem; }
  .danger-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1.5rem;
    padding: 1.4rem 1.75rem;
    border-bottom: 1px solid #161616;
  }
  .danger-row:last-child { border-bottom: none; }
  .danger-row--destructive { background: #0d0808; }
  .danger-row-text {}
  .danger-row-title { font-size: 0.9rem; color: #ccc; font-weight: 500; }
  .danger-row-desc { font-size: 0.8rem; color: #444; margin-top: 0.25rem; line-height: 1.5; }
  .btn-ghost {
    background: transparent;
    border: 1px solid #2a2a2a;
    border-radius: 9px;
    padding: 0.55rem 1.1rem;
    font-size: 0.8rem;
    color: #666;
    font-family: inherit;
    cursor: pointer;
    white-space: nowrap;
    transition: border-color 0.15s, color 0.15s;
    flex-shrink: 0;
  }
  .btn-ghost:hover { border-color: #444; color: #ccc; }
  .btn-ghost--red { color: #f87171; border-color: #2a1010; }
  .btn-ghost--red:hover { border-color: #f87171; color: #f87171; }
  .btn-ghost--amber { color: #fbbf24; border-color: #2a2010; }
  .btn-ghost--amber:hover { border-color: #fbbf24; color: #fbbf24; }
  .btn-ghost--active { background: #2d7a4f; border-color: #2d7a4f; color: #fff; }
  .toggle { position: relative; width: 42px; height: 24px; border-radius: 12px; background: #1e1e1e; border: 1px solid #2a2a2a; cursor: pointer; flex-shrink: 0; transition: background 0.2s; }
  .toggle--on { background: #ef4444; border-color: #ef4444; }
  .toggle-thumb { position: absolute; top: 2px; left: 2px; width: 18px; height: 18px; border-radius: 50%; background: #444; transition: transform 0.2s, background 0.2s; }
  .toggle--on .toggle-thumb { transform: translateX(18px); background: #fff; }

  /* Delete confirmation block */
  .delete-block {
    background: #0d0808;
    border: 1px solid #2a1010;
    border-radius: 14px;
    padding: 1.75rem;
    margin-bottom: 1rem;
    display: flex;
    flex-direction: column;
    gap: 1.1rem;
  }
  .delete-block-title {
    font-size: 0.7rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: #7f2020;
    padding-bottom: 0.6rem;
    border-bottom: 1px solid #2a1010;
  }
  .field { display: flex; flex-direction: column; gap: 0.4rem; }
  .field label { font-size: 0.775rem; color: #5a3535; font-weight: 500; }
  .field label strong { color: #f87171; font-weight: 600; }
  .field input {
    background: #0a0808;
    border: 1px solid #2a1010;
    border-radius: 8px;
    padding: 0.6rem 0.85rem;
    color: #e2ddd5;
    font-size: 0.875rem;
    font-family: inherit;
    outline: none;
    transition: border-color 0.15s;
    width: 100%;
    letter-spacing: 0.05em;
  }
  .field input:focus { border-color: #ef4444; }
  .field input::placeholder { color: #2a1a1a; }
  .field input.ready { border-color: #ef4444; box-shadow: 0 0 0 2px #ef444415; }
  .btn-danger {
    background: #7f1d1d;
    color: #fca5a5;
    border: 1px solid #991b1b;
    border-radius: 9px;
    padding: 0.7rem 1.5rem;
    font-size: 0.875rem;
    font-weight: 600;
    font-family: inherit;
    cursor: pointer;
    transition: background 0.15s;
    align-self: flex-start;
  }
  .btn-danger:hover:not(:disabled) { background: #991b1b; }
  .btn-danger:disabled { opacity: 0.3; cursor: not-allowed; }
  .export-done { font-size: 0.775rem; color: #4ade80; }
  .paused-badge { font-size: 0.72rem; background: #1a0a0a; color: #f87171; border: 1px solid #2a1010; border-radius: 4px; padding: 0.2rem 0.6rem; letter-spacing: 0.04em; white-space: nowrap; }
`;

export default function DangerZonePage() {
  const [ordersPaused, setOrdersPaused] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [exportDone, setExportDone] = useState(false);

  function handleExport() {
    setExportDone(true);
    setTimeout(() => setExportDone(false), 3000);
  }

  const canDelete = confirmText === "DELETE";

  return (
    <>
      <style>{S}</style>
      <div className="page-root">
        <div className="page-topbar">
          <a href="/settings" className="page-back">← Settings</a>
          <span className="page-sep">/</span>
          <span className="page-crumb">Danger zone</span>
        </div>
        <div className="page-body">
          <div className="page-heading">
            <h1>Danger zone</h1>
            <p>Actions here are irreversible or have significant consequences. Proceed carefully.</p>
          </div>

          <div className="warning-banner">
            <span className="warning-icon">⚠️</span>
            <span>Changes on this page take effect immediately and some cannot be undone. Make sure you understand what each action does before proceeding.</span>
          </div>

          {/* Actions */}
          <div className="section-block">
            {/* Pause orders */}
            <div className="danger-row">
              <div className="danger-row-text">
                <div className="danger-row-title" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  Pause online ordering
                  {ordersPaused && <span className="paused-badge">Paused</span>}
                </div>
                <div className="danger-row-desc">
                  Temporarily disables the order form on the front site. Existing orders are unaffected.
                </div>
              </div>
              <button
                role="switch"
                aria-checked={ordersPaused}
                className={`toggle ${ordersPaused ? "toggle--on" : ""}`}
                onClick={() => setOrdersPaused(v => !v)}
              >
                <span className="toggle-thumb" />
              </button>
            </div>

            {/* Export */}
            <div className="danger-row">
              <div className="danger-row-text">
                <div className="danger-row-title">Export all data</div>
                <div className="danger-row-desc">
                  Download a full JSON export of all orders, products, customers, and settings.
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexShrink: 0 }}>
                {exportDone && <span className="export-done">✓ Download started</span>}
                <button
                  className={`btn-ghost ${exportDone ? "btn-ghost--active" : ""}`}
                  onClick={handleExport}
                >
                  {exportDone ? "Exported ✓" : "Export JSON"}
                </button>
              </div>
            </div>

            {/* Reset menu */}
            <div className="danger-row">
              <div className="danger-row-text">
                <div className="danger-row-title">Reset menu</div>
                <div className="danger-row-desc">
                  Deletes all categories, products, options, and allergen assignments. Cannot be undone.
                </div>
              </div>
              <button className="btn-ghost btn-ghost--amber">Reset menu</button>
            </div>
          </div>

          {/* Delete account */}
          <div className="delete-block">
            <div className="delete-block-title">Delete account</div>
            <p style={{ fontSize: "0.85rem", color: "#5a3535", lineHeight: 1.6 }}>
              This will permanently delete your restaurant profile, all products, all orders, all customer data, and your admin account. <strong style={{ color: "#f87171" }}>This action cannot be undone.</strong>
            </p>
            <div className="field">
              <label>Type <strong>DELETE</strong> to confirm</label>
              <input
                type="text"
                placeholder="DELETE"
                value={confirmText}
                onChange={e => setConfirmText(e.target.value)}
                className={canDelete ? "ready" : ""}
                autoComplete="off"
                spellCheck={false}
              />
            </div>
            <button className="btn-danger" disabled={!canDelete}>
              Permanently delete everything
            </button>
          </div>
        </div>
      </div>
    </>
  );
}