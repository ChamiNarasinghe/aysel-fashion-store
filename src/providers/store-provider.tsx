"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useGuestCartStore } from "@/stores/guest-cart-store";
import { useGuestWishlistStore } from "@/stores/guest-wishlist-store";
import { detectStorage } from "@/lib/storage/safe-storage";
import { runMigrationWithLock } from "@/lib/shopping/migrate-legacy-shopping";
import { products } from "@/data/products";

// ── Context ───────────────────────────────────────────────────────────────────

type StoreReadiness = {
  // true only after migration has run and both guest stores have finished
  // hydrating from storage.
  // NOTE: the legacy useCartStore / useWishlistStore are no longer used by
  // live UI components after 10.7.3B. This flag covers the new guest stores.
  ready: boolean;
  storageAvailable: boolean;
  // Non-null when migration failed and legacy data may still be present.
  // Consumers should surface this to the user rather than showing an empty cart.
  migrationError: string | null;
};

const StoreReadinessContext = createContext<StoreReadiness>({
  ready: false,
  storageAvailable: true,
  migrationError: null,
});

export function useStoreReadiness(): StoreReadiness {
  return useContext(StoreReadinessContext);
}

// ── Provider ──────────────────────────────────────────────────────────────────

export default function StoreProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [storageAvailable, setStorageAvailable] = useState(true);
  const [migrationError, setMigrationError] = useState<string | null>(null);
  // Prevents StrictMode double-invocation from starting a second concurrent
  // initialization while the first Promise chain is still in flight.
  const initializing = useRef(false);

  useEffect(() => {
    if (initializing.current) return;
    initializing.current = true;

    const availability = detectStorage();
    setStorageAvailable(availability.available);

    // Build the set of known product IDs from the static catalogue.
    const knownProductIds = new Set(products.map((p) => p.id));

    // Initialization order:
    // 1. Acquire migration lock
    // 2. Run or resume legacy migration
    // 3. Hydrate both guest stores
    // 4. Mark ready
    (async () => {
      try {
        const migrationResult = await runMigrationWithLock(knownProductIds);

        if (!migrationResult.canContinue) {
          // Migration failed — expose error so UI can warn the user.
          // Do NOT mark ready=true with an empty store that hides legacy data.
          const cartErr = migrationResult.cart.error ?? "";
          const wishlistErr = migrationResult.wishlist.error ?? "";
          const combined = [cartErr, wishlistErr].filter(Boolean).join("; ");
          setMigrationError(combined || "Migration failed");
          // Still hydrate stores so any already-migrated data is loaded.
        }
      } catch (e) {
        setMigrationError(
          e instanceof Error ? e.message : "Unexpected migration error"
        );
      }

      // Hydrate guest stores regardless — they may already contain valid data
      // from a previous successful migration or from direct guest usage.
      const cartPromise = Promise.resolve(
        useGuestCartStore.persist.rehydrate()
      ).catch(() => {});

      const wishlistPromise = Promise.resolve(
        useGuestWishlistStore.persist.rehydrate()
      ).catch(() => {});

      await Promise.all([cartPromise, wishlistPromise]);
      setReady(true);
    })();

    // initializing.current intentionally persists across StrictMode remount.
  }, []);

  return (
    <StoreReadinessContext.Provider value={{ ready, storageAvailable, migrationError }}>
      {children}
    </StoreReadinessContext.Provider>
  );
}
