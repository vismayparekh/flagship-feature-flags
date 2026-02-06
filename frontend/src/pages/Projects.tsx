import React, { useEffect, useMemo, useState } from "react";
import api from "../api/client";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import { Modal } from "../components/Modal";
import { Input } from "../components/Input";
import { Badge } from "../components/Badge";
import { CopyButton } from "../components/Copy";
import { Plus, ChevronRight, Server, Trash2, AlertTriangle } from "lucide-react";

type Org = { id: number; name: string; slug: string };
type Project = { id: number; org: number; name: string; key: string; description: string; created_at: string };
type Env = { id: number; project: number; name: string; key: string; client_sdk_key: string; server_sdk_key: string };

type ConfirmState =
  | { type: "project"; id: number; name: string; key: string }
  | { type: "env"; id: number; name: string; key: string; projectId: number }
  | null;

export function Projects() {
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [envs, setEnvs] = useState<Env[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", key: "", description: "" });

  const [confirm, setConfirm] = useState<ConfirmState>(null);
  const [deleting, setDeleting] = useState(false);

  const orgId = useMemo(() => orgs?.[0]?.id, [orgs]);

  async function load() {
    const o = await api.get("/orgs/");
    setOrgs(o.data);
    if (o.data?.[0]?.id) {
      const p = await api.get("/projects/", { params: { org_id: o.data[0].id } });
      setProjects(p.data);
    }
  }

  async function loadEnvs(projectId: number) {
    const e = await api.get("/environments/", { params: { project_id: projectId } });
    setEnvs(e.data);
  }

  useEffect(() => {
    load();
  }, []);

  async function createProject() {
    if (!orgId) return;
    await api.post("/projects/", { org: orgId, ...form });
    setOpen(false);
    setForm({ name: "", key: "", description: "" });
    await load();
  }

  async function createEnv(projectId: number) {
    const name = prompt("Environment name (example: Staging)") || "";
    const key = prompt("Environment key (example: stage)") || "";
    if (!name || !key) return;
    await api.post("/environments/", { project: projectId, name, key });
    await loadEnvs(projectId);
  }

  function openDeleteProject(p: Project) {
    setConfirm({ type: "project", id: p.id, name: p.name, key: p.key });
  }

  function openDeleteEnv(e: Env) {
    setConfirm({ type: "env", id: e.id, name: e.name, key: e.key, projectId: e.project });
  }

  async function confirmDelete() {
    if (!confirm) return;
    setDeleting(true);
    try {
      if (confirm.type === "project") {
        await api.delete(`/projects/${confirm.id}/`);

        // refresh projects list
        await load();

        // if deleted project was selected, clear right panel
        if (selectedProject?.id === confirm.id) {
          setSelectedProject(null);
          setEnvs([]);
        }
      } else {
        await api.delete(`/environments/${confirm.id}/`);

        // refresh env list for selected project
        if (selectedProject?.id === confirm.projectId) {
          await loadEnvs(confirm.projectId);
        }
      }

      setConfirm(null);
    } finally {
      setDeleting(false);
    }
  }

  const confirmTitle =
    confirm?.type === "project" ? "Delete project" : confirm?.type === "env" ? "Delete environment" : "";

  const confirmSub =
    confirm?.type === "project"
      ? "This will remove the project and all related environments, flags, states, and rules (cascade)."
      : "This will remove the environment and all its flag states for that project.";

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xl font-semibold">Projects</div>
          <div className="text-sm text-slate-500 mt-1">Projects represent systems/products. Each has environments.</div>
        </div>
        <Button onClick={() => setOpen(true)}>+ New Project
        </Button>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* LEFT: Projects */}
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div className="text-base font-semibold">Your projects</div>
            <div className="text-xs text-slate-500">Tip: delete uses audit logs</div>
          </div>

          <div className="mt-4 space-y-2">
            {projects.length === 0 ? (
              <div className="text-sm text-slate-500 py-6">No projects yet. Create one.</div>
            ) : (
              projects.map((p) => {
                const active = selectedProject?.id === p.id;

                return (
                  <div
                    key={p.id}
                    className={[
                      "w-full flex items-center justify-between rounded-2xl border px-4 py-4 transition",
                      active
                        ? "border-indigo-500/30 bg-indigo-500/5"
                        : "border-slate-800 bg-slate-950/30 hover:bg-slate-900/50",
                    ].join(" ")}
                  >
                    {/* clickable area */}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedProject(p);
                        loadEnvs(p.id);
                      }}
                      className="flex-1 text-left"
                    >
                      <div className="text-sm font-semibold">{p.name}</div>
                      <div className="text-xs text-slate-500 mt-1 flex items-center gap-2 flex-wrap">
                        <Badge tone="slate">{p.key}</Badge>
                        <span className="truncate">{p.description || "—"}</span>
                      </div>
                    </button>

                    <div className="flex items-center gap-2 pl-3">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedProject(p);
                          loadEnvs(p.id);
                        }}
                        className="h-10 w-10 rounded-xl grid place-items-center border border-slate-800 bg-white/5 hover:bg-white/10 transition"
                        title="Open"
                      >
                        <ChevronRight className="h-5 w-5 text-slate-400" />
                      </button>

                      <button
                        type="button"
                        onClick={() => openDeleteProject(p)}
                        className="h-10 w-10 rounded-xl grid place-items-center border border-rose-500/20 bg-rose-500/10 hover:bg-rose-500/15 transition"
                        title="Delete project"
                      >
                        <Trash2 className="h-5 w-5 text-rose-200" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>

        {/* RIGHT: Environments */}
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-base font-semibold">Environments</div>
              <div className="text-sm text-slate-500 mt-1">
                {selectedProject ? `Project: ${selectedProject.name}` : "Select a project"}
              </div>
            </div>

            {selectedProject && (
              <Button variant="secondary" onClick={() => createEnv(selectedProject.id)}>
                + Add Env
              </Button>
            )}
          </div>

          <div className="mt-4 space-y-3">
            {!selectedProject ? (
              <div className="text-sm text-slate-500 py-6">Pick a project on the left.</div>
            ) : envs.length === 0 ? (
              <div className="text-sm text-slate-500 py-6">No environments yet. Add one.</div>
            ) : (
              envs.map((e) => (
                <div key={e.id} className="rounded-2xl border border-slate-800 bg-slate-950/30 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold">
                        {e.name} <span className="text-slate-500">({e.key})</span>
                      </div>
                      <div className="text-xs text-slate-500 mt-1">Use client key in SDK Tester.</div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge tone="emerald">Active</Badge>

                      <button
                        type="button"
                        onClick={() => openDeleteEnv(e)}
                        className="h-9 w-9 rounded-xl grid place-items-center border border-rose-500/20 bg-rose-500/10 hover:bg-rose-500/15 transition"
                        title="Delete environment"
                      >
                        <Trash2 className="h-4 w-4 text-rose-200" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 grid md:grid-cols-2 gap-3">
                    <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-3">
                      <div className="text-xs text-slate-500">Client SDK key</div>
                      <div className="mt-1 text-xs text-slate-200 break-all">{e.client_sdk_key}</div>
                      <div className="mt-2">
                        <CopyButton value={e.client_sdk_key} />
                      </div>
                    </div>

                    <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-3">
                      <div className="text-xs text-slate-500">Server SDK key</div>
                      <div className="mt-1 text-xs text-slate-200 break-all">{e.server_sdk_key}</div>
                      <div className="mt-2">
                        <CopyButton value={e.server_sdk_key} />
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Create Project Modal */}
      <Modal open={open} onClose={() => setOpen(false)} title="Create new project">
        <div className="space-y-4">
          <Input
            label="Project name"
            placeholder="Payments Platform"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <Input
            label="Project key"
            hint="Short identifier like payments, core, api"
            placeholder="payments"
            value={form.key}
            onChange={(e) => setForm({ ...form, key: e.target.value })}
          />
          <Input
            label="Description"
            placeholder="What is this project?"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <div className="flex items-center justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={createProject}>Create</Button>
          </div>
        </div>
      </Modal>

      {/* Confirm Delete Modal */}
      <Modal open={!!confirm} onClose={() => (deleting ? null : setConfirm(null))} title={confirmTitle}>
        <div className="space-y-4">
          <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-2xl bg-rose-500/15 border border-rose-500/20 grid place-items-center">
                <AlertTriangle className="h-5 w-5 text-rose-200" />
              </div>
              <div>
                <div className="text-sm font-semibold text-rose-100">
                  {confirm?.type === "project"
                    ? `Delete project “${confirm.name}” (${confirm.key})?`
                    : confirm?.type === "env"
                    ? `Delete environment “${confirm.name}” (${confirm.key})?`
                    : ""}
                </div>
                <div className="text-xs text-rose-200/80 mt-1">{confirmSub}</div>
                <div className="text-xs text-slate-300 mt-3">
                  This action is permanent. It will also appear in the Audit log.
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button variant="ghost" onClick={() => setConfirm(null)} disabled={deleting}>
              Cancel
            </Button>

            <button
              type="button"
              onClick={confirmDelete}
              disabled={deleting}
              className="px-4 py-2 rounded-xl bg-rose-500 text-white hover:bg-rose-400 transition disabled:opacity-60"
            >
              {deleting ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
