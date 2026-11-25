// Safe wrapper around browser localStorage.
// Never accesses window/localStorage during SSR.
// Returns explicit success/failure results — never silently swallows errors.

export type StorageResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: StorageError };

export type StorageError =
  | { kind: "unavailable" }
  | { kind: "quota_exceeded" }
  | { kind: "read_error"; message: string }
  | { kind: "write_error"; message: string }
  | { kind: "remove_error"; message: string };

export type StorageAvailability =
  | { available: true }
  | { available: false; reason: string };

// ── Failure subscribers ───────────────────────────────────────────────────────

type FailureListener = (error: StorageError) => void;
const listeners = new Set<FailureListener>();

export function onStorageFailure(fn: FailureListener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function notify(error: StorageError): void {
  listeners.forEach((fn) => fn(error));
}

// ── SSR guard ─────────────────────────────────────────────────────────────────

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

// ── Public API ────────────────────────────────────────────────────────────────

export function detectStorage(): StorageAvailability {
  if (!isBrowser()) return { available: false, reason: "server-side rendering" };
  try {
    const probe = "__aysel_storage_probe__";
    localStorage.setItem(probe, "1");
    localStorage.removeItem(probe);
    return { available: true };
  } catch (e) {
    return { available: false, reason: e instanceof Error ? e.message : "unknown" };
  }
}

export function getItem(key: string): StorageResult<string | null> {
  if (!isBrowser()) {
    const error: StorageError = { kind: "unavailable" };
    return { ok: false, error };
  }
  try {
    return { ok: true, value: localStorage.getItem(key) };
  } catch (e) {
    const error: StorageError = {
      kind: "read_error",
      message: e instanceof Error ? e.message : "unknown",
    };
    notify(error);
    return { ok: false, error };
  }
}

export function setItem(key: string, value: string): StorageResult<void> {
  if (!isBrowser()) {
    const error: StorageError = { kind: "unavailable" };
    return { ok: false, error };
  }
  try {
    localStorage.setItem(key, value);
    return { ok: true, value: undefined };
  } catch (e) {
    const isQuota =
      e instanceof DOMException &&
      (e.name === "QuotaExceededError" || e.name === "NS_ERROR_DOM_QUOTA_REACHED");
    const error: StorageError = isQuota
      ? { kind: "quota_exceeded" }
      : { kind: "write_error", message: e instanceof Error ? e.message : "unknown" };
    notify(error);
    return { ok: false, error };
  }
}

export function removeItem(key: string): StorageResult<void> {
  if (!isBrowser()) {
    const error: StorageError = { kind: "unavailable" };
    return { ok: false, error };
  }
  try {
    localStorage.removeItem(key);
    return { ok: true, value: undefined };
  } catch (e) {
    const error: StorageError = {
      kind: "remove_error",
      message: e instanceof Error ? e.message : "unknown",
    };
    notify(error);
    return { ok: false, error };
  }
}

// ── Zustand StateStorage adapter ──────────────────────────────────────────────
// Implements the StateStorage interface expected by zustand/middleware persist.

export const safeStorage = {
  getItem(key: string): string | null {
    const result = getItem(key);
    return result.ok ? result.value : null;
  },
  setItem(key: string, value: string): void {
    setItem(key, value);
  },
  removeItem(key: string): void {
    removeItem(key);
  },
};
