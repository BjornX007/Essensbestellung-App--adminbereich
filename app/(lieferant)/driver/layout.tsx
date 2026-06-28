import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "Driver · Almira",
  description: "Delivery driver view",
  // Prevent this page from being indexed
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  // Lock viewport so the page behaves like a native app on mobile
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  // Respect the iOS safe area (notch / home bar)
  viewportFit: "cover",
};

export default function DriverLayout({ children }: { children: React.ReactNode }) {
  return (
    // Isolate from admin/kitchen CSS by resetting the body background here
    <div style={{ background: "#f8f9fb", minHeight: "100dvh" }}>
      {children}
    </div>
  );
}