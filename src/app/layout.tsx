import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vibez — Tune in. Link up.",
  description:
    "Live radio, real friends, and the conversations around the music.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
