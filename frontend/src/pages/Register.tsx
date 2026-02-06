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
  full_name: z.string().min(2, "Please enter your name"),
  email: z.string().email(),
  password: z.string().min(8, "Minimum 8 characters")
});

type Form = z.infer<typeof schema>;

export function Register() {
  const nav = useNavigate();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { full_name: "", email: "", password: "" }
  });

  async function onSubmit(values: Form) {
    await api.post("/auth/register/", values);
    const res = await api.post("/auth/token/", { email: values.email, password: values.password });
    localStorage.setItem("auth", JSON.stringify(res.data));
    nav("/app");
  }

  return (
    <Card className="p-6">
      <div className="text-lg font-semibold">Create account</div>
      <div className="mt-1 text-sm text-slate-500"></div>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
        <Input label="Full name" placeholder="Your name" error={errors.full_name?.message} {...register("full_name")} />
        <Input label="Email" placeholder="you@company.com" error={errors.email?.message} {...register("email")} />
        <Input label="Password" type="password" placeholder="Minimum 8 characters" error={errors.password?.message} {...register("password")} />
        <Button className="w-full" disabled={isSubmitting}>{isSubmitting ? "Creating..." : "Create account"}</Button>
        <div className="text-xs text-slate-500">
          Already have an account? <Link to="/login" className="text-indigo-300 hover:text-indigo-200">Sign in</Link>
        </div>
      </form>
    </Card>
  );
}
