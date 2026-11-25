"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, ArrowRight, CheckCircle } from "lucide-react";
import { updatePassword } from "./actions";

type Fields = { password: string; confirmPassword: string };
type Errors = Partial<Record<keyof Fields, string>>;
type Status = "ready" | "loading" | "success";

function validate(fields: Fields): Errors {
  const errors: Errors = {};
  if (!fields.password) {
    errors.password = "Password is required.";
  } else if (fields.password.length < 8) {
    errors.password = "Password must be at least 8 characters.";
  }
  if (!fields.confirmPassword) {
    errors.confirmPassword = "Please confirm your password.";
  } else if (fields.password !== fields.confirmPassword) {
    errors.confirmPassword = "Passwords do not match.";
  }
  return errors;
}

// ── Expired / unauthorised state ─────────────────────────────────────────────

export function RecoveryExpired() {
  return (
    <div className="text-center">
      <p className="text-[10px] tracking-[0.3em] text-burgundy">
        LINK EXPIRED
      </p>
      <h1 className="mt-4 font-display text-3xl text-soft-black sm:text-4xl">
        Reset link expired
      </h1>
      <p className="mt-5 text-sm leading-7 text-muted-grey">
        This password reset link is no longer valid. Reset links expire
        after 10 minutes and can only be used once.
      </p>
      <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Link
          href="/forgot-password"
          className="flex h-[48px] items-center justify-center bg-burgundy px-8 text-[10px] tracking-[0.2em] text-warm-white transition-colors hover:bg-soft-black"
        >
          REQUEST NEW LINK
        </Link>
        <Link
          href="/"
          className="flex h-[48px] items-center justify-center border border-light-beige px-8 text-[10px] tracking-[0.2em] text-muted-grey transition-colors hover:border-soft-black hover:text-soft-black"
        >
          BACK TO HOME
        </Link>
      </div>
    </div>
  );
}

// ── Reset password form ───────────────────────────────────────────────────────

export default function ResetPasswordForm() {
  const [status, setStatus] = useState<Status>("ready");
  const [fields, setFields] = useState<Fields>({ password: "", confirmPassword: "" });
  const [errors, setErrors] = useState<Errors>({});
  const [serverError, setServerError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setFields((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof Fields]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
    if (serverError) setServerError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validation = validate(fields);
    if (Object.keys(validation).length > 0) {
      setErrors(validation);
      return;
    }

    setStatus("loading");
    setServerError("");

    // The Server Action verifies the recovery cookie and Supabase session
    // before performing the update — no client-side token handling needed.
    const result = await updatePassword(fields.password);

    if (!result.ok) {
      setStatus("ready");
      setServerError(result.error);
      return;
    }

    setStatus("success");
  }

  const inputBase =
    "w-full border bg-transparent px-4 py-3 text-sm outline-none transition-colors placeholder:text-muted-grey focus:border-burgundy";
  const inputNormal = `${inputBase} border-light-beige`;
  const inputError = `${inputBase} border-red-400`;

  // ── Success ─────────────────────────────────────────────────────────────────
  if (status === "success") {
    return (
      <div className="text-center">
        <div className="mx-auto mb-8 flex h-16 w-16 items-center justify-center border border-light-beige bg-warm-white">
          <CheckCircle size={28} strokeWidth={1.5} className="text-burgundy" />
        </div>
        <p className="text-[10px] tracking-[0.3em] text-burgundy">
          PASSWORD UPDATED
        </p>
        <h1 className="mt-4 font-display text-3xl text-soft-black sm:text-4xl">
          Password changed
        </h1>
        <p className="mt-5 text-sm leading-7 text-muted-grey">
          Your password has been updated successfully.
          You can now sign in with your new password.
        </p>
        <div className="mt-10">
          <Link
            href="/login"
            className="inline-flex h-[52px] items-center justify-center gap-3 bg-burgundy px-10 text-[10px] tracking-[0.2em] text-warm-white transition-colors hover:bg-soft-black"
          >
            SIGN IN
            <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    );
  }

  // ── Form (ready | loading) ───────────────────────────────────────────────────
  return (
    <>
      <div className="mb-10 text-center">
        <p className="text-[10px] tracking-[0.3em] text-burgundy">
          RESET PASSWORD
        </p>
        <h1 className="mt-4 font-display text-3xl text-soft-black sm:text-4xl">
          Create a new password
        </h1>
        <p className="mt-3 text-xs leading-6 text-muted-grey">
          Choose a strong password to keep your AYSEL account secure.
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        {/* New password */}
        <div>
          <label
            htmlFor="password"
            className="mb-1.5 block text-[10px] tracking-[0.15em] text-soft-black"
          >
            NEW PASSWORD
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              value={fields.password}
              onChange={handleChange}
              disabled={status === "loading"}
              aria-describedby={errors.password ? "password-error" : "password-hint"}
              aria-invalid={!!errors.password}
              className={`${errors.password ? inputError : inputNormal} pr-11`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-grey transition-colors hover:text-soft-black"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.password ? (
            <p id="password-error" role="alert" className="mt-1.5 text-[11px] text-red-500">
              {errors.password}
            </p>
          ) : (
            <p id="password-hint" className="mt-1.5 text-[11px] text-muted-grey">
              Minimum 8 characters.
            </p>
          )}
        </div>

        {/* Confirm password */}
        <div className="mt-5">
          <label
            htmlFor="confirmPassword"
            className="mb-1.5 block text-[10px] tracking-[0.15em] text-soft-black"
          >
            CONFIRM NEW PASSWORD
          </label>
          <div className="relative">
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirm ? "text" : "password"}
              autoComplete="new-password"
              value={fields.confirmPassword}
              onChange={handleChange}
              disabled={status === "loading"}
              aria-describedby={errors.confirmPassword ? "confirmPassword-error" : undefined}
              aria-invalid={!!errors.confirmPassword}
              className={`${errors.confirmPassword ? inputError : inputNormal} pr-11`}
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              aria-label={showConfirm ? "Hide confirm password" : "Show confirm password"}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-grey transition-colors hover:text-soft-black"
            >
              {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p id="confirmPassword-error" role="alert" className="mt-1.5 text-[11px] text-red-500">
              {errors.confirmPassword}
            </p>
          )}
        </div>

        {serverError && (
          <div role="alert" className="mt-5 border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-600">
            {serverError}
          </div>
        )}

        <button
          type="submit"
          disabled={status === "loading"}
          className="mt-8 flex h-[52px] w-full items-center justify-center gap-3 bg-burgundy text-[10px] tracking-[0.2em] text-warm-white transition-colors hover:bg-soft-black disabled:cursor-not-allowed disabled:opacity-60"
        >
          {status === "loading" ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-warm-white/30 border-t-warm-white" />
          ) : (
            <>
              UPDATE PASSWORD
              <ArrowRight size={15} />
            </>
          )}
        </button>
      </form>
    </>
  );
}
