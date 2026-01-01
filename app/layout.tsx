import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { UserProvider } from "@/context/UserContext";
import { LanguageProvider } from "@/context/LanguageContext";
import Footer from "@/components/Footer";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { GoogleOAuthProvider } from "@react-oauth/google";
import FacebookSDK from "@/components/FacebookSDK";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_FRONTEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000"),
  title: "Save The Plate",
  description: "Connect restaurants with consumers to reduce food waste. Discover the best foods at the most affordable prices!",
  keywords: ["food waste", "sustainable food", "restaurant deals", "eco-friendly", "save food", "reduce waste"],
  authors: [{ name: "Save The Plate" }],
  creator: "Save The Plate",
  publisher: "Save The Plate",
  applicationName: "Save The Plate",
  // Open Graph / Social Media
  openGraph: {
    type: "website",
    siteName: "Save The Plate",
    title: "Save The Plate - Reduce Food Waste",
    description: "Connect restaurants with consumers to reduce food waste. Discover the best foods at the most affordable prices!",
    images: [
      {
        url: "/logo.png",
        width: 512,
        height: 512,
        alt: "Save The Plate Logo",
      },
    ],
  },
  // Twitter Card
  twitter: {
    card: "summary_large_image",
    title: "Save The Plate",
    description: "Connect restaurants with consumers to reduce food waste.",
    images: ["/logo.png"],
  },
  // App Icons
  icons: {
    icon: [
      { url: "/logo.png", sizes: "32x32", type: "image/png" },
      { url: "/logo.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [
      { url: "/logo.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: "/logo.png",
  },
  // Optimize font loading
  other: {
    "font-display": "swap",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#10b981" }, // emerald-500
    { media: "(prefers-color-scheme: dark)", color: "#059669" }, // emerald-600
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <head>
        {/* Mobile viewport optimization - viewport meta is handled by Next.js viewport export */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Save The Plate" />
        <link rel="apple-touch-icon" href="/logo.png" />
        <link rel="icon" type="image/png" href="/logo.png" />
        <link rel="shortcut icon" href="/logo.png" />
        <link rel="manifest" href="/manifest.json" />
        {/* Resource hints for performance */}
        <link rel="preconnect" href={process.env.NEXT_PUBLIC_BACKEND_URL || "https://savetheplate.tn"} />
        <link rel="dns-prefetch" href={process.env.NEXT_PUBLIC_BACKEND_URL || "https://savetheplate.tn"} />
        <link rel="preconnect" href="https://www.googletagmanager.com" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        <link rel="preconnect" href="https://connect.facebook.net" />
        <link rel="dns-prefetch" href="https://connect.facebook.net" />
        {/* Prefetch critical routes */}
        <link rel="prefetch" href="/client/home" />
        <link rel="prefetch" href="/provider/home" />
        <link rel="prefetch" href="/signIn" />
      </head>
      <body className="flex flex-col min-h-screen bg-white safe-area-inset">
        <ErrorBoundary>
          <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ""}>
            <UserProvider>
              <LanguageProvider>
              {/* Google Analytics - gtag.js */}
              <Script
                src="https://www.googletagmanager.com/gtag/js?id=G-CVCP72DH21"
                strategy="afterInteractive"
              />
              <Script id="gtag-init" strategy="afterInteractive">
                {`window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);} 
                gtag('js', new Date());

                gtag('config', 'G-CVCP72DH21');`}
              </Script>
              {/* Facebook SDK */}
              <FacebookSDK />

              <main className="flex-1">
                {children}
              </main>
              <Footer />

              <Toaster 
                position="top-center" 
                reverseOrder={false}
              />
            </LanguageProvider>
          </UserProvider>
          </GoogleOAuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
