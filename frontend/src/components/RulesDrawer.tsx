import React, { useEffect, useMemo, useState } from "react";
import api from "../api/client";
import { Input } from "./Input";
import { Button } from "./Button";
import { Badge } from "./Badge";
import { Modal } from "./Modal";
import { X, Plus, Trash2, Save, ArrowUp, ArrowDown, Sliders, AlertTriangle } from "lucide-react";

type Rule = {
  id: number;
  state: number;
  priority: number;
  clauses: any[];
  variation: any;
  rollout_percentage: number;
  created_at: string;
};

type Clause = {
  field: string;
  op: string;
  value: any;
};

type Props = {
  open: boolean;
  onClose: () => void;
  stateId: number | null;
  flagName: string;
  envLabel: string;
  onChanged?: () => Promise<void> | void; // reload states if you want
};

const FIELD_OPTIONS = [
  { value: "key", label: "User key" },
  { value: "email", label: "Email" },
  { value: "country", label: "Country" },
  { value: "plan", label: "Plan" },
  { value: "segment", label: "Segment" },
];

const OP_OPTIONS = [
  { value: "equals", label: "equals" },
  { value: "not_equals", label: "not equals" },
  { value: "contains", label: "contains" },
  { value: "starts_with", label: "starts with" },
  { value: "ends_with", label: "ends with" },
  { value: "in", label: "in (comma list)" },
  { value: "not_in", label: "not in (comma list)" },
];

function normalizeClauseValue(op: string, raw: string) {
  if (op === "in" || op === "not_in") {
    return raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return raw;
}

function toTextValue(val: any) {
  if (Array.isArray(val)) return val.join(", ");
  if (val === null || val === undefined) return "";
  return String(val);
}

export function RulesDrawer({ open, onClose, stateId, flagName, envLabel, onChanged }: Props) {
  const [loading, setLoading] = useState(false);
  const [rules, setRules] = useState<Rule[]>([]);
  const [err, setErr] = useState<string>("");

  // editor state
  const [editingId, setEditingId] = useState<number | "new" | null>(null);
  const [priority, setPriority] = useState<number>(1);
  const [rollout, setRollout] = useState<number>(100);
  const [variationValue, setVariationValue] = useState<"true" | "false">("true");
  const [clauses, setClauses] = useState<Clause[]>([{ field: "key", op: "starts_with", value: "vip_" }]);

  // ✅ delete modal state
  const [deleteTarget, setDeleteTarget] = useState<Rule | null>(null);
  const [deleting, setDeleting] = useState(false);

  const sortedRules = useMemo(() => {
    return [...rules].sort((a, b) => (a.priority - b.priority) || (a.id - b.id));
  }, [rules]);

  async function loadRules() {
    if (!stateId) return;
    setLoading(true);
    setErr("");
    try {
      const res = await api.get("/flag-rules/", { params: { state_id: stateId } });
      setRules(res.data || []);
    } catch (e: any) {
      setErr("Failed to load rules.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (open) {
      setEditingId(null);
      setErr("");
      setDeleteTarget(null);
      if (stateId) loadRules();
      else setRules([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, stateId]);

  function resetEditorForNew() {
    setEditingId("new");
    setPriority(1);
    setRollout(100);
    setVariationValue("true");
    setClauses([{ field: "key", op: "starts_with", value: "vip_" }]);
  }

  function startEdit(rule: Rule) {
    setEditingId(rule.id);
    setPriority(rule.priority ?? 1);
    setRollout(rule.rollout_percentage ?? 100);
    setVariationValue((rule.variation?.value ? "true" : "false") as any);

    const cs = Array.isArray(rule.clauses) ? rule.clauses : [];
    const mapped: Clause[] = cs.map((c: any) => ({
      field: c?.field ?? "key",
      op: c?.op ?? "equals",
      value: c?.value ?? "",
    }));
    setClauses(mapped.length ? mapped : [{ field: "key", op: "equals", value: "" }]);
  }

  function addClause() {
    setClauses((prev) => [...prev, { field: "key", op: "equals", value: "" }]);
  }

  function removeClause(i: number) {
    setClauses((prev) => prev.filter((_, idx) => idx !== i));
  }

  function updateClause(i: number, patch: Partial<Clause>) {
    setClauses((prev) => prev.map((c, idx) => (idx === i ? { ...c, ...patch } : c)));
  }

  async function saveRule() {
    if (!stateId) return;
    setErr("");

    const payload = {
      state: stateId,
      priority: Number(priority),
      rollout_percentage: Number(rollout),
      variation: { value: variationValue === "true" },
      clauses: clauses.map((c) => ({
        field: c.field,
        op: c.op,
        value: c.value,
      })),
    };

    try {
      if (editingId === "new") {
        await api.post("/flag-rules/", payload);
      } else if (typeof editingId === "number") {
        await api.patch(`/flag-rules/${editingId}/`, payload);
      } else {
        return;
      }

      setEditingId(null);
      await loadRules();
      if (onChanged) await onChanged();
    } catch (e: any) {
      setErr("Save failed. Check clause format and try again.");
    }
  }

  function openDelete(rule: Rule) {
    setErr("");
    setDeleteTarget(rule);
  }

  async function confirmDeleteRule() {
    if (!deleteTarget) return;

    setDeleting(true);
    setErr("");

    try {
      await api.delete(`/flag-rules/${deleteTarget.id}/`);

      // if user was editing this rule, close editor
      if (editingId === deleteTarget.id) {
        setEditingId(null);
      }

      setDeleteTarget(null);
      await loadRules();
      if (onChanged) await onChanged();
    } catch (e: any) {
      setErr("Delete failed.");
    } finally {
      setDeleting(false);
    }
  }

  async function bumpPriority(rule: Rule, delta: number) {
    const next = Math.max(0, (rule.priority ?? 0) + delta);
    try {
      await api.patch(`/flag-rules/${rule.id}/`, { priority: next });
      await loadRules();
    } catch {
      setErr("Failed to reorder priority.");
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* overlay */}
      <div className="absolute inset-0 bg-black/55 backdrop-blur-sm" onClick={onClose} />

      {/* drawer */}
      <div className="absolute right-0 top-0 h-full w-full max-w-[640px] border-l border-white/10 bg-slate-950/85 shadow-2xl">
        <div className="h-full flex flex-col">
          {/* header */}
          <div className="p-5 border-b border-white/10 flex items-start justify-between gap-3">
            <div>
              <div className="text-lg font-semibold text-white flex items-center gap-2">
                <Sliders className="h-5 w-5 text-indigo-200" />
                Rules
              </div>
              <div className="mt-1 text-sm text-slate-300">
                <span className="text-white">{flagName || "—"}</span>{" "}
                <span className="text-slate-500">•</span>{" "}
                <span className="text-slate-200">{envLabel}</span>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                <Badge tone="indigo">Rules match in priority order</Badge>
                <Badge tone="emerald">Per-rule rollout supported</Badge>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="h-10 w-10 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 grid place-items-center transition"
              title="Close"
            >
              <X className="h-5 w-5 text-slate-200" />
            </button>
          </div>

          {/* content */}
          <div className="flex-1 overflow-auto p-5 space-y-4">
            {!stateId ? (
              <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-200">
                No FlagState found for this flag + environment. Select an environment and try again.
              </div>
            ) : null}

            {err ? (
              <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-200">
                {err}
              </div>
            ) : null}

            {/* create button */}
            <div className="flex items-center justify-between">
              <div className="text-sm text-slate-400">{loading ? "Loading..." : `${sortedRules.length} rule(s)`}</div>
              <Button onClick={resetEditorForNew}>+ Add rule
              </Button>
            </div>

            {/* editor */}
            {editingId ? (
              <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold text-white">
                    {editingId === "new" ? "Create rule" : `Edit rule #${editingId}`}
                  </div>
                  <Button variant="ghost" onClick={() => setEditingId(null)}>
                    Cancel
                  </Button>
                </div>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <div className="mb-1 text-sm text-slate-200">Priority</div>
                    <input
                      type="number"
                      className="w-full rounded-xl bg-slate-900/60 border border-slate-800 px-3 py-2 text-sm text-slate-100 outline-none"
                      value={priority}
                      onChange={(e) => setPriority(Number(e.target.value))}
                    />
                    <div className="mt-1 text-xs text-slate-500">Lower runs first</div>
                  </div>

                  <div>
                    <div className="mb-1 text-sm text-slate-200">Rule rollout %</div>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      className="w-full rounded-xl bg-slate-900/60 border border-slate-800 px-3 py-2 text-sm text-slate-100 outline-none"
                      value={rollout}
                      onChange={(e) => setRollout(Number(e.target.value))}
                    />
                    <div className="mt-1 text-xs text-slate-500">0–100</div>
                  </div>

                  <div>
                    <div className="mb-1 text-sm text-slate-200">Variation value</div>
                    <select
                      className="w-full rounded-xl bg-slate-900/60 border border-slate-800 px-3 py-2 text-sm text-slate-100 outline-none"
                      value={variationValue}
                      onChange={(e) => setVariationValue(e.target.value as any)}
                    >
                      <option value="true">true</option>
                      <option value="false">false</option>
                    </select>
                    <div className="mt-1 text-xs text-slate-500">Returned when rule matches</div>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="text-sm font-semibold text-white">Clauses</div>
                  <div className="text-xs text-slate-500 mt-1">
                    Clauses are AND-ed. Use <span className="text-slate-200">in</span> / <span className="text-slate-200">not_in</span> with comma-separated values.
                  </div>

                  <div className="mt-3 space-y-3">
                    {clauses.map((c, idx) => (
                      <div key={idx} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-end">
                        <div className="md:col-span-3">
                          <div className="mb-1 text-xs text-slate-400">Field</div>
                          <select
                            className="w-full rounded-xl bg-slate-900/60 border border-slate-800 px-3 py-2 text-sm text-slate-100 outline-none"
                            value={c.field}
                            onChange={(e) => updateClause(idx, { field: e.target.value })}
                          >
                            {FIELD_OPTIONS.map((f) => (
                              <option key={f.value} value={f.value}>
                                {f.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="md:col-span-3">
                          <div className="mb-1 text-xs text-slate-400">Operator</div>
                          <select
                            className="w-full rounded-xl bg-slate-900/60 border border-slate-800 px-3 py-2 text-sm text-slate-100 outline-none"
                            value={c.op}
                            onChange={(e) => {
                              const op = e.target.value;
                              const v = toTextValue(c.value);
                              updateClause(idx, { op, value: normalizeClauseValue(op, v) });
                            }}
                          >
                            {OP_OPTIONS.map((o) => (
                              <option key={o.value} value={o.value}>
                                {o.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="md:col-span-5">
                          <Input
                            label="Value"
                            placeholder={c.op === "in" || c.op === "not_in" ? "e.g. US, CA, IN" : "e.g. vip_"}
                            value={toTextValue(c.value)}
                            onChange={(e) => {
                              const raw = e.target.value;
                              updateClause(idx, { value: normalizeClauseValue(c.op, raw) });
                            }}
                          />
                        </div>

                        <div className="md:col-span-1 flex justify-end">
                          <Button variant="ghost" onClick={() => removeClause(idx)} title="Remove clause">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-3">
                    <Button variant="ghost" onClick={addClause}>+ Add clause
                    </Button>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-end gap-2">
                  <Button variant="ghost" onClick={() => setEditingId(null)}>
                    Cancel
                  </Button>
                  <Button onClick={saveRule}>
                    Save rule
                  </Button>
                </div>
              </div>
            ) : null}

            {/* rules list */}
            <div className="space-y-3">
              {sortedRules.length === 0 ? (
                <div className="rounded-2xl border border-slate-800 bg-slate-950/30 p-4 text-sm text-slate-400">
                  No rules yet. Add a rule to target specific users (vip_, country, plan, etc.).
                </div>
              ) : (
                sortedRules.map((r) => (
                  <div key={r.id} className="rounded-2xl border border-slate-800 bg-slate-950/30 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-semibold text-white">Rule #{r.id}</span>
                          <Badge tone="indigo">priority: {r.priority}</Badge>
                          <Badge tone={r.rollout_percentage === 100 ? "emerald" : "indigo"}>
                            rollout: {r.rollout_percentage}%
                          </Badge>
                          <Badge tone="indigo">value: {String(Boolean(r.variation?.value))}</Badge>
                        </div>

                        <div className="mt-2 text-xs text-slate-400 space-y-1">
                          {(Array.isArray(r.clauses) ? r.clauses : []).map((c: any, idx: number) => (
                            <div key={idx} className="truncate">
                              <span className="text-slate-200">{c.field}</span>{" "}
                              <span className="text-slate-500">{c.op}</span>{" "}
                              <span className="text-slate-300">
                                {Array.isArray(c.value) ? c.value.join(", ") : String(c.value)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => bumpPriority(r, -1)}
                          className="h-9 w-9 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 grid place-items-center transition"
                          title="Move up (lower priority number)"
                        >
                          <ArrowUp className="h-4 w-4 text-slate-200" />
                        </button>
                        <button
                          type="button"
                          onClick={() => bumpPriority(r, +1)}
                          className="h-9 w-9 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 grid place-items-center transition"
                          title="Move down (higher priority number)"
                        >
                          <ArrowDown className="h-4 w-4 text-slate-200" />
                        </button>

                        <Button variant="ghost" onClick={() => startEdit(r)}>
                          Edit
                        </Button>

                        <button
                          type="button"
                          onClick={() => openDelete(r)}
                          className="h-9 w-9 rounded-xl border border-rose-500/20 bg-rose-500/10 hover:bg-rose-500/15 grid place-items-center transition"
                          title="Delete rule"
                        >
                          <Trash2 className="h-4 w-4 text-rose-200" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* footer */}
          <div className="p-4 border-t border-white/10 flex items-center justify-between">
            <div className="text-xs text-slate-500">
            </div>
            <Button variant="ghost" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>

      {/* ✅ Delete rule confirm modal */}
      <Modal open={!!deleteTarget} onClose={() => (deleting ? null : setDeleteTarget(null))} title="Delete rule">
        <div className="space-y-4">
          <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-2xl bg-rose-500/15 border border-rose-500/20 grid place-items-center">
                <AlertTriangle className="h-5 w-5 text-rose-200" />
              </div>
              <div>
                <div className="text-sm font-semibold text-rose-100">
                  Delete Rule #{deleteTarget?.id}?
                </div>
                <div className="text-xs text-rose-200/80 mt-1">
                  This will remove the rule immediately. SDK evaluations will change right away.
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
              onClick={confirmDeleteRule}
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
