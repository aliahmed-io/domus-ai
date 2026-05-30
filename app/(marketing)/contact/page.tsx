import type { Metadata } from "next";
import ContactForm from "@/components/contact/ContactForm";
import { Mail, MessageSquare, Compass, Info } from "lucide-react";

export const metadata: Metadata = {
  title: "Contact Us | Domus",
  description: "Get in touch with the Domus spatial engineering team for sales or custom API requests.",
};

export default function ContactPage() {
  return (
    <div className="w-full min-h-screen bg-alabaster select-none">
      {/* Hero Header */}
      <section className="pt-32 pb-12 px-6 max-w-4xl mx-auto text-center space-y-4">
        <div className="flex items-center justify-center gap-2 text-xs font-semibold text-stone uppercase tracking-widest">
          <MessageSquare size={13} className="text-indigo" />
          <span>Get in touch</span>
        </div>
        <h1 className="font-jakarta text-display-sm md:text-display-md font-800 text-charcoal tracking-tight leading-none">
          Contact Spatial Engineering
        </h1>
        <p className="font-body text-base text-stone max-w-xl mx-auto leading-relaxed">
          Questions about custom GNN integrations, team licensing, or volume scanning pipelines? Write to our developer network.
        </p>
      </section>

      {/* Main split: contact details left, contact form right */}
      <section className="py-8 px-6 max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 items-start mb-16">
        {/* Info Column */}
        <div className="bg-white rounded-2xl border border-hairline p-6 md:p-8 shadow-card space-y-6">
          <h3 className="font-jakarta text-heading-xs font-800 text-charcoal tracking-tight border-b border-hairline pb-4 flex items-center gap-2">
            <Info size={16} className="text-indigo" />
            <span>Developer Support</span>
          </h3>

          <div className="space-y-4 font-body text-xs leading-relaxed text-stone">
            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 rounded-xl bg-indigo-light text-indigo flex items-center justify-center shrink-0">
                <Mail size={18} />
              </div>
              <div>
                <h4 className="font-jakarta font-bold text-charcoal">General Inquiries</h4>
                <p className="mt-0.5">dpo@domus.ai</p>
              </div>
            </div>

            <div className="flex gap-4 items-start border-t border-hairline pt-4">
              <div className="w-10 h-10 rounded-xl bg-teal-light text-teal flex items-center justify-center shrink-0">
                <Compass size={18} />
              </div>
              <div>
                <h4 className="font-jakarta font-bold text-charcoal">Compliance Office</h4>
                <p className="mt-0.5">dpo@domus.ai</p>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Form Column */}
        <ContactForm />
      </section>
    </div>
  );
}
