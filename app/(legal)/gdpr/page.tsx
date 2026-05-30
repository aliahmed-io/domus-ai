import type { Metadata } from "next";
import { Shield, Lock } from "lucide-react";

export const metadata: Metadata = {
  title: "GDPR Data Rights | Domus",
  description: "Understand your consumer privacy rights under GDPR and learn how to manage your spatial twin data.",
};

export default function GDPRPage() {
  return (
    <article className="space-y-10 font-body text-charcoal select-text">
      {/* Article Header */}
      <header className="border-b border-hairline pb-6">
        <div className="flex items-center gap-2 text-xs font-semibold text-stone uppercase tracking-widest mb-2">
          <Shield size={13} className="text-indigo" />
          <span>Legal Center</span>
        </div>
        <h1 className="font-jakarta text-display-sm font-850 tracking-tight leading-none">
          GDPR Data Rights
        </h1>
        <p className="text-stone text-xs mt-3">
          Last updated: May 29, 2026 • 5 min read
        </p>
      </header>

      {/* Summary Card */}
      <section className="bg-indigo-light/50 border border-indigo/10 rounded-2xl p-6 md:p-8 space-y-4">
        <h3 className="font-jakarta text-xs font-bold text-indigo uppercase tracking-wider flex items-center gap-2">
          <Lock size={15} />
          <span>GDPR Core Rights</span>
        </h3>
        <p className="text-xs text-charcoal/90 leading-relaxed">
          European Union residents retain legal control over their spatial profile records under the General Data Protection Regulation.
        </p>
      </section>

      {/* List of rights */}
      <section className="space-y-6">
        <div className="space-y-2">
          <h3 className="font-jakarta text-sm font-bold text-charcoal">
            1. Right to Access & Portability
          </h3>
          <p className="text-xs text-stone leading-relaxed">
            You have the right to request full copies of all spatial digital twin geometries, 3D models, and BOM CSV sheets. You can download these records at any time using the dashboard export buttons.
          </p>
        </div>

        <div className="space-y-2">
          <h3 className="font-jakarta text-sm font-bold text-charcoal">
            2. Right to Erasure (&ldquo;Right to be Forgotten&rdquo;)
          </h3>
          <p className="text-xs text-stone leading-relaxed">
            You can purge your entire workspace history instantly. Clicking &ldquo;Delete Project&rdquo; inside your card dashboard removes all references from active Puter index sets and completely wipes KV records.
          </p>
        </div>

        <div className="space-y-2">
          <h3 className="font-jakarta text-sm font-bold text-charcoal">
            3. Contacting the Data Protection Officer (DPO)
          </h3>
          <p className="text-xs text-stone leading-relaxed">
            For specific compliance inquiries or custom data requests, you can reach out directly to our compliance officer at <strong className="text-indigo">dpo@domus.ai</strong>.
          </p>
        </div>
      </section>
    </article>
  );
}
