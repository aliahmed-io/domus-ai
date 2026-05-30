import type { Metadata } from "next";
import Link from "next/link";
import { Check, HelpCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "Pricing | Domus",
  description: "Start free. Select a scalable pricing plan to unlock unlimited generative floor plans and BIM exports.",
};

const FEATURES = [
  "Core 3D Editor",
  "Cloud synchronization",
  "Community発見 feed",
  "AI Floor Plan variants",
  "Image-to-BIM Lift",
  "WebXR plane scanning",
  "TRELLIS seamless textures",
  "Draco pre-optimized GLBs",
  "IFC/BIM CAD export",
] as const;

export default function PricingPage() {
  return (
    <div className="w-full min-h-screen bg-alabaster select-none">
      {/* Hero Header */}
      <section className="pt-32 pb-16 px-6 max-w-4xl mx-auto text-center space-y-4">
        <div className="flex items-center justify-center gap-2 text-xs font-semibold text-stone uppercase tracking-widest">
          <HelpCircle size={13} className="text-indigo" />
          <span>Flexible Plans</span>
        </div>
        <h1 className="font-jakarta text-display-sm md:text-display-md font-800 text-charcoal tracking-tight leading-none">
          Simple, Scalable Pricing
        </h1>
        <p className="font-body text-base text-stone max-w-xl mx-auto leading-relaxed">
          Start for free to explore spatial twin CAD modeling, and upgrade to unlock advanced generative pipelines as your design needs grow.
        </p>
      </section>

      {/* Main pricing plan cards (starter, pro, studio) */}
      <section className="py-8 px-6 max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Starter Plan */}
        <div className="bg-white rounded-2xl p-6 border border-hairline shadow-card flex flex-col justify-between gap-6 hover:shadow-cardHover transition-all duration-300">
          <div className="space-y-4">
            <div>
              <h3 className="font-jakarta text-lg font-700 text-charcoal">Starter</h3>
              <p className="font-body text-xs text-stone mt-1">Perfect for spatial twin hobbyists.</p>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="font-jakarta text-heading-xl font-800 text-charcoal">Free</span>
            </div>
            <div className="h-px bg-hairline" />
            <ul className="space-y-3 font-body text-xs text-stone">
              <li className="flex items-center gap-2.5">
                <Check size={14} className="text-teal" />
                <span>5 active projects</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check size={14} className="text-teal" />
                <span>Standard WebGL viewer</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check size={14} className="text-teal" />
                <span>Puter KV database sync</span>
              </li>
            </ul>
          </div>
          <Link
            href="/editor"
            className="w-full py-2.5 bg-alabaster border border-hairline hover:bg-gray-50 text-charcoal text-center text-xs font-bold rounded-lg transition-colors outline-none"
          >
            Get Started Free
          </Link>
        </div>

        {/* Pro Plan */}
        <div className="bg-white rounded-2xl p-6 border-2 border-indigo shadow-[0_20px_50px_rgba(91,106,240,0.12)] flex flex-col justify-between gap-6 hover:-translate-y-0.5 transition-all duration-300 relative">
          <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4.5 py-1 bg-indigo text-white text-[10px] font-bold uppercase tracking-wider rounded-full shadow-sm">
            Most Popular
          </span>
          <div className="space-y-4">
            <div>
              <h3 className="font-jakarta text-lg font-700 text-charcoal">Professional</h3>
              <p className="font-body text-xs text-stone mt-1">For serious architects & studios.</p>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="font-jakarta text-heading-xl font-800 text-charcoal">$49</span>
              <span className="font-body text-xs text-stone">/mo</span>
            </div>
            <div className="h-px bg-hairline" />
            <ul className="space-y-3 font-body text-xs text-charcoal">
              <li className="flex items-center gap-2.5 font-semibold">
                <Check size={14} className="text-indigo" />
                <span>Unlimited project models</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check size={14} className="text-indigo" />
                <span>AI Floor Plan Engine</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check size={14} className="text-indigo" />
                <span>Full BIM Image-to-3D Extrusion</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check size={14} className="text-indigo" />
                <span>Generative PBR texture labs</span>
              </li>
            </ul>
          </div>
          <Link
            href="/editor"
            className="w-full py-2.5 bg-indigo hover:bg-indigoDark text-white text-center text-xs font-bold rounded-lg shadow-button transition-colors outline-none"
          >
            Start Pro Trial
          </Link>
        </div>

        {/* Studio Plan */}
        <div className="bg-white rounded-2xl p-6 border border-gold/30 shadow-card flex flex-col justify-between gap-6 hover:shadow-cardHover transition-all duration-300">
          <div className="space-y-4">
            <div>
              <h3 className="font-jakarta text-lg font-700 text-charcoal">Studio</h3>
              <p className="font-body text-xs text-stone mt-1">For large enterprise developer networks.</p>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="font-jakarta text-heading-xl font-800 text-charcoal">$149</span>
              <span className="font-body text-xs text-stone">/mo</span>
            </div>
            <div className="h-px bg-hairline" />
            <ul className="space-y-3 font-body text-xs text-stone">
              <li className="flex items-center gap-2.5">
                <Check size={14} className="text-gold" />
                <span>Everything in Professional</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check size={14} className="text-gold" />
                <span>API integration pathways</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check size={14} className="text-gold" />
                <span>Priority DPO data support</span>
              </li>
            </ul>
          </div>
          <Link
            href="/contact"
            className="w-full py-2.5 bg-white border border-gold/40 text-charcoal text-center text-xs font-bold rounded-lg hover:bg-gold-light transition-colors outline-none"
          >
            Contact Sales
          </Link>
        </div>
      </section>

      {/* Feature comparison table details */}
      <section className="py-16 px-6 max-w-4xl mx-auto border-t border-hairline mt-12">
        <h3 className="font-jakarta text-heading-xs font-800 text-charcoal tracking-tight text-center mb-8">
          Detailed Feature Comparison
        </h3>
        <div className="overflow-x-auto border border-hairline rounded-xl">
          <table className="w-full text-left border-collapse text-[11px]">
            <thead>
              <tr className="bg-alabaster border-b border-hairline text-charcoal font-bold">
                <th className="p-3">Domus capability</th>
                <th className="p-3 text-center">Starter</th>
                <th className="p-3 text-center">Professional</th>
                <th className="p-3 text-center">Studio</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline text-stone text-center">
              {FEATURES.map((item, idx) => (
                <tr key={idx}>
                  <td className="p-3 text-left font-semibold text-charcoal">{item}</td>
                  <td className="p-3">
                    {idx < 3 ? <Check size={14} className="text-success mx-auto" /> : "—"}
                  </td>
                  <td className="p-3">
                    {idx < 7 ? <Check size={14} className="text-indigo mx-auto" /> : "—"}
                  </td>
                  <td className="p-3">
                    <Check size={14} className="text-gold mx-auto" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
