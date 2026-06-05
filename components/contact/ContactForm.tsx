"use client";

import React, { useState } from "react";
import { Send, CheckCircle, AlertCircle } from "lucide-react";

export default function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("General");
  const [message, setMessage] = useState("");

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      setError("Please fill out all required fields.");
      return;
    }

    setLoading(true);
    setError(null);

    // Mock API call to simulate message sending
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
      setName("");
      setEmail("");
      setMessage("");
    }, 1200);
  };

  return (
    <div className="bg-white rounded-2xl border border-hairline p-6 md:p-8 shadow-card w-full">
      {success ? (
        <div className="text-center py-8 space-y-4">
          <div className="w-12 h-12 rounded-full bg-successLight text-success flex items-center justify-center border border-success/10 mx-auto shadow-inner">
            <CheckCircle size={22} className="animate-bounce" />
          </div>
          <div>
            <h3 className="font-jakarta text-heading-xs font-800 text-charcoal tracking-tight">
              Message Sent!
            </h3>
            <p className="font-body text-xs text-stone mt-1.5 max-w-xs mx-auto leading-relaxed">
              Thank you for writing to our team. We have received your spatial twin diagnostic logs and will respond within 24 hours.
            </p>
          </div>
          <button
            onClick={() => setSuccess(false)}
            className="text-xs font-bold text-indigo hover:text-indigoDark mt-4 transition-colors"
          >
            Send another message
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <h3 className="font-jakarta text-heading-xs font-800 text-charcoal tracking-tight">
              Send a Message
            </h3>
            <p className="font-body text-[11px] text-stone mt-0.5">
              Submit your inquiry and our engineering team will get back to you.
            </p>
          </div>

          {error && (
            <div className="p-3 bg-errorLight border border-error/10 text-error rounded-xl flex items-start gap-2 text-xs font-body leading-relaxed">
              <AlertCircle size={15} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="font-body text-xs font-bold text-charcoal">
              Your Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="px-3.5 py-2.5 bg-alabaster border border-hairline rounded-lg text-xs font-medium text-charcoal focus:bg-white focus:border-indigo focus:ring-2 focus:ring-indigo/20 transition-all outline-none"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-body text-xs font-bold text-charcoal">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="px-3.5 py-2.5 bg-alabaster border border-hairline rounded-lg text-xs font-medium text-charcoal focus:bg-white focus:border-indigo focus:ring-2 focus:ring-indigo/20 transition-all outline-none"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-body text-xs font-bold text-charcoal">
              Inquiry Subject
            </label>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="px-3.5 py-2.5 bg-alabaster border border-hairline rounded-lg text-xs font-medium text-charcoal focus:bg-white focus:border-indigo focus:ring-2 focus:ring-indigo/20 transition-all outline-none cursor-pointer"
            >
              <option>General</option>
              <option>Generative APIs (TRELLIS)</option>
              <option>Volume Scans (WebXR)</option>
              <option>Studio Licensing</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-body text-xs font-bold text-charcoal">
              Message Details
            </label>
            <textarea
              required
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="px-3.5 py-2.5 bg-alabaster border border-hairline rounded-lg text-xs font-medium text-charcoal focus:bg-white focus:border-indigo focus:ring-2 focus:ring-indigo/20 transition-all outline-none resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 btn-primary bg-indigo hover:bg-indigoDark text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 shadow-button disabled:opacity-50 transition-colors"
          >
            {loading ? (
              <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            ) : (
              <>
                <Send size={13} />
                <span>Send Message</span>
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
}
