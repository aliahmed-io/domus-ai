import type { Metadata } from "next";
import Link from "next/link";
import {
  Brain,
  Layers,
  Scan,
  Palette,
  Package,
  Sparkles,
  ArrowRight,
  Compass,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Spatial CAD Studio",
  description: "Select an AI tool module to begin designing in WebGL spatial virtual environments.",
};

const modules = [
  {
    href: "/editor/floor-plan",
    icon: Brain,
    title: "AI Floor Plan",
    desc: "Generate complete multi-room architectural spatial layouts using GNN-driven area optimization.",
    color: "bg-indigo text-indigo border-indigo/10",
    gradient: "from-indigo/10 via-white to-white",
  },
  {
    href: "/editor/bim-lift",
    icon: Layers,
    title: "BIM Lift",
    desc: "Lift 2D blueprints or hand sketches into extruded 3D BIM spaces, running full BOM reports client-side.",
    color: "bg-teal text-teal border-teal/10",
    gradient: "from-teal/10 via-white to-white",
  },
  {
    href: "/editor/ar-map",
    icon: Scan,
    title: "AR Room Scanner",
    desc: "Use WebXR passthrough on mobile devices to map exact room dimensions and output 3D spatial shells.",
    color: "bg-darkSurface text-charcoal border-charcoal/10",
    gradient: "from-gray-100 via-white to-white",
  },
  {
    href: "/editor/material-lab",
    icon: Palette,
    title: "Material Lab",
    desc: "Reskin 3D geometries with generative seamless PBR texture layers mapped via text-prompts.",
    color: "bg-gold text-gold border-gold/10",
    gradient: "from-gold/10 via-white to-white",
  },
  {
    href: "/editor/furniture",
    icon: Package,
    title: "Furniture Swap",
    desc: "Detect furniture placements and insert responsive, cached high-performance DRACO GLB assets.",
    color: "bg-stone text-stone border-stone/10",
    gradient: "from-stone/10 via-white to-white",
  },
] as const;

export default function EditorHubPage() {
  return (
    <div className="w-full min-h-screen flex flex-col p-6 md:p-10 bg-alabaster overflow-y-auto">
      {/* ── HEADER ────────────────────────────────────────────────────────── */}
      <header className="mb-10 max-w-2xl">
        <div className="flex items-center gap-2 text-xs font-semibold text-stone uppercase tracking-widest mb-1.5">
          <Compass size={12} className="text-indigo" />
          <span>Spatial Engineering Hub</span>
        </div>
        <h1 className="font-jakarta text-heading-xl font-800 text-charcoal tracking-tight">
          Spatial CAD Studio
        </h1>
        <p className="font-body text-sm text-stone mt-1">
          Select a specialized generative module below to start building high-performance spatial digital twins.
        </p>
      </header>

      {/* ── MODULE CARDS ──────────────────────────────────────────────────── */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl">
        {modules.map((mod) => (
          <div
            key={mod.title}
            className={`group relative bg-white rounded-2xl border border-hairline overflow-hidden shadow-card hover:shadow-cardHover transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between`}
          >
            {/* Background color gradient strip */}
            <div className={`h-1.5 w-full ${mod.color.split(" ")[0]}`} />

            <div className="p-6 flex-1 flex flex-col justify-between gap-6">
              {/* Upper Section */}
              <div className="space-y-4">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center border ${
                    mod.title === "AI Floor Plan"
                      ? "bg-indigo-light text-indigo border-indigo/20"
                      : mod.title === "BIM Lift"
                        ? "bg-teal-light text-teal border-teal/20"
                        : mod.title === "AR Room Scanner"
                          ? "bg-gray-100 text-charcoal border-gray-200"
                          : mod.title === "Material Lab"
                            ? "bg-gold-light text-gold border-gold/20"
                            : "bg-gray-100 text-stone border-gray-200"
                  }`}
                >
                  <mod.icon size={22} />
                </div>

                <div>
                  <h3 className="font-jakarta text-lg font-700 text-charcoal flex items-center gap-1.5 group-hover:text-indigo transition-colors">
                    <span>{mod.title}</span>
                    {mod.title === "AI Floor Plan" && (
                      <Sparkles size={13} className="text-indigo" />
                    )}
                  </h3>
                  <p className="font-body text-xs text-stone leading-relaxed mt-1.5">
                    {mod.desc}
                  </p>
                </div>
              </div>

              {/* Action Button */}
              <Link
                href={mod.href}
                className="btn-secondary w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-center flex items-center justify-center gap-1.5 group-hover:bg-charcoal group-hover:text-white transition-all duration-200"
              >
                <span>Launch Tool</span>
                <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
