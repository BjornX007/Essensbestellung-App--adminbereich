"use client";

import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useTranslation } from "@/app/lib/i18n/context";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  user: { name?: string | null; email?: string | null } | null;
}

export default function Sidebar({ collapsed, onToggle, user }: SidebarProps) {
  const { t } = useTranslation();
  const pathname = usePathname();
  const router = useRouter();
  const [isMobile, setIsMobile] = useState<boolean | null>(null);
  const [isLandscape, setIsLandscape] = useState(false);

  const navItems = [
    {
      label: t("nav.overview"),
      href: "/dashboard",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
          <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
        </svg>
      ),
    },
    {
      label: t("nav.orders"),
      href: "/orders",
      badge: 12,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
        </svg>
      ),
    },
    {
      label: t("nav.menu"),
      href: "/menu",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 002-2V2"/><path d="M7 2v20"/>
          <path d="M21 15V2a5 5 0 00-5 5v6c0 1.1.9 2 2 2h3zm0 0v7"/>
        </svg>
      ),
    },
    {
      label: t("nav.settings"),
      href: "/settings",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3"/>
          <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
        </svg>
      ),
    },
  ];

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const check = () => {
      setIsLandscape(window.innerWidth > window.innerHeight && window.innerWidth < 900);
    };
    check();
    window.addEventListener("resize", check);
    window.addEventListener("orientationchange", check);
    return () => {
      window.removeEventListener("resize", check);
      window.removeEventListener("orientationchange", check);
    };
  }, []);

  if (isMobile === null) return null;

  /* ─── Mobile nav ─── */
  if (isMobile) {
    return (
      <nav
        style={
          isLandscape
            ? {
                position: "fixed", top: 0, left: 0, bottom: 0,
                width: "70px", height: "100dvh",
                background: "#F0F0F0", borderRight: "1px solid #e5e7eb",
                display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "space-around",
                zIndex: 500, paddingLeft: "env(safe-area-inset-left, 0px)",
              }
            : {
                position: "fixed", bottom: 0, left: 0, right: 0,
                height: "70px", background: "#F0F0F0",
                borderTop: "1px solid #e5e7eb", display: "flex",
                alignItems: "center", justifyContent: "space-around",
                zIndex: 500, paddingBottom: "env(safe-area-inset-bottom, 0px)",
              }
        }
      >
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              style={{
                display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center",
                gap: "3px",
                ...(isLandscape ? { width: "100%", flex: 1 } : { flex: 1, height: "100%" }),
                color: active ? "#111827" : "#9ca3af",
                position: "relative", background: "none", border: "none",
                padding: 0, margin: 0, cursor: "pointer",
                WebkitTapHighlightColor: "transparent", minHeight: "44px",
              }}
            >
              {active && (
                <span style={isLandscape
                  ? { position: "absolute", right: "6px", top: "50%", transform: "translateY(-50%)", width: "4px", height: "4px", borderRadius: "50%", background: "#111827" }
                  : { position: "absolute", top: "6px", left: "50%", transform: "translateX(-50%)", width: "4px", height: "4px", borderRadius: "50%", background: "#111827" }
                }/>
              )}
              <span style={{ position: "relative" }}>
                {item.icon}
                {item.badge && (
                  <span style={{ position: "absolute", top: "-5px", right: "-8px", background: "#111827", color: "#fff", fontSize: "9px", fontWeight: 700, padding: "1px 5px", borderRadius: "99px" }}>
                    {item.badge}
                  </span>
                )}
              </span>
              <span style={{ fontSize: "10px", fontWeight: active ? 600 : 400 }}>{item.label}</span>
            </button>
          );
        })}
      </nav>
    );
  }

  /* ─── Desktop sidebar ─── */
  const initials = user?.name
    ? user.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() ?? "?";

  return (
    <aside style={{ width: "100%", height: "100vh", background: "#ffffff", borderRight: "1px solid #e5e7eb", display: "flex", flexDirection: "column", overflow: "hidden", position: "relative", flexShrink: 0 }}>
      {/* Logo */}
      <div style={{ padding: collapsed ? "24px 0" : "24px 20px", borderBottom: "1px solid #e5e7eb", display: "flex", alignItems: "center", gap: "12px", justifyContent: collapsed ? "center" : "flex-start", transition: "padding 0.3s cubic-bezier(0.4,0,0.2,1)", flexShrink: 0 }}>
        <div style={{ width: "34px", height: "34px", background: "#111827", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 002-2V2"/><path d="M7 2v20"/>
            <path d="M21 15V2a5 5 0 00-5 5v6c0 1.1.9 2 2 2h3zm0 0v7"/>
          </svg>
        </div>
        <div style={{ overflow: "hidden", opacity: collapsed ? 0 : 1, width: collapsed ? 0 : "auto", transition: "opacity 0.2s ease, width 0.3s cubic-bezier(0.4,0,0.2,1)", whiteSpace: "nowrap" }}>
          <div style={{ fontSize: "15px", fontWeight: 700, color: "#111827" }}>Almira</div>
          <div style={{ fontSize: "10px", color: "#9ca3af", letterSpacing: "0.1em", textTransform: "uppercase" }}>{t("nav.adminPanel")}</div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "12px 0", overflowY: "auto", overflowX: "hidden" }}>
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              title={collapsed ? item.label : undefined}
              style={{
                display: "flex", alignItems: "center", gap: "12px",
                padding: collapsed ? "10px 0" : "10px 16px",
                margin: "2px 8px", width: "calc(100% - 16px)",
                borderRadius: "8px", color: active ? "#111827" : "#6b7280",
                background: active ? "#f3f4f6" : "transparent",
                fontSize: "13.5px", fontWeight: active ? 600 : 400,
                transition: "all 0.15s ease", position: "relative",
                justifyContent: collapsed ? "center" : "flex-start",
                border: active ? "1px solid #e5e7eb" : "1px solid transparent",
                whiteSpace: "nowrap", cursor: "pointer",
                textAlign: "left", boxSizing: "border-box",
              }}
              onMouseEnter={(e) => { if (!active) { (e.currentTarget as HTMLButtonElement).style.background = "#f9fafb"; (e.currentTarget as HTMLButtonElement).style.color = "#111827"; }}}
              onMouseLeave={(e) => { if (!active) { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; (e.currentTarget as HTMLButtonElement).style.color = "#6b7280"; }}}
            >
              {active && <span style={{ position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)", width: "3px", height: "60%", background: "#111827", borderRadius: "0 2px 2px 0", marginLeft: "-8px" }}/>}
              <span style={{ flexShrink: 0 }}>{item.icon}</span>
              <span style={{ display: "flex", alignItems: "center", flex: 1, gap: "8px", overflow: "hidden", opacity: collapsed ? 0 : 1, width: collapsed ? 0 : "auto", transition: "opacity 0.2s ease, width 0.3s cubic-bezier(0.4,0,0.2,1)" }}>
                <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis" }}>{item.label}</span>
                {item.badge && <span style={{ background: "#111827", color: "#ffffff", fontSize: "10px", fontWeight: 700, padding: "1px 7px", borderRadius: "99px" }}>{item.badge}</span>}
              </span>
            </button>
          );
        })}
      </nav>

      {/* User */}
      <div style={{ padding: collapsed ? "14px 0" : "14px 16px 18px", borderTop: "1px solid #e5e7eb", display: "flex", alignItems: "center", gap: "10px", justifyContent: collapsed ? "center" : "flex-start", transition: "padding 0.3s cubic-bezier(0.4,0,0.2,1)", flexShrink: 0 }}>
        <div style={{ width: "34px", height: "34px", borderRadius: "50%", background: "#f3f4f6", border: "1.5px solid #e5e7eb", display: "flex", alignItems: "center", justifyContent: "center", color: "#111827", fontSize: "11px", fontWeight: 700, flexShrink: 0 }}>
          {initials}
        </div>
        <div style={{ overflow: "hidden", opacity: collapsed ? 0 : 1, width: collapsed ? 0 : "auto", transition: "opacity 0.2s ease, width 0.3s cubic-bezier(0.4,0,0.2,1)", whiteSpace: "nowrap" }}>
          <div style={{ fontSize: "12.5px", color: "#111827", fontWeight: 600 }}>{user?.name ?? user?.email ?? t("nav.guest")}</div>
          <div style={{ fontSize: "11px", color: "#9ca3af" }}>{user?.email ?? ""}</div>
        </div>
      </div>

      {/* Collapse toggle */}
      <button onClick={onToggle} style={{ position: "absolute", top: "50%", right: "-9px", transform: "translateY(-50%)", width: "26px", height: "26px", borderRadius: "50%", background: "#ffffff", border: "1px solid #e5e7eb", color: "#9ca3af", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 300, transition: "color 0.15s ease, box-shadow 0.15s ease" }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#111827"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 2px 8px rgba(0,0,0,0.12)"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#9ca3af"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "none"; }}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: collapsed ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.3s cubic-bezier(0.4,0,0.2,1)" }}>
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>
    </aside>
  );
}