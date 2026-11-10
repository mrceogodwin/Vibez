import type { ReactNode } from "react";
import { AppFrame } from "@/components/vibez/frame";

export function Shell({ children }: { children: ReactNode }) {
  return <AppFrame>{children}</AppFrame>;
}
