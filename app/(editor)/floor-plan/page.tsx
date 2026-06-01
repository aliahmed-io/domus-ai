"use client";

import React, { useEffect } from "react";
import dynamic from "next/dynamic";
import { useEditorStore } from "@/store/useEditorStore";
import { useShallow } from "zustand/react/shallow";

const ParameterPanel = dynamic(
  () => import("@/components/editor/FloorPlanEngine/ParameterPanel"),
  { ssr: false }
);

const FloorPlanCanvas = dynamic(
  () => import("@/components/editor/FloorPlanEngine/FloorPlanCanvas"),
  { ssr: false }
);

const ResultsPanel = dynamic(
  () => import("@/components/editor/FloorPlanEngine/ResultsPanel"),
  { ssr: false }
);

const MobileActionDrawer = dynamic(
  () => import("@/components/editor/MobileActionDrawer"),
  { ssr: false }
);

const CatalogPanel = dynamic(
  () => import("@/components/editor/FloorPlanEngine/CatalogPanel"),
  { ssr: false }
);

const Toolbar = dynamic(
  () => import("@/components/editor/Toolbar"),
  { ssr: false }
);

const OnboardingModal = dynamic(
  () => import("@/components/editor/OnboardingModal"),
  { ssr: false }
);

export default function FloorPlanPage() {
  const { setMode, setTool, workspace } = useEditorStore(
    useShallow((s) => ({ setMode: s.setMode, setTool: s.setTool, workspace: s.workspace }))
  );

  useEffect(() => {
    // Synchronize workspace views on tool launch
    setMode("2d");
    setTool("select");
  }, [setMode, setTool]);

  return (
    <div className="relative flex-1 w-full h-full overflow-hidden bg-darkSurface select-none">
      {/* Onboarding Modal Overlay */}
      {workspace === "onboarding" && <OnboardingModal />}

      {/* Primary CAD Visualizer Viewport - FULL BLEED */}
      <div className="absolute inset-0 z-0">
        <FloorPlanCanvas />
      </div>

      {/* Top App Bar (Manual CAD Mode) */}
      {workspace === "manual" && <Toolbar />}

      {/* Left Panel: Catalog (Manual) or Parameters (Generative) */}
      <div className="absolute left-6 top-24 bottom-6 w-80 z-20 pointer-events-none hidden lg:block">
        <div className="w-full h-full pointer-events-auto">
          {workspace === "manual" ? <CatalogPanel /> : workspace === "generative" ? <ParameterPanel /> : null}
        </div>
      </div>

      {/* Right Panel: Results & BOM */}
      <div className="absolute right-6 top-24 bottom-6 w-80 z-20 pointer-events-none hidden lg:block">
        <div className="w-full h-full pointer-events-auto">
          {(workspace === "manual" || workspace === "generative") && <ResultsPanel />}
        </div>
      </div>

      {/* Mobile Bottom Sheet Drawer (Mobile Only) */}
      <div className="block lg:hidden">
        <MobileActionDrawer />
      </div>
    </div>
  );
}
