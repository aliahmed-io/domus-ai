import React from "react";
import Link from "next/link";
import { MoveLeft, HelpCircle } from "lucide-react";
import Logo from "@/components/shared/Logo";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6 bg-alabaster relative overflow-hidden">
      {/* Structural background details */}
      <div
        className="absolute inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(#2A2A2A 1px, transparent 1px), linear-gradient(90deg, #2A2A2A 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      <div className="relative z-10 max-w-md w-full text-center flex flex-col items-center gap-6">
        <Logo size="md" showWordmark={true} />

        <div className="space-y-3 mt-4">
          <h1 className="font-jakarta text-[80px] font-800 text-indigo/15 leading-none select-none tracking-tight">
            404
          </h1>
          <h3 className="font-jakarta text-heading-md font-800 text-charcoal tracking-tight">
            This space doesn&rsquo;t exist... yet.
          </h3>
          <p className="font-body text-xs text-stone max-w-xs mx-auto leading-relaxed">
            The spatial coordinates you are trying to visit are outside our registered bounds. Let us route you back to reality.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full mt-2">
          <Link
            href="/dashboard"
            className="w-full h-11 btn-primary bg-indigo hover:bg-indigoDark text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-button transition-colors"
          >
            <span>Go to Dashboard</span>
          </Link>
          <Link
            href="/"
            className="w-full h-11 bg-white border border-hairline hover:bg-gray-50 text-charcoal font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all outline-none"
          >
            <MoveLeft size={14} className="text-stone" />
            <span>Back to Home</span>
          </Link>
        </div>

        <div className="mt-6 pt-6 border-t border-hairline w-full flex items-center justify-center gap-1.5 text-xs text-stone">
          <HelpCircle size={14} className="text-stone" />
          <span>Need help?</span>
          <Link href="/contact" className="font-semibold text-indigo hover:underline">
            Contact Support
          </Link>
        </div>
      </div>
    </div>
  );
}
