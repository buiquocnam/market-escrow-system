import type { Metadata } from "next";
import { Inter, Geist } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI + Crypto Escrow Marketplace",
  description: "Secure, Scam-free Web3 Marketplace with Airbnb-level Design.",
};

import { Web3Provider } from "@/core/providers/Web3Provider";
import { AuthProvider } from "@/core/providers/AuthContext";
import { Toaster } from "@/components/ui/sonner";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("antialiased", "h-full", inter.variable, "font-sans", geist.variable)}>
      <body className="min-h-full flex flex-col items-stretch">
        <Web3Provider>
          <AuthProvider>
            <Suspense fallback={<div className="h-[73px] w-full bg-white border-b border-[var(--palette-grey1000)]" />}>
              <Navbar />
            </Suspense>
            {children}
            <Toaster position="top-center" richColors />
          </AuthProvider>
        </Web3Provider>
      </body>
    </html>
  );
}

