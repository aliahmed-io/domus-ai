"use client";

import React from "react";
import { PenTool, Sparkles } from "lucide-react";
import { useEditorStore } from "@/store/useEditorStore";
import { useShallow } from "zustand/react/shallow";
import { loadProject, saveProject } from "@/lib/puter";

interface OnboardingModalProps {
  projectId: string | null;
}

export default function OnboardingModal({ projectId }: OnboardingModalProps) {
  const { setWorkspace, setFloorPlan } = useEditorStore(
    useShallow((s) => ({
      setWorkspace: s.setWorkspace,
      setFloorPlan: s.setFloorPlan,
    }))
  );

  const handleStartFromScratch = async () => {
    const layout = {
      id: projectId || "manual-project",
      rooms: [],
      walls: [],
      windows: [],
      doors: [],
      dimensions: { width: 40, height: 30 },
      efficiency: 100,
      naturalLight: 100,
      generatedAt: new Date().toISOString(),
      parameters: {
        style: "open-plan" as const,
        totalArea: 1200,
        bedrooms: 0,
        bathrooms: 0,
        floors: 1,
        features: [],
      },
    };

    // Initialize an empty floor plan for manual drawing
    setFloorPlan(layout);
    setWorkspace("manual");

    if (projectId) {
      try {
        const project = await loadProject(projectId);
        if (project) {
          await saveProject({
            ...project,
            title: project.title === "Untitled Project" ? "Manual Floor Plan" : project.title,
            tags: [...project.tags.filter(t => !t.startsWith("workspace-")), "workspace-manual"],
            floorPlanData: layout,
            updatedAt: new Date().toISOString()
          });
        }
      } catch (err) {
        console.error("Failed to save scratch onboarding choice:", err);
      }
    }
  };

  const handleGenerativeAI = async () => {
    setWorkspace("generative");

    if (projectId) {
      try {
        const project = await loadProject(projectId);
        if (project) {
          await saveProject({
            ...project,
            title: project.title === "Untitled Project" ? "AI Generated Floor Plan" : project.title,
            tags: [...project.tags.filter(t => !t.startsWith("workspace-")), "workspace-generative"],
            updatedAt: new Date().toISOString()
          });
        }
      } catch (err) {
        console.error("Failed to save generative onboarding choice:", err);
      }
    }
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
