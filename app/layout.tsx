import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { UserProvider } from "@/context/UserContext";
import { LanguageProvider } from "@/context/LanguageContext";
import Footer from "@/components/Footer";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export const metadata: Metadata = {
  title: "Save the plate app",
  description: "Discover the best foods at the most affordable prices!",
  // Optimize font loading
  other: {
    "font-display": "swap",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <head>
        {/* Mobile viewport optimization */}
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        {/* Resource hints for performance */}
        <link rel="preconnect" href={process.env.NEXT_PUBLIC_BACKEND_URL || "https://leftover-be.ccdev.space"} />
        <link rel="dns-prefetch" href={process.env.NEXT_PUBLIC_BACKEND_URL || "https://leftover-be.ccdev.space"} />
        <link rel="preconnect" href="https://www.googletagmanager.com" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        {/* Prefetch critical routes */}
        <link rel="prefetch" href="/client/home" />
        <link rel="prefetch" href="/provider/home" />
        <link rel="prefetch" href="/signIn" />
      </head>
      <body className="flex flex-col min-h-screen bg-white safe-area-inset">
        <ErrorBoundary>
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
        </ErrorBoundary>
      </body>
    </html>
  );
}
