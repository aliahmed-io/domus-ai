import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Domus",
    template: "%s | Domus",
  },
};

export default function MarketingLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Navbar rendered client-side to allow scroll detection */}
      {/* Import dynamically to keep layout as Server Component */}
      <MarketingNav />
      <div className="flex-1">{children}</div>
      <MarketingFooter />
    </div>
  );
}

// ─── Lazy imports to keep layout as Server Component ─────────────────────────
// These are defined inline to avoid circular import issues
import dynamic from "next/dynamic";

const MarketingNav = dynamic(() => import("@/components/shared/Navbar"), {
  ssr: true,
});

const MarketingFooter = dynamic(() => import("@/components/shared/Footer"), {
  ssr: true,
});
