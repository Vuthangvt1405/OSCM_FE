"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { loginIdentity } from "@/lib/apis/auth";
import { toast } from "sonner";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

type LoginValues = z.infer<typeof loginSchema>;

const LoginForm = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultEmail = searchParams.get("email") ?? "";

  const defaultValues = useMemo<LoginValues>(
    () => ({ email: defaultEmail, password: "" }),
    [defaultEmail],
  );

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues,
  });

  useEffect(() => {
    if (defaultEmail) form.setValue("email", defaultEmail);
  }, [defaultEmail, form]);

  const onSubmit = async (values: LoginValues) => {
    try {
      await loginIdentity(values);
      router.refresh();
      console.log("push");
      router.push("/");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Login failed";
      toast.error(message || "Login failed");
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6">
      <h1 className="text-lg font-semibold text-slate-900">Login</h1>
      <p className="mt-1 text-sm text-slate-600">
        Login to access your account
      </p>

      <form
        action=""
        className="mt-6 space-y-4"
        onSubmit={form.handleSubmit(onSubmit)}
      >
        <div className="space-y-1">
          <label htmlFor="email" className="text-sm font-medium text-slate-900">
            Email
          </label>
          <input
            type="email"
            className="w-full rounded-lg border text-black px-3 py-2 text-sm outline-none "
            autoComplete="email"
            {...form.register("email")}
          />
          {form.formState.errors.email?.message ? (
            <div className="text-sm text-red-600">
              {form.formState.errors.email.message}
            </div>
          ) : null}
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700">Password</label>
          <input
            className="w-full rounded-lg border text-black px-3 py-2 text-sm outline-none "
            type="password"
            autoComplete="current-password"
            {...form.register("password")}
          />
          {form.formState.errors.password?.message ? (
            <div className="text-sm text-red-600">
              {form.formState.errors.password.message}
            </div>
          ) : null}
        </div>

        <button
          type="submit"
          className="inline-flex h-10 w-full items-center justify-center rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting ? "Logging in..." : "Login"}
        </button>

        <div className="text-sm text-slate-600">
          Chưa có tài khoản?{" "}
          <Link
            href="/register"
            className="font-medium text-slate-900 underline"
          >
            Register
          </Link>
        </div>
      </form>
      <div className="text-sm text-slate-600">
        <Link
          href="/forgot-password"
          className="font-medium text-slate-900 underline"
        >
          Forgot password?
        </Link>
      </div>
    </div>
  );
};

export default LoginForm;
