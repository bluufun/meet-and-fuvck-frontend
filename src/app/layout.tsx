import "./globals.css";
import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import ClientRoot from "@/components/ClientRoot";
import { AuthProvider } from "@/context/AuthContext";
import ShellClient from "@/components/ShellClient";
import InstallPromptBanner from "@/components/pwa/InstallPromptBanner";
import AgeVerificationGate from "@/components/compliance/AgeVerificationGate";
import Script from "next/script";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-dm-sans",
  display: "swap",
});

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#011659",
  viewportFit: "cover",
};

const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.bluufun.com"
).replace(/\/$/, "");

const defaultDescription =
  "Bluufun is a Nigerian social platform for discovering profiles, meeting new people, chatting and building connections across Lagos, Abuja, Port Harcourt and other cities in Nigeria. Find your funmate today.";

const defaultOgImage = `${siteUrl}/bluufun.png`;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),

  title: {
    default: "Bluufun",
    template: "%s | Bluufun",
  },

  description: defaultDescription,

  applicationName: "Bluufun",

  alternates: {
    canonical: siteUrl,
  },

  robots: {
    index: true,
    follow: true,
  },

  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Bluufun",
  },

  other: {
    "mobile-web-app-capable": "yes",
  },

  openGraph: {
    type: "website",
    siteName: "Bluufun",
    title: "Bluufun",
    description: defaultDescription,
    url: siteUrl,
    locale: "en_NG",

    images: [
      {
        url: defaultOgImage,
        width: 1254,
        height: 1254,
        alt: "Bluufun - Discover people and connections across Nigeria",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Bluufun",
    description: defaultDescription,
    images: [
      {
        url: defaultOgImage,
        width: 1254,
        height: 1254,
        alt: "Bluufun - Discover people and connections across Nigeria",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`h-full antialiased ${dmSans.variable}`}>
      <body className="min-h-full flex flex-col">
        <ClientRoot>
          <AuthProvider>
            <ShellClient>{children}</ShellClient>
          </AuthProvider>
        </ClientRoot>

        <AgeVerificationGate />
        <InstallPromptBanner />

        <Script
          src="https://customerbot.qubaagency.com/widget.js"
          data-key="cb_live_kjDzCqL1J7Xk5gM9rPSwu6UL1bpVQKFl"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
