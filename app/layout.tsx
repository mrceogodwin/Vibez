import type { Metadata } from "next";
import "./globals.css";
import MobileAppDock from "@/components/MobileAppDock";

export const viewport = { width: "device-width", initialScale: 1, viewportFit: "cover" };

export const metadata: Metadata = {
  title: "VIBEZ — Events, Tickets & Experiences",
  description: "Discover events, buy tickets and experience more. Find concerts, festivals, nightlife and culture across Nigeria.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" data-vibez-theme="dark" suppressHydrationWarning><body>{children}<MobileAppDock /></body></html>;
}
