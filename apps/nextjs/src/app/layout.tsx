import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";

import { cn } from "@morse-bot/ui";
import { ThemeProvider, ThemeToggle } from "@morse-bot/ui/theme";
import { Toaster } from "@morse-bot/ui/toast";

import { env } from "~/env";
import { getSession } from "~/auth/server";
import { TRPCReactProvider } from "~/trpc/react";

import "~/app/styles.css";

export const metadata: Metadata = {
  metadataBase: new URL(
    env.VERCEL_ENV === "production"
      ? "https://moris-bot.vercel.app"
      : "http://localhost:3000",
  ),
  title: "Moris Bot",
  description: "Real-time morse code decoder web app",
  openGraph: {
    title: "Moris Bot",
    description: "Real-time morse code decoder web app",
    url: "https://moris-bot.vercel.app",
    siteName: "Moris Bot",
  },
  twitter: {
    card: "summary_large_image",
    site: "@jullerino",
    creator: "@jullerino",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
};

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});
const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export default async function RootLayout(props: { children: React.ReactNode }) {
  const session = await getSession();

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          "bg-background text-foreground min-h-screen font-sans antialiased",
          geistSans.variable,
          geistMono.variable,
        )}
      >
        <ThemeProvider>
          {session && (
            <nav className="border-b px-4 py-2">
              <Link
                href="/sessions"
                className="text-sm text-muted-foreground underline-offset-4 hover:underline"
              >
                My Sessions
              </Link>
            </nav>
          )}
          <TRPCReactProvider>{props.children}</TRPCReactProvider>
          <div className="absolute right-4 bottom-4">
            <ThemeToggle />
          </div>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
