import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Nav from '../components/Nav'


const inter = Inter({ subsets: ["latin"] });

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
    <html lang="en">
      <body className="relative">
        <Nav/>
          {children}

        
        
      </body>
    </html>
  );
}
