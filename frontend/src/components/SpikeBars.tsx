import React from "react";
import { cn } from "../lib/cn";

type Props = {
  values: number[];
  height?: number;
  className?: string;
  title?: string;
  subtitle?: string;
  right?: React.ReactNode; // ✅ top-right slot (trend badge etc.)
};

export function SpikeBars({
  values,
  height = 56,
  className,
  title = "Activity",
  subtitle = "Last 24 buckets",
  right,
}: Props) {
  const max = Math.max(1, ...values);
  const normalized = values.map((v) => Math.max(0, v) / max);

  return (
    <div className={cn("rounded-2xl border border-slate-800 bg-slate-950/40 p-5", className)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-white">{title}</div>
          <div className="mt-0.5 text-xs text-slate-400">{subtitle}</div>
        </div>

        <div className="flex items-center gap-2">
          {right ? (
            right
          ) : (
            <>
              <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,.6)]" />
              <span className="text-xs text-slate-400">Live</span>
            </>
          )}
        </div>
      </div>

      <div className="mt-4 flex items-end gap-1" style={{ height }} aria-label="spike-bars">
        {normalized.map((n, idx) => {
          const barH = Math.max(2, Math.round(n * height));
          const raw = values[idx] ?? 0;

          return (
            <div key={idx} className="group relative flex-1">
              <div
                className={cn(
                  "w-full rounded-md border border-white/5",
                  "bg-gradient-to-t from-indigo-500/35 via-indigo-400/20 to-transparent"
                )}
                style={{ height: barH }}
              />
              <div className="pointer-events-none absolute -top-8 left-1/2 hidden -translate-x-1/2 rounded-lg border border-white/10 bg-slate-950/95 px-2 py-1 text-[10px] text-slate-200 shadow-lg group-hover:block">
                {raw}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
        <span>Low</span>
        <span>High</span>
      </div>
    </div>
  );
}
