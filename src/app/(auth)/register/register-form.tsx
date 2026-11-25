"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, ArrowRight } from "lucide-react";
import { supabase } from "@/lib/supabase/client";

type Fields = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
};

type Errors = Partial<Record<keyof Fields, string>>;

function validate(fields: Fields): Errors {
  const errors: Errors = {};
  if (!fields.firstName.trim()) errors.firstName = "First name is required.";
  if (!fields.lastName.trim()) errors.lastName = "Last name is required.";
  if (!fields.email.trim()) {
    errors.email = "Email address is required.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email.trim())) {
    errors.email = "Please enter a valid email address.";
  }
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

function friendlyError(message: string): string {
  if (message.includes("already registered") || message.includes("already been registered")) {
    return "An account with this email already exists. Try signing in instead.";
  }
  if (message.includes("invalid email")) return "Please enter a valid email address.";
  if (message.includes("password")) return "Password does not meet the requirements.";
  if (message.includes("rate limit") || message.includes("too many")) {
    return "Too many attempts. Please wait a moment and try again.";
  }
  return "Something went wrong. Please try again.";
}

export default function RegisterForm() {
  const router = useRouter();
  const [fields, setFields] = useState<Fields>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Errors>({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
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

    setLoading(true);
    setServerError("");

    const callbackUrl = `${window.location.origin}/auth/callback?next=/`;

    const { error } = await supabase.auth.signUp({
      email: fields.email.trim().toLowerCase(),
      password: fields.password,
      options: {
        data: {
          first_name: fields.firstName.trim(),
          last_name: fields.lastName.trim(),
        },
        emailRedirectTo: callbackUrl,
      },
    });

    setLoading(false);

    if (error) {
      setServerError(friendlyError(error.message));
      return;
    }

    router.push("/verify-email");
  }

  const inputBase =
    "w-full border bg-transparent px-4 py-3 text-sm outline-none transition-colors placeholder:text-muted-grey focus:border-burgundy";
  const inputNormal = `${inputBase} border-light-beige`;
  const inputError = `${inputBase} border-red-400`;

  return (
    <>
      {/* Header */}
      <div className="mb-10 text-center">
        <p className="text-[10px] tracking-[0.3em] text-burgundy">
          CREATE AN ACCOUNT
        </p>
        <h1 className="mt-4 font-display text-3xl text-soft-black sm:text-4xl">
          Join AYSEL
        </h1>
        <p className="mt-3 text-xs leading-6 text-muted-grey">
          Create your account to save your wishlist,
          track orders, and enjoy a personalised experience.
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        {/* Name row */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="firstName" className="mb-1.5 block text-[10px] tracking-[0.15em] text-soft-black">
              FIRST NAME
            </label>
            <input
              id="firstName"
              name="firstName"
              type="text"
              autoComplete="given-name"
              value={fields.firstName}
              onChange={handleChange}
              disabled={loading}
              aria-describedby={errors.firstName ? "firstName-error" : undefined}
              aria-invalid={!!errors.firstName}
              className={errors.firstName ? inputError : inputNormal}
            />
            {errors.firstName && (
              <p id="firstName-error" role="alert" className="mt-1.5 text-[11px] text-red-500">
                {errors.firstName}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="lastName" className="mb-1.5 block text-[10px] tracking-[0.15em] text-soft-black">
              LAST NAME
            </label>
            <input
              id="lastName"
              name="lastName"
              type="text"
              autoComplete="family-name"
              value={fields.lastName}
              onChange={handleChange}
              disabled={loading}
              aria-describedby={errors.lastName ? "lastName-error" : undefined}
              aria-invalid={!!errors.lastName}
              className={errors.lastName ? inputError : inputNormal}
            />
            {errors.lastName && (
              <p id="lastName-error" role="alert" className="mt-1.5 text-[11px] text-red-500">
                {errors.lastName}
              </p>
            )}
          </div>
        </div>

        {/* Email */}
        <div className="mt-5">
          <label htmlFor="email" className="mb-1.5 block text-[10px] tracking-[0.15em] text-soft-black">
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
          <label htmlFor="password" className="mb-1.5 block text-[10px] tracking-[0.15em] text-soft-black">
            PASSWORD
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              value={fields.password}
              onChange={handleChange}
              disabled={loading}
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
          <label htmlFor="confirmPassword" className="mb-1.5 block text-[10px] tracking-[0.15em] text-soft-black">
            CONFIRM PASSWORD
          </label>
          <div className="relative">
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirm ? "text" : "password"}
              autoComplete="new-password"
              value={fields.confirmPassword}
              onChange={handleChange}
              disabled={loading}
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

        {/* Server error */}
        {serverError && (
          <div role="alert" className="mt-5 border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-600">
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
              CREATE ACCOUNT
              <ArrowRight size={15} />
            </>
          )}
        </button>
      </form>

      {/* Sign-in link */}
      <p className="mt-8 text-center text-xs text-muted-grey">
        Already have an account?{" "}
        <Link href="/login" className="text-burgundy underline-offset-2 hover:underline">
          Sign in
        </Link>
      </p>
    </>
  );
}
