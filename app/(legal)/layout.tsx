import React from "react";
import dynamic from "next/dynamic";

const Navbar = dynamic(() => import("@/components/shared/Navbar"), {
  ssr: true,
});

const Footer = dynamic(() => import("@/components/shared/Footer"), {
  ssr: true,
});

export default function LegalLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex flex-col min-h-screen bg-alabaster">
      <Navbar />

      {/* Main legal content wrapper */}
      <main className="flex-1 w-full max-w-4xl mx-auto px-6 py-24 md:py-32">
        {children}
      </main>

      <Footer />
    </div>
  );
}
