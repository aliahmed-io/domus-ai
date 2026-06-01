"use client";

import React from "react";
import { PenTool, Sparkles, Image as ImageIcon, X } from "lucide-react";
import { useEditorStore } from "@/store/useEditorStore";

export default function OnboardingModal() {
  const { setWorkspace, setFloorPlan } = useEditorStore((s) => ({
    setWorkspace: s.setWorkspace,
    setFloorPlan: s.setFloorPlan,
  }));

  const handleStartFromScratch = () => {
    // Initialize an empty floor plan for manual drawing
    setFloorPlan({
      id: "manual-project",
      rooms: [],
      walls: [],
      windows: [],
      doors: [],
      dimensions: { width: 40, height: 30 },
      efficiency: 100,
      naturalLight: 100,
      generatedAt: new Date().toISOString(),
      parameters: {
        style: "open-plan",
        totalArea: 1200,
        bedrooms: 0,
        bathrooms: 0,
        floors: 1,
        features: [],
      },
    });
    setWorkspace("manual");
  };

  const handleGenerativeAI = () => {
    setWorkspace("generative");
  };

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col md:flex-row">
      {/* Left side: branding/intro */}
      <div className="w-full md:w-1/3 bg-alabaster border-r border-hairline p-10 flex flex-col justify-between">
        <div>
          <h1 className="font-headline text-3xl font-bold text-charcoal tracking-tight mb-4">
            Getting Started
          </h1>
          <p className="font-body text-sm text-stone leading-relaxed">
            Choose how you want to begin your project. Use our proprietary generative engine to synthesize a complete floor plan, or start from a blank canvas with our professional CAD tools.
          </p>
        </div>
      </div>

      {/* Right side: Options grid */}
      <div className="w-full md:w-2/3 p-10 flex items-center justify-center bg-white">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl w-full">
          {/* Start from Scratch */}
          <button
            onClick={handleStartFromScratch}
            className="group relative p-8 bg-white border border-hairline rounded-2xl flex flex-col items-center justify-center text-center gap-4 hover:border-indigo hover:shadow-card transition-all duration-300 outline-none"
          >
            <div className="w-16 h-16 rounded-2xl bg-indigo-light text-indigo flex items-center justify-center mb-2 group-hover:scale-110 transition-transform duration-300">
              <PenTool size={32} strokeWidth={1.5} />
            </div>
            <div>
              <h3 className="font-jakarta text-lg font-bold text-charcoal mb-2">
                Start from scratch
              </h3>
              <p className="font-body text-xs text-stone">
                Design your project manually using a 2D and 3D editor from a blank canvas.
              </p>
            </div>
            <div className="mt-4 px-6 py-2.5 bg-indigo text-white font-bold text-xs rounded-xl opacity-0 group-hover:opacity-100 transition-opacity">
              Open Editor
            </div>
          </button>

          {/* AI Generator */}
          <button
            onClick={handleGenerativeAI}
            className="group relative p-8 bg-white border border-hairline rounded-2xl flex flex-col items-center justify-center text-center gap-4 hover:border-teal hover:shadow-card transition-all duration-300 outline-none"
          >
            <div className="absolute top-4 right-4 px-2.5 py-1 bg-gradient-to-r from-indigo to-teal text-white text-[9px] font-bold uppercase tracking-wider rounded-lg">
              Popular
            </div>
            <div className="w-16 h-16 rounded-2xl bg-teal/10 text-teal flex items-center justify-center mb-2 group-hover:scale-110 transition-transform duration-300">
              <Sparkles size={32} strokeWidth={1.5} />
            </div>
            <div>
              <h3 className="font-jakarta text-lg font-bold text-charcoal mb-2">
                Domus AI Generator
              </h3>
              <p className="font-body text-xs text-stone">
                Specify constraints and let our spatial AI generate highly optimized layouts instantly.
              </p>
            </div>
            <div className="mt-4 px-6 py-2.5 bg-teal text-white font-bold text-xs rounded-xl opacity-0 group-hover:opacity-100 transition-opacity">
              Launch Wizard
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
