"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { LogIn, Sparkles, AlertCircle } from "lucide-react";
import Logo from "@/components/shared/Logo";
import { useAuthStore } from "@/store/useAuthStore";
import { signIn, isSignedIn, getUser } from "@/lib/puter";

export default function LoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  const { setUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-redirect if already signed in
  useEffect(() => {
    async function checkAuth() {
      const authenticated = await isSignedIn();
      if (authenticated) {
        const user = await getUser();
        setUser(user);
        router.push(callbackUrl);
      }
    }
    checkAuth();
  }, [router, callbackUrl, setUser]);

  // Handle Puter OAuth Sign-In
  const handlePuterSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      const user = await signIn();
      if (user) {
        setUser(user);
        // Set the lightweight puter_session cookie for next.js middleware route guard
        document.cookie = `puter_session=active_session; path=/; max-age=86400; SameSite=Strict`;
        router.push(callbackUrl);
      } else {
        setError("Unable to authenticate with Puter identity. Please try again.");
      }
    } catch (err: unknown) {
      console.error(err);
      setError("An error occurred during authentication.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full bg-white border border-hairline rounded-2xl p-8 md:p-10 shadow-hero flex flex-col items-center">
      {/* Domus Logo */}
      <div className="mb-6 flex justify-center scale-110">
        <Logo size="lg" showWordmark={true} />
      </div>

      <div className="text-center mb-8">
        <h2 className="font-jakarta text-heading-sm font-800 text-charcoal tracking-tight">
          Welcome to Domus
        </h2>
        <p className="font-body text-xs text-stone mt-1 max-w-[280px] mx-auto leading-relaxed">
          Sign in using Puter identity services to unlock cloud sync, 3D twins, and community feed sharing.
        </p>
      </div>

      {/* Error message */}
      {error && (
        <div className="w-full mb-5 bg-errorLight border border-error/10 text-error rounded-xl p-3 flex items-start gap-2.5 animate-in fade-in slide-in-from-top-1 duration-200">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <span className="font-body text-xs font-semibold leading-relaxed">
            {error}
          </span>
        </div>
      )}

      {/* Sign-in button */}
      <button
        onClick={handlePuterSignIn}
        disabled={loading}
        className="w-full h-13 btn-primary bg-indigo hover:bg-indigoDark text-white font-semibold text-sm rounded-xl flex items-center justify-center gap-2.5 shadow-button transition-all duration-300 disabled:opacity-50"
      >
        {loading ? (
          <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
        ) : (
          <>
            <LogIn size={18} />
            <span>Sign In with Puter</span>
          </>
        )}
      </button>

      {/* Info links */}
      <div className="mt-8 pt-6 border-t border-hairline w-full flex items-center justify-center gap-1.5 text-xs text-stone">
        <span>New to Domus?</span>
        <Link
          href="/onboarding"
          className="font-semibold text-indigo hover:text-indigoDark flex items-center gap-0.5 transition-colors"
        >
          <span>Start onboarding</span>
          <Sparkles size={11} className="text-indigo" />
        </Link>
      </div>
    </div>
  );
}
