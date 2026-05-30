import type { Metadata } from "next";
import { Compass, Shield, Users, Layers, Award, Sparkles } from "lucide-react";

export const metadata: Metadata = {
  title: "About Us | Domus",
  description: "Learn about the mission, values, and engineering team building the future of spatial intelligence.",
};

const VALUES = [
  {
    icon: Compass,
    title: "Precision First",
    desc: "We prioritize absolute dimensional accuracy. Millimeter-level calculations form the bedrock of digital twins.",
  },
  {
    icon: Shield,
    title: "Open by Default",
    desc: "We support open standard BIM schemas. Full support for IFC format ensures absolute cross-platform parity.",
  },
  {
    icon: Sparkles,
    title: "AI as a Co-Pilot",
    desc: "We empower architects with generative models, automating heavy routing and optimization calculations.",
  },
] as const;

export default function AboutPage() {
  return (
    <div className="w-full min-h-screen bg-alabaster select-none">
      {/* ── HERO SECTION ──────────────────────────────────────────────────── */}
      <section className="pt-32 pb-20 px-6 max-w-5xl mx-auto text-center space-y-6">
        <div className="flex items-center justify-center gap-2 text-xs font-semibold text-stone uppercase tracking-widest">
          <Award size={13} className="text-indigo" />
          <span>Our Mission</span>
        </div>
        <h1 className="font-jakarta text-display-sm md:text-display-md font-800 text-charcoal tracking-tight leading-none max-w-3xl mx-auto">
          We&rsquo;re Building the Future of Spatial Design.
        </h1>
        <p className="font-body text-base text-stone max-w-xl mx-auto leading-relaxed">
          Domus is the unified spatial intelligence platform. We empower architects, interior designers, and developer teams to build high-performance WebGL digital twins.
        </p>
      </section>

      {/* ── CORE VALUES ────────────────────────────────────────────────────── */}
      <section className="py-16 px-6 max-w-5xl mx-auto border-t border-hairline">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {VALUES.map((val) => (
            <div
              key={val.title}
              className="bg-white rounded-2xl p-6 border border-hairline shadow-card hover:shadow-cardHover hover:-translate-y-0.5 transition-all duration-300 space-y-4"
            >
              <div className="w-10 h-10 rounded-xl bg-indigo-light text-indigo flex items-center justify-center">
                <val.icon size={20} />
              </div>
              <h3 className="font-jakarta text-heading-xs font-700 text-charcoal">
                {val.title}
              </h3>
              <p className="font-body text-xs text-stone leading-relaxed">
                {val.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── METRICS GRID ───────────────────────────────────────────────────── */}
      <section className="py-16 bg-charcoal text-white px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { label: "Designers Worldwide", value: "2,400+" },
            { label: "BIM Models Parsed", value: "180k+" },
            { label: "Countries Active", value: "47" },
            { label: "WASM Parse Time", value: "4.2s" },
          ].map((metric) => (
            <div key={metric.label} className="space-y-1">
              <h2 className="font-jakarta text-heading-xl font-800 text-indigo animate-pulse">
                {metric.value}
              </h2>
              <p className="font-body text-[10px] text-onDarkMuted uppercase tracking-wider font-semibold">
                {metric.label}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
