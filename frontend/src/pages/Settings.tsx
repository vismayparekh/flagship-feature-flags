import React from "react";
import { Card } from "../components/Card";
import { Badge } from "../components/Badge";
import { Shield, KeyRound, Rocket } from "lucide-react";

export function Settings() {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xl font-semibold">Settings</div>
          <div className="text-sm text-slate-500 mt-1">High-level controls you can expand later.</div>
        </div>
        <Badge tone="slate"><Shield className="h-3.5 w-3.5" /> Security-ready</Badge>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Card className="p-5">
          <div className="flex items-center gap-2 text-sm font-semibold"><KeyRound className="h-4 w-4 text-indigo-200" /> Keys</div>
          <div className="mt-2 text-sm text-slate-500">Rotate environment keys via backend rotate_keys action.</div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-2 text-sm font-semibold"><Shield className="h-4 w-4 text-emerald-200" /> RBAC</div>
          <div className="mt-2 text-sm text-slate-500">Memberships endpoint supports roles. Add Members UI next.</div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-2 text-sm font-semibold"><Rocket className="h-4 w-4 text-fuchsia-200" /> Roadmap</div>
          <div className="mt-2 text-sm text-slate-500">Segments, approvals, webhooks, multi-variation flags.</div>
        </Card>
      </div>
    </div>
  );
}
