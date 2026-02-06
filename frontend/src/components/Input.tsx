import React from "react";
import { cn } from "../lib/cn";

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hint?: string;
  error?: string;
};

export const Input = React.forwardRef<HTMLInputElement, Props>(
  ({ label, hint, error, className, ...props }, ref) => {
    return (
      <label className="block">
        {label && <div className="mb-1 text-sm text-slate-200">{label}</div>}
        <input
          ref={ref}
          className={cn(
            "w-full rounded-xl bg-slate-900/60 border border-slate-800 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-indigo-400/60 focus:ring-2 focus:ring-indigo-400/20 outline-none transition",
            error
              ? "border-rose-500/60 focus:border-rose-400/70 focus:ring-rose-400/20"
              : "",
            className
          )}
          {...props}
        />
        {hint && !error && <div className="mt-1 text-xs text-slate-500">{hint}</div>}
        {error && <div className="mt-1 text-xs text-rose-300">{error}</div>}
      </label>
    );
  }
);

Input.displayName = "Input";
