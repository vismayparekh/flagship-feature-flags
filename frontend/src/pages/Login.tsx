import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import api from "../api/client";
import { Input } from "../components/Input";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { Link, useNavigate } from "react-router-dom";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

type Form = z.infer<typeof schema>;

export function Login() {
  const nav = useNavigate();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" }
  });

  async function onSubmit(values: Form) {
    const res = await api.post("/auth/token/", values);
    localStorage.setItem("auth", JSON.stringify(res.data));
    nav("/app");
  }

  return (
    <Card className="p-6">
      <div className="text-lg font-semibold">Welcome back</div>
      <div className="mt-1 text-sm text-slate-500"></div>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
        <Input label="Email" placeholder="you@company.com" error={errors.email?.message} {...register("email")} />
        <Input label="Password" type="password" placeholder="••••••••" error={errors.password?.message} {...register("password")} />
        <Button className="w-full" disabled={isSubmitting}>{isSubmitting ? "Signing in..." : "Sign in"}</Button>
        <div className="text-xs text-slate-500">
          Don’t have an account? <Link to="/register" className="text-indigo-300 hover:text-indigo-200">Create one</Link>
        </div>
      </form>
    </Card>
  );
}
