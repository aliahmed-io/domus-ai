"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Layers, FileImage, Download, Activity, CheckCircle2 } from "lucide-react";

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

export default function ShowcasePage() {
  return (
    <main className="flex-1 w-full bg-alabaster min-h-screen">
      {/* ─── Header ──────────────────────────────────────────────────────────── */}
      <section className="pt-32 pb-16 px-6">
        <div className="max-w-[1000px] mx-auto">
          <Link href="/" className="inline-flex items-center gap-2 text-stone hover:text-charcoal transition-colors mb-8 font-body text-sm font-bold">
            <ArrowLeft size={16} />
            Back to Platform
          </Link>

          <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="flex flex-col gap-4">
            <motion.div variants={fadeInUp} className="flex flex-wrap items-center gap-3 mb-2">
              <span className="px-3 py-1 bg-indigo-light text-indigo rounded-full text-[11px] font-bold uppercase tracking-widest border border-indigo/20">
                Showcase
              </span>
              <span className="px-3 py-1 bg-white border border-hairline rounded-full text-stone text-[11px] font-bold uppercase tracking-widest">
                Generated via Domus Engine 2.0
              </span>
            </motion.div>
            
            <motion.h1 variants={fadeInUp} className="font-headline font-bold text-5xl md:text-6xl text-charcoal tracking-tight">
              The Atrium Tower
            </motion.h1>
            
            <motion.p variants={fadeInUp} className="text-xl text-stone font-body max-w-2xl mt-4 leading-relaxed">
              A 4,200 sq ft conceptual residential high-rise interior. The layout, structural BOM, and photorealistic visualizations were generated entirely inside the Domus editor from a single sketch.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* ─── Gallery Grid ────────────────────────────────────────────────────── */}
      <section className="px-6 pb-20">
        <div className="max-w-[1200px] mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="w-full h-[500px] md:h-[700px] rounded-3xl overflow-hidden shadow-card relative border border-hairline group"
          >
            <img src="/atrium_tower.png" alt="Atrium Tower Main Render" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-charcoal/40 to-transparent" />
            <div className="absolute bottom-6 right-6">
              <a href="/atrium_tower.png" target="_blank" className="flex items-center gap-2 bg-white/20 backdrop-blur-md px-4 py-2 rounded-lg text-white font-bold text-xs hover:bg-white/30 transition-colors border border-white/20 shadow-sm">
                <Download size={14} /> Download 8K Render
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── Project Data ────────────────────────────────────────────────────── */}
      <section className="py-20 bg-white border-y border-hairline px-6">
        <div className="max-w-[1000px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-16">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer} className="space-y-8">
            <motion.h3 variants={fadeInUp} className="font-headline font-bold text-3xl text-charcoal">
              Generated Assets
            </motion.h3>

            <motion.div variants={fadeInUp} className="flex gap-4 items-start p-6 rounded-2xl border border-hairline bg-alabaster">
              <div className="p-3 bg-white rounded-xl shadow-sm border border-hairline">
                <Layers className="text-indigo" size={24} />
              </div>
              <div>
                <h4 className="font-headline font-bold text-lg text-charcoal mb-1">IFC BIM Model</h4>
                <p className="text-stone font-body text-sm leading-relaxed mb-3">
                  Full 3D structural model containing walls, slabs, windows, and doors with attached semantic data.
                </p>
                <div className="flex gap-2">
                  <span className="text-[10px] font-bold text-stone bg-white px-2 py-1 rounded border border-hairline uppercase">.IFC</span>
                  <span className="text-[10px] font-bold text-stone bg-white px-2 py-1 rounded border border-hairline uppercase">.GLB</span>
                </div>
              </div>
            </motion.div>

            <motion.div variants={fadeInUp} className="flex gap-4 items-start p-6 rounded-2xl border border-hairline bg-alabaster">
              <div className="p-3 bg-white rounded-xl shadow-sm border border-hairline">
                <FileImage className="text-teal" size={24} />
              </div>
              <div>
                <h4 className="font-headline font-bold text-lg text-charcoal mb-1">Photorealistic Visualizations</h4>
                <p className="text-stone font-body text-sm leading-relaxed mb-3">
                  12 High-fidelity renders synthesized via the FLUX.1 edge API with architectural prompt parameters.
                </p>
                <div className="flex gap-2">
                  <span className="text-[10px] font-bold text-stone bg-white px-2 py-1 rounded border border-hairline uppercase">.PNG</span>
                </div>
              </div>
            </motion.div>
          </motion.div>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer} className="space-y-8">
            <motion.h3 variants={fadeInUp} className="font-headline font-bold text-3xl text-charcoal">
              Material Palette
            </motion.h3>

            <motion.div variants={fadeInUp} className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl border border-hairline flex flex-col gap-4">
                <div className="w-full h-16 rounded-lg bg-[#2C2621]" />
                <div>
                  <p className="font-bold text-sm text-charcoal">Ebony Wood</p>
                  <p className="text-xs text-stone font-body">Flooring • 4,200 sq ft</p>
                </div>
              </div>
              <div className="p-4 rounded-2xl border border-hairline flex flex-col gap-4">
                <div className="w-full h-16 rounded-lg bg-[#F9F9F8] border border-hairline" />
                <div>
                  <p className="font-bold text-sm text-charcoal">Alabaster Drywall</p>
                  <p className="text-xs text-stone font-body">Walls • 12,000 sq ft</p>
                </div>
              </div>
              <div className="p-4 rounded-2xl border border-hairline flex flex-col gap-4">
                <div className="w-full h-16 rounded-lg bg-[#C2A585]" />
                <div>
                  <p className="font-bold text-sm text-charcoal">Brushed Gold</p>
                  <p className="text-xs text-stone font-body">Fixtures & Accents</p>
                </div>
              </div>
              <div className="p-4 rounded-2xl border border-hairline flex flex-col gap-4">
                <div className="w-full h-16 rounded-lg bg-[#A88E75]" />
                <div>
                  <p className="font-bold text-sm text-charcoal">Bronze Metal</p>
                  <p className="text-xs text-stone font-body">Window Mullions</p>
                </div>
              </div>
            </motion.div>

            <motion.div variants={fadeInUp} className="p-6 bg-charcoal rounded-2xl text-white shadow-card relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo/20 blur-3xl rounded-full" />
              <Activity className="text-indigo-light mb-4" />
              <h4 className="font-bold text-lg mb-2">Performance Audit</h4>
              <ul className="space-y-2 font-body text-sm text-on-dark-muted">
                <li className="flex justify-between items-center"><span className="flex items-center gap-2"><CheckCircle2 size={14} className="text-teal" /> Layout Generation</span> <span className="text-white font-mono">1.2s</span></li>
                <li className="flex justify-between items-center"><span className="flex items-center gap-2"><CheckCircle2 size={14} className="text-teal" /> IFC Extraction</span> <span className="text-white font-mono">3.4s</span></li>
                <li className="flex justify-between items-center"><span className="flex items-center gap-2"><CheckCircle2 size={14} className="text-teal" /> Path-Traced Render</span> <span className="text-white font-mono">8.1s</span></li>
              </ul>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ─── CTA ─────────────────────────────────────────────────────────────── */}
      <section className="py-24 px-6 text-center">
        <div className="max-w-[600px] mx-auto">
          <h2 className="font-headline font-bold text-4xl text-charcoal mb-6">Build your next project with Domus</h2>
          <p className="text-lg text-stone font-body mb-8">
            Experience the workflow that generated the Atrium Tower. Start with a sketch, finish with a masterpiece.
          </p>
          <Link href="/editor" className="btn-primary inline-flex items-center gap-2 px-10 py-5 text-[16px] group shadow-lg shadow-indigo/20">
            Open the Editor
            <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </section>
    </main>
  );
}
