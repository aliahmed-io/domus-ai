import React from "react";
import dynamic from "next/dynamic";

const Sidebar = dynamic(() => import("@/components/shared/Sidebar"), {
  ssr: true,
});

export default function CommunityLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-alabaster">
      {/* Sidebar navigation */}
      <Sidebar />

      {/* Primary viewport content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto relative">
        {children}
      </main>
    </div>
  );
}
