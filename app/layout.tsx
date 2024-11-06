import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from 'react-hot-toast';
import { UserProvider } from "@/context/UserContext"; 

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
    <html lang="en">
      <body className="flex flex-col min-h-screen bg-white">
        <main className=""> 
          {children}
        </main>
        <Toaster position="top-right" reverseOrder={false} />
      </body>
    </html>
   </UserProvider>
  );
}
