import { redirect } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import ChangePasswordForm from "./change-password-form";

export const metadata: Metadata = {
  title: "Change Password",
};

export const dynamic = "force-dynamic";

export default async function ChangePasswordPage() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login?next=/account/change-password");
  }

  return (
    <div className="min-h-[calc(100vh-76px-56px)] bg-warm-white">
      {/* Page header */}
      <div className="border-b border-light-beige bg-warm-white px-5 py-12 md:px-10">
        <div className="mx-auto max-w-4xl">
          <p className="text-[10px] tracking-[0.3em] text-burgundy">
            MY ACCOUNT
          </p>
          <h1 className="mt-3 font-display text-3xl text-soft-black sm:text-4xl">
            Change password
          </h1>
          <p className="mt-2 text-sm text-muted-grey">
            Enter your current password to set a new one.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-5 py-10 md:px-10">
        <div className="grid gap-8 lg:grid-cols-3">

          {/* ── Sidebar ───────────────────────────────────────────────── */}
          <aside className="lg:col-span-1">
            <div className="border border-light-beige bg-warm-white p-6">
              <p className="text-[10px] tracking-[0.2em] text-burgundy">
                SECURITY
              </p>
              <p className="mt-4 text-xs leading-6 text-muted-grey">
                Choose a strong password of at least 8 characters. Your current
                password is required to confirm the change.
              </p>
              <p className="mt-4 text-xs leading-6 text-muted-grey">
                You will remain signed in after a successful update.
              </p>
            </div>

            <div className="mt-4">
              <Link
                href="/account"
                className="inline-flex items-center gap-2 text-[10px] tracking-[0.15em] text-muted-grey transition-colors hover:text-soft-black"
              >
                <ArrowLeft size={13} />
                BACK TO ACCOUNT
              </Link>
            </div>
          </aside>

          {/* ── Main: form ────────────────────────────────────────────── */}
          <main className="lg:col-span-2">
            <div className="border border-light-beige bg-warm-white p-6 sm:p-8">
              <p className="text-[10px] tracking-[0.2em] text-burgundy">
                UPDATE PASSWORD
              </p>
              <h2 className="mt-2 font-display text-xl text-soft-black">
                Set a new password
              </h2>
              <p className="mt-1 text-xs text-muted-grey">
                All fields are required.
              </p>
              <div className="mt-7">
                <ChangePasswordForm />
              </div>
            </div>
          </main>

        </div>
      </div>
    </div>
  );
}
