import React from "react";
import { cn } from "../lib/cn";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900/60 to-slate-950/40 shadow-soft",
        className
      )}
      {...props}
    />
  );
}
