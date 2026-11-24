import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";

if (!supabaseUrl || !supabasePublishableKey) {
  // Warn at runtime rather than throwing at module evaluation time.
  // A missing URL/key will surface as a network error when a query is made.
  console.warn(
    "[Supabase] NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is not set. "
    + "Configure these in .env.local before making database queries."
  );
}

// Singleton browser client — safe to import in Client Components.
export const supabase = createClient<Database>(supabaseUrl, supabasePublishableKey);
