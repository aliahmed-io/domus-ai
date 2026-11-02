"use client";

import React from "react";
import Link from "next/link";
import PlanIllustration from "@/components/studio/PlanIllustration";
import { PenTool, ArrowUpRight } from "lucide-react";
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
    })),
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
            title:
              project.title === "Untitled Project"
                ? "Manual Floor Plan"
                : project.title,
            tags: [
              ...project.tags.filter((t) => !t.startsWith("workspace-")),
              "workspace-manual",
            ],
            floorPlanData: layout,
            updatedAt: new Date().toISOString(),
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
            title:
              project.title === "Untitled Project"
                ? "Generated floor plan"
                : project.title,
            tags: [
              ...project.tags.filter((t) => !t.startsWith("workspace-")),
              "workspace-generative",
            ],
            updatedAt: new Date().toISOString(),
          });
        }
      } catch (err) {
        console.error("Failed to save generative onboarding choice:", err);
      }
    }
  };

  return (
    <div className="plan-entry studio-landing">
      <header>
        <Link href="/editor">Back to workshop</Link>
        <span>Make yourself at home.</span>
      </header>
      <div className="plan-entry-content">
        <div>
          <span className="studio-kicker">A fresh start</span>
          <h1>
            Every space starts
            <br />
            with an idea.
          </h1>
          <p>How would you like to begin?</p>
          <div className="plan-entry-choices">
            <button type="button" onClick={handleStartFromScratch}>
              <PenTool size={24} />
              <span>
                <strong>Start from scratch</strong>
                <small>A blank canvas, ready for your first wall.</small>
              </span>
              <ArrowUpRight size={20} />
            </button>
            <button type="button" onClick={handleGenerativeAI}>

              <span>
                <strong>Help me with a layout</strong>
                <small>
                  Set your room requirements and explore a starting plan.
                </small>
              </span>
              <ArrowUpRight size={20} />
            </button>
          </div>
          <small className="plan-entry-note">
            Saved in this browser as you work. No account needed.
          </small>
        </div>
        <div className="plan-entry-drawing">
          <PlanIllustration />
          <span>A few lines. A whole new possibility.</span>
        </div>
      </div>
    </div>
  );
}
