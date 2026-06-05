import type { Metadata } from "next";
import dynamic from "next/dynamic";
import React from "react";

const Sidebar = dynamic(() => import("@/components/shared/Sidebar"), {
  ssr: true,
});

export const metadata: Metadata = {
  title: "Spatial Workspace | Domus",
  description: "WebGL spatial workspace editor.",
};

export default function EditorLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-dark-surface select-none">
      {/* Dynamic left sidebar navigation - default collapsed state will be managed within sidebar */}
      <Sidebar />

      {/* Primary viewport space */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {children}
      </div>
    </div>
  );
}
