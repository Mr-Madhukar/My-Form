import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { GlobalProviders } from "~/providers/global";
import { cn } from "~/lib/utils";
import { Analytics } from "@vercel/analytics/next";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-sans",
  display: "swap",
});
const geistHeading = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-heading",
  display: "swap",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "My Form",
  description: "Build and share forms in minutes",
};

export default function RootLayout({ children }: { readonly children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={cn("dark", geistSans.variable, geistHeading.variable, geistMono.variable)}
      suppressHydrationWarning
    >
      <body suppressHydrationWarning>
        <GlobalProviders>{children}</GlobalProviders>
        <Analytics />
      </body>
    </html>
  );
}
