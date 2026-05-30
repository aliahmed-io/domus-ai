"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Brain,
  Layers,
  Scan,
  Palette,
  Package,
  SplitSquareHorizontal,
  ChevronRight,
  Check,
  Building2,
  Box,
} from "lucide-react";
import HeroVisualizer from "@/components/visualizer/HeroVisualizer";

// ─── Animation Variants ─────────────────────────────────────────────────────────

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

export default function MarketingPage() {
  return (
    <main className="flex-1 w-full relative overflow-hidden bg-alabaster">
      {/* ─── Hero Section ──────────────────────────────────────────────────────── */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 px-6 flex flex-col items-center text-center">
        {/* Background Decorative Blur */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-indigo-light/40 rounded-full blur-[120px] -z-10 pointer-events-none" />

        <div className="w-full max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="flex flex-col items-start text-left z-10"
          >
            <motion.div variants={fadeInUp} className="mb-6 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-hairline shadow-sm">
              <span className="flex h-2 w-2 rounded-full bg-teal" />
              <span className="text-[11px] font-bold text-charcoal tracking-wide uppercase">
                Domus Engine 2.0 Live
              </span>
            </motion.div>

            <motion.h1
              variants={fadeInUp}
              className="font-headline font-bold text-charcoal leading-[1.05] tracking-tight text-5xl md:text-7xl lg:text-[80px]"
            >
              Architectural <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-charcoal via-indigo-dark to-charcoal">
                Intelligence.
              </span>
            </motion.h1>

            <motion.p
              variants={fadeInUp}
              className="mt-6 text-lg md:text-xl text-stone font-body max-w-lg leading-relaxed"
            >
              The unified spatial platform for the future of design. Generate AI floor plans, scan physical rooms, and render photorealistic WebXR walkthroughs instantly.
            </motion.p>

            <motion.div variants={fadeInUp} className="mt-10 flex flex-col sm:flex-row items-center gap-4">
              <Link href="/editor" className="btn-primary flex items-center gap-2 group px-8 py-4 text-[15px]">
                Open Editor
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
              </Link>
              <Link href="/showcase" className="btn-secondary flex items-center gap-2 px-8 py-4 text-[15px]">
                View Showcase
              </Link>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] as [number, number, number, number], delay: 0.2 }}
            className="relative h-[400px] lg:h-[600px] w-full rounded-2xl overflow-hidden shadow-hero border border-hairline bg-white/50 backdrop-blur-sm flex items-center justify-center"
          >
            {/* The HeroVisualizer is a 3D R3F Canvas */}
            <HeroVisualizer />
          </motion.div>
        </div>
      </section>

      {/* ─── Partners Marquee ──────────────────────────────────────────────────── */}
      <section className="py-10 border-y border-hairline bg-white/50">
        <div className="max-w-[1200px] mx-auto px-6 overflow-hidden flex flex-col items-center">
          <p className="text-[11px] font-bold text-stone uppercase tracking-widest mb-6">Trusted by industry leaders</p>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
            {["Zaha Hadid", "Foster + Partners", "Gensler", "SOM", "BIG"].map((partner) => (
              <span key={partner} className="font-headline font-bold text-xl md:text-2xl text-charcoal">{partner}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Bento Box Features ────────────────────────────────────────────────── */}
      <section className="py-24 md:py-32 px-6">
        <div className="max-w-[1200px] mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
            className="text-center mb-16"
          >
            <h2 className="font-headline font-bold text-4xl md:text-5xl text-charcoal mb-4">
              A Complete Ecosystem
            </h2>
            <p className="text-lg text-stone font-body max-w-2xl mx-auto">
              Everything you need to capture, generate, and inhabit spatial designs in a single, fluid browser experience.
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 auto-rows-[300px]"
          >
            {/* Large Feature 1 */}
            <motion.div
              variants={fadeInUp}
              className="md:col-span-2 lg:col-span-2 row-span-2 rounded-3xl bg-white border border-hairline p-8 flex flex-col relative overflow-hidden group hover:border-indigo/30 transition-colors shadow-sm hover:shadow-card"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-light/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <Brain className="text-indigo w-10 h-10 mb-6" />
              <h3 className="font-headline font-bold text-2xl text-charcoal mb-3">AI Floor Plan Engine</h3>
              <p className="text-stone font-body text-[15px] leading-relaxed max-w-md">
                Input room counts and area constraints. Our proprietary GNN-powered edge service generates mathematically sound, optimized spatial layouts in under 3 seconds.
              </p>
              <div className="mt-auto pt-8">
                <div className="w-full h-48 bg-alabaster rounded-xl border border-hairline relative overflow-hidden flex items-center justify-center group-hover:scale-[1.02] transition-transform duration-500">
                  <div className="w-3/4 h-3/4 border-2 border-dashed border-indigo/30 rounded-lg flex items-center justify-center">
                    <span className="text-indigo/50 font-bold text-sm uppercase tracking-wider">Neural Layout Gen</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Feature 2 */}
            <motion.div
              variants={fadeInUp}
              className="md:col-span-1 lg:col-span-2 rounded-3xl bg-charcoal text-white p-8 flex flex-col relative overflow-hidden group shadow-card"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-gold/10 rounded-full blur-3xl -mr-16 -mt-16" />
              <Palette className="text-gold w-8 h-8 mb-4" />
              <h3 className="font-headline font-bold text-xl mb-2">Generative Materials</h3>
              <p className="text-on-dark-muted font-body text-[14px] leading-relaxed mb-6">
                Type a material prompt. TRELLIS maps seamless PBR textures onto every wall and floor surface in real time.
              </p>
              <div className="mt-auto flex gap-2">
                <span className="px-3 py-1 bg-white/10 rounded-full text-[11px] font-bold">Wood</span>
                <span className="px-3 py-1 bg-white/10 rounded-full text-[11px] font-bold">Marble</span>
                <span className="px-3 py-1 bg-white/10 rounded-full text-[11px] font-bold">Concrete</span>
              </div>
            </motion.div>

            {/* Feature 3 */}
            <motion.div
              variants={fadeInUp}
              className="md:col-span-1 lg:col-span-1 rounded-3xl bg-white border border-hairline p-8 flex flex-col group hover:border-teal/30 transition-colors shadow-sm hover:shadow-card"
            >
              <Scan className="text-teal w-8 h-8 mb-4" />
              <h3 className="font-headline font-bold text-lg text-charcoal mb-2">WebXR Scanner</h3>
              <p className="text-stone font-body text-[13px] leading-relaxed">
                Capture real-world dimensions using LiDAR directly from your mobile browser.
              </p>
            </motion.div>

            {/* Feature 4 */}
            <motion.div
              variants={fadeInUp}
              className="md:col-span-1 lg:col-span-1 rounded-3xl bg-white border border-hairline p-8 flex flex-col group hover:border-indigo/30 transition-colors shadow-sm hover:shadow-card"
            >
              <Layers className="text-indigo w-8 h-8 mb-4" />
              <h3 className="font-headline font-bold text-lg text-charcoal mb-2">BIM Lift</h3>
              <p className="text-stone font-body text-[13px] leading-relaxed">
                Transform 2D sketches into structured 3D BIM models with IFC export instantly.
              </p>
            </motion.div>

            {/* Feature 5 */}
            <motion.div
              variants={fadeInUp}
              className="md:col-span-3 lg:col-span-2 rounded-3xl bg-surface border border-hairline p-8 flex flex-col justify-between group overflow-hidden relative shadow-sm hover:shadow-card"
            >
              <div className="flex justify-between items-start mb-6 z-10 relative">
                <div>
                  <Package className="text-charcoal w-8 h-8 mb-4" />
                  <h3 className="font-headline font-bold text-xl text-charcoal mb-2">Smart Furniture Swap</h3>
                  <p className="text-stone font-body text-[14px] leading-relaxed max-w-sm">
                    Detect furniture in your scan. Replace with AI-selected or custom 3D assets matching your aesthetic.
                  </p>
                </div>
                <div className="w-16 h-16 rounded-full bg-alabaster border border-hairline flex items-center justify-center text-charcoal shrink-0">
                  <ArrowRight />
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ─── Showcase Preview ──────────────────────────────────────────────────── */}
      <section className="py-24 bg-white border-y border-hairline">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
            >
              <h2 className="font-headline font-bold text-4xl text-charcoal mb-4">Built with Domus</h2>
              <p className="text-stone font-body text-lg">See how leading firms leverage our platform.</p>
            </motion.div>
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
            >
              <Link href="/showcase" className="group flex items-center gap-2 text-indigo font-bold hover:text-indigo-dark transition-colors">
                Explore the Atrium Tower
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
              </Link>
            </motion.div>
          </div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="w-full h-[400px] md:h-[600px] rounded-3xl overflow-hidden relative shadow-card group"
          >
            <img 
              src="/atrium_tower_1780033150664.png" 
              alt="Atrium Tower"
              className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-charcoal/80 via-transparent to-transparent" />
            <div className="absolute bottom-0 left-0 p-8 md:p-12">
              <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-white text-[11px] font-bold uppercase tracking-wider mb-4 inline-block border border-white/10">
                Full Suite Pipeline
              </span>
              <h3 className="font-headline font-bold text-3xl md:text-5xl text-white mb-2">The Atrium Tower</h3>
              <p className="text-white/80 font-body text-lg">Generated entirely in Domus 2.0</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── Footer CTA ──────────────────────────────────────────────────────── */}
      <section className="py-32 px-6 text-center">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
          className="max-w-[800px] mx-auto"
        >
          <h2 className="font-headline font-bold text-4xl md:text-5xl text-charcoal mb-6">
            Ready to build the future?
          </h2>
          <p className="text-xl text-stone font-body mb-10 max-w-2xl mx-auto">
            Join thousands of architects and designers shaping tomorrow's spaces today.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/editor" className="btn-primary px-10 py-5 text-[16px] shadow-lg shadow-indigo/20">
              Start Designing Free
            </Link>
            <Link href="/pricing" className="btn-secondary px-10 py-5 text-[16px]">
              View Pricing
            </Link>
          </div>
        </motion.div>
      </section>
    </main>
  );
}
