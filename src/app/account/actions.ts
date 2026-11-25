"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";
import {
  validateProfileFields,
  type ProfileFields,
} from "@/lib/profile-validation";

export type { ProfileFields };

export type ProfileUpdateResult =
  | { ok: true }
  | { ok: false; error: string };

export async function updateProfile(
  fields: ProfileFields
): Promise<ProfileUpdateResult> {
  // Re-validate server-side — never trust client input.
  const validationError = validateProfileFields(fields);
  if (validationError) {
    return { ok: false, error: validationError };
  }

  // Authenticate via server-validated session — user ID is never taken from
  // the client. The RLS UPDATE policy (auth.uid() = id) enforces ownership
  // at the database level as a second layer.
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      ok: false,
      error: "Your session has expired. Please sign in again.",
    };
  }

  // The payload is typed via the Database alias before the query so TypeScript
  // verifies the data shape independently of the cast below.
  type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];
  const payload: ProfileUpdate = {
    first_name: fields.first_name.trim() || null,
    last_name: fields.last_name.trim() || null,
    phone: fields.phone.trim() || null,
  };

  // Workaround: the Next.js TypeScript plugin (tsconfig "plugins": ["next"])
  // transforms "use server" modules during type-checking in a way that breaks
  // the Database generic propagation from createServerClient into .from() call
  // sites — the table argument resolves to `never` under the plugin even though
  // the same code type-checks cleanly without it. The payload is fully typed
  // above via the Database type alias, so the data shape is still verified.
  // The cast is limited to this single query expression.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: updateError, count } = await (supabase as any)
    .from("profiles")
    .update(payload)
    .eq("id", user.id)
    .select("id", { count: "exact", head: true });

  if (updateError) {
    return { ok: false, error: "Failed to update profile. Please try again." };
  }

  // count === 0 means the RLS policy matched no rows — the profile record is
  // missing. A zero-row update must not be reported as success.
  if (count === 0) {
    return {
      ok: false,
      error: "Profile not found. Please contact support if this issue persists.",
    };
  }

  return { ok: true };
}
