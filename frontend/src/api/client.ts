import axios from "axios";
import { API_BASE_URL } from "../lib/env";

const api = axios.create({
  baseURL: API_BASE_URL + "/api",
});

function getTokens() {
  const raw = localStorage.getItem("auth");
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

api.interceptors.request.use((config) => {
  const t = getTokens();
  if (t?.access) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${t.access}`;
  }
  return config;
});

export async function refreshTokenIfNeeded() {
  const t = getTokens();
  if (!t?.refresh) return false;
  try {
    const res = await axios.post(API_BASE_URL + "/api/auth/token/refresh/", { refresh: t.refresh });
    const next = { ...t, access: res.data.access, refresh: res.data.refresh ?? t.refresh };
    localStorage.setItem("auth", JSON.stringify(next));
    return true;
  } catch {
    localStorage.removeItem("auth");
    return false;
  }
}

api.interceptors.response.use(
  (r) => r,
  async (error) => {
    const original = error.config;
    if (error?.response?.status === 401 && !original?._retry) {
      original._retry = true;
      const ok = await refreshTokenIfNeeded();
      if (ok) return api(original);
    }
    return Promise.reject(error);
  }
);

export default api;
