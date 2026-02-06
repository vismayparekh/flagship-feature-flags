import React, { useEffect, useState } from "react";
import api from "../api/client";
import { Card } from "../components/Card";
import { Badge } from "../components/Badge";
import { Activity } from "lucide-react";

type Audit = { id: number; action: string; metadata: any; created_at: string; actor_email?: string; actor_full_name?: string };

export function Audit() {
  const [items, setItems] = useState<Audit[]>([]);

  useEffect(() => {
    (async () => {
      const o = await api.get("/orgs/");
      if (o.data?.[0]?.id) {
        const a = await api.get("/audit/", { params: { org_id: o.data[0].id } });
        setItems(a.data);
      }
    })();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xl font-semibold">Audit Log</div>
          <div className="text-sm text-slate-500 mt-1">Track who changed what, and when.</div>
        </div>
        <Badge tone="indigo"><Activity className="h-3.5 w-3.5" /> Immutable trail</Badge>
      </div>

      <Card className="p-5">
        <div className="overflow-hidden rounded-2xl border border-slate-900">
          <div className="grid grid-cols-12 bg-slate-950/70 px-4 py-3 text-xs text-slate-500">
            <div className="col-span-3">Actor</div>
            <div className="col-span-3">Action</div>
            <div className="col-span-4">Metadata</div>
            <div className="col-span-2 text-right">Time</div>
          </div>
          <div className="divide-y divide-slate-900">
            {items.length === 0 ? (
              <div className="px-4 py-6 text-sm text-slate-500">No audit events yet.</div>
            ) : items.slice(0, 100).map((a) => (
              <div key={a.id} className="grid grid-cols-12 items-start px-4 py-4 bg-slate-950/30 gap-3">
                <div className="col-span-3">
                  <div className="text-sm font-medium">{a.actor_full_name || "System"}</div>
                  <div className="text-xs text-slate-500">{a.actor_email || "—"}</div>
                </div>
                <div className="col-span-3 text-sm text-slate-200">{a.action}</div>
                <div className="col-span-4 text-xs text-slate-500 break-words">{JSON.stringify(a.metadata)}</div>
                <div className="col-span-2 text-right text-xs text-slate-500">{new Date(a.created_at).toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}
