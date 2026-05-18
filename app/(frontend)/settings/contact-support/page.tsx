"use client";

// app/admin/settings/contact-support/page.tsx

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
  padding: 1.25rem 2.5rem;
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

.page-heading { margin-bottom: 2.5rem; }

.page-heading h1 {
  font-family: 'DM Serif Display', serif;
  font-size: 2rem;
  font-weight: 400;
  color: #111;
  letter-spacing: -0.02em;
}

.page-heading p {
  margin-top: 0.5rem;
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
}

.field label {
  font-size: 0.775rem;
  color: #666;
  font-weight: 500;
}

.field input,
.field textarea,
.field select {
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
  resize: vertical;
}

.field input:focus,
.field textarea:focus,
.field select:focus {
  border-color: #0ea5e9;
}

.field input::placeholder,
.field textarea::placeholder {
  color: #aaa;
}

.field select {
  appearance: none;
  cursor: pointer;
}

.field-row {
  display: flex;
  gap: 0.85rem;
  flex-wrap: wrap;
}

.field-row .field {
  flex: 1;
  min-width: 0;
}

.btn-primary {
  background: #0ea5e9;
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

.btn-primary:hover { background: #0284c7; }

.btn-primary--ok { background: #2d7a4f; }

.form-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding-top: 0.25rem;
}

.sent-badge {
  font-size: 0.775rem;
  color: #2d7a4f;
}

/* Quick links */
.link-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}

.link-card {
  background: #ffffff;
  border: 1px solid #e5e5e5;
  border-radius: 12px;
  padding: 1.1rem 1.1rem 1rem;
  text-decoration: none;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  position: relative;
  transition: border-color 0.15s, transform 0.15s;
}

.link-card:hover {
  border-color: #0ea5e9;
  transform: translateY(-1px);
}

.link-card-icon {
  font-size: 1.1rem;
  margin-bottom: 0.15rem;
}

.link-card-title {
  font-size: 0.875rem;
  color: #111;
  font-weight: 500;
}

.link-card-desc {
  font-size: 0.775rem;
  color: #666;
}

.link-card-arrow {
  position: absolute;
  top: 1rem;
  right: 1rem;
  color: #aaa;
  font-size: 0.85rem;
  transition: color 0.15s, transform 0.15s;
}

.link-card:hover .link-card-arrow {
  color: #0ea5e9;
  transform: translateX(2px);
}

/* FAQ */
.faq-item {
  border-bottom: 1px solid #eee;
}

.faq-item:last-child {
  border-bottom: none;
}

.faq-q {
  width: 100%;
  background: none;
  border: none;
  text-align: left;
  padding: 0.85rem 0;
  font-size: 0.875rem;
  color: #666;
  font-family: inherit;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  transition: color 0.15s;
}

.faq-q:hover { color: #111; }

.faq-q--open { color: #111; }

.faq-chevron {
  font-size: 0.7rem;
  color: #aaa;
  transition: transform 0.2s;
  flex-shrink: 0;
}

.faq-q--open .faq-chevron {
  transform: rotate(180deg);
  color: #0ea5e9;
}

.faq-a {
  font-size: 0.825rem;
  color: #666;
  line-height: 1.6;
  padding-bottom: 0.85rem;
}

@media (max-width: 520px) {
  .link-grid {
    grid-template-columns: 1fr;
  }
}
`;

const FAQ = [
  { q: "How do I change the menu on the front site?", a: "Go to Menu in the sidebar, then edit products or categories. Changes are reflected on the public site immediately." },
  { q: "Can customers order without an account?", a: "Yes. Guest checkout is supported — orders can be placed with just a name, email, and phone number." },
  { q: "How do I temporarily close the restaurant?", a: "In Settings → Danger zone, you can pause online ordering with one click. You can also adjust opening hours in the schedule settings." },
  { q: "Where do I find my order history?", a: "Open the Orders section from the admin sidebar. You can filter by status, date range, or customer name." },
];

export default function ContactSupportPage() {
  const [sent, setSent] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    setSent(true);
    setTimeout(() => setSent(false), 3000);
  }

  return (
    <>
      <style>{S}</style>
      <div className="page-root">
        <div className="page-topbar">
          <a href="/admin/settings" className="page-back">← Settings</a>
          <span className="page-sep">/</span>
          <span className="page-crumb">Contact & support</span>
        </div>
        <div className="page-body">
          <div className="page-heading">
            <h1>Contact & support</h1>
            <p>Browse quick links, check common questions, or send us a message.</p>
          </div>

          {/* Quick links */}
          <div className="section-block">
            <div className="block-title">Quick links</div>
            <div className="link-grid">
              {[
                { icon: "📖", label: "Documentation",  desc: "Guides & reference",    href: "#" },
                { icon: "🟢", label: "Status page",     desc: "Uptime & incidents",    href: "#" },
                { icon: "🚀", label: "Changelog",       desc: "Latest updates",        href: "#" },
                { icon: "🗣️", label: "Community",       desc: "Forum & discussions",   href: "#" },
              ].map(l => (
                <a key={l.label} href={l.href} className="link-card">
                  <span className="link-card-icon">{l.icon}</span>
                  <span className="link-card-title">{l.label}</span>
                  <span className="link-card-desc">{l.desc}</span>
                  <span className="link-card-arrow">→</span>
                </a>
              ))}
            </div>
          </div>

          {/* FAQ */}
          <div className="section-block">
            <div className="block-title">Common questions</div>
            {FAQ.map((item, i) => (
              <div className="faq-item" key={i}>
                <button
                  className={`faq-q ${openFaq === i ? "faq-q--open" : ""}`}
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  {item.q}
                  <span className="faq-chevron">▼</span>
                </button>
                {openFaq === i && <p className="faq-a">{item.a}</p>}
              </div>
            ))}
          </div>

          {/* Contact form */}
          <div className="section-block">
            <div className="block-title">Send a message</div>
            <form onSubmit={handleSend}>
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div className="field-row">
                  <div className="field">
                    <label>Subject</label>
                    <select>
                      <option>General question</option>
                      <option>Bug report</option>
                      <option>Billing issue</option>
                      <option>Feature request</option>
                      <option>Account help</option>
                    </select>
                  </div>
                  <div className="field">
                    <label>Priority</label>
                    <select>
                      <option>Normal</option>
                      <option>High</option>
                      <option>Urgent</option>
                    </select>
                  </div>
                </div>
                <div className="field">
                  <label>Message</label>
                  <textarea rows={4} placeholder="Describe your issue in detail…" required />
                </div>
                <div className="form-row">
                  {sent && <span className="sent-badge">✓ Message sent — we'll reply within 24h</span>}
                  <button type="submit" className={`btn-primary ${sent ? "btn-primary--ok" : ""}`} style={{ marginLeft: "auto" }}>
                    {sent ? "Sent ✓" : "Send message"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}