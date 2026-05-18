"use client";

// app/admin/settings/auth-security/page.tsx

import { useState } from "react";

const S = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=DM+Serif+Display&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

.page-root {
  min-height: 100vh;
  background: #ffffff;
  color: #111;
  font-family: 'DM Sans', sans-serif;
}

.page-topbar {
  padding: 1;
  border-bottom: 1px solid #e5e5e5;
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.page-back {
  font-size: 0.75rem;
  color: #666;
  text-decoration: none;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  transition: color 0.15s;
}

.page-back:hover { color: #111; }

.page-sep { color: #ccc; }

.page-crumb {
  font-size: 0.75rem;
  color: #888;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.page-body {
  max-width: 680px;
  margin: 0 auto;
  padding: 3rem 2.5rem 5rem;
}

.page-heading {
  margin-bottom: 2.5rem;
}

.page-heading h1 {
  font-family: 'Arial', serif;
  font-size: 2rem;
  font-weight: 400;
  color: #111;
  letter-spacing: -0.02em;
}

.page-heading p {
  margin-top: 0;
  font-size: 0.875rem;
  color: #666;
  line-height: 1.6;
}

.section-block {
  background: #ffffff;
  border: 1px solid #e5e5e5;
  border-radius: 14px;
  padding: 1.75rem;
  margin-bottom: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
}

.block-title {
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #888;
  padding-bottom: 0.6rem;
  border-bottom: 1px solid #eee;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  flex: 1;
}

.field label {
  font-size: 0.775rem;
  color: #666;
  font-weight: 500;
}

.field input {
  background: #ffffff;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 0.6rem 0.85rem;
  color: #111;
  font-size: 0.875rem;
  font-family: inherit;
  outline: none;
  transition: border-color 0.15s;
  width: 100%;
}

.field input:focus {
  border-color: #6366f1;
}

.field input::placeholder {
  color: #aaa;
}

.field-row {
  display: flex;
  gap: 0.85rem;
  flex-wrap: wrap;
}

.field-row .field {
  min-width: 0;
}

.btn-primary {
  background: #6366f1;
  color: #fff;
  border: none;
  border-radius: 9px;
  padding: 0.7rem 1.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: background 0.15s;
}

.btn-primary:hover {
  background: #4f52d9;
}

.btn-primary--ok {
  background: #2d7a4f;
}

.btn-ghost {
  background: transparent;
  border: 1px solid #ddd;
  border-radius: 9px;
  padding: 0.6rem 1rem;
  font-size: 0.8rem;
  color: #666;
  font-family: inherit;
  cursor: pointer;
  white-space: nowrap;
  transition: border-color 0.15s, color 0.15s;
}

.btn-ghost:hover {
  border-color: #bbb;
  color: #111;
}

.btn-ghost--red {
  color: #f87171;
  border-color: #f3caca;
}

.btn-ghost--red:hover {
  border-color: #f87171;
}

.form-row {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.75rem;
  padding-top: 0.25rem;
}

.toggle-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.toggle-label {
  font-size: 0.875rem;
  color: #111;
  font-weight: 500;
}

.toggle-sub {
  font-size: 0.775rem;
  color: #888;
  margin-top: 0.2rem;
}

.toggle {
  position: relative;
  width: 42px;
  height: 24px;
  border-radius: 12px;
  background: #eee;
  border: 1px solid #ddd;
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.2s;
}

.toggle--on {
  background: #6366f1;
  border-color: #6366f1;
}

.toggle-thumb {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #aaa;
  transition: transform 0.2s, background 0.2s;
}

.toggle--on .toggle-thumb {
  transform: translateX(18px);
  background: #fff;
}

.session-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 0;
  border-bottom: 1px solid #eee;
}

.session-row:last-of-type {
  border-bottom: none;
}

.session-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ccc;
  flex-shrink: 0;
}

.session-dot--active {
  background: #4ade80;
}

.session-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.session-device {
  font-size: 0.875rem;
  color: #111;
}

.session-meta {
  font-size: 0.75rem;
  color: #888;
}

.badge-current {
  font-size: 0.68rem;
  background: #eafaf1;
  color: #2d7a4f;
  border: 1px solid #bfe8cf;
  border-radius: 4px;
  padding: 0.2rem 0.5rem;
  letter-spacing: 0.04em;
}

.info-box {
  padding: 0.85rem 1rem;
  border-radius: 8px;
  font-size: 0.825rem;
  line-height: 1.5;
}

.info-box--indigo {
  background: #f5f6ff;
  border: 1px solid #e0e2ff;
  color: #4f52d9;
}

.pw-strength {
  height: 3px;
  border-radius: 2px;
  margin-top: 0.4rem;
  background: #eee;
  overflow: hidden;
}

.pw-strength-bar {
  height: 100%;
  border-radius: 2px;
  transition: width 0.3s, background 0.3s;
}

.field-hint {
  font-size: 0.72rem;
  color: #999;
  margin-top: 0.2rem;
}

.error-msg {
  font-size: 0.75rem;
  color: #f87171;
  margin-top: 0.2rem;
}
`;
function passwordStrength(pw: string) {
  if (!pw) return 0;
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^a-zA-Z0-9]/.test(pw)) s++;
  return s;
}

const STRENGTH_LABELS = ["", "Weak", "Fair", "Good", "Strong"];
const STRENGTH_COLORS = ["", "#ef4444", "#f59e0b", "#6366f1", "#4ade80"];

export default function AuthSecurityPage() {
  const [current, setCurrent] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwSaved, setPwSaved] = useState(false);
  const [twoFA, setTwoFA] = useState(false);
  const [sessions, setSessions] = useState([
    { id: 1, device: "Chrome · macOS", location: "Cologne, DE", time: "Now", current: true },
    { id: 2, device: "Safari · iPhone 15", location: "Cologne, DE", time: "2 hours ago", current: false },
    { id: 3, device: "Firefox · Windows", location: "Berlin, DE", time: "Yesterday", current: false },
  ]);

  const strength = passwordStrength(newPw);
  const mismatch = confirmPw.length > 0 && newPw !== confirmPw;
  const canSave = current.length > 0 && newPw.length >= 8 && newPw === confirmPw;

  function savePw(e: React.FormEvent) {
    e.preventDefault();
    if (!canSave) return;
    setPwSaved(true);
    setCurrent(""); setNewPw(""); setConfirmPw("");
    setTimeout(() => setPwSaved(false), 2500);
  }

  function revokeSession(id: number) {
    setSessions((s) => s.filter((x) => x.id !== id));
  }

  return (
    <>
      <style>{S}</style>
      <div className="page-root">
        <div className="page-topbar">
          <a href="/settings" className="page-back">← Settings</a>
          <span className="page-sep">/</span>
          <span className="page-crumb">Auth & security</span>
        </div>
        <div className="page-body">
          <div className="page-heading">    
            <h1>Auth & security</h1>
            <p>Keep your account safe — update credentials and manage active sessions.</p>
          </div>

          {/* Password */}
          <div className="section-block">
            <div className="block-title">Change password</div>
            <form onSubmit={savePw}>
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div className="field">
                  <label>Current password</label>
                  <input type="password" placeholder="••••••••" value={current} onChange={e => setCurrent(e.target.value)} />
                </div>
                <div className="field-row">
                  <div className="field">
                    <label>New password</label>
                    <input type="password" placeholder="••••••••" value={newPw} onChange={e => setNewPw(e.target.value)} />
                    {newPw && (
                      <>
                        <div className="pw-strength">
                          <div className="pw-strength-bar" style={{ width: `${strength * 25}%`, background: STRENGTH_COLORS[strength] }} />
                        </div>
                        <span className="field-hint" style={{ color: STRENGTH_COLORS[strength] }}>{STRENGTH_LABELS[strength]}</span>
                      </>
                    )}
                  </div>
                  <div className="field">
                    <label>Confirm new password</label>
                    <input type="password" placeholder="••••••••" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} style={mismatch ? { borderColor: "#ef4444" } : {}} />
                    {mismatch && <span className="error-msg">Passwords don't match</span>}
                  </div>
                </div>
                <div className="form-row">
                  <button type="submit" className={`btn-primary ${pwSaved ? "btn-primary--ok" : ""}`} disabled={!canSave}>
                    {pwSaved ? "✓ Updated" : "Update password"}
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* 2FA */}
          <div className="section-block">
            <div className="block-title">Two-factor authentication</div>
            <div className="toggle-row">
              <div>
                <p className="toggle-label">Authenticator app (TOTP)</p>
                <p className="toggle-sub">Require a 6-digit code on every login.</p>
              </div>
              <button
                role="switch"
                aria-checked={twoFA}
                className={`toggle ${twoFA ? "toggle--on" : ""}`}
                onClick={() => setTwoFA(v => !v)}
              >
                <span className="toggle-thumb" />
              </button>
            </div>
            {twoFA && (
              <div className="info-box info-box--indigo">
                In production, show a QR code here for the user to scan with Google Authenticator / Authy, then verify with a 6-digit code before activating.
              </div>
            )}
          </div>

          {/* Sessions */}
          <div className="section-block">
            <div className="block-title">Active sessions</div>
            {sessions.map(s => (
              <div className="session-row" key={s.id}>
                <div className={`session-dot ${s.current ? "session-dot--active" : ""}`} />
                <div className="session-info">
                  <span className="session-device">{s.device}</span>
                  <span className="session-meta">{s.location} · {s.time}</span>
                </div>
                {s.current
                  ? <span className="badge-current">Current</span>
                  : <button className="btn-ghost btn-ghost--red" onClick={() => revokeSession(s.id)}>Revoke</button>
                }
              </div>
            ))}
            {sessions.filter(s => !s.current).length > 0 && (
              <button
                className="btn-ghost btn-ghost--red"
                style={{ alignSelf: "flex-start", marginTop: "0.25rem" }}
                onClick={() => setSessions(s => s.filter(x => x.current))}
              >
                Sign out all other sessions
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}