import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

/**
 * Cookie-based server client for Server Components, Route Handlers, and
 * Server Actions. Reads and writes the Supabase session from request cookies
 * so the authenticated user's session is always propagated correctly.
 *
 * In read-only contexts (Server Components) cookie writes are silently
 * ignored by Next.js — this is expected and safe.
 */
export async function createSupabaseServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Missing Supabase environment variables. " +
      "Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env.local"
    );
  }

  const cookieStore = await cookies();

  return createServerClient<Database>(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Server Component context — cookie writes are not permitted.
          // The middleware handles token refresh and cookie propagation.
        }
      },
    },
  });
}

/**
 * Privileged service-role client. Bypasses RLS.
 * Use only for trusted server-side operations (e.g. admin, seeding).
 * Never use for normal customer requests.
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
