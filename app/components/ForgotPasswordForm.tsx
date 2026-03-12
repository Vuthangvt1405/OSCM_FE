"use client";

import {
  requestForgotPasswordOtp,
  resetPasswordWithOtp,
} from "@/lib/apis/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import z from "zod";

const emailSchema = z.object({ email: z.string().email() });
const resetSchema = z.object({
  otp: z.string().min(6, { message: "OTP must be at least 6 characters" }),
  newPassword: z
    .string()
    .min(6, { message: "Password must be at least 6 characters" }),
});

type EmailValues = z.infer<typeof emailSchema>;

type ResetValues = z.infer<typeof resetSchema>;

const ForgotPasswordForm = () => {
  const router = useRouter();

  const [step, setStep] = useState<"email" | "reset">("email");
  const [email, setEmail] = useState<string>("");
  const [submitError, setSubmitError] = useState<string | null>(null);

  const emailForm = useForm<EmailValues>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: "" },
  });

  const resetForm = useForm<ResetValues>({
    resolver: zodResolver(resetSchema),
    defaultValues: { otp: "", newPassword: "" },
  });

  const onRequestOtp = async (values: EmailValues) => {
    setSubmitError(null);
    try {
      await requestForgotPasswordOtp({ email: values.email });
      setEmail(values.email);
      setStep("reset");
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Failed to send OTP");
    }
  };

  const onResetPassword = async (values: ResetValues) => {
    setSubmitError(null);
    try {
      await resetPasswordWithOtp({
        email,
        otp: values.otp,
        newPassword: values.newPassword,
      });
      router.push("/login?email=" + encodeURIComponent(email));
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Failed to reset password",
      );
    }
  };

  if (step === "reset") {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h1 className="text-lg font-semibold text-slate-900">Reset password</h1>
        <p className="mt-1 text-sm text-slate-600">
          Enter the OTP sent to your Telegram and your new password.
        </p>
        <form
          className="mt-6 space-y-4"
          onSubmit={resetForm.handleSubmit(onResetPassword)}
        >
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">OTP</label>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              className="w-full rounded-lg border px-3 py-2 text-sm text-black outline-none"
              {...resetForm.register("otp")}
            />
            {resetForm.formState.errors.otp?.message && (
              <div className="text-sm text-red-600">
                {resetForm.formState.errors.otp.message}
              </div>
            )}
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">
              New password
            </label>
            <input
              type="password"
              autoComplete="new-password"
              className="w-full rounded-lg border px-3 py-2 text-sm text-black outline-none"
              {...resetForm.register("newPassword")}
            />
            {resetForm.formState.errors.newPassword?.message && (
              <div className="text-sm text-red-600">
                {resetForm.formState.errors.newPassword.message}
              </div>
            )}
          </div>
          {submitError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {submitError}
            </div>
          )}
          <button
            type="submit"
            className="inline-flex h-10 w-full items-center justify-center rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
            disabled={resetForm.formState.isSubmitting}
          >
            {resetForm.formState.isSubmitting
              ? "Resetting..."
              : "Reset password"}
          </button>
          <button
            type="button"
            className="w-full text-sm text-slate-600 underline"
            onClick={() => setStep("email")}
          >
            Use a different email
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6">
      <h1 className="text-lg font-semibold text-slate-900">Forgot Password</h1>
      <p className="mt-1 text-sm text-slate-600">
        Enter your email. We&apos;ll send an OTP to your linked Telegram.
      </p>
      <form
        className="mt-6 space-y-4"
        onSubmit={emailForm.handleSubmit(onRequestOtp)}
      >
        <div>
          <label htmlFor="email" className="text-sm font-medium text-slate-900">
            Email
          </label>
          <input
            type="email"
            id="email"
            autoComplete="email"
            className="w-full rounded-lg border px-3 py-2 text-sm text-black outline-none"
            {...emailForm.register("email")}
          />
          {emailForm.formState.errors.email?.message && (
            <div className="text-sm text-red-600">
              {emailForm.formState.errors.email.message}
            </div>
          )}
        </div>
        {submitError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {submitError}
          </div>
        )}
        <button
          type="submit"
          className="inline-flex h-10 w-full items-center justify-center rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
          disabled={emailForm.formState.isSubmitting}
        >
          {emailForm.formState.isSubmitting ? "Sending..." : "Send OTP"}
        </button>
        <div className="text-sm text-slate-600">
          <Link href="/login" className="font-medium text-slate-900 underline">
            Back to login
          </Link>
        </div>
      </form>
    </div>
  );
};

export default ForgotPasswordForm;
