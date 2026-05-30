import React from "react";

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6 bg-alabaster relative overflow-hidden">
      {/* Background spatial lines */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(#2A2A2A 1px, transparent 1px), linear-gradient(90deg, #2A2A2A 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />
      <div className="relative z-10 w-full max-w-md">
        {children}
      </div>
    </div>
  );
}
