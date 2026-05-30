import type { Metadata } from "next";
import { Shield, Eye, Lock, Globe } from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy Policy | Domus",
  description: "Learn how Domus processes, secures, and protects your spatial digital twin data.",
};

export default function PrivacyPage() {
  return (
    <article className="space-y-10 font-body text-charcoal select-text">
      {/* Article Header */}
      <header className="border-b border-hairline pb-6">
        <div className="flex items-center gap-2 text-xs font-semibold text-stone uppercase tracking-widest mb-2">
          <Shield size={13} className="text-indigo" />
          <span>Legal Center</span>
        </div>
        <h1 className="font-jakarta text-display-sm font-850 tracking-tight leading-none">
          Privacy Policy
        </h1>
        <p className="text-stone text-xs mt-3">
          Last updated: May 29, 2026 • 6 min read
        </p>
      </header>

      {/* Overview Card */}
      <section className="bg-indigo-light/50 border border-indigo/10 rounded-2xl p-6 md:p-8 space-y-4">
        <h3 className="font-jakarta text-xs font-bold text-indigo uppercase tracking-wider flex items-center gap-2">
          <Eye size={15} />
          <span>Core Privacy Summary</span>
        </h3>
        <ul className="space-y-3.5 text-xs text-charcoal/90 leading-relaxed list-disc pl-5">
          <li>
            <strong>Zero Server-Side Storage of IFCs:</strong> Your parsed CAD and BIM models are processed directly inside your browser WebAssembly sandbox. We do not store raw design files on our servers.
          </li>
          <li>
            <strong>Puter SDK Synchronization:</strong> Spatial metadata (like project configurations and PBR textures) are saved under your personal Puter.js KV cloud account, completely under your credentials.
          </li>
          <li>
            <strong>No Ad Tracking:</strong> We do not sell your spatial layouts or interior design templates to third-party advertisers.
          </li>
        </ul>
      </section>

      {/* Main legal content sections */}
      <section className="space-y-4">
        <h2 className="font-jakarta text-heading-md font-800 tracking-tight">
          1. Information We Collect
        </h2>
        <p className="text-xs text-stone leading-relaxed">
          We collect metadata necessary to build three-dimensional meshes and authenticate design sessions.
        </p>

        {/* Data Table */}
        <div className="overflow-x-auto border border-hairline rounded-xl mt-3">
          <table className="w-full text-left border-collapse text-[11px]">
            <thead>
              <tr className="bg-alabaster border-b border-hairline text-charcoal font-bold">
                <th className="p-3">Data Type</th>
                <th className="p-3">Processing Purpose</th>
                <th className="p-3">Retention Rule</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline text-stone">
              <tr>
                <td className="p-3 font-semibold text-charcoal">Authentication details</td>
                <td className="p-3">User sign-in credentials synchronized via Puter OAuth services.</td>
                <td className="p-3">Maintained under active Puter profiles.</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold text-charcoal">Spatial Metadata</td>
                <td className="p-3">Calculated positions, rotation angles, and active PBR texture prompts.</td>
                <td className="p-3">Cleared immediately upon project deletion.</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold text-charcoal">Telemetry & FPS Logs</td>
                <td className="p-3">Performance diagnostics for Three.js render loops.</td>
                <td className="p-3">Deleted after 30 days.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-jakarta text-heading-md font-800 tracking-tight">
          2. Direct Data Processing & WebAssembly
        </h2>
        <p className="text-xs text-stone leading-relaxed">
          Unlike legacy SaaS software platforms that upload multi-gigabyte architectural twins onto server backends, Domus runs heavy parsing models client-side in the browser. When you drop blueprints or IFC structures, these are processed entirely within WebAssembly stacks, ensuring absolute file isolation.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="font-jakarta text-heading-md font-800 tracking-tight">
          3. Your Rights Under GDPR & CCPA
        </h2>
        <p className="text-xs text-stone leading-relaxed">
          Under the General Data Protection Regulation (GDPR), users residing in the European Economic Area retain clear rights to access, rectify, or purge all personal spatial files. Since all records are written to Puter storage networks, you can wipe your entire profile instantly through your dashboard.
        </p>
      </section>
    </article>
  );
}
