import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { LocaleProvider } from '@/app/lib/i18n/context';

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Admin",
  description: "Restaurant admin dashboard",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body style={{
        margin: 0,
        padding: 0,
        background: "#f9fafb",
        overflowX: "hidden",
        height: "100dvh",
        width: "100vw",
      }}>
        <LocaleProvider>{children}</LocaleProvider>
      </body>
    </html>
  );
}