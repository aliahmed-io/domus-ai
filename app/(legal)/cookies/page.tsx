import type { Metadata } from "next";
import { Shield, Eye } from "lucide-react";

export const metadata: Metadata = {
  title: "Cookie Policy | Domus",
  description: "Learn how Domus uses cookies to persist spatial workspace configurations and session states.",
};

export default function CookiesPage() {
  return (
    <article className="space-y-10 font-body text-charcoal select-text">
      {/* Article Header */}
      <header className="border-b border-hairline pb-6">
        <div className="flex items-center gap-2 text-xs font-semibold text-stone uppercase tracking-widest mb-2">
          <Shield size={13} className="text-indigo" />
          <span>Legal Center</span>
        </div>
        <h1 className="font-jakarta text-display-sm font-850 tracking-tight leading-none">
          Cookie Policy
        </h1>
        <p className="text-stone text-xs mt-3">
          Last updated: May 29, 2026 • 4 min read
        </p>
      </header>

      {/* Summary Card */}
      <section className="bg-indigo-light/50 border border-indigo/10 rounded-2xl p-6 md:p-8 space-y-4">
        <h3 className="font-jakarta text-xs font-bold text-indigo uppercase tracking-wider flex items-center gap-2">
          <Eye size={15} />
          <span>General Cookie Usage</span>
        </h3>
        <p className="text-xs text-charcoal/90 leading-relaxed">
          Domus uses cookies and local browser storage objects to secure user credentials, persist 3D camera placements, and optimize Three.js render buffers.
        </p>
      </section>

      {/* Cookie Table */}
      <section className="space-y-4">
        <h2 className="font-jakarta text-heading-md font-800 tracking-tight">
          1. Classifications of Cookies We Use
        </h2>
        <div className="overflow-x-auto border border-hairline rounded-xl">
          <table className="w-full text-left border-collapse text-[11px]">
            <thead>
              <tr className="bg-alabaster border-b border-hairline text-charcoal font-bold">
                <th className="p-3">Cookie Name</th>
                <th className="p-3">Classification</th>
                <th className="p-3">Function Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline text-stone">
              <tr>
                <td className="p-3 font-semibold text-charcoal">puter_session</td>
                <td className="p-3 text-indigo font-semibold">Essential</td>
                <td className="p-3">Secures dynamic app routes and validates active Puter.js workspace profiles.</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold text-charcoal">domus-editor-grid</td>
                <td className="p-3 text-teal font-semibold">Functional</td>
                <td className="p-3">Persists grid helper scale selections and 2D/3D workspace views in local storage.</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold text-charcoal">domus-diagnostics</td>
                <td className="p-3 text-gold font-semibold">Performance</td>
                <td className="p-3">Tracks WebGL loading speeds and WASM IFC parser performance metrics anonymously.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </article>
  );
}
