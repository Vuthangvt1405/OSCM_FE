"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { registerIdentity } from "@/lib/apis/auth";

const registerSchema = z
  .object({
    email: z.string().email(),
    password: z.string().min(6),
    confirmPassword: z.string().min(6),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: "Password not match",
    path: ["confirmPassword"],
  });

type RegisterValues = z.infer<typeof registerSchema>;

const RegisterForm = () => {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (values: RegisterValues) => {
    setSubmitError(null);

    try {
      await registerIdentity({ email: values.email, password: values.password });
      router.push(`/login?email=${encodeURIComponent(values.email)}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Register failed";
      setSubmitError(message || "Register failed");
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6">
      <h1 className="text-lg font-semibold text-slate-900">Register</h1>
      <p className="mt-1 text-sm text-slate-600">Create a new account</p>

      <form className="mt-6 space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-900">Email</label>
          <input
            type="email"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
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
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
            type="password"
            autoComplete="new-password"
            {...form.register("password")}
          />
          {form.formState.errors.password?.message ? (
            <div className="text-sm text-red-600">
              {form.formState.errors.password.message}
            </div>
          ) : null}
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700">
            Confirm password
          </label>
          <input
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
            type="password"
            autoComplete="new-password"
            {...form.register("confirmPassword")}
          />
          {form.formState.errors.confirmPassword?.message ? (
            <div className="text-sm text-red-600">
              {form.formState.errors.confirmPassword.message}
            </div>
          ) : null}
        </div>

        {submitError ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {submitError}
          </div>
        ) : null}

        <button
          type="submit"
          className="inline-flex h-10 w-full items-center justify-center rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting ? "Registering..." : "Register"}
        </button>

        <div className="text-sm text-slate-600">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-slate-900 underline">
            Login
          </Link>
        </div>
      </form>
    </div>
  );
};

export default RegisterForm;
