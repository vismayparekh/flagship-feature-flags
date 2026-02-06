import { useEffect, useState } from "react";
import api from "../api/client";

type Me = { id: number; email: string; full_name: string; is_superuser: boolean };

export function useAuth() {
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    const raw = localStorage.getItem("auth");
    if (!raw) { setMe(null); setLoading(false); return; }
    try {
      const res = await api.get("/auth/me/");
      setMe(res.data);
    } catch {
      setMe(null);
      localStorage.removeItem("auth");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function logout() {
    localStorage.removeItem("auth");
    setMe(null);
  }

  return { me, loading, reload: load, logout };
}
