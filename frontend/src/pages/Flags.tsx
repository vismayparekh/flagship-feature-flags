import React, { useEffect, useMemo, useState } from "react";
import api from "../api/client";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import { Modal } from "../components/Modal";
import { Input } from "../components/Input";
import { Toggle } from "../components/Toggle";
import { Badge } from "../components/Badge";
import { RolloutModal } from "../components/RolloutModal";
import { RulesDrawer } from "../components/RulesDrawer";
import { Plus, Flag, Sliders, Trash2, AlertTriangle } from "lucide-react";

type Org = { id: number; name: string; slug: string };
type Project = { id: number; org: number; name: string; key: string; description: string };
type Env = { id: number; project: number; name: string; key: string; client_sdk_key: string };
type FF = { id: number; project: number; key: string; name: string; description: string };
type State = { id: number; flag: number; environment: number; enabled: boolean; rollout_percentage: number; updated_at: string };

type RolloutTarget = { stateId: number; flagId: number; flagName: string; current: number };
type RulesTarget = { stateId: number; flagId: number; flagName: string };

type DeleteTarget = { flagId: number; name: string; key: string } | null;

export function Flags() {
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [envs, setEnvs] = useState<Env[]>([]);

  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [selectedEnvId, setSelectedEnvId] = useState<number | null>(null);

  const [flags, setFlags] = useState<FF[]>([]);
  const [states, setStates] = useState<State[]>([]);

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ key: "", name: "", description: "" });

  // ✅ rollout modal
  const [rolloutOpen, setRolloutOpen] = useState(false);
  const [rolloutTarget, setRolloutTarget] = useState<RolloutTarget | null>(null);

  // ✅ rules drawer
  const [rulesOpen, setRulesOpen] = useState(false);
  const [rulesTarget, setRulesTarget] = useState<RulesTarget | null>(null);

  // ✅ delete flag confirm
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>(null);
  const [deleting, setDeleting] = useState(false);

  async function load() {
    const o = await api.get("/orgs/");
    setOrgs(o.data);
    if (o.data?.[0]?.id) {
      const p = await api.get("/projects/", { params: { org_id: o.data[0].id } });
      setProjects(p.data);
      if (p.data?.[0]?.id) setSelectedProjectId(p.data[0].id);
    }
  }

  async function loadEnvs(projectId: number) {
    const e = await api.get("/environments/", { params: { project_id: projectId } });
    setEnvs(e.data);
    if (e.data?.[0]?.id) setSelectedEnvId(e.data[0].id);
  }

  async function loadFlags(projectId: number) {
    const f = await api.get("/flags/", { params: { project_id: projectId } });
    setFlags(f.data);
  }

  async function loadStates(envId: number) {
    const s = await api.get("/flag-states/", { params: { environment_id: envId } });
    setStates(s.data);
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (selectedProjectId) {
      loadEnvs(selectedProjectId);
      loadFlags(selectedProjectId);
    }
  }, [selectedProjectId]);

  useEffect(() => {
    if (selectedEnvId) loadStates(selectedEnvId);
  }, [selectedEnvId]);

  const selectedEnv = useMemo(() => envs.find((e) => e.id === selectedEnvId) || null, [envs, selectedEnvId]);

  const stateByFlag = useMemo(() => {
    const m: Record<number, State> = {};
    for (const s of states) m[s.flag] = s;
    return m;
  }, [states]);

  async function createFlag() {
    if (!selectedProjectId) return;
    await api.post("/flags/", { project: selectedProjectId, ...form });
    setOpen(false);
    setForm({ key: "", name: "", description: "" });
    await loadFlags(selectedProjectId);
    if (selectedEnvId) await loadStates(selectedEnvId);
  }

  async function toggle(flagId: number) {
    const st = stateByFlag[flagId];
    if (!st) return;
    await api.post(`/flag-states/${st.id}/toggle/`);
    if (selectedEnvId) await loadStates(selectedEnvId);
  }

  function openRolloutEditor(flag: FF, st: State) {
    setRolloutTarget({ stateId: st.id, flagId: flag.id, flagName: flag.name, current: st.rollout_percentage ?? 100 });
    setRolloutOpen(true);
  }

  async function saveRollout(next: number) {
    if (!rolloutTarget) return;

    const res = await api.patch(`/flag-states/${rolloutTarget.stateId}/`, { rollout_percentage: next });
    const updated = res.data as State;

    setStates((prev) =>
      prev.map((s) =>
        s.id === updated.id
          ? { ...s, enabled: updated.enabled, rollout_percentage: updated.rollout_percentage, updated_at: updated.updated_at }
          : s
      )
    );

    if (selectedEnvId) await loadStates(selectedEnvId);
  }

  function openRules(flag: FF, st: State) {
    setRulesTarget({ stateId: st.id, flagId: flag.id, flagName: flag.name });
    setRulesOpen(true);
  }

  function openDeleteFlag(flag: FF) {
    setDeleteTarget({ flagId: flag.id, name: flag.name, key: flag.key });
  }

  async function confirmDeleteFlag() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/flags/${deleteTarget.flagId}/`);

      // close modals/drawers if open for deleted flag
      if (rulesTarget?.flagId === deleteTarget.flagId) {
        setRulesOpen(false);
        setRulesTarget(null);
      }
      if (rolloutTarget?.flagId === deleteTarget.flagId) {
        setRolloutOpen(false);
        setRolloutTarget(null);
      }

      // update UI immediately + reload for correctness
      setFlags((prev) => prev.filter((f) => f.id !== deleteTarget.flagId));
      setDeleteTarget(null);

      if (selectedProjectId) await loadFlags(selectedProjectId);
      if (selectedEnvId) await loadStates(selectedEnvId);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xl font-semibold">Feature Flags</div>
          <div className="text-sm text-slate-500 mt-1">Create once per project. Toggle + rollout + rules per environment.</div>
        </div>
        <Button onClick={() => setOpen(true)}>
          + New Flag
        </Button>
      </div>

      <Card className="p-5">
        <div className="flex flex-wrap items-center gap-3 justify-between">
          <div className="flex items-center gap-3">
            <label className="text-sm text-slate-400">Project</label>
            <select
              className="rounded-xl bg-slate-900/60 border border-slate-800 px-3 py-2 text-sm"
              value={selectedProjectId ?? ""}
              onChange={(e) => setSelectedProjectId(Number(e.target.value))}
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.key})
                </option>
              ))}
            </select>

            <label className="text-sm text-slate-400">Environment</label>
            <select
              className="rounded-xl bg-slate-900/60 border border-slate-800 px-3 py-2 text-sm"
              value={selectedEnvId ?? ""}
              onChange={(e) => setSelectedEnvId(Number(e.target.value))}
            >
              {envs.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name} ({e.key})
                </option>
              ))}
            </select>
          </div>
          <div className="text-xs text-slate-500">
            Tip: Click rollout % to edit. Use Rules for targeting (vip_, country, plan...).
          </div>
        </div>

        <div className="mt-5 overflow-hidden rounded-2xl border border-slate-900">
          <div className="grid grid-cols-12 bg-slate-950/70 px-4 py-3 text-xs text-slate-500">
            <div className="col-span-4">Flag</div>
            <div className="col-span-3">Key</div>
            <div className="col-span-2">Rollout</div>
            <div className="col-span-2">Actions</div>
            <div className="col-span-1 text-right">Enabled</div>
          </div>

          <div className="divide-y divide-slate-900">
            {flags.length === 0 ? (
              <div className="px-4 py-6 text-sm text-slate-500">No flags yet. Create one.</div>
            ) : (
              flags.map((f) => {
                const st = stateByFlag[f.id];

                return (
                  <div key={f.id} className="grid grid-cols-12 items-center px-4 py-4 bg-slate-950/30">
                    <div className="col-span-4 flex items-center gap-3">
                      <div className="h-10 w-10 rounded-2xl border border-slate-800 bg-indigo-500/10 grid place-items-center">
                        <Flag className="h-5 w-5 text-indigo-200" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold">{f.name}</div>
                        <div className="text-xs text-slate-500">{f.description || "—"}</div>
                      </div>
                    </div>

                    <div className="col-span-3 text-sm text-slate-200">{f.key}</div>

                    <div className="col-span-2">
                      {st ? (
                        <button
                          type="button"
                          onClick={() => openRolloutEditor(f, st)}
                          className="inline-flex items-center gap-2 hover:opacity-90 transition"
                          title="Click to edit rollout"
                        >
                          <Badge tone={st.rollout_percentage === 100 ? "emerald" : "indigo"}>{st.rollout_percentage}%</Badge>
                          <span className="text-xs text-slate-500">(edit)</span>
                        </button>
                      ) : (
                        <span className="text-xs text-slate-500">—</span>
                      )}
                    </div>

                    <div className="col-span-2">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => (st ? openRules(f, st) : null)}
                          disabled={!st}
                          className={[
                            "h-9 w-9 rounded-xl border grid place-items-center transition",
                            st ? "border-white/10 bg-white/5 hover:bg-white/10" : "border-white/5 bg-white/5 opacity-40 cursor-not-allowed",
                          ].join(" ")}
                          title="Rules"
                        >
                          <Sliders className="h-4 w-4 text-slate-200" />
                        </button>

                        <button
                          type="button"
                          onClick={() => openDeleteFlag(f)}
                          className="h-9 w-9 rounded-xl border border-rose-500/20 bg-rose-500/10 hover:bg-rose-500/15 grid place-items-center transition"
                          title="Delete flag"
                        >
                          <Trash2 className="h-4 w-4 text-rose-200" />
                        </button>
                      </div>
                    </div>

                    <div className="col-span-1 flex items-center justify-end">
                      {st ? (
                        <Toggle checked={st.enabled} onChange={() => toggle(f.id)} />
                      ) : (
                        <span className="text-xs text-slate-500">—</span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </Card>

      {/* Create flag modal */}
      <Modal open={open} onClose={() => setOpen(false)} title="Create new feature flag">
        <div className="space-y-4">
          <Input
            label="Flag name"
            placeholder="New Checkout"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <Input
            label="Flag key"
            hint="Stable identifier like new_checkout"
            placeholder="new_checkout"
            value={form.key}
            onChange={(e) => setForm({ ...form, key: e.target.value })}
          />
          <Input
            label="Description"
            placeholder="What does this flag control?"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <div className="flex items-center justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={createFlag}>Create</Button>
          </div>
        </div>
      </Modal>

      {/* Delete flag confirm modal */}
      <Modal open={!!deleteTarget} onClose={() => (deleting ? null : setDeleteTarget(null))} title="Delete flag">
        <div className="space-y-4">
          <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-2xl bg-rose-500/15 border border-rose-500/20 grid place-items-center">
                <AlertTriangle className="h-5 w-5 text-rose-200" />
              </div>
              <div>
                <div className="text-sm font-semibold text-rose-100">
                  Delete “{deleteTarget?.name}” ({deleteTarget?.key})?
                </div>
                <div className="text-xs text-rose-200/80 mt-1">
                  This deletes the flag across the project and removes all flag states + rules. It will appear in Audit logs.
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button variant="ghost" onClick={() => setDeleteTarget(null)} disabled={deleting}>
              Cancel
            </Button>
            <button
              type="button"
              onClick={confirmDeleteFlag}
              disabled={deleting}
              className="px-4 py-2 rounded-xl bg-rose-500 text-white hover:bg-rose-400 transition disabled:opacity-60"
            >
              {deleting ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      </Modal>

      {/* rollout modal */}
      <RolloutModal
        open={rolloutOpen}
        onClose={() => setRolloutOpen(false)}
        flagName={rolloutTarget?.flagName || ""}
        current={rolloutTarget?.current ?? 100}
        onSave={saveRollout}
      />

      {/* rules drawer */}
      <RulesDrawer
        open={rulesOpen}
        onClose={() => setRulesOpen(false)}
        stateId={rulesTarget?.stateId ?? null}
        flagName={rulesTarget?.flagName || ""}
        envLabel={selectedEnv ? `${selectedEnv.name} (${selectedEnv.key})` : "Environment"}
        onChanged={async () => {
          if (selectedEnvId) await loadStates(selectedEnvId);
        }}
      />
    </div>
  );
}
