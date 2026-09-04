"use client";

import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};

/**
 * Clean SSR hydration guard hook using React 18/19 useSyncExternalStore.
 * Avoids cascading renders and passes strict react-hooks/set-state-in-effect linting.
 */
export function useIsClient(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}
