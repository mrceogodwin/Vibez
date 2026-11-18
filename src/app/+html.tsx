import { ScrollViewStyleReset, useServerDocumentContext } from "expo-router/html";
import type { ReactNode } from "react";

export default function Root({ children }: { children: ReactNode }) {
  const { headNodes, bodyNodes } = useServerDocumentContext();
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#0C0C0E" />
        <meta name="description" content="Vibez is a social entertainment app for Nigeria." />
        <link rel="manifest" href="/manifest.webmanifest" />
        <link rel="apple-touch-icon" href="/icon-180.png" />
        <title>Vibez</title>
        <ScrollViewStyleReset />
        {headNodes}
        <style>{`html, body, #root { height: 100%; background: #0C0C0E; } body { margin: 0; }`}</style>
      </head>
      <body>
        {children}
        {bodyNodes}
      </body>
    </html>
  );
}
