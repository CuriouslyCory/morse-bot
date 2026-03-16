import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { cn } from "@morse-bot/ui";
import { ThemeProvider, ThemeToggle } from "@morse-bot/ui/theme";
import { Toaster } from "@morse-bot/ui/toast";

import { getSession } from "~/auth/server";
import { env } from "~/env";
import { TRPCReactProvider } from "~/trpc/react";

import "~/app/styles.css";

export const metadata: Metadata = {
  metadataBase: new URL(
    env.VERCEL_ENV === "production"
      ? "https://morse-bot.vercel.app"
      : "http://localhost:3000",
  ),
  title: "morse Bot",
  description: "Real-time morse code decoder web app",
  openGraph: {
    title: "morse Bot",
    description: "Real-time morse code decoder web app",
    url: "https://morse-bot.vercel.app",
    siteName: "morse Bot",
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
          <header className="border-b">
            <div className="container flex h-14 items-center justify-between">
              <div className="flex items-center gap-6">
                <Link href="/" className="flex items-center gap-2">
                  <span className="bg-primary text-primary-foreground flex h-8 w-8 items-center justify-center rounded-lg font-mono text-sm font-bold">
                    .-
                  </span>
                  <span className="text-lg font-bold tracking-tight">
                    morse Bot
                  </span>
                </Link>
                {session && (
                  <nav>
                    <Link
                      href="/sessions"
                      className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
                    >
                      My Sessions
                    </Link>
                  </nav>
                )}
              </div>
              <div className="flex items-center gap-3">
                <ThemeToggle />
              </div>
            </div>
          </header>
          <TRPCReactProvider>{props.children}</TRPCReactProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
