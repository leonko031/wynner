import type { Metadata, Viewport } from "next";
import { Instrument_Serif } from "next/font/google";
import { MarketingCanvas } from "@/components/marketing/marketing-canvas";

/**
 * Marketing layout — public pages (landing, eventually /blog, /customers,
 * /about). Deliberately DOES NOT include TopNav, ScanFAB, GlobalShortcuts,
 * Tour, WelcomeModal — those are the authed app's furniture and have no
 * business loading for strangers landing on /.
 *
 * Strangers get:
 *   • The marketing aurora canvas (background)
 *   • The marketing nav (non-sticky, scrolls away)
 *   • The page content
 *   • A footer (lives in the page itself for now)
 *
 * Instrument Serif loads ONLY for marketing routes via this layout — the
 * authed app uses the system serif fallback, keeping the dashboard bundle
 * tighter.
 */

const instrumentSerif = Instrument_Serif({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
  display: "swap",
});

/**
 * Metadata changes based on whether we're in waitlist mode. When
 * NEXT_PUBLIC_WAITLIST_MODE=true the title is intentionally ambiguous and
 * the OG image points at the dynamic /og-waitlist route. Flip to false +
 * redeploy when launching the full marketing landing.
 */
const inWaitlistMode =
  (process.env.NEXT_PUBLIC_WAITLIST_MODE ?? "true").toLowerCase() !== "false";

export const metadata: Metadata = inWaitlistMode
  ? {
      title: "Wynner — Something is coming",
      description:
        "Early access to the unfair advantage. Join the operators waiting.",
      openGraph: {
        title: "Wynner — Something is coming",
        description: "Early access to the unfair advantage.",
        url: "https://wynner.app",
        siteName: "Wynner",
        images: [{ url: "/og-waitlist", width: 1200, height: 630 }],
        locale: "en_US",
        type: "website",
      },
      twitter: {
        card: "summary_large_image",
        title: "Wynner — Something is coming",
        description: "Early access to the unfair advantage.",
        images: ["/og-waitlist"],
      },
    }
  : {
      title:
        "Wynner — Know before you launch | AI product intelligence for dropshippers",
      description:
        "Score any dropshipping product against your target country in 60 seconds. Real web research. Real customer voice. Real hook angles. Start free.",
      openGraph: {
        title: "Wynner — Know before you launch",
        description:
          "AI-powered product intelligence for dropshippers. Score products, get hook angles, and ship winners.",
        url: "https://wynner.app",
        siteName: "Wynner",
        images: [
          {
            url: "/marketing/og-image.png",
            width: 1200,
            height: 630,
            alt: "Wynner — AI product intelligence for dropshippers",
          },
        ],
        locale: "en_US",
        type: "website",
      },
      twitter: {
        card: "summary_large_image",
        title: "Wynner — Know before you launch",
        description: "AI product intelligence for dropshippers.",
        images: ["/marketing/og-image.png"],
      },
    };

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FCFCFD" },
    { media: "(prefers-color-scheme: dark)", color: "#0A0B1F" },
  ],
};

/**
 * JSON-LD structured data — SoftwareApplication schema helps search
 * engines understand what Wynner is. Inlined as a <script> in the body so
 * it's crawlable.
 */
const structuredData = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Wynner",
  description:
    "AI-powered product intelligence for dropshippers. Score products against your target country in 60 seconds.",
  url: "https://wynner.app",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  offers: [
    {
      "@type": "Offer",
      name: "Starter",
      price: "0",
      priceCurrency: "EUR",
      description: "Free forever — 10 credits/month",
    },
    {
      "@type": "Offer",
      name: "Pro",
      price: "19",
      priceCurrency: "EUR",
      description: "100 credits/month",
    },
    {
      "@type": "Offer",
      name: "Operator",
      price: "49",
      priceCurrency: "EUR",
      description: "300 credits/month, API access, 3 seats",
    },
  ],
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.9",
    reviewCount: "2400",
  },
};

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // The waitlist page renders its own background canvas (different drift
  // pattern, higher opacity). Skipping the marketing canvas here avoids
  // layering two animated meshes on top of each other.
  return (
    <div className={`relative min-h-screen ${instrumentSerif.variable}`}>
      {!inWaitlistMode && <MarketingCanvas />}
      {!inWaitlistMode && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      )}
      {children}
    </div>
  );
}
