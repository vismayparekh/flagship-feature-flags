import React, { useEffect, useMemo, useState } from "react";
import api from "../api/client";
import { Card } from "../components/Card";
import { Badge } from "../components/Badge";
import { SpikeBars } from "../components/SpikeBars";
import { Activity, FolderKanban, Flag, Server, ShieldCheck, Filter } from "lucide-react";
import { Link } from "react-router-dom";

type Org = { id: number; name: string; slug: string; created_at: string };
type Project = { id: number; org: number; name: string; key: string; description: string };
type Env = { id: number; project: number; name: string; key: string; client_sdk_key: string; server_sdk_key: string };
type Audit = { id: number; action: string; metadata: any; created_at: string; actor_email?: string };

function formatDelta(curr: number, prev: number) {
  if (prev <= 0 && curr <= 0) return "0%";
  if (prev <= 0 && curr > 0) return "New";
  const pct = ((curr - prev) / prev) * 100;
  const sign = pct >= 0 ? "+" : "";
  return `${sign}${Math.round(pct)}%`;
}

function deltaTone(curr: number, prev: number) {
  if (prev <= 0 && curr > 0) return "text-emerald-200 border-emerald-400/20 bg-emerald-500/10";
  if (curr >= prev) return "text-emerald-200 border-emerald-400/20 bg-emerald-500/10";
  return "text-rose-200 border-rose-400/20 bg-rose-500/10";
}

function buildHourlyBuckets(events: Audit[], predicate: (a: Audit) => boolean, hours = 24) {
  const buckets = new Array(hours).fill(0);
  const now = Date.now();
  const bucketMs = 60 * 60 * 1000;

  for (const a of events) {
    if (!predicate(a)) continue;
    const t = new Date(a.created_at).getTime();
    const diff = now - t;
    const idx = Math.floor(diff / bucketMs);
    if (idx >= 0 && idx < hours) buckets[hours - 1 - idx] += 1; // oldest -> newest
  }
  return buckets;
}

export function Overview() {
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [envs, setEnvs] = useState<Env[]>([]);
  const [audit, setAudit] = useState<Audit[]>([]);

  // ✅ Filters
  const [envFilter, setEnvFilter] = useState<string>("all");
  const [actionFilter, setActionFilter] = useState<string>("all"); // affects table

  const currentOrg = useMemo(() => orgs[0], [orgs]);

  useEffect(() => {
    (async () => {
      const o = await api.get("/orgs/");
      setOrgs(o.data);

      if (o.data?.[0]?.id) {
        const orgId = o.data[0].id;

        const p = await api.get("/projects/", { params: { org_id: orgId } });
        setProjects(p.data);

        // ✅ get more audit so graphs + yesterday trend are meaningful
        const a = await api.get("/audit/", { params: { org_id: orgId } });
        setAudit(a.data.slice(0, 500));

        if (p.data?.[0]?.id) {
          const e = await api.get("/environments/", { params: { project_id: p.data[0].id } });
          setEnvs(e.data);
        }
      }
    })();
  }, []);

  // ✅ env filter applied to ALL computations (graphs + table)
  const envFilteredAudit = useMemo(() => {
    if (envFilter === "all") return audit;
    return audit.filter((a) => String(a?.metadata?.env || "") === envFilter);
  }, [audit, envFilter]);

  // ✅ action filter applied ONLY to table list (not the graphs)
  const tableFilteredAudit = useMemo(() => {
    if (actionFilter === "all") return envFilteredAudit;

    return envFilteredAudit.filter((a) => {
      const act = a.action || "";

      if (actionFilter === "toggle") return act === "flagstate.toggle";
      if (actionFilter === "rollout") return act === "flagstate.update";
      if (actionFilter === "flag") return act.startsWith("flag.");
      if (actionFilter === "rule") return act.startsWith("rule.");
      if (actionFilter === "auth") return act.startsWith("auth.") || act.startsWith("accounts.");
      return true;
    });
  }, [envFilteredAudit, actionFilter]);

  // Predicates for graphs
  const isToggle = (a: Audit) => a.action === "flagstate.toggle";
  const isRolloutChange = (a: Audit) => a.action === "flagstate.update"; // includes rollout edits

  // ✅ 24h spikes (graphs)
  const toggleSpikes24 = useMemo(
    () => buildHourlyBuckets(envFilteredAudit, isToggle, 24),
    [envFilteredAudit]
  );

  const rolloutSpikes24 = useMemo(
    () => buildHourlyBuckets(envFilteredAudit, isRolloutChange, 24),
    [envFilteredAudit]
  );

  // ✅ Trend vs yesterday (compare last 24h vs previous 24h)
  const toggleTrend = useMemo(() => {
    const last24 = buildHourlyBuckets(envFilteredAudit, isToggle, 24).reduce((a, b) => a + b, 0);
    const prev24Buckets = new Array(24).fill(0);
    const now = Date.now();
    const bucketMs = 60 * 60 * 1000;

    for (const e of envFilteredAudit) {
      if (!isToggle(e)) continue;
      const t = new Date(e.created_at).getTime();
      const diff = now - t;
      const idx = Math.floor(diff / bucketMs);
      if (idx >= 24 && idx < 48) prev24Buckets[47 - idx] += 1;
    }
    const prev24 = prev24Buckets.reduce((a, b) => a + b, 0);
    return { last24, prev24, label: formatDelta(last24, prev24), tone: deltaTone(last24, prev24) };
  }, [envFilteredAudit]);

  const rolloutTrend = useMemo(() => {
    const last24 = buildHourlyBuckets(envFilteredAudit, isRolloutChange, 24).reduce((a, b) => a + b, 0);
    const prev24Buckets = new Array(24).fill(0);
    const now = Date.now();
    const bucketMs = 60 * 60 * 1000;

    for (const e of envFilteredAudit) {
      if (!isRolloutChange(e)) continue;
      const t = new Date(e.created_at).getTime();
      const diff = now - t;
      const idx = Math.floor(diff / bucketMs);
      if (idx >= 24 && idx < 48) prev24Buckets[47 - idx] += 1;
    }
    const prev24 = prev24Buckets.reduce((a, b) => a + b, 0);
    return { last24, prev24, label: formatDelta(last24, prev24), tone: deltaTone(last24, prev24) };
  }, [envFilteredAudit]);

  // ✅ Table rows (show latest 8 after filters)
  const recent8 = useMemo(() => tableFilteredAudit.slice(0, 8), [tableFilteredAudit]);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xl font-semibold">Overview</div>
          <div className="text-sm text-slate-500 mt-1">Start with Projects and create flags per environment.</div>
        </div>
        
      </div>

      {/* KPI row */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-500">Organizations</div>
            <FolderKanban className="h-5 w-5 text-slate-500" />
          </div>
          <div className="mt-2 text-2xl font-semibold">{orgs.length}</div>
          <div className="mt-2 text-xs text-slate-500">
            Current: <span className="text-slate-200">{currentOrg?.name || "-"}</span>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-500">Projects</div>
            <Server className="h-5 w-5 text-slate-500" />
          </div>
          <div className="mt-2 text-2xl font-semibold">{projects.length}</div>
          <div className="mt-2 text-xs text-slate-500">
            Manage in <Link className="text-indigo-300 hover:text-indigo-200" to="/app/projects">Projects</Link>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-500">Environments</div>
            <Activity className="h-5 w-5 text-slate-500" />
          </div>
          <div className="mt-2 text-2xl font-semibold">{envs.length}</div>
          <div className="mt-2 text-xs text-slate-500">Client keys per env</div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-500">Flags</div>
            <Flag className="h-5 w-5 text-slate-500" />
          </div>
          <div className="mt-2 text-2xl font-semibold">↗</div>
          <div className="mt-2 text-xs text-slate-500">
            Go to <Link className="text-indigo-300 hover:text-indigo-200" to="/app/flags">Feature Flags</Link>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-base font-semibold flex items-center gap-2">
              <Filter className="h-4 w-4 text-slate-400" />
              Filters
            </div>
            <div className="text-sm text-slate-500 mt-1">Slice activity by environment and event type.</div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-sm text-slate-400">Environment</label>
              <select
                className="rounded-xl bg-slate-900/60 border border-slate-800 px-3 py-2 text-sm"
                value={envFilter}
                onChange={(e) => setEnvFilter(e.target.value)}
              >
                <option value="all">All</option>
                {envs.map((e) => (
                  <option key={e.id} value={e.key}>
                    {e.name} ({e.key})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm text-slate-400">Action type</label>
              <select
                className="rounded-xl bg-slate-900/60 border border-slate-800 px-3 py-2 text-sm"
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
              >
                <option value="all">All</option>
                <option value="toggle">Flag toggles</option>
                <option value="rollout">Rollout changes</option>
                <option value="flag">Flag create/update</option>
                <option value="rule">Rule create/update</option>
              </select>
            </div>
          </div>
        </div>
      </Card>

      {/* Graphs */}
      <div className="grid gap-4 lg:grid-cols-2">
        <SpikeBars
          values={toggleSpikes24}
          title="Flag toggles"
          subtitle="Spikes over last 24 hours"
          right={
            <div className={"px-2.5 py-1 rounded-xl border text-xs font-semibold " + toggleTrend.tone}>
              {toggleTrend.label} <span className="text-slate-400 font-normal">vs yesterday</span>
            </div>
          }
        />

        <SpikeBars
          values={rolloutSpikes24}
          title="Rollout changes"
          subtitle="Spikes over last 24 hours"
          right={
            <div className={"px-2.5 py-1 rounded-xl border text-xs font-semibold " + rolloutTrend.tone}>
              {rolloutTrend.label} <span className="text-slate-400 font-normal">vs yesterday</span>
            </div>
          }
        />
      </div>

      {/* Audit table */}
      <Card className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-base font-semibold">Recent audit events</div>
            <div className="text-sm text-slate-500 mt-1">Every meaningful change is tracked.</div>
          </div>
          <Link className="text-sm text-indigo-300 hover:text-indigo-200" to="/app/audit">View all</Link>
        </div>

        <div className="mt-4 divide-y divide-slate-900">
          {recent8.length === 0 ? (
            <div className="py-6 text-sm text-slate-500">
              No events for the selected filters — try “All”.
            </div>
          ) : recent8.map((a) => (
            <div key={a.id} className="py-3 flex items-center justify-between gap-4">
              <div>
                <div className="text-sm font-medium">{a.action}</div>
                <div className="text-xs text-slate-500">
                  {a.actor_email || "system"} • {new Date(a.created_at).toLocaleString()}
                  {a?.metadata?.env ? (
                    <span className="ml-2 text-slate-400">• env: <span className="text-slate-200">{String(a.metadata.env)}</span></span>
                  ) : null}
                </div>
              </div>
              <div className="text-xs text-slate-500 truncate max-w-[420px]">{JSON.stringify(a.metadata)}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
