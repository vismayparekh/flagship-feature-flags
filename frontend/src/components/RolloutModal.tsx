import React, { useEffect, useMemo, useState } from "react";
import { Modal } from "./Modal";
import { Button } from "./Button";

type Props = {
  open: boolean;
  onClose: () => void;
  flagName: string;
  current: number;
  onSave: (next: number) => Promise<void>;
};

export function RolloutModal({ open, onClose, flagName, current, onSave }: Props) {
  const [value, setValue] = useState<number>(current);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setValue(current);
  }, [open, current]);

  const presets = useMemo(() => [0, 10, 25, 50, 75, 100], []);

  async function handleSave() {
    setSaving(true);
    try {
      await onSave(value);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Edit rollout percentage">
      <div className="space-y-4">
        <div className="text-sm text-slate-300">
          Flag: <span className="text-white font-semibold">{flagName || "—"}</span>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-400">Rollout</div>
            <div className="text-sm font-semibold text-white">{value}%</div>
          </div>

          <input
            type="range"
            min={0}
            max={100}
            value={value}
            onChange={(e) => setValue(Number(e.target.value))}
            className="mt-3 w-full accent-indigo-400"
          />

          <div className="mt-3 flex flex-wrap gap-2">
            {presets.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setValue(p)}
                className={
                  "px-3 py-1.5 text-xs rounded-xl border transition " +
                  (value === p
                    ? "border-indigo-400/40 bg-indigo-500/15 text-indigo-100"
                    : "border-slate-800 bg-slate-900/40 text-slate-200 hover:bg-slate-900/70")
                }
              >
                {p}%
              </button>
            ))}
          </div>

          <div className="mt-3 text-xs text-slate-500">
            Higher % → more users get the feature. In production, ramp up gradually (10% → 25% → 50% → 100%).
          </div>
        </div>

        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
        </div>
      </div>
    </Modal>
  );
}
