import React from "react";
import { cn } from "../lib/cn";

export function Badge({ children, tone="indigo" }: { children: React.ReactNode; tone?: "indigo"|"emerald"|"rose"|"slate" }) {
  const tones: Record<string, string> = {
    indigo: "bg-indigo-500/15 text-indigo-200 border-indigo-500/30",
    emerald: "bg-emerald-500/15 text-emerald-200 border-emerald-500/30",
    rose: "bg-rose-500/15 text-rose-200 border-rose-500/30",
    slate: "bg-slate-500/15 text-slate-200 border-slate-500/30"
  };
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs", tones[tone])}>
      {children}
    </span>
  );
}
