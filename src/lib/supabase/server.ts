import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

/**
 * Server-side Supabase client for use in Server Components, Route Handlers
 * and Server Actions only. Never import in Client Components.
 *
 * Named createSupabaseServerClient (not createServerClient) to avoid a naming
 * collision with the @supabase/ssr export of the same name in Phase 10.
 *
 * This implementation uses @supabase/supabase-js directly with session
 * persistence disabled. Phase 10 will replace this with @supabase/ssr which
 * handles cookie-based session propagation for authenticated users.
 */
export function createSupabaseServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Missing Supabase environment variables. " +
      "Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env.local"
    );
  }

  return createClient<Database>(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

/**
 * Privileged server client using the secret key.
 * Bypasses RLS — use only for trusted server-side operations (e.g. seeding, admin).
 * Requires SUPABASE_SECRET_KEY in the server environment.
 * Never expose this key to the browser or commit it to source control.
 */
export function createSupabaseServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;

  if (!url || !secretKey) {
    throw new Error(
      "SUPABASE_SECRET_KEY is required for privileged server operations. " +
      "Never expose this key to the browser."
    );
  }

  return createClient<Database>(url, secretKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
