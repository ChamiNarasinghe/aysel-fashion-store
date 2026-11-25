import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ProfileRow } from "@/lib/supabase/types";
import ProfileForm from "./profile-form";

export const metadata: Metadata = {
  title: "My Account",
};

// Always server-render — reads the live session and profile on every request.
export const dynamic = "force-dynamic";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function AccountPage() {
  const supabase = await createSupabaseServerClient();

  // Server-validated auth — never trusts the cookie value directly.
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login?next=/account");
  }

  // Fetch the authenticated user's own profile.
  // RLS policy "Customers read own profile" (auth.uid() = id) ensures this
  // query can only ever return the current user's row.
  //
  // Workaround: the Next.js TypeScript plugin transforms Server Component
  // modules during type-checking in a way that breaks Database generic
  // propagation from createServerClient into .from() call sites — the table
  // argument resolves to `never` under the plugin. The result is immediately
  // re-typed as ProfileRow | null so the rest of the file is fully typed.
  // The cast is limited to this single query expression.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profileData, error: profileError, status: profileStatus } = await (supabase as any)
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  // PGRST116 = "no rows" from .single() — not a real error when the trigger
  // hasn't fired yet. Any other error is unexpected and worth logging.
  if (profileError && profileError.code !== "PGRST116") {
    console.error(
      `[account] profile query failed — status=${profileStatus} code=${profileError.code} message=${profileError.message} details=${profileError.details} hint=${profileError.hint}`
    );
  }

  const profile = profileData as ProfileRow | null;

  const displayName =
    profile?.first_name && profile?.last_name
      ? `${profile.first_name} ${profile.last_name}`
      : profile?.first_name ?? user.email ?? "there";

  return (
    <div className="min-h-[calc(100vh-76px-56px)] bg-warm-white">
      {/* Page header */}
      <div className="border-b border-light-beige bg-warm-white px-5 py-12 md:px-10">
        <div className="mx-auto max-w-4xl">
          <p className="text-[10px] tracking-[0.3em] text-burgundy">
            MY ACCOUNT
          </p>
          <h1 className="mt-3 font-display text-3xl text-soft-black sm:text-4xl">
            Welcome back, {displayName.split(" ")[0]}
          </h1>
          <p className="mt-2 text-sm text-muted-grey">
            Manage your personal information and account settings.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-5 py-10 md:px-10">
        <div className="grid gap-8 lg:grid-cols-3">

          {/* ── Sidebar: Account overview ─────────────────────────────── */}
          <aside className="lg:col-span-1">
            <div className="border border-light-beige bg-warm-white p-6">
              <p className="text-[10px] tracking-[0.2em] text-burgundy">
                ACCOUNT OVERVIEW
              </p>

              <div className="mt-5 space-y-4">
                <div>
                  <p className="text-[10px] tracking-[0.12em] text-muted-grey">
                    NAME
                  </p>
                  <p className="mt-1 text-sm text-soft-black">
                    {profile?.first_name || profile?.last_name
                      ? [profile.first_name, profile.last_name]
                          .filter(Boolean)
                          .join(" ")
                      : "—"}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] tracking-[0.12em] text-muted-grey">
                    EMAIL
                  </p>
                  <p className="mt-1 break-all text-sm text-soft-black">
                    {user.email}
                  </p>
                </div>

                {profile?.phone && (
                  <div>
                    <p className="text-[10px] tracking-[0.12em] text-muted-grey">
                      PHONE
                    </p>
                    <p className="mt-1 text-sm text-soft-black">
                      {profile.phone}
                    </p>
                  </div>
                )}

                <div>
                  <p className="text-[10px] tracking-[0.12em] text-muted-grey">
                    MEMBER SINCE
                  </p>
                  <p className="mt-1 text-sm text-soft-black">
                    {formatDate(user.created_at)}
                  </p>
                </div>
              </div>
            </div>

            {/* Authentication info */}
            <div className="mt-4 border border-light-beige bg-warm-white p-6">
              <p className="text-[10px] tracking-[0.2em] text-burgundy">
                AUTHENTICATION
              </p>
              <div className="mt-4 space-y-3">
                <div>
                  <p className="text-[10px] tracking-[0.12em] text-muted-grey">
                    SIGN-IN METHOD
                  </p>
                  <p className="mt-1 text-sm text-soft-black">
                    Email &amp; password
                  </p>
                </div>
                <div>
                  <p className="text-[10px] tracking-[0.12em] text-muted-grey">
                    EMAIL VERIFIED
                  </p>
                  <p className="mt-1 text-sm text-soft-black">
                    {user.email_confirmed_at ? "Yes" : "Pending verification"}
                  </p>
                </div>
              </div>
            </div>

            {/* Account actions */}
            <div className="mt-4 border border-light-beige bg-warm-white p-6">
              <p className="text-[10px] tracking-[0.2em] text-burgundy">
                ACCOUNT ACTIONS
              </p>
              <div className="mt-4 space-y-3">
                <a
                  href="/account/change-password"
                  className="block text-xs text-muted-grey underline-offset-2 transition-colors hover:text-burgundy hover:underline"
                >
                  Change password
                </a>
              </div>
            </div>
          </aside>

          {/* ── Main: Personal information ────────────────────────────── */}
          <main className="lg:col-span-2">
            <div className="border border-light-beige bg-warm-white p-6 sm:p-8">
              <p className="text-[10px] tracking-[0.2em] text-burgundy">
                PERSONAL INFORMATION
              </p>
              <h2 className="mt-2 font-display text-xl text-soft-black">
                Edit your profile
              </h2>
              <p className="mt-1 text-xs text-muted-grey">
                Your email address cannot be changed here.
              </p>

              {profile ? (
                <div className="mt-7">
                  <ProfileForm profile={profile} />
                </div>
              ) : (
                // Profile row missing — trigger may not have fired yet.
                // Surface a clear message rather than crashing or silently
                // creating a duplicate row.
                <div className="mt-7 border border-golden-sand bg-golden-sand/10 px-5 py-4 text-sm text-soft-black">
                  <p className="font-medium">Profile not found.</p>
                  <p className="mt-1 text-xs text-muted-grey">
                    Your profile record could not be loaded. This can happen if
                    account creation did not complete fully. Please contact
                    support if this persists.
                  </p>
                </div>
              )}
            </div>
          </main>

        </div>
      </div>
    </div>
  );
}
