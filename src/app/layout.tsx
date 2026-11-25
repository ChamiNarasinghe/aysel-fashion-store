
import type { Metadata } from "next";
import { Playfair_Display, DM_Sans } from "next/font/google";
import "./globals.css";
import SiteHeader from "@/components/site-header";
import SiteFooter from "@/components/site-footer";
import StoreProvider from "@/providers/store-provider";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "AYSEL | Contemporary Fashion",
    template: "%s | AYSEL",
  },
  description:
    "Discover AYSEL — contemporary fashion, carefully curated collections and timeless everyday style.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body className={`${playfair.variable} ${dmSans.variable}`}>
        <StoreProvider>
          <SiteHeader />
          <main>{children}</main>
          <SiteFooter />
        </StoreProvider>
      </body>
    </html>
  );
}
