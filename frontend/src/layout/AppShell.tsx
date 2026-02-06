import React from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { Badge } from "../components/Badge";
import { Button } from "../components/Button";
import { cn } from "../lib/cn";
import { Flag, LayoutGrid, FolderKanban, Settings, Activity, TestTube2, LogOut, Shield } from "lucide-react";
import { useAuth } from "../auth/useAuth";

const nav = [
  { to: "/app", label: "Overview", icon: LayoutGrid },
  { to: "/app/projects", label: "Projects", icon: FolderKanban },
  { to: "/app/flags", label: "Feature Flags", icon: Flag },
  { to: "/app/audit", label: "Audit Log", icon: Activity },
  { to: "/app/sdk-tester", label: "SDK Tester", icon: TestTube2 },
  { to: "/app/settings", label: "Settings", icon: Settings }
];

export function AppShell() {
  const { me, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen">
      <div className="fixed inset-y-0 left-0 w-72 border-r border-slate-900 bg-slate-950/60 backdrop-blur-xl">
        <div className="px-6 py-6 flex items-center justify-between">
          <Link to="/app" className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 grid place-items-center">
              <Flag className="h-5 w-5 text-indigo-200" />
            </div>
            <div>
              <div className="text-sm font-semibold">FlagShip</div>
              <div className="text-xs text-slate-500">Feature flags platform</div>
            </div>
          </Link>
          {me?.is_superuser && (
            <Badge tone="emerald"><Shield className="h-3.5 w-3.5" /> Superuser</Badge>
          )}
        </div>

        <div className="px-4">
          <div className="rounded-2xl border border-slate-900 bg-slate-950 p-4">
            <div className="text-xs text-slate-500">Signed in</div>
            <div className="mt-1 text-sm font-medium">{me?.full_name || "User"}</div>
            <div className="text-xs text-slate-400">{me?.email}</div>
          </div>
        </div>

        <div className="mt-6 px-3">
          {nav.map((n) => {
            const Icon = n.icon;
            return (
              <NavLink
                key={n.to}
                to={n.to}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 px-4 py-3 rounded-2xl text-sm text-slate-300 hover:bg-slate-900/60 hover:text-slate-100 transition",
                    isActive ? "bg-indigo-500/10 border border-indigo-500/20 text-slate-100" : "border border-transparent"
                  )
                }
              >
                <Icon className="h-5 w-5" />
                {n.label}
              </NavLink>
            );
          })}
        </div>

        <div className="mt-auto p-4">
          <Button
            variant="ghost"
            className="w-full justify-center"
            onClick={() => {
              logout();
              navigate("/login");
            }}
          >Logout
          </Button>
          {/* <div className="mt-3 text-[11px] text-slate-600 text-center">Built for enterprise-style portfolios</div> */}
        </div>
      </div>

      <div className="pl-72">
        <div className="px-8 py-6 border-b border-slate-900 bg-slate-950/40 backdrop-blur-xl sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-lg font-semibold">Control Plane</div>
              <div className="text-sm text-slate-500">Launch, target, and audit feature delivery</div>
            </div>
            <a
              href="http://localhost:8000/admin/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-sm text-slate-300 hover:text-slate-100"
            >
              Admin Console ↗
            </a>
          </div>
        </div>
        <div className="px-8 py-7">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
