import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VYBZ — Events, Tickets & Experiences",
  description: "Discover events, get your tickets and be there. Find concerts, festivals, nightlife and experiences across Nigeria.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
