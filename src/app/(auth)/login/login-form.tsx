"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, ArrowRight } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { getSafeRedirect } from "@/lib/safe-redirect";

type Fields = { email: string; password: string };
type Errors = Partial<Record<keyof Fields, string>>;

function validate(fields: Fields): Errors {
  const errors: Errors = {};
  if (!fields.email.trim()) {
    errors.email = "Email address is required.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email.trim())) {
    errors.email = "Please enter a valid email address.";
  }
  if (!fields.password) errors.password = "Password is required.";
  return errors;
}

function friendlyError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login") || m.includes("invalid credentials") || m.includes("wrong")) {
    return "Incorrect email or password. Please try again.";
  }
  if (m.includes("email not confirmed") || m.includes("not confirmed")) {
    return "Please verify your email address before signing in. Check your inbox for the verification link.";
  }
  if (m.includes("rate limit") || m.includes("too many")) {
    return "Too many attempts. Please wait a moment and try again.";
  }
  if (m.includes("network") || m.includes("fetch")) {
    return "A network error occurred. Please check your connection and try again.";
  }
  return "Sign in failed. Please try again.";
}

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextParam = searchParams.get("next");

  const [fields, setFields] = useState<Fields>({ email: "", password: "" });
  const [errors, setErrors] = useState<Errors>({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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

    setLoading(true);
    setServerError("");

    const { error } = await supabase.auth.signInWithPassword({
      email: fields.email.trim().toLowerCase(),
      password: fields.password,
    });

    if (error) {
      setLoading(false);
      setServerError(friendlyError(error.message));
      return;
    }

    // Refresh server components so they pick up the new session cookie,
    // then navigate to the validated destination.
    router.refresh();
    router.push(getSafeRedirect(nextParam));
  }

  const inputBase =
    "w-full border bg-transparent px-4 py-3 text-sm outline-none transition-colors placeholder:text-muted-grey focus:border-burgundy";
  const inputNormal = `${inputBase} border-light-beige`;
  const inputError = `${inputBase} border-red-400`;

  return (
    <>
      {/* Page header */}
      <div className="mb-10 text-center">
        <p className="text-[10px] tracking-[0.3em] text-burgundy">
          WELCOME BACK
        </p>
        <h1 className="mt-4 font-display text-3xl text-soft-black sm:text-4xl">
          Sign in
        </h1>
        <p className="mt-3 text-xs leading-6 text-muted-grey">
          Sign in to your AYSEL account.
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        {/* Email */}
        <div>
          <label
            htmlFor="email"
            className="mb-1.5 block text-[10px] tracking-[0.15em] text-soft-black"
          >
            EMAIL ADDRESS
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            value={fields.email}
            onChange={handleChange}
            disabled={loading}
            aria-describedby={errors.email ? "email-error" : undefined}
            aria-invalid={!!errors.email}
            className={errors.email ? inputError : inputNormal}
          />
          {errors.email && (
            <p id="email-error" role="alert" className="mt-1.5 text-[11px] text-red-500">
              {errors.email}
            </p>
          )}
        </div>

        {/* Password */}
        <div className="mt-5">
          <div className="mb-1.5 flex items-center justify-between">
            <label
              htmlFor="password"
              className="text-[10px] tracking-[0.15em] text-soft-black"
            >
              PASSWORD
            </label>
            <Link
              href="/forgot-password"
              className="text-[10px] text-muted-grey underline-offset-2 hover:text-burgundy hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              value={fields.password}
              onChange={handleChange}
              disabled={loading}
              aria-describedby={errors.password ? "password-error" : undefined}
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
          {errors.password && (
            <p id="password-error" role="alert" className="mt-1.5 text-[11px] text-red-500">
              {errors.password}
            </p>
          )}
        </div>

        {/* Server error */}
        {serverError && (
          <div
            role="alert"
            className="mt-5 border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-600"
          >
            {serverError}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="mt-8 flex h-[52px] w-full items-center justify-center gap-3 bg-burgundy text-[10px] tracking-[0.2em] text-warm-white transition-colors hover:bg-soft-black disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-warm-white/30 border-t-warm-white" />
          ) : (
            <>
              SIGN IN
              <ArrowRight size={15} />
            </>
          )}
        </button>
      </form>

      {/* Footer links */}
      <p className="mt-8 text-center text-xs text-muted-grey">
        Don&apos;t have an account?{" "}
        <Link
          href="/register"
          className="text-burgundy underline-offset-2 hover:underline"
        >
          Create account
        </Link>
      </p>

      <p className="mt-4 text-center">
        <Link
          href="/"
          className="text-[10px] tracking-[0.15em] text-muted-grey underline-offset-2 hover:text-soft-black hover:underline"
        >
          CONTINUE SHOPPING
        </Link>
      </p>
    </>
  );
}
