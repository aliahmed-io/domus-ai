import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge Tailwind classes safely — resolves conflicts via twMerge */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/** Format a number as a compact string (e.g. 1200 → "1.2k") */
export function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

/** Format sq ft with imperial + metric */
export function formatArea(sqft: number): string {
  const sqm = (sqft * 0.0929).toFixed(0);
  return `${sqft.toLocaleString()} sq ft / ${sqm} m²`;
}

/** Generate a nano-ID for client-side entity creation */
export function nanoid(len = 12): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let id = "";
  const arr = crypto.getRandomValues(new Uint8Array(len));
  for (const byte of arr) {
    id += chars[byte % chars.length];
  }
  return id;
}

/** Clamp a number between min and max */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** Format ISO date string to a readable label */
export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(iso));
}

/** Format ISO date as relative time ("3 days ago") */
export function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(iso);
}

/** Debounce a function */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  ms: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

/** Convert feet to meters */
export function feetToMeters(feet: number): number {
  return Number((feet * 0.3048).toFixed(2));
}

/** Convert meters to feet */
export function metersToFeet(meters: number): number {
  return Number((meters / 0.3048).toFixed(2));
}
