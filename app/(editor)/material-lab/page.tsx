"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Palette, Info, Loader2, CheckCircle, Sliders, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import EditorCanvas from "@/components/editor/EditorCanvas";
import { PBR_PRESETS } from "@/lib/materials/pbr-preset-catalog";
import { useEditorStore } from "@/store/useEditorStore";
import { useShallow } from "zustand/react/shallow";
import type { ApiResult, Material } from "@/types/puter";

const PRESET_SWATCHES: { name: string; color: string }[] = [
  { name: "Alabaster Drywall", color: "#e3ded7" },
  { name: "Walnut Trim", color: "#8a7e72" },
  { name: "Forest Siding", color: "#4f5d54" },
  { name: "Oak Herringbone", color: "#d9ab55" },
  { name: "Obsidian Slate", color: "#222222" },
];

export default function MaterialLabPage() {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeMaterial, setActiveMaterial] = useState<Material>(
    PBR_PRESETS["Alabaster Drywall"]!,
  );
  const [baseColor, setBaseColor] = useState("#e3ded7");
  const [roughness, setRoughness] = useState(0.9);
  const [metalness, setMetalness] = useState(0);
  const [previewShape, setPreviewShape] = useState<"sphere" | "wall" | "cube">(
    "sphere",
  );

  const {
    selectedObjectId,
    floorPlanLayout,
    setFloorPlan,
    setMaterial,
    updateWall,
    updateSceneObject,
    sceneObjects,
    setWorkspace,
  } = useEditorStore(
    useShallow((s) => ({
      selectedObjectId: s.selectedObjectId,
      floorPlanLayout: s.floorPlanLayout,
      setFloorPlan: s.setFloorPlan,
      setMaterial: s.setMaterial,
      updateWall: s.updateWall,
      updateSceneObject: s.updateSceneObject,
      sceneObjects: s.sceneObjects,
      setWorkspace: s.setWorkspace,
    })),
  );

  const handleSelectPreset = (name: string, swatchColor: string) => {
    const preset = PBR_PRESETS[name];
    if (!preset) return;
    setActiveMaterial(preset);
    setBaseColor(swatchColor);
    setRoughness(preset.roughness);
    setMetalness(preset.metalness);
    toast.success(`Loaded preset shader "${preset.name}"`);
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    toast.loading("Finding a built-in finish...", {
      id: "mat-lab",
    });

    try {
      const response = await fetch("/api/materials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const result = (await response.json()) as ApiResult<Material>;

      if (!result.ok) {
        toast.error(result.error || "Failed to generate material.", {
          id: "mat-lab",
        });
      } else {
        const mat = result.data;
        setActiveMaterial(mat);
        setRoughness(mat.roughness);
        setMetalness(mat.metalness);
        setBaseColor(mat.color || "#e3ded7");

        setPrompt("");
        toast.success(`Matched finish "${mat.name}"!`, { id: "mat-lab" });
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to connect to PBR synthesis endpoint.", {
        id: "mat-lab",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApplyToProject = () => {
    const customizedMaterial: Material = {
      ...activeMaterial,
      color: baseColor,
      roughness,
      metalness,
    };

    if (
      selectedObjectId &&
      (floorPlanLayout?.walls.some((w) => w.id === selectedObjectId) ||
        sceneObjects.some((o) => o.id === selectedObjectId))
    ) {
      setMaterial(selectedObjectId, customizedMaterial);
      const isWall = floorPlanLayout?.walls.some(
        (w) => w.id === selectedObjectId,
      );
      const isFurn = sceneObjects.some((o) => o.id === selectedObjectId);
      if (isWall) {
        updateWall(selectedObjectId, {
          materialId: customizedMaterial.id,
          color: baseColor,
        });
      } else if (isFurn) {
        updateSceneObject(selectedObjectId, {
          materialId: customizedMaterial.id,
        });
      }
      toast.success(
        `Applied "${customizedMaterial.name}" to selected element (${selectedObjectId})!`,
      );
      return;
    }

    if (floorPlanLayout && floorPlanLayout.walls.length > 0) {
      const updatedWalls = floorPlanLayout.walls.map((w) => ({
        ...w,
        materialId: customizedMaterial.id,
        color: baseColor,
      }));
      updatedWalls.forEach((w) => setMaterial(w.id, customizedMaterial));
      setFloorPlan({
        ...floorPlanLayout,
        walls: updatedWalls,
      });
      toast.success(
        `Applied "${customizedMaterial.name}" across all ${updatedWalls.length} structural walls!`,
      );
      return;
    }

    toast.info(
      "Select an element or create a floor plan first to apply this material.",
    );
  };

  return (
    <div className="tool-studio flex-1 w-full h-full flex flex-col md:flex-row overflow-hidden bg-dark-surface select-none">
      {/* Parameter inputs */}
      <aside className="w-[340px] h-full bg-white border-r border-hairline flex flex-col shrink-0 overflow-y-auto p-6 gap-6 shadow-card z-20">
        <div className="flex items-center justify-between border-b border-hairline pb-4">
          <div>
            <h2 className="font-jakarta text-heading-xs font-800 text-charcoal tracking-tight flex items-center gap-2">
              <Palette size={18} className="text-gold" />
              <span>Material Lab</span>
            </h2>
            <p className="font-body text-[11px] text-stone mt-0.5">
              Try built-in colors and surface finishes, then apply them to your
              project.
            </p>
          </div>
        </div>

        {/* Preset Library */}
        <div className="space-y-2.5">
          <label className="font-jakarta text-xs font-bold text-charcoal uppercase tracking-wider block">
            Architectural PBR Presets
          </label>
          <div className="grid grid-cols-1 gap-2">
            {PRESET_SWATCHES.map((sw) => {
              const isSelected = activeMaterial.name === sw.name;
              return (
                <button
                  key={sw.name}
                  onClick={() => handleSelectPreset(sw.name, sw.color)}
                  className={`p-2.5 rounded-xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                    isSelected
                      ? "bg-indigo-light border-indigo text-charcoal shadow-xs"
                      : "bg-alabaster border-hairline text-stone hover:bg-gray-50 hover:text-charcoal"
                  }`}
                >
                  <span
                    className="w-6 h-6 rounded-full border border-black/15 shrink-0"
                    style={{ backgroundColor: sw.color }}
                  />
                  <span className="font-jakarta text-xs font-bold truncate">
                    {sw.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Fine-Tune PBR Sliders */}
        <div className="space-y-3 border-t border-hairline pt-4">
          <label className="font-jakarta text-xs font-bold text-charcoal uppercase tracking-wider flex items-center gap-1.5">
            <Sliders size={13} className="text-indigo" />
            <span>PBR Surface Calibration</span>
          </label>

          <div>
            <div className="flex justify-between text-[10px] font-bold text-stone uppercase mb-1">
              <span>Surface Roughness</span>
              <span className="font-mono text-charcoal">
                {roughness.toFixed(2)}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.02}
              value={roughness}
              aria-label="Surface roughness"
              onChange={(e) => setRoughness(parseFloat(e.target.value))}
              className="w-full accent-indigo"
            />
          </div>

          <div>
            <div className="flex justify-between text-[10px] font-bold text-stone uppercase mb-1">
              <span>Metallic Reflectance</span>
              <span className="font-mono text-charcoal">
                {metalness.toFixed(2)}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.02}
              value={metalness}
              aria-label="Metallic reflectance"
              onChange={(e) => setMetalness(parseFloat(e.target.value))}
              className="w-full accent-indigo"
            />
          </div>
        </div>

        {/* Input prompt */}
        <div className="space-y-3 border-t border-hairline pt-4 mt-auto">
          <label className="font-jakarta text-xs font-bold text-charcoal uppercase tracking-wider block">
            Find a built-in finish
          </label>
          <textarea
            aria-label="Finish description"
            rows={3}
            placeholder="Try oak, walnut, forest green, slate, or white plaster..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-alabaster border border-hairline rounded-xl text-xs font-medium text-charcoal focus:bg-white focus:border-indigo focus:ring-2 focus:ring-indigo/20 outline-none resize-none"
          />

          <button
            onClick={handleGenerate}
            disabled={isGenerating || !prompt.trim()}
            className="w-full h-11 btn-primary bg-indigo hover:bg-indigoDark text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-button disabled:opacity-50 transition-colors cursor-pointer"
          >
            {isGenerating ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Finding finish...</span>
              </>
            ) : (
              <>

                <span>Find finish</span>
              </>
            )}
          </button>
        </div>
      </aside>

      {/* Primary Viewport */}
      <main className="flex-1 h-full relative overflow-hidden flex flex-col">
        {/* Floating toolbar */}
        <div className="absolute top-6 left-6 right-6 flex items-center justify-between pointer-events-none z-30">
          <div className="flex items-center gap-2 pointer-events-auto">
            {(["sphere", "wall", "cube"] as const).map((shape) => (
              <button
                key={shape}
                onClick={() => setPreviewShape(shape)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border transition-all cursor-pointer ${
                  previewShape === shape
                    ? "bg-indigo text-white border-indigo shadow-hero"
                    : "bg-dark-surface/90 border-hairline-dark text-on-dark-muted hover:text-white"
                }`}
              >
                {shape}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 pointer-events-auto">
            <div className="flex items-center gap-1.5 px-4 py-2 bg-dark-surface/90 border border-hairline-dark text-on-dark-muted rounded-full text-xs font-bold shadow-hero select-none">
              <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse" />
              <span>PBR Shader Preview</span>
            </div>
          </div>
        </div>

        <div className="flex-1 w-full h-full relative">
          <EditorCanvas cameraMode="perspective" showGrid={true}>
            {previewShape === "sphere" && (
              <mesh position={[0, 1.5, 0]} castShadow receiveShadow>
                <sphereGeometry args={[1.4, 64, 64]} />
                <meshStandardMaterial
                  color={baseColor}
                  roughness={roughness}
                  metalness={metalness}
                />
              </mesh>
            )}
            {previewShape === "wall" && (
              <mesh position={[0, 1.5, 0]} castShadow receiveShadow>
                <boxGeometry args={[3.6, 2.8, 0.25]} />
                <meshStandardMaterial
                  color={baseColor}
                  roughness={roughness}
                  metalness={metalness}
                />
              </mesh>
            )}
            {previewShape === "cube" && (
              <mesh
                position={[0, 1.2, 0]}
                rotation={[0, Math.PI / 4, 0]}
                castShadow
                receiveShadow
              >
                <boxGeometry args={[2.0, 2.0, 2.0]} />
                <meshStandardMaterial
                  color={baseColor}
                  roughness={roughness}
                  metalness={metalness}
                />
              </mesh>
            )}

            <mesh
              rotation={[-Math.PI / 2, 0, 0]}
              position={[0, -0.02, 0]}
              receiveShadow
            >
              <planeGeometry args={[100, 100]} />
              <meshStandardMaterial color="#1a1a2e" roughness={1.0} />
            </mesh>
          </EditorCanvas>
        </div>
      </main>

      {/* Right Sidebar statistics info */}
      <aside className="w-[300px] h-full bg-white border-l border-hairline flex flex-col shrink-0 overflow-y-auto p-6 gap-6 shadow-card z-20">
        <div>
          <h3 className="font-jakarta text-heading-xs font-800 text-charcoal tracking-tight flex items-center gap-1.5 border-b border-hairline pb-4">
            <Info size={16} className="text-gold" />
            <span>Material Outputs</span>
          </h3>
        </div>

        <div className="space-y-4">
          <h4 className="font-jakarta text-xs font-bold text-charcoal uppercase tracking-wider">
            Active Material Node
          </h4>

          <div className="space-y-3">
            <div className="p-4 bg-alabaster border border-hairline rounded-xl space-y-2 text-[10px] font-body text-charcoal">
              <div className="flex justify-between items-center border-b border-hairline/60 pb-1.5">
                <span>Shader Name</span>
                <span className="font-bold truncate max-w-[130px]">
                  {activeMaterial.name}
                </span>
              </div>
              <div className="flex justify-between items-center border-b border-hairline/60 pb-1.5">
                <span>Roughness Factor</span>
                <span className="font-mono font-bold">
                  {roughness.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center border-b border-hairline/60 pb-1.5">
                <span>Metalness Factor</span>
                <span className="font-mono font-bold">
                  {metalness.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center pt-0.5">
                <span>Channels</span>
                <span className="font-mono font-bold">
                  Color, roughness, metalness
                </span>
              </div>
            </div>

            <div className="bg-successLight border border-success/10 text-success rounded-xl p-3 flex items-center gap-2 text-[10px] font-body">
              <CheckCircle size={14} className="shrink-0" />
              <span className="font-bold uppercase tracking-wider">
                Color and surface finish preview
              </span>
            </div>
          </div>
        </div>

        <div className="border-t border-hairline pt-4 flex flex-col gap-2.5 mt-auto">
          <button
            onClick={handleApplyToProject}
            className="w-full h-11 btn-primary bg-indigo hover:bg-indigoDark text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-button transition-colors cursor-pointer"
          >
            <span>
              {selectedObjectId
                ? "Apply To Selected Element"
                : "Apply To All Project Walls"}
            </span>
          </button>

          <button
            onClick={() => {
              setWorkspace("manual");
              router.push("/floor-plan");
            }}
            className="w-full h-10 bg-white border border-hairline hover:bg-gray-50 text-charcoal text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <span>Return to CAD Studio</span>
            <ArrowRight size={13} />
          </button>
        </div>
      </aside>
    </div>
  );
}
