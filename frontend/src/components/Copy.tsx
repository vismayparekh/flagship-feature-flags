import React, { useState } from "react";
import { Copy, Check } from "lucide-react";
import { cn } from "../lib/cn";

export function CopyButton({ value, className }: { value: string; className?: string }) {
  const [ok, setOk] = useState(false);
  async function onCopy() {
    await navigator.clipboard.writeText(value);
    setOk(true);
    setTimeout(() => setOk(false), 900);
  }
  return (
    <button onClick={onCopy} className={cn("inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/40 px-3 py-2 text-xs hover:bg-slate-900 transition", className)}>
      {ok ? <Check className="h-4 w-4 text-emerald-300" /> : <Copy className="h-4 w-4 text-slate-300" />}
      <span className="text-slate-200">{ok ? "Copied" : "Copy"}</span>
    </button>
  );
}
