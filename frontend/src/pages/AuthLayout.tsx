import React from "react";
import { Outlet, Link } from "react-router-dom";
import { Flag } from "lucide-react";

export function AuthLayout() {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="relative overflow-hidden hidden lg:block">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/25 via-fuchsia-600/15 to-emerald-500/15" />
        <div className="absolute -top-24 -left-24 h-80 w-80 rounded-full bg-indigo-500/25 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-fuchsia-500/20 blur-3xl" />
        <div className="relative p-12 h-full flex flex-col justify-between">
          <div className="flex items-center gap-2">
            <div className="h-12 w-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 grid place-items-center">
              <Flag className="h-6 w-6 text-indigo-200" />
            </div>
            <div>
              <div className="text-xl font-semibold">FlagShip</div>
              <div className="text-sm text-slate-400">Feature Flags Platform</div>
            </div>
          </div>

          <div className="max-w-md">
            <div className="text-3xl font-semibold leading-tight">
              Ship safely with <span className="text-indigo-300">flags</span>, targeting, and audit.
            </div>
            <div className="mt-3 text-slate-400">
            </div>

            <div className="mt-8 grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
                <div className="text-sm font-semibold">RBAC</div>
                <div className="text-xs text-slate-500 mt-1">Owner/Admin/Dev/Viewer</div>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
                <div className="text-sm font-semibold">SDK</div>
                <div className="text-xs text-slate-500 mt-1">Eval endpoint with keys</div>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
                <div className="text-sm font-semibold">Rollouts</div>
                <div className="text-xs text-slate-500 mt-1">Deterministic targeting</div>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
                <div className="text-sm font-semibold">Audit</div>
                <div className="text-xs text-slate-500 mt-1">Track changes</div>
              </div>
            </div>
          </div>

          <div className="text-xs text-slate-500">
          </div>
        </div>
      </div>

      <div className="p-6 lg:p-10 flex items-center justify-center">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-6">
            <div className="h-10 w-10 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 grid place-items-center">
              <Flag className="h-5 w-5 text-indigo-200" />
            </div>
            <div>
              <div className="text-base font-semibold">FlagShip</div>
              <div className="text-xs text-slate-400">Feature flags platform</div>
            </div>
          </div>

          <Outlet />

          <div className="mt-6 text-center text-xs text-slate-500">
            
          </div>
        </div>
      </div>
    </div>
  );
}
