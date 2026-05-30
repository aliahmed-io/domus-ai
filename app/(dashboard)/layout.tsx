import type { Metadata } from "next";
import dynamic from "next/dynamic";
import React from "react";

// Dynamically import Sidebar with ssr: true to support layout pre-rendering
const Sidebar = dynamic(() => import("@/components/shared/Sidebar"), {
  ssr: true,
});

export const metadata: Metadata = {
  title: {
    default: "Workspace | Domus",
    template: "%s | Domus",
  },
};

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-alabaster">
      {/* Dynamic left sidebar navigation */}
      <Sidebar />

      {/* Main dashboard content area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto relative">
        {children}
      </main>
    </div>
  );
}
