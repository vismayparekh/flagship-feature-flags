import React from "react";
import { X } from "lucide-react";
import { cn } from "../lib/cn";

export function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className={cn("relative w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-950 shadow-soft")}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <div className="text-base font-semibold">{title}</div>
          <button className="rounded-xl p-2 hover:bg-slate-900" onClick={onClose}>
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
