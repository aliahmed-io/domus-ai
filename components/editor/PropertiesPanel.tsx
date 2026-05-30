"use client";

import React, { useState } from "react";
import {
  Info,
  Layers,
  Sparkles,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  AlertTriangle,
  Move,
  Package,
} from "lucide-react";
import { useEditorStore } from "@/store/useEditorStore";
import { useShallow } from "zustand/react/shallow";

const SWATCHES = [
  { color: "#e3ded7", name: "Alabaster Drywall" },
  { color: "#8a7e72", name: "Walnut Trim" },
  { color: "#4f5d54", name: "Forest Siding" },
  { color: "#d9ab55", name: "Oak Herringbone" },
  { color: "#222222", name: "Obsidian Slate" },
];

export default function PropertiesPanel() {
  const { selectedObjectId, sceneObjects, updateSceneObject, bomReport, violations } = useEditorStore(
    useShallow((s) => ({
      selectedObjectId: s.selectedObjectId,
      sceneObjects: s.sceneObjects,
      updateSceneObject: s.updateSceneObject,
      bomReport: s.bomReport,
      violations: s.violations,
    }))
  );
  const [prompt, setPrompt] = useState("");
  const [isGeneratingMat, setIsGeneratingMat] = useState(false);
  const [activeMaterial, setActiveMaterial] = useState("Alabaster Drywall");

  // Collapsible panel sections
  const [showTransform, setShowTransform] = useState(true);
  const [showMaterial, setShowMaterial] = useState(true);
  const [showBOM, setShowBOM] = useState(true);
  const [showCompliance, setShowCompliance] = useState(true);

  // Find currently selected object
  const selectedObj = sceneObjects.find((o) => o.id === selectedObjectId);

  // Mock material generation
  const handleGenerateMaterial = () => {
    if (!prompt.trim()) return;
    setIsGeneratingMat(true);
    setTimeout(() => {
      setIsGeneratingMat(false);
      setActiveMaterial(prompt);
      setPrompt("");
      alert(`Generative PBR material "${prompt}" mapped successfully via TRELLIS API proxy.`);
    }, 1500);
  };

  return (
    <aside className="w-80 h-full bg-white border-l border-hairline flex flex-col shrink-0 overflow-y-auto select-none shadow-card z-20">
      {/* Property Header */}
      <div className="p-5 border-b border-hairline flex items-center justify-between">
        <h2 className="font-jakarta text-heading-xs font-700 text-charcoal flex items-center gap-2">
          <Info size={16} className="text-indigo" />
          <span>Properties</span>
        </h2>
        {selectedObj && (
          <span className="px-2 py-0.5 bg-indigo-light text-indigo text-[10px] font-bold uppercase rounded-lg border border-indigo/10">
            {selectedObj.type}
          </span>
        )}
      </div>

      {/* Main panel body */}
      {!selectedObj ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-stone">
          <Layers size={28} className="text-muted animate-pulse mb-3" />
          <h4 className="font-jakarta text-xs font-bold text-charcoal">No element selected</h4>
          <p className="font-body text-[11px] text-stone mt-1 max-w-[200px] leading-relaxed">
            Click on a structural wall, furniture, or floor mesh inside the WebGL canvas to edit attributes.
          </p>
        </div>
      ) : (
        <div className="flex flex-col">
          {/* ── 1. TRANSFORM ──────────────────────────────────────────────── */}
          <div className="border-b border-hairline">
            <button
              onClick={() => setShowTransform(!showTransform)}
              className="w-full flex items-center justify-between p-4 text-xs font-bold text-charcoal uppercase tracking-wider hover:bg-gray-50 transition-colors outline-none"
            >
              <span className="flex items-center gap-2">
                <Move size={14} className="text-stone" />
                <span>Local Transform</span>
              </span>
              {showTransform ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {showTransform && (
              <div className="px-5 pb-5 space-y-4">
                {/* Position */}
                <div>
                  <label className="font-body text-[10px] font-bold text-stone uppercase tracking-wider block mb-1.5">
                    Position (x, y, z)
                  </label>
                  <div className="grid grid-cols-3 gap-2 font-mono text-xs">
                    {["x", "y", "z"].map((axis) => (
                      <div key={axis} className="relative">
                        <span className="absolute left-2.5 top-2 text-[10px] font-bold text-stone capitalize">
                          {axis}
                        </span>
                        <input
                          type="number"
                          step={0.1}
                          value={selectedObj.position[axis as "x" | "y" | "z"]}
                          onChange={(e) =>
                            updateSceneObject(selectedObj.id, {
                              position: {
                                ...selectedObj.position,
                                [axis]: Number(e.target.value),
                              },
                            })
                          }
                          className="pl-6 pr-2 py-1.5 w-full bg-alabaster border border-hairline rounded-lg text-charcoal outline-none focus:bg-white focus:border-indigo"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Rotation */}
                <div>
                  <label className="font-body text-[10px] font-bold text-stone uppercase tracking-wider block mb-1.5">
                    Rotation (x, y, z)
                  </label>
                  <div className="grid grid-cols-3 gap-2 font-mono text-xs">
                    {["x", "y", "z"].map((axis) => (
                      <div key={axis} className="relative">
                        <span className="absolute left-2.5 top-2 text-[10px] font-bold text-stone capitalize">
                          {axis}
                        </span>
                        <input
                          type="number"
                          step={5}
                          value={selectedObj.rotation[axis as "x" | "y" | "z"]}
                          onChange={(e) =>
                            updateSceneObject(selectedObj.id, {
                              rotation: {
                                ...selectedObj.rotation,
                                [axis]: Number(e.target.value),
                              },
                            })
                          }
                          className="pl-6 pr-2 py-1.5 w-full bg-alabaster border border-hairline rounded-lg text-charcoal outline-none focus:bg-white focus:border-indigo"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── 2. MATERIAL LAB ────────────────────────────────────────────── */}
          <div className="border-b border-hairline">
            <button
              onClick={() => setShowMaterial(!showMaterial)}
              className="w-full flex items-center justify-between p-4 text-xs font-bold text-charcoal uppercase tracking-wider hover:bg-gray-50 transition-colors outline-none"
            >
              <span className="flex items-center gap-2">
                <Sparkles size={14} className="text-stone" />
                <span>Material Reskin</span>
              </span>
              {showMaterial ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {showMaterial && (
              <div className="px-5 pb-5 flex flex-col gap-4">
                {/* Active Swatches */}
                <div>
                  <label className="font-body text-[10px] font-bold text-stone uppercase tracking-wider block mb-2">
                    Preset PBR Shaders
                  </label>
                  <div className="flex items-center gap-2.5">
                    {SWATCHES.map((sw) => (
                      <button
                        key={sw.name}
                        onClick={() => {
                          setActiveMaterial(sw.name);
                          updateSceneObject(selectedObj.id, { name: `${selectedObj.name} (${sw.name})` });
                        }}
                        className={`w-7 h-7 rounded-full border shadow-sm transition-all outline-none ${
                          activeMaterial === sw.name ? "ring-2 ring-indigo ring-offset-2 scale-110" : "border-hairline"
                        }`}
                        style={{ backgroundColor: sw.color }}
                        title={sw.name}
                      />
                    ))}
                  </div>
                  <span className="text-[10px] font-medium text-stone block mt-2.5">
                    Active Layer: <strong className="text-charcoal">{activeMaterial}</strong>
                  </span>
                </div>

                {/* Generative Text prompt */}
                <div className="flex flex-col gap-2">
                  <label className="font-body text-[10px] font-bold text-stone uppercase tracking-wider block">
                    TRELLIS AI Texture Generator
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. brushed brass tile, low roughness..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="px-3 py-2 bg-alabaster border border-hairline rounded-lg text-xs font-medium text-charcoal focus:bg-white focus:border-indigo focus:ring-2 focus:ring-indigo/20 outline-none resize-none"
                  />
                  <button
                    onClick={handleGenerateMaterial}
                    disabled={isGeneratingMat || !prompt.trim()}
                    className="w-full h-9 btn-primary bg-indigo hover:bg-indigoDark text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 shadow-sm transition-colors disabled:opacity-50"
                  >
                    {isGeneratingMat ? (
                      <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    ) : (
                      <>
                        <Sparkles size={12} />
                        <span>Reskin Mesh</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ── 3. BILL OF MATERIALS (BOM) ─────────────────────────────────── */}
          <div className="border-b border-hairline">
            <button
              onClick={() => setShowBOM(!showBOM)}
              className="w-full flex items-center justify-between p-4 text-xs font-bold text-charcoal uppercase tracking-wider hover:bg-gray-50 transition-colors outline-none"
            >
              <span className="flex items-center gap-2">
                <Package size={14} className="text-stone" />
                <span>Materials Bill (BOM)</span>
              </span>
              {showBOM ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {showBOM && (
              <div className="px-5 pb-5">
                {bomReport && bomReport.items.length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto border border-hairline rounded-xl p-2.5 bg-alabaster">
                    {bomReport.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center text-[10px] font-body text-charcoal border-b border-hairline/40 pb-1.5 last:border-0 last:pb-0">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-bold">{item.name}</span>
                          <span className="text-stone">{item.category}</span>
                        </div>
                        <span className="font-mono font-bold text-stone">
                          {item.quantity} {item.unit}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-alabaster rounded-xl p-4 border border-hairline text-center text-stone">
                    <p className="font-body text-[10px] leading-relaxed">
                      No global materials recorded. Run a floor plan or BIM analyzer to build bills.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── 4. CODE COMPLIANCE ─────────────────────────────────────────── */}
          <div>
            <button
              onClick={() => setShowCompliance(!showCompliance)}
              className="w-full flex items-center justify-between p-4 text-xs font-bold text-charcoal uppercase tracking-wider hover:bg-gray-50 transition-colors outline-none"
            >
              <span className="flex items-center gap-2">
                <CheckCircle size={14} className="text-stone" />
                <span>IBC Code Check</span>
              </span>
              {showCompliance ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {showCompliance && (
              <div className="px-5 pb-5">
                {violations && violations.length > 0 ? (
                  <div className="space-y-2">
                    {violations.map((v, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-errorLight border border-error/10 text-error rounded-xl flex items-start gap-2 text-[10px] leading-relaxed font-body"
                      >
                        <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                        <div>
                          <strong className="font-bold block uppercase tracking-wider text-[9px] mb-0.5">
                            {v.code} ({v.severity})
                          </strong>
                          <p className="font-medium">{v.message}</p>
                          <p className="text-stone font-bold mt-1 text-[9px]">
                            FIX: {v.recommendation}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-successLight border border-success/10 text-success rounded-xl p-3.5 flex items-center gap-2.5">
                    <CheckCircle size={16} className="shrink-0" />
                    <span className="font-body text-[10px] font-bold uppercase tracking-wider">
                      IBC Compliance: ALL CLEAR
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </aside>
  );
}
