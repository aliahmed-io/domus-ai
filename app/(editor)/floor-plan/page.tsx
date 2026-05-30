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

export default function FloorPlanPage() {
  const { setMode, setTool } = useEditorStore(useShallow((s) => ({ setMode: s.setMode, setTool: s.setTool })));

  useEffect(() => {
    // Synchronize workspace views on tool launch
    setMode("2d");
    setTool("select");
  }, [setMode, setTool]);

  return (
    <div className="flex-1 w-full h-full flex flex-col md:flex-row overflow-hidden bg-darkSurface select-none">
      {/* Parameters Controls */}
      <ParameterPanel />

      {/* Primary CAD Visualizer Viewport */}
      <div className="flex-1 h-full relative overflow-hidden flex flex-col">
        <FloorPlanCanvas />
      </div>

      {/* Generative Scores & Export panel */}
      <ResultsPanel />
    </div>
  );
}
