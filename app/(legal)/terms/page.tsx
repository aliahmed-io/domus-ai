import type { Metadata } from "next";
import { FileText, AlertTriangle, Scale } from "lucide-react";

export const metadata: Metadata = {
  title: "Terms of Service | Domus",
  description: "Read the governing terms and licensing conditions for using the Domus platform.",
};

export default function TermsPage() {
  return (
    <article className="space-y-10 font-body text-charcoal select-text">
      {/* Article Header */}
      <header className="border-b border-hairline pb-6">
        <div className="flex items-center gap-2 text-xs font-semibold text-stone uppercase tracking-widest mb-2">
          <Scale size={13} className="text-indigo" />
          <span>Legal Center</span>
        </div>
        <h1 className="font-jakarta text-display-sm font-850 tracking-tight leading-none">
          Terms of Service
        </h1>
        <p className="text-stone text-xs mt-3">
          Last updated: May 29, 2026 • 8 min read
        </p>
      </header>

      {/* Summary Card */}
      <section className="bg-indigo-light/50 border border-indigo/10 rounded-2xl p-6 md:p-8 space-y-4">
        <h3 className="font-jakarta text-xs font-bold text-indigo uppercase tracking-wider flex items-center gap-2">
          <FileText size={15} />
          <span>General Agreement Overview</span>
        </h3>
        <p className="text-xs text-charcoal/90 leading-relaxed">
          By launching any spatial digital twin tool under Domus, you agree to these governing terms and licensing definitions. You must possess the legal authority to upload blueprints and structural IFC files.
        </p>
      </section>

      {/* Warn box */}
      <div className="p-4 bg-amberLight border border-amber/10 text-amber rounded-xl flex items-start gap-3 text-xs leading-relaxed font-body">
        <AlertTriangle size={16} className="shrink-0 mt-0.5" />
        <div>
          <strong className="font-bold">Disclaimer of Architectural Liability:</strong>
          <p className="mt-0.5 opacity-90">
            Domus is an AI-powered simulation assistant. Layout calculations, automatically routed conduits, and IBC compliance checks do NOT replace professional architectural stamps, structural engineer certifications, or municipal building permits.
          </p>
        </div>
      </div>

      <section className="space-y-4">
        <h2 className="font-jakarta text-heading-md font-800 tracking-tight">
          1. Platform Usage & CAD Uploads
        </h2>
        <p className="text-xs text-stone leading-relaxed">
          You retain full copyright over all original CAD drawings, hand-sketched blueprints, and digital room models uploaded or drawn inside the workspace. However, you grant Domus and its cloud host, Puter, a worldwide, non-exclusive license to host, parse, and synchronize this metadata to compile WebGL geometry.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="font-jakarta text-heading-md font-800 tracking-tight">
          2. Generative Assets & PBR Mapping
        </h2>
        <p className="text-xs text-stone leading-relaxed">
          Textures and assets created via the Replicate and TRELLIS generative APIs are provided on an as-is basis. We make no guarantees regarding copyright patent availability or seamlessness under actual commercial builds.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="font-jakarta text-heading-md font-800 tracking-tight">
          3. Platform Termination
        </h2>
        <p className="text-xs text-stone leading-relaxed">
          We reserve the right to suspend or block user sessions that violate acceptable platform practices, including trying to reverse engineer our WebAssembly binary files or flood API routes.
        </p>
      </section>
    </article>
  );
}
