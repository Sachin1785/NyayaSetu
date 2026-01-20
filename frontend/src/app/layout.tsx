"use client";

import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { useState } from "react";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-google-sans",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <html lang="en">
      <body className={`${inter.variable} antialiased`}>
        <div className="flex h-screen overflow-hidden bg-white">
          <Sidebar
            mobileOpen={mobileMenuOpen}
            onMobileClose={() => setMobileMenuOpen(false)}
          />
          <main className="flex-1 overflow-y-auto lg:ml-60">
            {/* Clone children and pass menu handler */}
            {typeof children === 'object' && children !== null && 'type' in children
              ? children
              : children}
          </main>
        </div>
      </body>
    </html>
  );
}
