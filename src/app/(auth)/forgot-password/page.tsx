"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { supabase } from "@/lib/supabase/client";

type Status = "idle" | "loading" | "sent";

function validateEmail(email: string): string {
  if (!email.trim()) return "Email address is required.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return "Please enter a valid email address.";
  }
  return "";
}

function friendlyError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("rate limit") || m.includes("too many")) {
    return "Too many attempts. Please wait a moment and try again.";
  }
  if (m.includes("network") || m.includes("fetch")) {
    return "A network error occurred. Please check your connection and try again.";
  }
  return "Something went wrong. Please try again.";
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [serverError, setServerError] = useState("");
  const [status, setStatus] = useState<Status>("idle");

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setEmail(e.target.value);
    if (emailError) setEmailError("");
    if (serverError) setServerError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const err = validateEmail(email);
    if (err) {
      setEmailError(err);
      return;
    }

    setStatus("loading");
    setServerError("");

    const callbackUrl = `${window.location.origin}/auth/callback?type=recovery`;

    const { error } = await supabase.auth.resetPasswordForEmail(
      email.trim().toLowerCase(),
      { redirectTo: callbackUrl }
    );

    // Always show the success state — never reveal whether the address exists.
    if (error && (error.message.toLowerCase().includes("rate limit") || error.message.toLowerCase().includes("too many") || error.message.toLowerCase().includes("network") || error.message.toLowerCase().includes("fetch"))) {
      setStatus("idle");
      setServerError(friendlyError(error.message));
      return;
    }

    setStatus("sent");
  }

  const inputBase =
    "w-full border bg-transparent px-4 py-3 text-sm outline-none transition-colors placeholder:text-muted-grey focus:border-burgundy";

  if (status === "sent") {
    return (
      <div className="text-center">
        <p className="text-[10px] tracking-[0.3em] text-burgundy">
          EMAIL SENT
        </p>
        <h1 className="mt-4 font-display text-3xl text-soft-black sm:text-4xl">
          Check your inbox
        </h1>
        <p className="mt-5 text-sm leading-7 text-muted-grey">
          If an account exists for this email address, you will receive
          instructions to reset your password shortly.
        </p>
        <p className="mt-4 text-xs leading-6 text-muted-grey">
          The link will expire after 1 hour. If you don&apos;t see the email,
          check your spam or junk folder.
        </p>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/login"
            className="flex h-[48px] items-center justify-center bg-burgundy px-8 text-[10px] tracking-[0.2em] text-warm-white transition-colors hover:bg-soft-black"
          >
            BACK TO SIGN IN
          </Link>
          <Link
            href="/"
            className="flex h-[48px] items-center justify-center border border-light-beige px-8 text-[10px] tracking-[0.2em] text-muted-grey transition-colors hover:border-soft-black hover:text-soft-black"
          >
            BACK TO HOME
          </Link>
        </div>

        <p className="mt-10 text-[11px] text-muted-grey">
          Didn&apos;t receive the email?{" "}
          <button
            type="button"
            onClick={() => setStatus("idle")}
            className="text-burgundy underline-offset-2 hover:underline"
          >
            Try again
          </button>
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="mb-10 text-center">
        <p className="text-[10px] tracking-[0.3em] text-burgundy">
          PASSWORD RECOVERY
        </p>
        <h1 className="mt-4 font-display text-3xl text-soft-black sm:text-4xl">
          Forgot your password?
        </h1>
        <p className="mt-3 text-xs leading-6 text-muted-grey">
          Don&apos;t worry. Enter your registered email address and
          we&apos;ll send you a link to reset your password.
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate>
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
            value={email}
            onChange={handleChange}
            disabled={status === "loading"}
            aria-describedby={emailError ? "email-error" : undefined}
            aria-invalid={!!emailError}
            className={emailError ? `${inputBase} border-red-400` : `${inputBase} border-light-beige`}
          />
          {emailError && (
            <p id="email-error" role="alert" className="mt-1.5 text-[11px] text-red-500">
              {emailError}
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
              SEND RESET LINK
              <ArrowRight size={15} />
            </>
          )}
        </button>
      </form>

      <p className="mt-8 text-center">
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-[10px] tracking-[0.15em] text-muted-grey underline-offset-2 hover:text-soft-black hover:underline"
        >
          <ArrowLeft size={13} />
          BACK TO SIGN IN
        </Link>
      </p>
    </>
  );
}
