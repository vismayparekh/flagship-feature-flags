import React, { useEffect, useState } from "react";
import api from "../api/client";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import { Input } from "../components/Input";
import { CopyButton } from "../components/Copy";
import { Badge } from "../components/Badge";
import axios from "axios";
import { API_BASE_URL } from "../lib/env";
import { TestTube2 } from "lucide-react";

type Project = { id: number; name: string };
type Env = { id: number; project: number; name: string; key: string; client_sdk_key: string };

export function SdkTester() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [envs, setEnvs] = useState<Env[]>([]);
  const [projectId, setProjectId] = useState<number | null>(null);
  const [envId, setEnvId] = useState<number | null>(null);

  const [userKey, setUserKey] = useState("user_123");
  const [email, setEmail] = useState("user@example.com");
  const [country, setCountry] = useState("US");
  const [plan, setPlan] = useState("free");

  const [clientKey, setClientKey] = useState("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const o = await api.get("/orgs/");
      if (o.data?.[0]?.id) {
        const p = await api.get("/projects/", { params: { org_id: o.data[0].id } });
        setProjects(p.data);
        if (p.data?.[0]?.id) setProjectId(p.data[0].id);
      }
    })();
  }, []);

  useEffect(() => {
    if (!projectId) return;
    (async () => {
      const e = await api.get("/environments/", { params: { project_id: projectId } });
      setEnvs(e.data);
      if (e.data?.[0]?.id) setEnvId(e.data[0].id);
    })();
  }, [projectId]);

  useEffect(() => {
    const env = envs.find((x) => x.id === envId);
    if (env) setClientKey(env.client_sdk_key);
  }, [envId, envs]);

  async function runEval() {
    if (!clientKey) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await axios.post(
        API_BASE_URL + "/api/sdk/evaluate/",
        { user: { key: userKey, email, country, plan } },
        { headers: { "X-Client-Key": clientKey } }
      );
      setResult(res.data);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xl font-semibold">SDK Tester</div>
          <div className="text-sm text-slate-500 mt-1">Simulate a client calling the evaluate endpoint.</div>
        </div>
        <Badge tone="indigo"><TestTube2 className="h-3.5 w-3.5" /> Public Evaluate API</Badge>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="p-5">
          <div className="text-base font-semibold">Choose environment</div>

          <div className="mt-4 grid md:grid-cols-2 gap-3">
            <label className="text-sm text-slate-400">
              Project
              <select className="mt-1 w-full rounded-xl bg-slate-900/60 border border-slate-800 px-3 py-2 text-sm"
                value={projectId ?? ""} onChange={(e) => setProjectId(Number(e.target.value))}>
                {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </label>

            <label className="text-sm text-slate-400">
              Environment
              <select className="mt-1 w-full rounded-xl bg-slate-900/60 border border-slate-800 px-3 py-2 text-sm"
                value={envId ?? ""} onChange={(e) => setEnvId(Number(e.target.value))}>
                {envs.map((e) => <option key={e.id} value={e.id}>{e.name} ({e.key})</option>)}
              </select>
            </label>
          </div>

          <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950/30 p-4">
            <div className="text-xs text-slate-500">Environment client key</div>
            <div className="mt-1 text-xs text-slate-200 break-all">{clientKey || "—"}</div>
            <div className="mt-2"><CopyButton value={clientKey || ""} /></div>
          </div>

          <div className="mt-6 text-base font-semibold">User context</div>
          <div className="mt-3 grid md:grid-cols-2 gap-3">
            <Input label="User key" value={userKey} onChange={(e) => setUserKey(e.target.value)} />
            <Input label="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <Input label="Country" value={country} onChange={(e) => setCountry(e.target.value)} />
            <Input label="Plan" value={plan} onChange={(e) => setPlan(e.target.value)} />
          </div>

          <div className="mt-5">
            <Button className="w-full" onClick={runEval} disabled={loading || !clientKey}>
              {loading ? "Evaluating..." : "Run Evaluation"}
            </Button>
          </div>

          <div className="mt-3 text-xs text-slate-500">
            
          </div>
        </Card>

        <Card className="p-5">
          <div className="text-base font-semibold">Result</div>
          <div className="mt-3 rounded-2xl border border-slate-800 bg-slate-950/30 p-4 min-h-[420px]">
            <pre className="text-xs text-slate-200 whitespace-pre-wrap break-words">
              {result ? JSON.stringify(result, null, 2) : "Run evaluation to see response."}
            </pre>
          </div>
          <div className="mt-3 text-xs text-slate-500">
          </div>
        </Card>
      </div>
    </div>
  );
}
