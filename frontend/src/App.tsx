import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthLayout } from "./pages/AuthLayout";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { AppShell } from "./layout/AppShell";
import { Overview } from "./pages/Overview";
import { Projects } from "./pages/Projects";
import { Flags } from "./pages/Flags";
import { Audit } from "./pages/Audit";
import { SdkTester } from "./pages/SdkTester";
import { Settings } from "./pages/Settings";
import { useAuth } from "./auth/useAuth";

function Protected({ children }: { children: React.ReactNode }) {
  const { me, loading } = useAuth();
  if (loading) return <div className="p-10 text-slate-400">Loading...</div>;
  if (!me) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>

        <Route path="/app" element={<Protected><AppShell /></Protected>}>
          <Route index element={<Overview />} />
          <Route path="projects" element={<Projects />} />
          <Route path="flags" element={<Flags />} />
          <Route path="audit" element={<Audit />} />
          <Route path="sdk-tester" element={<SdkTester />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        <Route path="/" element={<Navigate to="/app" replace />} />
        <Route path="*" element={<Navigate to="/app" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
