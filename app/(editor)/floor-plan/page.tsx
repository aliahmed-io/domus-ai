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

export default function FloorPlanPage() {
  const { setMode, setTool } = useEditorStore(useShallow((s) => ({ setMode: s.setMode, setTool: s.setTool })));

  useEffect(() => {
    // Synchronize workspace views on tool launch
    setMode("2d");
    setTool("select");
  }, [setMode, setTool]);

  return (
    <div className="relative flex-1 w-full h-full overflow-hidden bg-darkSurface select-none">
      {/* Primary CAD Visualizer Viewport - FULL BLEED */}
      <div className="absolute inset-0 z-0">
        <FloorPlanCanvas />
      </div>

      {/* Floating Parameters Controls (Desktop Only) */}
      <div className="absolute left-6 top-24 bottom-6 w-80 z-20 pointer-events-none hidden lg:block">
        <div className="w-full h-full pointer-events-auto">
          <ParameterPanel />
        </div>
      </div>

      {/* Floating Generative Scores & Export panel (Desktop Only) */}
      <div className="absolute right-6 top-24 bottom-6 w-80 z-20 pointer-events-none hidden lg:block">
        <div className="w-full h-full pointer-events-auto">
          <ResultsPanel />
        </div>
      </div>

      {/* Mobile Bottom Sheet Drawer (Mobile Only) */}
      <div className="block lg:hidden">
        <MobileActionDrawer />
      </div>
    </div>
  );
}
