import type { Metadata } from "next";
import "./globals.css";
import Footer from '../components/Footer';
import Nav from '../components/Nav'
import { Toaster } from 'react-hot-toast'


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
        <Toaster position="top-right" reverseOrder={false} />

        <Footer/>

      </body>
    </html>
  );
}
