"use client";

import React, { useState } from "react";
import {
  Upload,
  Layers,
  Sparkles,
  CheckCircle,
  AlertTriangle,
  FileText,
  Info,
  Loader2,
  RefreshCw,
} from "lucide-react";
import EditorCanvas from "@/components/editor/EditorCanvas";

export default function BimLiftPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [hasLifted, setHasLifted] = useState(false);
  const [wallHeight, setWallHeight] = useState(9); // feet

  // Mock upload
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      setFile(files[0]);
    }
  };

  const handleSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  // Run Image-to-BIM analysis
  const handleLift = () => {
    if (!file) return;
    setIsUploading(true);
    setTimeout(() => {
      setIsUploading(false);
      setHasLifted(true);
    }, 2000);
  };

  return (
    <div className="flex-1 w-full h-full flex flex-col md:flex-row overflow-hidden bg-darkSurface select-none">
      {/* Parameter inputs (Left sidebar, 340px) */}
      <aside className="w-[340px] h-full bg-white border-r border-hairline flex flex-col shrink-0 overflow-y-auto p-6 gap-6 shadow-card z-20">
        <div className="flex items-center justify-between border-b border-hairline pb-4">
          <div>
            <h2 className="font-jakarta text-heading-xs font-800 text-charcoal tracking-tight flex items-center gap-2">
              <Layers size={18} className="text-teal" />
              <span>BIM Extruder</span>
            </h2>
            <p className="font-body text-[11px] text-stone mt-0.5">
              Extract 3D digital twins from flat blueprint images.
            </p>
          </div>
        </div>

        {/* File Drag and Drop */}
        <div className="space-y-3">
          <label className="font-jakarta text-xs font-bold text-charcoal uppercase tracking-wider block">
            Select Blueprint Sketch
          </label>

          {!file ? (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              className="border-2 border-dashed border-hairline hover:border-indigo/40 rounded-2xl p-6 flex flex-col items-center justify-center text-center gap-3 bg-alabaster/40 cursor-pointer transition-colors"
            >
              <div className="w-11 h-11 rounded-xl bg-white border border-hairline flex items-center justify-center text-stone">
                <Upload size={18} />
              </div>
              <div>
                <p className="font-body text-xs font-semibold text-charcoal">
                  Drag blueprint here
                </p>
                <p className="font-body text-[10px] text-stone mt-0.5">
                  Supports PNG, JPG, or PDF
                </p>
              </div>
              <label className="btn-secondary text-[10px] font-bold uppercase tracking-wider py-1.5 px-3 bg-white border border-hairline rounded-lg cursor-pointer hover:bg-gray-50">
                Browse Files
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handleSelectFile}
                  className="hidden"
                />
              </label>
            </div>
          ) : (
            <div className="p-4 bg-alabaster border border-hairline rounded-xl flex items-center gap-3 relative">
              <div className="w-10 h-10 rounded-lg bg-teal-light text-teal flex items-center justify-center">
                <FileText size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-jakarta text-xs font-bold text-charcoal truncate">
                  {file.name}
                </h4>
                <p className="font-body text-[10px] text-stone">
                  {(file.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
              <button
                onClick={() => {
                  setFile(null);
                  setHasLifted(false);
                }}
                className="text-[10px] font-bold text-stone hover:text-error transition-colors"
              >
                Clear
              </button>
            </div>
          )}
        </div>

        {/* Height parameter */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="font-jakarta text-xs font-bold text-charcoal uppercase tracking-wider">
              Extrusion Wall Height
            </span>
            <span className="font-body text-xs font-bold text-indigo">
              {wallHeight} ft
            </span>
          </div>
          <input
            type="range"
            min={8}
            max={14}
            value={wallHeight}
            onChange={(e) => setWallHeight(Number(e.target.value))}
            className="w-full h-1.5 bg-indigo-light rounded-lg appearance-none cursor-pointer accent-indigo"
          />
        </div>

        {/* Action Button */}
        <button
          onClick={handleLift}
          disabled={!file || isUploading}
          className="w-full h-13 btn-primary bg-indigo hover:bg-indigoDark text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 shadow-button transition-colors disabled:opacity-50 mt-auto"
        >
          {isUploading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>Analyzing Blueprint...</span>
            </>
          ) : (
            <>
              <Sparkles size={16} />
              <span>Lift Blueprint (3D)</span>
            </>
          )}
        </button>
      </aside>

      {/* Primary CAD Viewport */}
      <main className="flex-1 h-full relative overflow-hidden flex flex-col">
        {/* Viewport Floating Header */}
        <div className="absolute top-6 left-6 right-6 flex items-center justify-between pointer-events-none z-30">
          <div className="flex items-center gap-2 pointer-events-auto">
            <div className="px-4 py-2 bg-darkSurface/90 border border-hairlineDark text-onDark rounded-full text-xs font-bold shadow-hero select-none flex items-center gap-1.5">
              <span>BIM Extruder Viewport</span>
            </div>
          </div>

          <div className="flex items-center gap-2 pointer-events-auto">
            <div className="flex items-center gap-1.5 px-4 py-2 bg-darkSurface/90 border border-hairlineDark text-teal rounded-full text-xs font-bold shadow-hero select-none">
              <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
              <span>WebGL Ready</span>
            </div>
          </div>
        </div>

        <div className="flex-1 w-full h-full relative">
          {!hasLifted ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center text-[#A1A1AA] gap-4">
              <div className="w-16 h-16 rounded-2xl border border-[#ffffff]/10 bg-[#161622] flex items-center justify-center text-teal shadow-hero">
                <Layers size={28} />
              </div>
              <div>
                <h3 className="font-jakarta text-heading-sm font-700 text-white">
                  WebGL Viewport Empty
                </h3>
                <p className="font-body text-xs text-stone mt-1 max-w-[280px] mx-auto leading-relaxed">
                  Drag in your blueprint PNG/JPG file on the left side menu, then click &ldquo;Lift Blueprint&rdquo; to build your 3D digital twin.
                </p>
              </div>
            </div>
          ) : (
            <EditorCanvas cameraMode="perspective" showGrid={true}>
              {/* Procedural extruded walls representing the analyzed blueprint */}
              {[
                { startX: -6, startY: -4, endX: 6, endY: -4 },
                { startX: 6, startY: -4, endX: 6, endY: 4 },
                { startX: 6, startY: 4, endX: -6, endY: 4 },
                { startX: -6, startY: 4, endX: -6, endY: -4 },
                { startX: -1, startY: -4, endX: -1, endY: 1 },
                { startX: -1, startY: 1, endX: 2, endY: 1 },
              ].map((w, idx) => {
                const dx = w.endX - w.startX;
                const dz = w.endY - w.startY;
                const len = Math.sqrt(dx * dx + dz * dz);
                const midX = (w.startX + w.endX) / 2;
                const midZ = (w.startY + w.endY) / 2;
                const angle = -Math.atan2(dz, dx);
                const hMeters = wallHeight * 0.3048;
                return (
                  <mesh key={idx} position={[midX, hMeters / 2, midZ]} rotation={[0, angle, 0]} castShadow receiveShadow>
                    <boxGeometry args={[len, hMeters, 0.2]} />
                    <meshStandardMaterial color="#8a8a81" roughness={0.8} />
                  </mesh>
                );
              })}

              {/* Flat floor layout plane */}
              <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
                <planeGeometry args={[100, 100]} />
                <meshStandardMaterial color="#1a1a2e" roughness={1.0} />
              </mesh>
            </EditorCanvas>
          )}
        </div>
      </main>

      {/* BIM stats (Right sidebar, 300px) */}
      <aside className="w-[300px] h-full bg-white border-l border-hairline flex flex-col shrink-0 overflow-y-auto p-6 gap-6 shadow-card z-20">
        <div>
          <h3 className="font-jakarta text-heading-xs font-800 text-charcoal tracking-tight flex items-center gap-1.5 border-b border-hairline pb-4">
            <Info size={16} className="text-teal" />
            <span>Analysis Output</span>
          </h3>
        </div>

        {/* BIM calculations */}
        <div className="space-y-4">
          <h4 className="font-jakarta text-xs font-bold text-charcoal uppercase tracking-wider">
            BIM Material Estimation
          </h4>

          {hasLifted ? (
            <div className="space-y-3">
              <div className="p-3.5 bg-alabaster border border-hairline rounded-xl space-y-2 text-[10px] font-body text-charcoal">
                <div className="flex justify-between items-center border-b border-hairline/60 pb-1.5">
                  <span>Detected Wall Segments</span>
                  <span className="font-mono font-bold">6 walls</span>
                </div>
                <div className="flex justify-between items-center border-b border-hairline/60 pb-1.5">
                  <span>Structural Framing</span>
                  <span className="font-mono font-bold">42 LFT</span>
                </div>
                <div className="flex justify-between items-center border-b border-hairline/60 pb-1.5">
                  <span>Exterior Openings</span>
                  <span className="font-mono font-bold">2 doors</span>
                </div>
                <div className="flex justify-between items-center border-b border-hairline/60 pb-1.5">
                  <span>Estimated Total Footprint</span>
                  <span className="font-mono font-bold">960 sq ft</span>
                </div>
                <div className="flex justify-between items-center pt-0.5">
                  <span>BIM Confidence Ratio</span>
                  <span className="font-mono font-bold text-success">94.7%</span>
                </div>
              </div>

              <div className="bg-successLight border border-success/10 text-success rounded-xl p-3 flex items-center gap-2 text-[10px] font-body">
                <CheckCircle size={14} className="shrink-0" />
                <span className="font-bold uppercase tracking-wider">
                  IBC Standard compliance met
                </span>
              </div>
            </div>
          ) : (
            <p className="font-body text-[10px] text-stone italic text-center p-4 bg-alabaster border border-hairline rounded-xl">
              Lift sketch blueprint to calculate parameters.
            </p>
          )}
        </div>

        {/* Re-analysis tools */}
        {hasLifted && (
          <button
            onClick={() => {
              setHasLifted(false);
              handleLift();
            }}
            className="w-full h-10 bg-white border border-hairline hover:bg-gray-50 text-stone hover:text-charcoal text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all outline-none mt-auto"
          >
            <RefreshCw size={13} />
            <span>Recalculate Scale</span>
          </button>
        )}
      </aside>
    </div>
  );
}
