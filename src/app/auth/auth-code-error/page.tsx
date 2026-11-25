import Link from "next/link";
import { AlertCircle } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Verification Link Invalid",
};

export default function AuthCodeErrorPage() {
  return (
    <div className="min-h-[calc(100vh-76px-56px)] bg-warm-white px-5 py-16 sm:py-24">
      <div className="mx-auto w-full max-w-md text-center">

        {/* Icon */}
        <div className="mx-auto mb-8 flex h-16 w-16 items-center justify-center border border-light-beige bg-warm-white">
          <AlertCircle size={28} strokeWidth={1.5} className="text-burgundy" />
        </div>

        <p className="text-[10px] tracking-[0.3em] text-burgundy">
          VERIFICATION FAILED
        </p>

        <h1 className="mt-4 font-display text-3xl text-soft-black sm:text-4xl">
          Link expired or invalid
        </h1>

        <p className="mt-5 text-sm leading-7 text-muted-grey">
          The verification link may have expired, already been used,
          or is no longer valid. Verification links are valid for 24 hours.
        </p>

        <p className="mt-4 text-xs leading-6 text-muted-grey">
          Please register again to receive a new verification email.
        </p>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/register"
            className="flex h-[48px] items-center justify-center bg-burgundy px-8 text-[10px] tracking-[0.2em] text-warm-white transition-colors hover:bg-soft-black"
          >
            REGISTER AGAIN
          </Link>

          <Link
            href="/"
            className="flex h-[48px] items-center justify-center border border-light-beige px-8 text-[10px] tracking-[0.2em] text-muted-grey transition-colors hover:border-soft-black hover:text-soft-black"
          >
            BACK TO HOME
          </Link>
        </div>

      </div>
    </div>
  );
}
