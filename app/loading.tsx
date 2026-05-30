import React from "react";
import Logo from "@/components/shared/Logo";

export default function LoadingPage() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6 bg-alabaster relative overflow-hidden">
      {/* Background visual lines */}
      <div
        className="absolute inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(#2A2A2A 1px, transparent 1px), linear-gradient(90deg, #2A2A2A 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      <div className="relative z-10 max-w-sm w-full text-center flex flex-col items-center gap-5">
        {/* Pulsing centered Logo */}
        <div className="animate-pulse">
          <Logo size="lg" showWordmark={true} />
        </div>

        <div className="space-y-3 mt-2 flex flex-col items-center">
          {/* Subtle loading indicator dot */}
          <div className="flex items-center gap-1.5 justify-center">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo animate-bounce [animation-delay:-0.3s]" />
            <span className="w-1.5 h-1.5 rounded-full bg-indigo animate-bounce [animation-delay:-0.15s]" />
            <span className="w-1.5 h-1.5 rounded-full bg-indigo animate-bounce" />
          </div>

          <p className="font-body text-xs font-semibold text-stone uppercase tracking-widest animate-pulse">
            Loading Spatial Workspace...
          </p>
        </div>
      </div>
    </div>
  );
}
