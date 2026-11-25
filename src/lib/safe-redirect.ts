/**
 * Validates a `next` redirect parameter and returns a safe internal path.
 *
 * Acceptance rules — the input must:
 *   1. Start with exactly one forward slash.
 *   2. Not start with `//`  (protocol-relative URL → external host).
 *   3. Not start with `\/`  (backslash normalised to `//` by some browsers).
 *   4. Contain no `:` character (rules out `http:`, `https:`, `javascript:`, etc.).
 *
 * Anything that does not satisfy all four rules falls back to `"/"`.
 *
 * After the string-level checks pass, the value is returned as-is.
 * No URL constructor is used — avoids the `http://localhost` bypass where
 * `new URL("http://localhost", base).hostname === "localhost"` would pass.
 */
export function getSafeRedirect(raw: string | null | undefined): string {
  if (!raw) return "/";

  // Rule 4 — reject anything containing a colon (scheme separator).
  if (raw.includes(":")) return "/";

  // Rules 1–3 — must start with / but not // or /\
  if (!/^\/[^/\\]/.test(raw) && raw !== "/") return "/";

  return raw;
}
