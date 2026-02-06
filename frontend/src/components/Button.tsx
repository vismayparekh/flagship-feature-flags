import React from "react";
import { cn } from "../lib/cn";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
};

const variants: Record<string, string> = {
  primary: "bg-indigo-500/90 hover:bg-indigo-500 text-white shadow-soft",
  secondary: "bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700",
  ghost: "bg-transparent hover:bg-slate-900 text-slate-100 border border-slate-800",
  danger: "bg-rose-500/90 hover:bg-rose-500 text-white shadow-soft"
};

const sizes: Record<string, string> = {
  sm: "px-3 py-1.5 text-sm rounded-lg",
  md: "px-4 py-2 text-sm rounded-xl",
  lg: "px-5 py-2.5 text-base rounded-2xl"
};

export function Button({ className, variant="primary", size="md", ...props }: Props) {
  return (
    <button
      className={cn(
        "transition-all duration-150 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-400/50 disabled:opacity-50 disabled:cursor-not-allowed",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  );
}
