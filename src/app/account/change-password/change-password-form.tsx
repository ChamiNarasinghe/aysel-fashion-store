"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, ArrowRight, CheckCircle } from "lucide-react";
import {
  validateChangePasswordForm,
  type ChangePasswordFields,
  type ChangePasswordErrors,
} from "@/lib/change-password-validation";
import { changePassword } from "./actions";

type Status = "ready" | "loading" | "success";

const inputBase =
  "w-full border bg-transparent px-4 py-3 text-sm outline-none transition-colors placeholder:text-muted-grey focus:border-burgundy";
const inputNormal = `${inputBase} border-light-beige`;
const inputError = `${inputBase} border-red-400`;

export default function ChangePasswordForm() {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("ready");
  const [fields, setFields] = useState<ChangePasswordFields>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<ChangePasswordErrors>({});
  const [serverError, setServerError] = useState("");
  const [show, setShow] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setFields((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof ChangePasswordFields]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
    if (serverError) setServerError("");
  }

  function toggleShow(field: keyof typeof show) {
    setShow((prev) => ({ ...prev, [field]: !prev[field] }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validation = validateChangePasswordForm(fields);
    if (Object.keys(validation).length > 0) {
      setErrors(validation);
      return;
    }

    setStatus("loading");
    setServerError("");

    const result = await changePassword(
      fields.currentPassword,
      fields.newPassword,
      fields.confirmPassword
    );

    if (!result.ok) {
      setStatus("ready");
      if (result.field) {
        setErrors((prev) => ({ ...prev, [result.field!]: result.error }));
      } else {
        setServerError(result.error);
      }
      return;
    }

    setStatus("success");
    // Refresh server components so the updated session is reflected.
    router.refresh();
  }

  if (status === "success") {
    return (
      <div className="text-center">
        <div className="mx-auto mb-8 flex h-16 w-16 items-center justify-center border border-light-beige bg-warm-white">
          <CheckCircle size={28} strokeWidth={1.5} className="text-burgundy" />
        </div>
        <p className="text-[10px] tracking-[0.3em] text-burgundy">
          PASSWORD UPDATED
        </p>
        <h2 className="mt-4 font-display text-2xl text-soft-black">
          Password changed
        </h2>
        <p className="mt-4 text-sm leading-7 text-muted-grey">
          Your password has been updated successfully.
        </p>
        <div className="mt-8">
          <Link
            href="/account"
            className="inline-flex h-[52px] items-center justify-center gap-3 bg-burgundy px-10 text-[10px] tracking-[0.2em] text-warm-white transition-colors hover:bg-soft-black"
          >
            BACK TO ACCOUNT
            <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      {/* Current password */}
      <div>
        <label
          htmlFor="currentPassword"
          className="mb-1.5 block text-[10px] tracking-[0.15em] text-soft-black"
        >
          CURRENT PASSWORD
        </label>
        <div className="relative">
          <input
            id="currentPassword"
            name="currentPassword"
            type={show.currentPassword ? "text" : "password"}
            autoComplete="current-password"
            value={fields.currentPassword}
            onChange={handleChange}
            disabled={status === "loading"}
            aria-describedby={errors.currentPassword ? "currentPassword-error" : undefined}
            aria-invalid={!!errors.currentPassword}
            className={`${errors.currentPassword ? inputError : inputNormal} pr-11`}
          />
          <button
            type="button"
            onClick={() => toggleShow("currentPassword")}
            aria-label={show.currentPassword ? "Hide current password" : "Show current password"}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-grey transition-colors hover:text-soft-black"
          >
            {show.currentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        {errors.currentPassword && (
          <p id="currentPassword-error" role="alert" className="mt-1.5 text-[11px] text-red-500">
            {errors.currentPassword}
          </p>
        )}
      </div>

      {/* New password */}
      <div className="mt-5">
        <label
          htmlFor="newPassword"
          className="mb-1.5 block text-[10px] tracking-[0.15em] text-soft-black"
        >
          NEW PASSWORD
        </label>
        <div className="relative">
          <input
            id="newPassword"
            name="newPassword"
            type={show.newPassword ? "text" : "password"}
            autoComplete="new-password"
            value={fields.newPassword}
            onChange={handleChange}
            disabled={status === "loading"}
            aria-describedby={errors.newPassword ? "newPassword-error" : "newPassword-hint"}
            aria-invalid={!!errors.newPassword}
            className={`${errors.newPassword ? inputError : inputNormal} pr-11`}
          />
          <button
            type="button"
            onClick={() => toggleShow("newPassword")}
            aria-label={show.newPassword ? "Hide new password" : "Show new password"}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-grey transition-colors hover:text-soft-black"
          >
            {show.newPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        {errors.newPassword ? (
          <p id="newPassword-error" role="alert" className="mt-1.5 text-[11px] text-red-500">
            {errors.newPassword}
          </p>
        ) : (
          <p id="newPassword-hint" className="mt-1.5 text-[11px] text-muted-grey">
            Minimum 8 characters.
          </p>
        )}
      </div>

      {/* Confirm new password */}
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
            type={show.confirmPassword ? "text" : "password"}
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
            onClick={() => toggleShow("confirmPassword")}
            aria-label={show.confirmPassword ? "Hide confirm password" : "Show confirm password"}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-grey transition-colors hover:text-soft-black"
          >
            {show.confirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
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
  );
}
