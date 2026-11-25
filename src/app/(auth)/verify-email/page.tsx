import Link from "next/link";
import { Mail } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Check Your Email",
};

export default function VerifyEmailPage() {
  return (
    <div className="text-center">
      {/* Icon */}
      <div className="mx-auto mb-8 flex h-16 w-16 items-center justify-center border border-light-beige bg-warm-white">
        <Mail size={28} strokeWidth={1.5} className="text-burgundy" />
      </div>

      <p className="text-[10px] tracking-[0.3em] text-burgundy">
        ALMOST THERE
      </p>

      <h1 className="mt-4 font-display text-3xl text-soft-black sm:text-4xl">
        Check your inbox
      </h1>

      <p className="mt-5 text-sm leading-7 text-muted-grey">
        We&apos;ve sent a verification link to your email address.
        Open the email and click the link to activate your account.
      </p>

      <p className="mt-4 text-xs leading-6 text-muted-grey">
        The link will expire after 24 hours. If you don&apos;t see the
        email, check your spam or junk folder.
      </p>

      <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Link
          href="/login"
          className="flex h-[48px] items-center justify-center border border-burgundy px-8 text-[10px] tracking-[0.2em] text-burgundy transition-colors hover:bg-burgundy hover:text-warm-white"
        >
          SIGN IN
        </Link>

        <Link
          href="/"
          className="flex h-[48px] items-center justify-center border border-light-beige px-8 text-[10px] tracking-[0.2em] text-muted-grey transition-colors hover:border-soft-black hover:text-soft-black"
        >
          BACK TO HOME
        </Link>
      </div>

      <p className="mt-10 text-[11px] text-muted-grey">
        Didn&apos;t receive the email?{" "}
        <Link href="/register" className="text-burgundy underline-offset-2 hover:underline">
          Try registering again
        </Link>
      </p>
    </div>
  );
}
