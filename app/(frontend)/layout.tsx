"use client";

import { authClient } from '@/app/lib/auth/client';
import { useEffect, useState } from "react";
import Sidebar from "@/components/layout/Sidebar";

export default function FrontendLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isLandscape, setIsLandscape] = useState(false);
  const { data: session, isPending } = authClient.useSession();
  const user = session?.user ?? null;

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

  if (isPending) return null;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : collapsed ? "72px 1fr" : "240px 1fr",
        transition: "grid-template-columns 0.3s cubic-bezier(0.4,0,0.2,1)",
        height: "100vh",
        overflow: "hidden",
        background: "#f9fafb",
      }}
    >
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed(!collapsed)}
        user={session?.user ?? null} // ✅ pass user down
      />
    <main
  style={{
    minWidth: 0,
    overflowY: "auto",
    padding: "0px",
    paddingBottom: isMobile && !isLandscape ? "70px" : "0px",
    paddingLeft: isMobile && isLandscape
      ? "calc(70px + env(safe-area-inset-left, 0px))"
      : "0px",
    // Remove overflowY: "auto" — child pages manage their own scroll
    height: "100vh",
   
  }}
>
        {children}
      </main>
    </div>
  );
}