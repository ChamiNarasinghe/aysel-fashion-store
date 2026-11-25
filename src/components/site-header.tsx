"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Search,
  UserRound,
  Heart,
  ShoppingBag,
  Menu,
  X,
  LogOut,
} from "lucide-react";
import { products, formatPrice } from "@/data/products";
import type { Product } from "@/data/products";
import { useGuestCartStore } from "@/stores/guest-cart-store";
import { useGuestWishlistStore } from "@/stores/guest-wishlist-store";
import { useStoreReadiness } from "@/providers/store-provider";
import { supabase } from "@/lib/supabase/client";

const navigation = [
  { label: "WOMEN", href: "/collections/women" },
  { label: "MEN", href: "/collections/men" },
  { label: "NEW ARRIVALS", href: "/collections/new-arrivals" },
  { label: "COLLECTIONS", href: "/collections" },
  { label: "ABOUT", href: "/about" },
];

function getSuggestions(query: string): Product[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return products
    .filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
    )
    .slice(0, 6);
}

export default function SiteHeader() {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);
  // null = not yet resolved, false = signed out, true = signed in
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [signingOut, setSigningOut] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const { ready } = useStoreReadiness();
  const cartCount = useGuestCartStore((s) => s.items.reduce((sum, i) => sum + i.quantity, 0));
  const wishlistCount = useGuestWishlistStore((s) => s.items.length);

  useEffect(() => {
    // Resolve initial session without a network call.
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
    });

    // Keep auth state in sync across tabs and after login/logout.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleSignOut() {
    if (signingOut) return;
    setSigningOut(true);
    await supabase.auth.signOut();
    setSigningOut(false);
    router.refresh();
    router.push("/");
  }

  const suggestions = getSuggestions(query);

  const openSearch = useCallback(() => {
    setSearchOpen(true);
    setQuery("");
    setActiveIndex(-1);
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  const closeSearch = useCallback(() => {
    setSearchOpen(false);
    setQuery("");
    setActiveIndex(-1);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    closeSearch();
    router.push(`/search?q=${encodeURIComponent(q)}`);
  };

  const handleSuggestionClick = (slug: string) => {
    closeSearch();
    router.push(`/products/${slug}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!suggestions.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      handleSuggestionClick(suggestions[activeIndex].slug);
    } else if (e.key === "Escape") {
      closeSearch();
    }
  };

  // Close on outside click
  useEffect(() => {
    if (!searchOpen) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        closeSearch();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [searchOpen, closeSearch]);

  return (
    <header className="w-full bg-warm-white">

      {/* Announcement Bar */}
      <div className="bg-burgundy px-4 py-2 text-center">
        <p className="text-[10px] tracking-[0.2em] text-golden-sand sm:text-xs">
          DISCOVER THE NEW AYSEL COLLECTION
        </p>
      </div>

      {/* Main Navigation */}
      <div className="relative border-b border-light-beige">
        <div className="mx-auto flex h-[76px] max-w-[1600px] items-center justify-between px-5 md:px-10">

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            className="p-2 lg:hidden"
          >
            {menuOpen ? (
              <X size={21} strokeWidth={1.5} />
            ) : (
              <Menu size={21} strokeWidth={1.5} />
            )}
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden flex-1 items-center gap-7 lg:flex">
            {navigation.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="text-[10px] font-medium tracking-[0.12em] transition-colors hover:text-burgundy xl:text-xs"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Brand Logo */}
          <Link
            href="/"
            className="absolute left-1/2 -translate-x-1/2"
            aria-label="AYSEL Home"
          >
            <span className="font-display text-[30px] font-semibold tracking-[0.13em] text-burgundy sm:text-[36px]">
              AYSEL
            </span>
          </Link>

          {/* Right Navigation Icons */}
          <div className="ml-auto flex items-center gap-4 sm:gap-5">

            <button
              onClick={openSearch}
              aria-label="Search"
              className="transition-colors hover:text-burgundy"
            >
              <Search size={20} strokeWidth={1.5} />
            </button>

            {/* Account icon — resolves after mount to avoid hydration mismatch */}
            {isAuthenticated === true ? (
              <>
                <Link
                  href="/account"
                  aria-label="My account"
                  className="hidden transition-colors hover:text-burgundy sm:block"
                >
                  <UserRound size={20} strokeWidth={1.5} />
                </Link>
                <button
                  onClick={handleSignOut}
                  disabled={signingOut}
                  aria-label="Sign out"
                  className="hidden transition-colors hover:text-burgundy disabled:opacity-50 sm:block"
                >
                  <LogOut size={20} strokeWidth={1.5} />
                </button>
              </>
            ) : (
              <Link
                href="/login"
                aria-label="Sign in"
                className="hidden transition-colors hover:text-burgundy sm:block"
              >
                <UserRound size={20} strokeWidth={1.5} />
              </Link>
            )}

            <Link
              href="/wishlist"
              aria-label="Wishlist"
              className="relative hidden transition-colors hover:text-burgundy sm:block"
            >
              <Heart size={20} strokeWidth={1.5} />
              {ready && wishlistCount > 0 && (
                <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-burgundy text-[9px] font-medium text-warm-white">
                  {wishlistCount > 99 ? "99+" : wishlistCount}
                </span>
              )}
            </Link>

            <Link
              href="/cart"
              aria-label="Shopping bag"
              className="relative transition-colors hover:text-burgundy"
            >
              <ShoppingBag size={20} strokeWidth={1.5} />
              {ready && cartCount > 0 && (
                <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-burgundy text-[9px] font-medium text-warm-white">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </Link>

          </div>
        </div>

        {/* Search Panel */}
        {searchOpen && (
          <div
            ref={panelRef}
            className="absolute left-0 top-full z-50 w-full border-b border-light-beige bg-warm-white shadow-lg"
          >
            <div className="mx-auto max-w-2xl px-5 py-5">
              <form
                onSubmit={handleSubmit}
                className="flex items-center gap-3 border-b border-burgundy pb-3"
              >
                <Search size={18} className="shrink-0 text-muted-grey" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => { setQuery(e.target.value); setActiveIndex(-1); }}
                  onKeyDown={handleKeyDown}
                  placeholder="Search for products..."
                  className="w-full bg-transparent text-sm outline-none"
                  autoComplete="off"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => { setQuery(""); setActiveIndex(-1); inputRef.current?.focus(); }}
                    aria-label="Clear search"
                    className="shrink-0 text-muted-grey transition-colors hover:text-soft-black"
                  >
                    <X size={16} />
                  </button>
                )}
                <button
                  type="button"
                  onClick={closeSearch}
                  aria-label="Close search"
                  className="shrink-0 text-muted-grey transition-colors hover:text-soft-black"
                >
                  <X size={19} />
                </button>
              </form>

              {/* Suggestions */}
              {query.trim() && (
                <div className="py-2">
                  {suggestions.length === 0 ? (
                    <p className="py-6 text-center text-xs text-muted-grey">
                      No products found for &ldquo;{query}&rdquo;
                    </p>
                  ) : (
                    <ul role="listbox" aria-label="Search suggestions">
                      {suggestions.map((product, i) => (
                        <li key={product.id} role="option" aria-selected={i === activeIndex}>
                          <button
                            type="button"
                            onClick={() => handleSuggestionClick(product.slug)}
                            className={`flex w-full items-center gap-4 px-2 py-3 text-left transition-colors ${
                              i === activeIndex ? "bg-light-beige" : "hover:bg-light-beige/50"
                            }`}
                          >
                            <div className="relative h-14 w-10 shrink-0 overflow-hidden bg-light-beige" style={{ position: "relative" }}>
                              <Image
                                src={product.image}
                                alt={product.name}
                                fill
                                sizes="40px"
                                className="object-cover"
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-xs font-medium text-soft-black">
                                {product.name}
                              </p>
                              <p className="mt-0.5 text-[10px] text-muted-grey">
                                {product.category}
                              </p>
                            </div>
                            <p className="shrink-0 text-xs font-medium text-burgundy">
                              {formatPrice(product.price)}
                            </p>
                          </button>
                        </li>
                      ))}
                      <li className="border-t border-light-beige pt-2">
                        <button
                          type="button"
                          onClick={handleSubmit as unknown as React.MouseEventHandler}
                          className="w-full py-2 text-center text-[10px] tracking-widest text-burgundy transition-colors hover:text-soft-black"
                        >
                          VIEW ALL RESULTS FOR &ldquo;{query}&rdquo;
                        </button>
                      </li>
                    </ul>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Mobile Navigation */}
        {menuOpen && (
          <nav className="absolute left-0 top-full z-40 w-full border-b border-light-beige bg-warm-white px-6 py-7 shadow-lg lg:hidden">
            <div className="flex flex-col gap-6">
              {navigation.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className="border-b border-light-beige pb-3 text-xs tracking-[0.16em]"
                >
                  {item.label}
                </Link>
              ))}

              {isAuthenticated === true ? (
                <>
                  <Link
                    href="/account"
                    onClick={() => setMenuOpen(false)}
                    className="border-b border-light-beige pb-3 text-xs tracking-[0.16em]"
                  >
                    MY ACCOUNT
                  </Link>
                  <button
                    onClick={() => { setMenuOpen(false); handleSignOut(); }}
                    disabled={signingOut}
                    className="text-left text-xs tracking-[0.16em] text-muted-grey disabled:opacity-50"
                  >
                    SIGN OUT
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setMenuOpen(false)}
                  className="border-b border-light-beige pb-3 text-xs tracking-[0.16em]"
                >
                  SIGN IN
                </Link>
              )}

              <Link
                href="/wishlist"
                onClick={() => setMenuOpen(false)}
                className="text-xs tracking-[0.16em]"
              >
                MY WISHLIST
              </Link>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
