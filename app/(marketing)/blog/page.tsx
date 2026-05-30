import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, Calendar, Clock, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Blog & CAD resources | Domus",
  description: "Read the latest deep dives on WebAssembly IFC engines, WebXR scanning benchmarks, and generative PBR modeling.",
};

const ARTICLES = [
  {
    slug: "wasm-ifc-bim-processing",
    title: "Heavy BIM Parsing in Browser Sandbox: Accelerating WASM",
    excerpt: "Learn how we shifted coordinate extraction off server threads directly into native browser WebAssembly runtimes, achieving sub-second loads.",
    date: "May 25, 2026",
    readTime: "8 min read",
    category: "Engineering",
  },
  {
    slug: "generative-topologies-trellis-pbr",
    title: "TRELLIS v2: Mapping Seamless PBR Shaders Procedurally",
    excerpt: "A deep dive on Microsoft's generative CAD systems and our dynamic mesh mapping pipelines for interior reskin models.",
    date: "May 18, 2026",
    readTime: "6 min read",
    category: "Interior Design",
  },
  {
    slug: "webxr-plane-registration-benchmarks",
    title: "WebXR Plane Registrations: Benchmarks Across Devices",
    excerpt: "Comparing Android Chrome LiDAR returns against Apple Vision Pro passthrough mappings in real-world environments.",
    date: "May 10, 2026",
    readTime: "5 min read",
    category: "Hardware",
  },
] as const;

export default function BlogHubPage() {
  return (
    <div className="w-full min-h-screen bg-alabaster select-none">
      {/* Hero Header */}
      <section className="pt-32 pb-16 px-6 max-w-4xl mx-auto text-center space-y-4">
        <div className="flex items-center justify-center gap-2 text-xs font-semibold text-stone uppercase tracking-widest">
          <BookOpen size={13} className="text-indigo" />
          <span>Knowledge Hub</span>
        </div>
        <h1 className="font-jakarta text-display-sm md:text-display-md font-800 text-charcoal tracking-tight leading-none">
          Blog & CAD Resources
        </h1>
        <p className="font-body text-base text-stone max-w-xl mx-auto leading-relaxed">
          Technical insights, architecture guides, and developer case studies exploring spatial digital twin systems.
        </p>
      </section>

      {/* Articles list */}
      <section className="py-8 px-6 max-w-4xl mx-auto space-y-6">
        <h3 className="font-jakarta text-xs font-bold text-charcoal uppercase tracking-widest border-b border-hairline pb-3">
          Latest Deep Dives
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {ARTICLES.map((art) => (
            <article
              key={art.slug}
              className="bg-white rounded-2xl p-6 border border-hairline shadow-card hover:shadow-cardHover hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between gap-5 group"
            >
              <div className="space-y-3">
                <span className="px-2.5 py-0.5 bg-indigo-light text-indigo text-[10px] font-bold uppercase rounded-full border border-indigo/10 inline-block">
                  {art.category}
                </span>
                <h4 className="font-jakarta text-base font-700 text-charcoal leading-snug group-hover:text-indigo transition-colors">
                  {art.title}
                </h4>
                <p className="font-body text-xs text-stone leading-relaxed">
                  {art.excerpt}
                </p>
              </div>

              <div className="flex items-center justify-between border-t border-hairline pt-4 text-[10px] font-body text-stone font-semibold">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <Calendar size={12} />
                    <span>{art.date}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={12} />
                    <span>{art.readTime}</span>
                  </span>
                </div>

                <div className="text-indigo flex items-center gap-1 group-hover:translate-x-0.5 transition-transform cursor-pointer font-bold">
                  <span>Read Article</span>
                  <ArrowRight size={12} />
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
