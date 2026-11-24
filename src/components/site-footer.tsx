
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

const footerGroups = [
  {
    title: "SHOP",
    links: [
      { label: "Women", href: "/collections/women" },
      { label: "Men", href: "/collections/men" },
      { label: "New Arrivals", href: "/collections/new-arrivals" },
      { label: "Collections", href: "/collections" },
    ],
  },
  {
    title: "AYSEL",
    links: [
      { label: "Our Story", href: "/about" },
      { label: "Contact Us", href: "/contact" },
      { label: "FAQs", href: "/faq" },
    ],
  },
  {
    title: "CUSTOMER CARE",
    links: [
      { label: "Shipping Information", href: "/shipping" },
      { label: "Returns & Exchanges", href: "/returns" },
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms & Conditions", href: "/terms" },
    ],
  },
];

export default function SiteFooter() {
  return (
    <footer className="bg-soft-black text-warm-white">

      <div className="mx-auto grid max-w-[1500px] gap-12 px-6 py-16 sm:px-10 lg:grid-cols-2 lg:gap-20 lg:py-20">

        {/* Brand */}
        <div className="max-w-md">
          <Link
            href="/"
            className="font-display text-4xl tracking-[0.12em] text-golden-sand"
          >
            AYSEL
          </Link>

          <p className="mt-5 text-sm leading-7 text-white/60">
            Contemporary fashion, thoughtfully curated.
            Discover timeless essentials and express your
            personal style with AYSEL.
          </p>

          {/* Social Links */}
          <div className="mt-7 flex items-center gap-6">
            <Link
              href="https://www.instagram.com/"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 text-xs text-white/60 hover:text-golden-sand"
            >
              INSTAGRAM
              <ArrowUpRight size={14} />
            </Link>

            <Link
              href="https://www.facebook.com/"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 text-xs text-white/60 hover:text-golden-sand"
            >
              FACEBOOK
              <ArrowUpRight size={14} />
            </Link>
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="grid grid-cols-2 gap-9 sm:grid-cols-3">
          {footerGroups.map((group) => (
            <div key={group.title}>
              <h3 className="mb-6 text-[10px] font-semibold tracking-[0.2em] text-golden-sand">
                {group.title}
              </h3>

              <ul className="flex flex-col gap-4">
                {group.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-xs text-white/60 transition-colors hover:text-golden-sand"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Newsletter */}
      <div className="border-y border-white/10">
        <div className="mx-auto flex max-w-[1500px] flex-col justify-between gap-5 px-6 py-9 sm:px-10 md:flex-row md:items-center">

          <div>
            <h3 className="font-display text-2xl text-golden-sand">
              Stay in style.
            </h3>

            <p className="mt-2 text-xs text-white/50">
              Be the first to discover new collections.
            </p>
          </div>

          <Link
            href="/newsletter"
            className="flex items-center gap-3 border-b border-golden-sand pb-2 text-xs tracking-widest text-golden-sand transition-colors hover:text-white"
          >
            JOIN THE AYSEL COMMUNITY
            <ArrowUpRight size={16} />
          </Link>
        </div>
      </div>

      {/* Copyright */}
      <div className="mx-auto flex max-w-[1500px] flex-col justify-between gap-3 px-6 py-6 text-[10px] text-white/40 sm:px-10 md:flex-row">
        <p>
          © {new Date().getFullYear()} AYSEL. All rights reserved.
        </p>

        <p>
          CONTEMPORARY FASHION · TIMELESS EXPRESSION
        </p>
      </div>

    </footer>
  );
}
