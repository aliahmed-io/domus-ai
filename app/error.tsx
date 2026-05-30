"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertCircle, RefreshCw, MoveLeft } from "lucide-react";
import Logo from "@/components/shared/Logo";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorBoundaryPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error("Unhandled spatial error boundary caught:", error);
  }, [error]);

  const isDev = process.env.NODE_ENV === "development";

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6 bg-alabaster relative overflow-hidden">
      {/* Visual coordinates lines */}
      <div
        className="absolute inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(#DC2626 1px, transparent 1px), linear-gradient(90deg, #DC2626 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      <div className="relative z-10 max-w-md w-full text-center flex flex-col items-center gap-6">
        <Logo size="md" showWordmark={true} />

        <div className="space-y-3 mt-4">
          <div className="w-12 h-12 rounded-full bg-errorLight text-error flex items-center justify-center border border-error/10 mx-auto shadow-inner">
            <AlertCircle size={24} />
          </div>
          <h1 className="font-jakarta text-[80px] font-800 text-error/10 leading-none tracking-tight">
            500
          </h1>
          <h3 className="font-jakarta text-heading-sm font-800 text-charcoal tracking-tight">
            Spatial collision occurred
          </h3>
          <p className="font-body text-xs text-stone max-w-xs mx-auto leading-relaxed">
            Our WebGL coordinates ran into an unhandled collision. Let us reset the virtual workspace state or return to the main dashboard.
          </p>
        </div>

        {/* Development call stack trace */}
        {isDev && (
          <div className="w-full bg-[#1e1e2d] text-left rounded-xl p-4 border border-white/5 font-mono text-[10px] leading-relaxed text-error max-h-40 overflow-y-auto shadow-inner select-text">
            <p className="font-bold">{error.name}: {error.message}</p>
            {error.stack && (
              <pre className="opacity-75 mt-1 white-space-pre-wrap">{error.stack}</pre>
            )}
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full mt-2">
          <button
            onClick={reset}
            className="w-full h-11 btn-primary bg-indigo hover:bg-indigoDark text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-button transition-colors outline-none"
          >
            <RefreshCw size={14} className="shrink-0" />
            <span>Reset Workspace</span>
          </button>
          <Link
            href="/dashboard"
            className="w-full h-11 bg-white border border-hairline hover:bg-gray-50 text-charcoal font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all outline-none"
          >
            <MoveLeft size={14} className="text-stone" />
            <span>Go to Dashboard</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
