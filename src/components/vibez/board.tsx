import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import type { ReactNode } from "react";

export function Board({
  kicker,
  title,
  children,
}: {
  kicker: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="board">
      <p className="board-kicker">{kicker}</p>
      <h1>{title}</h1>
      {children}
    </div>
  );
}

export function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <article className="hero-stat">
      <span>{label}</span>
      <strong>{value}</strong>
      {hint ? <em>{hint}</em> : null}
    </article>
  );
}

export function RealChart({ data, empty }: { data: { name: string; value: number }[]; empty: string }) {
  const live = data.some((item) => item.value > 0);
  if (!live) {
    return (
      <div className="empty chart-empty">
        <h2>Nothing to chart yet</h2>
        <p>{empty}</p>
      </div>
    );
  }
  return (
    <div className="chart">
      <ResponsiveContainer width="100%" height={168}>
        <BarChart data={data} margin={{ top: 8, right: 0, left: 0, bottom: 0 }}>
          <XAxis dataKey="name" tick={{ fill: "#69738a", fontSize: 11 }} axisLine={false} tickLine={false} interval={0} />
          <Tooltip cursor={{ fill: "rgba(16,22,201,0.06)" }} contentStyle={{ borderRadius: 12, border: "1px solid #E7EAF3", fontSize: 13 }} />
          <Bar dataKey="value" fill="#1016C9" radius={[8, 8, 4, 4]} maxBarSize={36} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function Actions({ items }: { items: { href: string; label: string; detail: string }[] }) {
  return (
    <div className="quick">
      {items.map((item) => (
        <a key={item.label} href={item.href}>
          <strong>{item.label}</strong>
          <span>{item.detail}</span>
        </a>
      ))}
    </div>
  );
}
