"use client";

// app/admin/settings/page.tsx
import Link from "next/link";
import { useTranslation } from "@/app/lib/i18n/context";

export default function SettingsHubPage() {
  const { t, locale, setLocale } = useTranslation();

  // ✅ Moved inside the component — rebuilds on every locale change
  const SECTIONS = [
    {
      label: t("settings.sections.restaurant.label"),
      items: [
        { href: "/settings/business-profile", icon: "🏪", iconClass: "orange", label: t("settings.sections.restaurant.businessProfile.label"), desc: t("settings.sections.restaurant.businessProfile.desc"), badge: null },
      //  { href: "/settings/menu",             icon: "🍽️", iconClass: "teal",   label: t("settings.sections.restaurant.menu.label"),            desc: t("settings.sections.restaurant.menu.desc"),            badge: null },
        { href: "/settings/opening-hours",    icon: "🕐", iconClass: "amber",  label: t("settings.sections.restaurant.openingHours.label"),    desc: t("settings.sections.restaurant.openingHours.desc"),    badge: { label: t("settings.badges.live"), style: "green" } },
      ],
    },
    {
      label: t("settings.sections.ordersPayments.label"),
      items: [
        { href: "/settings/paypal",            icon: "💳", iconClass: "sky",  label: t("settings.sections.ordersPayments.paypal.label"),           desc: t("settings.sections.ordersPayments.paypal.desc"),           badge: { label: t("settings.badges.notConnected"), style: "gray" } },
        { href: "/settings/delivery-settings", icon: "📦", iconClass: "gray", label: t("settings.sections.ordersPayments.deliverySettings.label"), desc: t("settings.sections.ordersPayments.deliverySettings.desc"), badge: null },
      ],
    },
    {
      label: t("settings.sections.account.label"),
      items: [
        { href: "/settings/auth-security",   icon: "🔐", iconClass: "violet", label: t("settings.sections.account.authSecurity.label"),   desc: t("settings.sections.account.authSecurity.desc"),   badge: null },
        { href: "/settings/contact-support", icon: "💬", iconClass: "sky",    label: t("settings.sections.account.contactSupport.label"), desc: t("settings.sections.account.contactSupport.desc"), badge: null },
        { href: "/settings/danger-zone",     icon: "⚠️", iconClass: "red",   label: t("settings.sections.account.dangerZone.label"),     desc: t("settings.sections.account.dangerZone.desc"),     badge: { label: t("settings.badges.destructive"), style: "red" } },
      ],
    },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --ink:    #111110;
          --ink2:   #4A4845;
          --ink3:   #8A8784;
          --border: #E8E7E3;
          --bg:     #FFFFFF;
          --bg2:    #F7F6F3;
          --radius: 12px;
        }
        body { font-family: 'DM Sans', sans-serif; background: var(--bg); color: var(--ink); }
        .root { min-height: 100vh; max-width: 760px; margin: 0 auto; padding: 16px; }

        .topbar {
          display: flex; align-items: center; gap: 6px;
          padding: 1.25rem 0;
          border-bottom: 0.5px solid var(--border);
          margin-bottom: 2rem;
        }
        .topbar-left { display: flex; align-items: center; gap: 6px; flex: 1; }
        .back { font-size: 13px; color: var(--ink3); text-decoration: none; transition: color .15s; }
        .back:hover { color: var(--ink2); }
        .sep { font-size: 13px; color: var(--border); }
        .crumb { font-size: 13px; color: var(--ink); font-weight: 500; }

        .lang-switcher {
          display: flex; align-items: center; gap: 2px;
          background: var(--bg2); border: 0.5px solid var(--border);
          border-radius: 8px; padding: 3px; flex-shrink: 0;
        }
        .lang-btn {
          font-size: 11px; font-weight: 500; padding: 3px 9px;
          border-radius: 6px; border: none; cursor: pointer;
          background: transparent; color: var(--ink3);
          transition: all .15s; font-family: inherit;
        }
        .lang-btn.active {
          background: var(--bg); color: var(--ink);
          box-shadow: 0 1px 3px rgba(0,0,0,0.08);
        }
        .lang-btn:hover:not(.active) { color: var(--ink2); }

        .page-title { font-size: 1.4rem; font-weight: 600; color: var(--ink); margin-bottom: 4px; }
        .page-sub   { font-size: 0.875rem; color: var(--ink3); margin-bottom: 2rem; }

        .section { margin-bottom: 1.5rem; }
        .section-label {
          font-size: 11px; font-weight: 600; color: var(--ink3);
          text-transform: uppercase; letter-spacing: .08em;
          margin-bottom: 8px;
        }

        .card-group {
          border: 0.5px solid var(--border);
          border-radius: var(--radius);
          overflow: hidden;
        }
        .card {
          display: flex; align-items: center; gap: 14px;
          padding: 13px 16px;
          background: var(--bg);
          text-decoration: none;
          border-top: 0.5px solid var(--border);
          transition: background .12s;
        }
        .card:first-child { border-top: none; }
        .card:hover { background: var(--bg2); }

        .icon {
          width: 36px; height: 36px; border-radius: 9px;
          display: flex; align-items: center; justify-content: center;
          font-size: 16px; flex-shrink: 0;
        }
        .icon-orange { background: #FEF3EC; }
        .icon-teal   { background: #E1F5EE; }
        .icon-amber  { background: #FAEEDA; }
        .icon-sky    { background: #E6F1FB; }
        .icon-gray   { background: var(--bg2); }
        .icon-violet { background: #EEEDFE; }
        .icon-red    { background: #FCEBEB; }

        .text { flex: 1; min-width: 0; }
        .card-label { font-size: 14px; font-weight: 500; color: var(--ink); }
        .card-desc  { font-size: 12px; color: var(--ink3); margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

        .right { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
        .badge { font-size: 11px; font-weight: 500; padding: 2px 9px; border-radius: 999px; }
        .badge-green  { background: #EAF3DE; color: #3B6D11; }
        .badge-gray   { background: var(--bg2); color: var(--ink3); }
        .badge-red    { background: #FCEBEB; color: #A32D2D; }
        .chevron { font-size: 16px; color: var(--ink3); }
      `}</style>

      <div className="root">
        <div className="topbar">
          <div className="topbar-left">
            <a href="/dashboard" className="back">← {t("settings.backToDashboard")}</a>
            <span className="sep">/</span>
            <span className="crumb">{t("settings.title")}</span>
          </div>

          {/* ── Language switcher ── */}
          <div className="lang-switcher">
            <button
              className={`lang-btn ${locale === "en" ? "active" : ""}`}
              onClick={() => setLocale("en")}
            >
              EN
            </button>
            <button
              className={`lang-btn ${locale === "de" ? "active" : ""}`}
              onClick={() => setLocale("de")}
            >
              DE
            </button>
          </div>
        </div>

        <div className="page-title">{t("settings.title")}</div>
        <div className="page-sub">{t("settings.sub")}</div>

        {SECTIONS.map((section) => (
          <div className="section" key={section.label}>
            <div className="section-label">{section.label}</div>
            <div className="card-group">
              {section.items.map((item) => (
                <Link key={item.href} href={item.href} className="card">
                  <div className={`icon icon-${item.iconClass}`}>{item.icon}</div>
                  <div className="text">
                    <div className="card-label">{item.label}</div>
                    <div className="card-desc">{item.desc}</div>
                  </div>
                  <div className="right">
                    {item.badge && (
                      <span className={`badge badge-${item.badge.style}`}>{item.badge.label}</span>
                    )}
                    <span className="chevron">›</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}