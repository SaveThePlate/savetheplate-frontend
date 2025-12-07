import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { UserProvider } from "@/context/UserContext";
import { LanguageProvider } from "@/context/LanguageContext";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Save the plate app",
  description: "Discover the best foods at the most affordable prices!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <UserProvider>
      <LanguageProvider>
        <html lang="en">
          <body className="flex flex-col min-h-screen bg-white">
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
          

          <Toaster position="top-right" reverseOrder={false} />
          </body>
        </html>
      </LanguageProvider>
    </UserProvider>
  );
}
