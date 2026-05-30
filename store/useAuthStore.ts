'use client';

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { PuterUser } from '@/types/puter';

// ─── State Shape ──────────────────────────────────────────────────────────────

interface AuthState {
  // ── Data ──────────────────────────────────────────────────────────────────
  user: PuterUser | null;
  isLoading: boolean;

  // ── Actions ───────────────────────────────────────────────────────────────
  setUser(user: PuterUser | null): void;
  setLoading(isLoading: boolean): void;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useAuthStore = create<AuthState>()(
  immer((set) => ({
    // ── Initial State ────────────────────────────────────────────────────────
    user: null,
    isLoading: false,

    // ── Actions ──────────────────────────────────────────────────────────────

    setUser(user) {
      set((state) => {
        state.user = user;
      });
    },

    setLoading(isLoading) {
      set((state) => {
        state.isLoading = isLoading;
      });
    },
  })),
);
