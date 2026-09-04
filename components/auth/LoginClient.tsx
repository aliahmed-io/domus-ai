"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { LogIn, Compass, ArrowRight, AlertCircle } from "lucide-react";
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

  // Check if already signed in on mount
  useEffect(() => {
    async function checkAuth() {
      try {
        const loggedIn = await isSignedIn();
        if (loggedIn) {
          const puterUser = await getUser();
          if (puterUser) {
            setUser(puterUser);
            router.push(callbackUrl);
          }
        }
      } catch (err) {
        console.error("Auth check failed:", err);
      }
    }
    checkAuth();
  }, [router, callbackUrl, setUser]);

  const handleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      const puterUser = await signIn();
      if (puterUser) {
        setUser(puterUser);
        router.push(callbackUrl);
      }
    } catch (err) {
      console.error("Sign in failed:", err);
      setError(err instanceof Error ? err.message : "Failed to sign in with Puter");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md p-8 bg-white border border-hairline rounded-2xl shadow-card flex flex-col items-center select-none">
      <Logo size="lg" className="mb-6" />

      <h1 className="font-jakarta text-heading-md font-bold text-charcoal text-center mb-2">
        Welcome to Domus AI
      </h1>
      <p className="font-body text-xs text-stone text-center mb-8 max-w-xs">
        Unified spatial architectural platform powered by Puter Cloud infrastructure.
      </p>

      {error && (
        <div className="w-full mb-6 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-600">
          <AlertCircle size={16} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <button
        onClick={handleSignIn}
        disabled={loading}
        className="w-full h-11 bg-indigo hover:bg-indigoDark text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-2 shadow-button disabled:opacity-50 transition-all cursor-pointer"
      >
        {loading ? (
          <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
        ) : (
          <>
            <LogIn size={18} />
            <span>Sign In with Puter</span>
          </>
        )}
      </button>

      {/* Guest Mode Direct Access */}
      <Link
        href="/floor-plan"
        className="w-full h-11 mt-3 bg-white border border-hairline hover:bg-gray-50 text-charcoal font-semibold text-xs rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all"
      >
        <Compass size={14} className="text-indigo" />
        <span>Enter Studio (Guest Mode)</span>
      </Link>

      {/* Info links */}
      <div className="mt-8 pt-6 border-t border-hairline w-full flex items-center justify-center gap-1.5 text-xs text-stone">
        <span>New to Domus?</span>
        <Link
          href="/onboarding"
          className="font-semibold text-indigo hover:text-indigoDark flex items-center gap-0.5 transition-colors"
        >
          <span>Start onboarding</span>
          <ArrowRight size={11} className="text-indigo" />
        </Link>
      </div>
    </div>
  );
}
