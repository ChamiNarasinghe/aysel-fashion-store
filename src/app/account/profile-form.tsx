"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CheckCircle } from "lucide-react";
import { updateProfile, type ProfileFields } from "./actions";
import {
  validateProfileForm,
  type ProfileFieldErrors,
} from "@/lib/profile-validation";
import type { ProfileRow } from "@/lib/supabase/types";

const inputBase =
  "w-full border bg-transparent px-4 py-3 text-sm outline-none transition-colors placeholder:text-muted-grey focus:border-burgundy disabled:opacity-50";

export default function ProfileForm({ profile }: { profile: ProfileRow }) {
  const router = useRouter();
  const [fields, setFields] = useState<ProfileFields>({
    first_name: profile.first_name ?? "",
    last_name: profile.last_name ?? "",
    phone: profile.phone ?? "",
  });
  const [fieldErrors, setFieldErrors] = useState<ProfileFieldErrors>({});
  const [serverError, setServerError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setFields((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name as keyof ProfileFields]) {
      setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
    }
    if (serverError) setServerError("");
    if (success) setSuccess(false);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errors = validateProfileForm(fields);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setServerError("");
    setSuccess(false);

    startTransition(async () => {
      const result = await updateProfile(fields);
      if (!result.ok) {
        setServerError(result.error);
      } else {
        setSuccess(true);
        // Refresh the Server Component tree so the sidebar overview reflects
        // the saved values without a full page reload.
        router.refresh();
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="grid gap-5 sm:grid-cols-2">
        {/* First name */}
        <div>
          <label
            htmlFor="first_name"
            className="mb-1.5 block text-[10px] tracking-[0.15em] text-soft-black"
          >
            FIRST NAME
          </label>
          <input
            id="first_name"
            name="first_name"
            type="text"
            autoComplete="given-name"
            value={fields.first_name}
            onChange={handleChange}
            disabled={isPending}
            aria-describedby={
              fieldErrors.first_name ? "first_name-error" : undefined
            }
            aria-invalid={!!fieldErrors.first_name}
            className={`${inputBase} ${fieldErrors.first_name ? "border-red-400" : "border-light-beige"}`}
          />
          {fieldErrors.first_name && (
            <p
              id="first_name-error"
              role="alert"
              className="mt-1.5 text-[11px] text-red-500"
            >
              {fieldErrors.first_name}
            </p>
          )}
        </div>

        {/* Last name */}
        <div>
          <label
            htmlFor="last_name"
            className="mb-1.5 block text-[10px] tracking-[0.15em] text-soft-black"
          >
            LAST NAME
          </label>
          <input
            id="last_name"
            name="last_name"
            type="text"
            autoComplete="family-name"
            value={fields.last_name}
            onChange={handleChange}
            disabled={isPending}
            aria-describedby={
              fieldErrors.last_name ? "last_name-error" : undefined
            }
            aria-invalid={!!fieldErrors.last_name}
            className={`${inputBase} ${fieldErrors.last_name ? "border-red-400" : "border-light-beige"}`}
          />
          {fieldErrors.last_name && (
            <p
              id="last_name-error"
              role="alert"
              className="mt-1.5 text-[11px] text-red-500"
            >
              {fieldErrors.last_name}
            </p>
          )}
        </div>
      </div>

      {/* Phone */}
      <div className="mt-5">
        <label
          htmlFor="phone"
          className="mb-1.5 block text-[10px] tracking-[0.15em] text-soft-black"
        >
          PHONE NUMBER{" "}
          <span className="text-muted-grey">(OPTIONAL)</span>
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          autoComplete="tel"
          value={fields.phone}
          onChange={handleChange}
          disabled={isPending}
          aria-describedby={fieldErrors.phone ? "phone-error" : undefined}
          aria-invalid={!!fieldErrors.phone}
          className={`${inputBase} ${fieldErrors.phone ? "border-red-400" : "border-light-beige"}`}
        />
        {fieldErrors.phone && (
          <p
            id="phone-error"
            role="alert"
            className="mt-1.5 text-[11px] text-red-500"
          >
            {fieldErrors.phone}
          </p>
        )}
      </div>

      {serverError && (
        <div
          role="alert"
          className="mt-5 border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-600"
        >
          {serverError}
        </div>
      )}

      {success && (
        <div
          role="status"
          className="mt-5 flex items-center gap-2 border border-green-200 bg-green-50 px-4 py-3 text-xs text-green-700"
        >
          <CheckCircle size={14} strokeWidth={2} />
          Profile updated successfully.
        </div>
      )}

      <div className="mt-7">
        <button
          type="submit"
          disabled={isPending}
          className="flex h-[48px] items-center justify-center gap-3 bg-burgundy px-8 text-[10px] tracking-[0.2em] text-warm-white transition-colors hover:bg-soft-black disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-warm-white/30 border-t-warm-white" />
          ) : (
            <>
              SAVE CHANGES
              <ArrowRight size={14} />
            </>
          )}
        </button>
      </div>
    </form>
  );
}
