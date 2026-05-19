import type { Metadata } from "next";
import { Geist, JetBrains_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { BackgroundFx } from "@/components/layout/background-fx";
import { ThemeScript } from "@/components/layout/theme-script";
import { SkipLink } from "@/components/layout/skip-link";
import { StoreHydration } from "@/components/store-hydration";
import { Suspense } from "react";
import { UserProvider } from "@/lib/auth/user-provider";
import { CreditProfileSync } from "@/components/auth/credit-profile-sync";
import { AdminOnlyToast } from "@/components/auth/admin-only-toast";
import { getServerUser } from "@/lib/auth/server-user";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Wynner — Know before you launch",
  description:
    "Premium dropshipping intelligence. Score products, see saturation, and ship winners with confidence.",
  openGraph: {
    title: "Wynner — Know before you launch",
    description:
      "Premium dropshipping intelligence. Score products, see saturation, and ship winners with confidence.",
    images: ["/og.png"],
  },
  metadataBase: new URL("https://wynner.app"),
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Hydrate the UserProvider from the server so the first paint has the
  // correct auth state — no flash of "Sign in" before the client catches up.
  const { user, profile, configured } = await getServerUser();
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${jetbrainsMono.variable}`}
    >
      <head>
        <ThemeScript />
      </head>
      <body className="relative min-h-screen font-sans antialiased">
        <BackgroundFx />
        <StoreHydration />
        <SkipLink />
        <UserProvider initialUser={user} initialProfile={profile} configured={configured}>
          <CreditProfileSync />
          {/* useSearchParams must live under <Suspense> in Next 16 to avoid
              bailing the whole layout out of static rendering. */}
          <Suspense fallback={null}>
            <AdminOnlyToast />
          </Suspense>
          <div className="relative z-10 flex min-h-screen flex-col">
            {children}
          </div>
        </UserProvider>
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}
