import React from "react";
import { cn } from "../lib/cn";

export function Toggle({ checked, onChange }: { checked: boolean; onChange: (next: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-7 w-12 items-center rounded-full border transition",
        checked ? "bg-emerald-500/20 border-emerald-500/40" : "bg-slate-900/60 border-slate-700"
      )}
      aria-pressed={checked}
    >
      <span
        className={cn(
          "inline-block h-5 w-5 transform rounded-full transition",
          checked ? "translate-x-6 bg-emerald-300" : "translate-x-1 bg-slate-300"
        )}
      />
    </button>
  );
}
