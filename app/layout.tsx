import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import cx from "./utils/cx";
import "prismjs/themes/prism-tomorrow.css";

export const metadata: Metadata = {
  title: "Cross Referencer",
  description: "Generated by create next app",
  icons: {
    icon: "/favicon-32x32.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

const defaultFont = Inter({
  variable: "--font-inter",
  display: "swap",
  style: "normal",
  subsets: ["latin-ext"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cx("scroll-smooth", defaultFont.variable)}>
      <body className="antialiased text-sm sm:text-base">{children}</body>
    </html>
  );
}
