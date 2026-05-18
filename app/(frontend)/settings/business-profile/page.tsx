"use client";

import React, { useState, useEffect } from "react";
import { ImageUpload } from "@/components/ImageUpload";
import { useTranslation } from "@/app/lib/i18n/context";

// ── Types ─────────────────────────────────────────────────────────────────────
type ProfileData = {
  id?: string;
  name: string; tagline: string; description: string;
  address: string; city: string; postal_code: string;
  phone: string; email: string;
  logo_url: string; hero_image_url: string;
  instagram: string; facebook: string; tiktok: string; website: string;
};

const EMPTY: ProfileData = {
  name: "", tagline: "", description: "",
  address: "", city: "", postal_code: "", phone: "", email: "",
  logo_url: "", hero_image_url: "",
  instagram: "", facebook: "", tiktok: "", website: "",
};

// ── API helpers ───────────────────────────────────────────────────────────────
async function fetchProfile(): Promise<ProfileData | null> {
  const res = await fetch("/api/business-profile");
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Failed to load profile");
  return res.json();
}
async function createProfile(data: ProfileData): Promise<ProfileData> {
  const res = await fetch("/api/business-profile", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
  if (!res.ok) throw new Error("Failed to create profile");
  return res.json();
}
async function updateProfile(data: ProfileData): Promise<ProfileData> {
  const res = await fetch("/api/business-profile", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
  if (!res.ok) throw new Error("Failed to update profile");
  return res.json();
}

// ── Shared styles ─────────────────────────────────────────────────────────────
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;0,9..144,500;1,9..144,300&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --ink:      #1A1714;
    --ink2:     #4A4540;
    --ink3:     #8C8680;
    --border:   #E6E2DC;
    --border2:  #F0EDE8;
    --bg:       #FDFCFA;
    --bg2:      #F5F2ED;
    --bg3:      #EDE9E2;
    --accent:   #C4672A;
    --accent2:  #F5EBE0;
    --green:    #3B7A4A;
    --green-bg: #EBF4EE;
    --red:      #C0392B;
    --red-bg:   #FDECEB;
    --radius:   10px;
    --radius-lg: 16px;
    --shadow:   0 1px 3px rgba(0,0,0,0.07), 0 4px 16px rgba(0,0,0,0.04);
    --shadow-lg: 0 2px 8px rgba(0,0,0,0.08), 0 8px 32px rgba(0,0,0,0.06);
  }

  body { font-family: 'DM Sans', sans-serif; background: var(--bg); color: var(--ink); -webkit-font-smoothing: antialiased; }

  /* ── Layout ── */
  .bp-root { min-height: 100vh; }

  .bp-topbar {
    display: flex; align-items: center; justify-content: space-between;
    padding: 1rem 1.75rem;
    border-bottom: 1px solid var(--border2);
    background: var(--bg);
    position: sticky; top: 0; z-index: 100;
    backdrop-filter: blur(8px);
  }
  .bp-topbar-left { display: flex; align-items: center; gap: 8px; }
  .bp-back {
    display: inline-flex; align-items: center; gap: 5px;
    font-size: 13px; color: var(--ink3); text-decoration: none;
    padding: 5px 10px; border-radius: 7px;
    transition: all .15s; border: 1px solid transparent;
  }
  .bp-back:hover { color: var(--ink2); background: var(--bg2); border-color: var(--border); }
  .bp-sep { font-size: 13px; color: var(--border); }
  .bp-crumb { font-size: 13px; color: var(--ink); font-weight: 500; font-family: 'Fraunces', serif; }

  /* ── Body ── */
  .bp-body { max-width: 680px; margin: 0 auto; padding: 2.5rem 1.75rem 5rem; }

  /* ── Page heading ── */
  .bp-heading { margin-bottom: 2.25rem; }
  .bp-heading h1 { font-family: 'Fraunces', serif; font-size: 2rem; font-weight: 400; color: var(--ink); line-height: 1.15; margin-bottom: 6px; }
  .bp-heading p { font-size: 14px; color: var(--ink3); line-height: 1.6; }

  /* ── Steps ── */
  .bp-steps {
    display: flex; align-items: center; gap: 0;
    margin-bottom: 2.25rem;
    background: var(--bg2); border: 1px solid var(--border);
    border-radius: var(--radius-lg); padding: 12px 20px;
  }
  .bp-step { display: flex; align-items: center; gap: 8px; flex: 1; }
  .bp-step-num {
    width: 26px; height: 26px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 11px; font-weight: 700; flex-shrink: 0;
    border: 1.5px solid var(--border);
    background: var(--bg); color: var(--ink3);
    transition: all .2s;
  }
  .bp-step--active .bp-step-num { background: var(--ink); border-color: var(--ink); color: #fff; }
  .bp-step--done .bp-step-num { background: var(--green); border-color: var(--green); color: #fff; }
  .bp-step-label { font-size: 12.5px; font-weight: 500; color: var(--ink3); transition: color .2s; }
  .bp-step--active .bp-step-label { color: var(--ink); }
  .bp-step--done .bp-step-label { color: var(--green); }
  .bp-step-divider { flex: 0 0 24px; height: 1px; background: var(--border); margin: 0 4px; }

  /* ── Sections ── */
  .bp-section {
    background: var(--bg); border: 1px solid var(--border);
    border-radius: var(--radius-lg); overflow: hidden;
    margin-bottom: 1.25rem;
    box-shadow: var(--shadow);
  }
  .bp-section-header {
    padding: 16px 22px 14px;
    border-bottom: 1px solid var(--border2);
    display: flex; align-items: flex-start; gap: 12px;
  }
  .bp-section-icon {
    width: 34px; height: 34px; border-radius: 9px;
    background: var(--bg2); border: 1px solid var(--border);
    display: flex; align-items: center; justify-content: center;
    font-size: 16px; flex-shrink: 0; margin-top: 1px;
  }
  .bp-section-title { font-family: 'Fraunces', serif; font-size: 15px; font-weight: 400; color: var(--ink); margin-bottom: 2px; }
  .bp-section-sub { font-size: 12px; color: var(--ink3); line-height: 1.5; }
  .bp-section-body { padding: 20px 22px; display: flex; flex-direction: column; gap: 16px; }

  /* ── Fields ── */
  .bp-field { display: flex; flex-direction: column; gap: 5px; }
  .bp-field label { font-size: 12.5px; font-weight: 600; color: var(--ink2); letter-spacing: 0.01em; }
  .bp-field input,
  .bp-field textarea,
  .bp-field select {
    width: 100%; padding: 9px 13px;
    border: 1px solid var(--border);
    border-radius: var(--radius); background: var(--bg);
    font-family: 'DM Sans', sans-serif; font-size: 14px; color: var(--ink);
    transition: border-color .15s, box-shadow .15s; outline: none;
    resize: vertical;
  }
  .bp-field input:focus,
  .bp-field textarea:focus { border-color: var(--ink); box-shadow: 0 0 0 3px rgba(26,23,20,0.06); }
  .bp-field input::placeholder,
  .bp-field textarea::placeholder { color: var(--ink3); }
  .bp-field-hint {
    font-size: 11.5px; color: var(--ink3); line-height: 1.5;
    display: flex; align-items: flex-start; gap: 5px;
    padding: 8px 11px; background: var(--bg2);
    border-radius: 7px; border: 1px solid var(--border2);
  }
  .bp-field-hint-icon { font-size: 13px; flex-shrink: 0; margin-top: 0px; }

  .bp-field-row { display: grid; grid-template-columns: 1fr 140px; gap: 12px; }
  .bp-field-row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

  /* ── Social field ── */
  .bp-social-field { display: flex; flex-direction: column; gap: 5px; }
  .bp-social-field label { font-size: 12.5px; font-weight: 600; color: var(--ink2); }
  .bp-social-input-wrap { display: flex; align-items: center; border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden; transition: border-color .15s, box-shadow .15s; background: var(--bg); }
  .bp-social-input-wrap:focus-within { border-color: var(--ink); box-shadow: 0 0 0 3px rgba(26,23,20,0.06); }
  .bp-social-prefix { padding: 9px 12px; background: var(--bg2); border-right: 1px solid var(--border); font-size: 12px; color: var(--ink3); white-space: nowrap; flex-shrink: 0; }
  .bp-social-input { border: none !important; outline: none; background: transparent; padding: 9px 12px; font-family: 'DM Sans', sans-serif; font-size: 14px; color: var(--ink); width: 100%; }
  .bp-social-input::placeholder { color: var(--ink3); }

  /* ── Actions ── */
  .bp-actions {
    display: flex; align-items: center; justify-content: space-between;
    padding: 16px 22px;
    border-top: 1px solid var(--border2);
    background: var(--bg2);
  }
  .bp-actions-right { display: flex; align-items: center; gap: 10px; }

  /* ── Buttons ── */
  .bp-btn-primary {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 9px 20px; border-radius: var(--radius);
    background: var(--ink); color: #fff; border: 1px solid var(--ink);
    font-family: 'DM Sans', sans-serif; font-size: 13.5px; font-weight: 600;
    cursor: pointer; transition: all .15s; white-space: nowrap;
  }
  .bp-btn-primary:hover:not(:disabled) { background: var(--ink2); }
  .bp-btn-primary:disabled { opacity: 0.55; cursor: not-allowed; }
  .bp-btn-primary--ok { background: var(--green) !important; border-color: var(--green) !important; }

  .bp-btn-ghost {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 9px 16px; border-radius: var(--radius);
    background: transparent; color: var(--ink2);
    border: 1px solid var(--border);
    font-family: 'DM Sans', sans-serif; font-size: 13.5px; font-weight: 500;
    cursor: pointer; transition: all .15s;
  }
  .bp-btn-ghost:hover { background: var(--bg3); border-color: var(--ink3); }

  /* ── Badges ── */
  .bp-saved-badge {
    display: inline-flex; align-items: center; gap: 5px;
    font-size: 12.5px; font-weight: 500; color: var(--green);
    background: var(--green-bg); padding: 5px 12px;
    border-radius: 999px; border: 1px solid #c3e6cc;
  }
  .bp-error-badge {
    font-size: 12.5px; color: var(--red);
    background: var(--red-bg); padding: 5px 12px;
    border-radius: 999px; border: 1px solid #f5c6c4;
  }
  .bp-required-note { font-size: 12px; color: var(--ink3); }

  /* ── Loading ── */
  .bp-loading {
    min-height: 100vh; display: flex; align-items: center; justify-content: center;
    flex-direction: column; gap: 12px;
  }
  .bp-spinner {
    width: 22px; height: 22px; border-radius: 50%;
    border: 2px solid var(--border); border-top-color: var(--ink);
    animation: bp-spin .7s linear infinite;
  }
  @keyframes bp-spin { to { transform: rotate(360deg); } }
  .bp-loading-text { font-size: 13px; color: var(--ink3); }

  /* ── Responsive ── */
  @media (max-width: 600px) {
    .bp-body { padding: 1.5rem 1rem 4rem; }
    .bp-topbar { padding: 0.875rem 1rem; }
    .bp-field-row, .bp-field-row-2 { grid-template-columns: 1fr; }
    .bp-steps { padding: 10px 14px; }
    .bp-step-label { display: none; }
  }
`;

// ── RegisterForm ──────────────────────────────────────────────────────────────
function RegisterForm({ onComplete }: { onComplete: (data: ProfileData) => void }) {
  const { t } = useTranslation();
  const [step, setStep] = useState(1);
  const [data, setData] = useState<ProfileData>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function update(k: keyof ProfileData, v: string) {
    setData(d => ({ ...d, [k]: v }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const created = await createProfile(data);
      onComplete(created);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("bp.errors.generic"));
    } finally { setLoading(false); }
  }

  const stepLabels = [t("bp.steps.identity"), t("bp.steps.location"), t("bp.steps.branding")];

  return (
    <div className="bp-root">
      <style>{STYLES}</style>
      <div className="bp-topbar">
        <div className="bp-topbar-left">
          <a href="/settings" className="bp-back">← {t("bp.backToSettings")}</a>
          <span className="bp-sep">/</span>
          <span className="bp-crumb">{t("bp.title")}</span>
        </div>
      </div>

      <div className="bp-body">
        <div className="bp-heading">
          <h1>{t("bp.register.heading")}</h1>
          <p>{t("bp.register.sub")}</p>
        </div>

        {/* Steps */}
        <div className="bp-steps">
          {stepLabels.map((label, i) => {
            const n = i + 1;
            const cls = n < step ? "done" : n === step ? "active" : "";
            return (
              <React.Fragment key={label}>
                <div className={`bp-step bp-step--${cls}`}>
                  <div className="bp-step-num">{n < step ? "✓" : n}</div>
                  <span className="bp-step-label">{label}</span>
                </div>
                {i < 2 && <div className="bp-step-divider" />}
              </React.Fragment>
            );
          })}
        </div>

        <form onSubmit={handleSubmit}>
          {step === 1 && (
            <div className="bp-section">
              <div className="bp-section-header">
                <div className="bp-section-icon">🏷️</div>
                <div>
                  <div className="bp-section-title">{t("bp.sections.identity.title")}</div>
                  <div className="bp-section-sub">{t("bp.sections.identity.sub")}</div>
                </div>
              </div>
              <div className="bp-section-body">
                <div className="bp-field">
                  <label>{t("bp.fields.name.label")} *</label>
                  <input required value={data.name} onChange={e => update("name", e.target.value)} placeholder={t("bp.fields.name.placeholder")} />
                </div>
                <div className="bp-field">
                  <label>{t("bp.fields.tagline.label")}</label>
                  <input value={data.tagline} onChange={e => update("tagline", e.target.value)} placeholder={t("bp.fields.tagline.placeholder")} />
                  <div className="bp-field-hint">
                    <span className="bp-field-hint-icon">💡</span>
                    {t("bp.fields.tagline.hint")}
                  </div>
                </div>
                <div className="bp-field">
                  <label>{t("bp.fields.description.label")}</label>
                  <textarea rows={4} value={data.description} onChange={e => update("description", e.target.value)} placeholder={t("bp.fields.description.placeholder")} />
                  <div className="bp-field-hint">
                    <span className="bp-field-hint-icon">✍️</span>
                    {t("bp.fields.description.hint")}
                  </div>
                </div>
              </div>
              <div className="bp-actions">
                <span className="bp-required-note">{t("bp.requiredNote")}</span>
                <button type="button" className="bp-btn-primary" onClick={() => setStep(2)} disabled={!data.name.trim()}>
                  {t("bp.continue")} →
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="bp-section">
              <div className="bp-section-header">
                <div className="bp-section-icon">📍</div>
                <div>
                  <div className="bp-section-title">{t("bp.sections.location.title")}</div>
                  <div className="bp-section-sub">{t("bp.sections.location.sub")}</div>
                </div>
              </div>
              <div className="bp-section-body">
                <div className="bp-field">
                  <label>{t("bp.fields.address.label")}</label>
                  <input value={data.address} onChange={e => update("address", e.target.value)} placeholder={t("bp.fields.address.placeholder")} />
                </div>
                <div className="bp-field-row">
                  <div className="bp-field">
                    <label>{t("bp.fields.city.label")}</label>
                    <input value={data.city} onChange={e => update("city", e.target.value)} placeholder={t("bp.fields.city.placeholder")} />
                  </div>
                  <div className="bp-field">
                    <label>{t("bp.fields.postalCode.label")}</label>
                    <input value={data.postal_code} onChange={e => update("postal_code", e.target.value)} placeholder={t("bp.fields.postalCode.placeholder")} />
                  </div>
                </div>
                <div className="bp-field-row-2">
                  <div className="bp-field">
                    <label>{t("bp.fields.phone.label")}</label>
                    <input type="tel" value={data.phone} onChange={e => update("phone", e.target.value)} placeholder={t("bp.fields.phone.placeholder")} />
                  </div>
                  <div className="bp-field">
                    <label>{t("bp.fields.email.label")}</label>
                    <input type="email" value={data.email} onChange={e => update("email", e.target.value)} placeholder={t("bp.fields.email.placeholder")} />
                  </div>
                </div>
              </div>
              <div className="bp-actions">
                <button type="button" className="bp-btn-ghost" onClick={() => setStep(1)}>← {t("bp.back")}</button>
                <button type="button" className="bp-btn-primary" onClick={() => setStep(3)}>{t("bp.continue")} →</button>
              </div>
            </div>
          )}

          {step === 3 && (
            <>
              <div className="bp-section">
                <div className="bp-section-header">
                  <div className="bp-section-icon">🎨</div>
                  <div>
                    <div className="bp-section-title">{t("bp.sections.branding.title")}</div>
                    <div className="bp-section-sub">{t("bp.sections.branding.sub")}</div>
                  </div>
                </div>
                <div className="bp-section-body">
                  <div className="bp-field">
                    <label>{t("bp.fields.logo.label")}</label>
                    <ImageUpload label={t("bp.fields.logo.label")} type="logo" value={data.logo_url} onChange={url => update("logo_url", url)} />
                    <div className="bp-field-hint">
                      <span className="bp-field-hint-icon">🖼️</span>
                      {t("bp.fields.logo.hint")}
                    </div>
                  </div>
                  <div className="bp-field">
                    <label>{t("bp.fields.hero.label")}</label>
                    <ImageUpload label={t("bp.fields.hero.label")} type="hero" value={data.hero_image_url} onChange={url => update("hero_image_url", url)} />
                    <div className="bp-field-hint">
                      <span className="bp-field-hint-icon">📸</span>
                      {t("bp.fields.hero.hint")}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bp-section">
                <div className="bp-section-header">
                  <div className="bp-section-icon">🔗</div>
                  <div>
                    <div className="bp-section-title">{t("bp.sections.social.title")}</div>
                    <div className="bp-section-sub">{t("bp.sections.social.sub")}</div>
                  </div>
                </div>
                <div className="bp-section-body">
                  {(["instagram", "facebook", "tiktok", "website"] as const).map(k => (
                    <div className="bp-social-field" key={k}>
                      <label>{k.charAt(0).toUpperCase() + k.slice(1)}</label>
                      <div className="bp-social-input-wrap">
                        <span className="bp-social-prefix">
                          {k === "website" ? "https://" : `${k}.com/`}
                        </span>
                        <input
                          className="bp-social-input"
                          value={data[k].replace(/^https?:\/\/(www\.)?(instagram|facebook|tiktok)\.com\//, "").replace(/^https?:\/\//, "")}
                          onChange={e => {
                            const v = e.target.value;
                            update(k, k === "website" ? `https://${v}` : `https://${k}.com/${v}`);
                          }}
                          placeholder={k === "website" ? t("bp.fields.website.placeholder") : `your${k}handle`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bp-section" style={{ background: "transparent", border: "none", boxShadow: "none" }}>
                <div className="bp-actions" style={{ background: "transparent", border: "none", padding: "0" }}>
                  <button type="button" className="bp-btn-ghost" onClick={() => setStep(2)}>← {t("bp.back")}</button>
                  <div className="bp-actions-right">
                    {error && <span className="bp-error-badge">{error}</span>}
                    <button type="submit" className="bp-btn-primary" disabled={loading}>
                      {loading ? t("bp.saving") : t("bp.register.saveBtn")}
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
}

// ── EditProfile ───────────────────────────────────────────────────────────────
function EditProfile({ data: initial }: { data: ProfileData }) {
  const { t } = useTranslation();
  const [data, setData] = useState(initial);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function update(k: keyof ProfileData, v: string) {
    setData(d => ({ ...d, [k]: v }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const updated = await updateProfile(data);
      setData(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("bp.errors.saveFailed"));
    } finally { setLoading(false); }
  }

  return (
    <div className="bp-root">
      <style>{STYLES}</style>
      <div className="bp-topbar">
        <div className="bp-topbar-left">
          <a href="/settings" className="bp-back">← {t("bp.backToSettings")}</a>
          <span className="bp-sep">/</span>
          <span className="bp-crumb">{t("bp.title")}</span>
        </div>
        <div className="bp-actions-right" style={{ gap: 8 }}>
          {saved && <span className="bp-saved-badge">✓ {t("bp.changesSaved")}</span>}
          {error && <span className="bp-error-badge">{error}</span>}
          <button form="edit-form" type="submit" className={`bp-btn-primary ${saved ? "bp-btn-primary--ok" : ""}`} disabled={loading}>
            {loading ? t("bp.saving") : saved ? `✓ ${t("bp.saved")}` : t("bp.saveChanges")}
          </button>
        </div>
      </div>

      <div className="bp-body">
        <div className="bp-heading">
          <h1>{t("bp.title")}</h1>
          <p>{t("bp.edit.sub")}</p>
        </div>

        <form id="edit-form" onSubmit={handleSave}>

          {/* Identity */}
          <div className="bp-section">
            <div className="bp-section-header">
              <div className="bp-section-icon">🏷️</div>
              <div>
                <div className="bp-section-title">{t("bp.sections.identity.title")}</div>
                <div className="bp-section-sub">{t("bp.sections.identity.sub")}</div>
              </div>
            </div>
            <div className="bp-section-body">
              <div className="bp-field">
                <label>{t("bp.fields.name.label")}</label>
                <input value={data.name} onChange={e => update("name", e.target.value)} />
              </div>
              <div className="bp-field">
                <label>{t("bp.fields.tagline.label")}</label>
                <input value={data.tagline} onChange={e => update("tagline", e.target.value)} placeholder={t("bp.fields.tagline.placeholder")} />
                <div className="bp-field-hint">
                  <span className="bp-field-hint-icon">💡</span>
                  {t("bp.fields.tagline.hint")}
                </div>
              </div>
              <div className="bp-field">
                <label>{t("bp.fields.description.label")}</label>
                <textarea rows={4} value={data.description} onChange={e => update("description", e.target.value)} placeholder={t("bp.fields.description.placeholder")} />
                <div className="bp-field-hint">
                  <span className="bp-field-hint-icon">✍️</span>
                  {t("bp.fields.description.hint")}
                </div>
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="bp-section">
            <div className="bp-section-header">
              <div className="bp-section-icon">📍</div>
              <div>
                <div className="bp-section-title">{t("bp.sections.location.title")}</div>
                <div className="bp-section-sub">{t("bp.sections.location.sub")}</div>
              </div>
            </div>
            <div className="bp-section-body">
              <div className="bp-field">
                <label>{t("bp.fields.address.label")}</label>
                <input value={data.address} onChange={e => update("address", e.target.value)} placeholder={t("bp.fields.address.placeholder")} />
              </div>
              <div className="bp-field-row">
                <div className="bp-field">
                  <label>{t("bp.fields.city.label")}</label>
                  <input value={data.city} onChange={e => update("city", e.target.value)} />
                </div>
                <div className="bp-field">
                  <label>{t("bp.fields.postalCode.label")}</label>
                  <input value={data.postal_code} onChange={e => update("postal_code", e.target.value)} />
                </div>
              </div>
              <div className="bp-field-row-2">
                <div className="bp-field">
                  <label>{t("bp.fields.phone.label")}</label>
                  <input type="tel" value={data.phone} onChange={e => update("phone", e.target.value)} />
                </div>
                <div className="bp-field">
                  <label>{t("bp.fields.email.label")}</label>
                  <input type="email" value={data.email} onChange={e => update("email", e.target.value)} />
                </div>
              </div>
            </div>
          </div>

          {/* Branding */}
          <div className="bp-section">
            <div className="bp-section-header">
              <div className="bp-section-icon">🎨</div>
              <div>
                <div className="bp-section-title">{t("bp.sections.branding.title")}</div>
                <div className="bp-section-sub">{t("bp.sections.branding.sub")}</div>
              </div>
            </div>
            <div className="bp-section-body">
              <div className="bp-field">
                <label>{t("bp.fields.logo.label")}</label>
                <ImageUpload label={t("bp.fields.logo.label")} type="logo" value={data.logo_url} onChange={url => update("logo_url", url)} />
                <div className="bp-field-hint">
                  <span className="bp-field-hint-icon">🖼️</span>
                  {t("bp.fields.logo.hint")}
                </div>
              </div>
              <div className="bp-field">
                <label>{t("bp.fields.hero.label")}</label>
                <ImageUpload label={t("bp.fields.hero.label")} type="hero" value={data.hero_image_url} onChange={url => update("hero_image_url", url)} />
                <div className="bp-field-hint">
                  <span className="bp-field-hint-icon">📸</span>
                  {t("bp.fields.hero.hint")}
                </div>
              </div>
            </div>
          </div>

          {/* Social */}
          <div className="bp-section">
            <div className="bp-section-header">
              <div className="bp-section-icon">🔗</div>
              <div>
                <div className="bp-section-title">{t("bp.sections.social.title")}</div>
                <div className="bp-section-sub">{t("bp.sections.social.sub")}</div>
              </div>
            </div>
            <div className="bp-section-body">
              {(["instagram", "facebook", "tiktok", "website"] as const).map(k => (
                <div className="bp-social-field" key={k}>
                  <label>{k.charAt(0).toUpperCase() + k.slice(1)}</label>
                  <div className="bp-social-input-wrap">
                    <span className="bp-social-prefix">
                      {k === "website" ? "https://" : `${k}.com/`}
                    </span>
                    <input
                      className="bp-social-input"
                      value={data[k].replace(/^https?:\/\/(www\.)?(instagram|facebook|tiktok)\.com\//, "").replace(/^https?:\/\//, "")}
                      onChange={e => {
                        const v = e.target.value;
                        update(k, k === "website" ? `https://${v}` : `https://${k}.com/${v}`);
                      }}
                      placeholder={k === "website" ? t("bp.fields.website.placeholder") : `your${k}handle`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

        </form>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function BusinessProfilePage() {
  const { t } = useTranslation();
  const [profile, setProfile] = useState<ProfileData | null | "loading">("loading");

  useEffect(() => {
    fetchProfile().then(setProfile).catch(() => setProfile(null));
  }, []);

  if (profile === "loading") return (
    <>
      <style>{STYLES}</style>
      <div className="bp-loading">
        <div className="bp-spinner" />
        <span className="bp-loading-text">{t("bp.loading")}</span>
      </div>
    </>
  );

  if (!profile) return <RegisterForm onComplete={setProfile} />;
  return <EditProfile data={profile} />;
}