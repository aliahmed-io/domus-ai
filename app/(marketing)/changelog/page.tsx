import type { Metadata } from "next";
import { Sparkles, Calendar, Zap } from "lucide-react";

export const metadata: Metadata = {
  title: "Changelog | Domus",
  description: "Track our feature additions, WASM speedups, and WebXR passthrough updates.",
};

const LOGS = [
  {
    version: "v1.2.0",
    date: "May 20, 2026",
    badge: "WASM Extruder",
    desc: "Major update to Image-to-BIM Lift pipelines.",
    bullets: [
      "Integrated browser-native Canny edge filters for flat sketches.",
      "Reduced WebAssembly IFC parsing overhead by 40% using fragmented geometries.",
      "Fixed camera reset offsets in Orthographic top-down projections.",
    ],
  },
  {
    version: "v1.1.0",
    date: "May 08, 2026",
    badge: "Generative Textures",
    desc: "Introduced our post-build interior reskin components.",
    bullets: [
      "Mounted TRELLIS API proxies for seamless generative texture reskinning.",
      "Created preset Swatch selectors for instant drywall and walnut finishes.",
      "Added Radical Slider comparison visualizers.",
    ],
  },
] as const;

export default function ChangelogPage() {
  return (
    <div className="w-full min-h-screen bg-alabaster select-none">
      {/* Hero Header */}
      <section className="pt-32 pb-16 px-6 max-w-4xl mx-auto text-center space-y-4">
        <div className="flex items-center justify-center gap-2 text-xs font-semibold text-stone uppercase tracking-widest">
          <Zap size={13} className="text-indigo" />
          <span>Product Timeline</span>
        </div>
        <h1 className="font-jakarta text-display-sm md:text-display-md font-800 text-charcoal tracking-tight leading-none">
          Product Changelog
        </h1>
        <p className="font-body text-base text-stone max-w-xl mx-auto leading-relaxed">
          Stay in the loop with our bi-weekly updates on CAD capabilities, WASM parsing speedups, and point-cloud scan registrations.
        </p>
      </section>

      {/* Timeline Section */}
      <section className="py-8 px-6 max-w-3xl mx-auto relative">
        {/* Central timeline line */}
        <div className="absolute top-10 bottom-10 left-6 sm:left-1/2 w-0.5 bg-hairline" />

        <div className="space-y-12">
          {LOGS.map((log) => (
            <div key={log.version} className="relative flex flex-col sm:flex-row gap-8 items-start">
              {/* Dot locator */}
              <div className="absolute left-6 sm:left-1/2 w-4 h-4 rounded-full bg-indigo border-4 border-white -translate-x-[7px] z-10 shadow-sm" />

              {/* Version title (left in desktop) */}
              <div className="w-full sm:w-1/2 sm:text-right pl-12 sm:pl-0 sm:pr-8 space-y-1">
                <span className="px-2.5 py-0.5 bg-indigo-light text-indigo text-[10px] font-bold uppercase rounded-full border border-indigo/10 inline-block">
                  {log.version}
                </span>
                <div className="flex items-center sm:justify-end gap-1.5 text-xs text-stone mt-1">
                  <Calendar size={12} />
                  <span>{log.date}</span>
                </div>
              </div>

              {/* Change Details (right in desktop) */}
              <div className="w-full sm:w-1/2 pl-12 sm:pl-8">
                <div className="bg-white rounded-2xl p-6 border border-hairline shadow-card space-y-4">
                  <div>
                    <h3 className="font-jakarta text-sm font-bold text-charcoal flex items-center gap-1.5">
                      <Sparkles size={13} className="text-indigo" />
                      <span>{log.badge}</span>
                    </h3>
                    <p className="font-body text-xs text-stone mt-1 leading-relaxed">
                      {log.desc}
                    </p>
                  </div>

                  <ul className="space-y-2 text-xs text-stone list-disc pl-4 leading-relaxed font-body">
                    {log.bullets.map((b, bIdx) => (
                      <li key={bIdx}>{b}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
