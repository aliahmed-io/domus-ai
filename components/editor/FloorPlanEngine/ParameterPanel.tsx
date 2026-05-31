"use client";

import React, { useState } from "react";
import * as Slider from "@radix-ui/react-slider";
import * as Switch from "@radix-ui/react-switch";
import { Sparkles, Brain, Minus, Plus, Loader2, Cuboid, Scan, UploadCloud } from "lucide-react";
import { toast } from "sonner";
import { useQueryState, parseAsInteger, parseAsStringEnum } from "nuqs";
import { useEditorStore } from "@/store/useEditorStore";
import { useShallow } from "zustand/react/shallow";
import { formatArea } from "@/lib/utils";
import type { FloorPlanLayout, ApiResult } from "@/types/puter";

export default function ParameterPanel() {
  const { setFloorPlan, setGenerating, isGenerating, setBomReport, setViolations, addSceneObject } = useEditorStore(
    useShallow((s) => ({
      setFloorPlan: s.setFloorPlan,
      setGenerating: s.setGenerating,
      isGenerating: s.isGenerating,
      setBomReport: s.setBomReport,
      setViolations: s.setViolations,
      addSceneObject: s.addSceneObject,
    }))
  );

  // Parameter states in URL via nuqs
  const [beds, setBeds] = useQueryState("beds", parseAsInteger.withDefault(3));
  const [baths, setBaths] = useQueryState("baths", parseAsInteger.withDefault(2));
  const [area, setArea] = useQueryState("area", parseAsInteger.withDefault(1200));
  const [style, setStyle] = useQueryState(
    "style",
    parseAsStringEnum<"open-plan" | "traditional" | "l-shape" | "studio">([
      "open-plan",
      "traditional",
      "l-shape",
      "studio",
    ]).withDefault("open-plan")
  );
  const [naturalLight, setNaturalLight] = useState(true);
  const [accessibility, setAccessibility] = useState(false);
  const [specialRooms, setSpecialRooms] = useState<string[]>(["Home Office"]);
  const [modelPrompt, setModelPrompt] = useState("");
  const [isGeneratingModel, setIsGeneratingModel] = useState(false);

  const specialOptions = [
    "Home Office",
    "Walk-in Wardrobe",
    "Mudroom",
    "Pantry",
    "Gym",
    "Garage",
    "Terrace",
    "Library",
  ];

  const handleToggleSpecial = (room: string) => {
    if (specialRooms.includes(room)) {
      setSpecialRooms(specialRooms.filter((r) => r !== room));
    } else {
      setSpecialRooms([...specialRooms, room]);
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    toast.loading("Generating layout...", { id: "gen" });
    try {
      const response = await fetch("/api/floor-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ beds, baths, area, style }),
      });
      const result = (await response.json()) as ApiResult<FloorPlanLayout[]>;
      if (result.ok && result.data[0]) {
        toast.success("Floor plan ready — layout generated", { id: "gen" });
        // Set first layout variant as active
        const activeLayout = result.data[0];
        setFloorPlan(activeLayout);

        // Populate Mock BOM materials calculated from walls
        const wallQuantity = activeLayout.walls.length * 10; // linear feet approximation
        const doorQuantity = activeLayout.doors.length;
        const windowQuantity = activeLayout.windows.length;

        setBomReport({
          items: [
            { category: "Structure", name: "Timber Wall Framing", quantity: wallQuantity, unit: "LFT" },
            { category: "Openings", name: "Standard Hinge Doors", quantity: doorQuantity, unit: "PCS" },
            { category: "Openings", name: "Low-E Double Pane Windows", quantity: windowQuantity, unit: "PCS" },
            { category: "Finishes", name: "Gypsum Drywall Board", quantity: wallQuantity * 2, unit: "SFT" },
          ],
          currency: "USD",
          generatedAt: new Date().toISOString(),
        });

        // Set Code compliance validation checks
        const mockViolations = [];
        if (area / (beds + baths) < 300) {
          mockViolations.push({
            code: "IRC-R304",
            severity: "warning" as const,
            message: "Averaging less than 300 sq ft per habitable room limits space circulation.",
            recommendation: "Increase total footprint target to 1500 sq ft or decrease bedrooms.",
          });
        }
        if (accessibility && doorQuantity > 0) {
          mockViolations.push({
            code: "ADA-404",
            severity: "info" as const,
            message: "ADA clearance requires all interior doorway swings to exceed 32 inches clear.",
            recommendation: "Ensure sliding pocket doors are fitted in bathrooms.",
          });
        }

        setViolations(mockViolations);
      } else {
        toast.error("Generation failed. Please retry.", { id: "gen" });
      }
    } catch (err) {
      console.error(err);
      toast.error("Error contacting the generative spatial edge service.", { id: "gen" });
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerate3DModel = async () => {
    if (!modelPrompt.trim()) return;
    setIsGeneratingModel(true);
    toast.loading("Synthesizing 3D model...", { id: "gen3d" });
    try {
      const response = await fetch("/api/generate-3d", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: modelPrompt }),
      });
      const result = await response.json();
      if (result.ok && result.data.output) {
        toast.success(result.data.message || "3D model synthesized!", { id: "gen3d" });
        // Add to scene objects
        addSceneObject({
          id: `gen-mesh-${Date.now()}`,
          type: "furniture",
          name: modelPrompt,
          position: { x: 0, y: 3, z: 0 }, // Drop from sky
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 1, y: 1, z: 1 },
          gltfPath: result.data.output,
        });
        setModelPrompt("");
      } else {
        toast.error(result.error || "Generation failed.", { id: "gen3d" });
      }
    } catch (err) {
      toast.error("Error communicating with AI cluster.", { id: "gen3d" });
    } finally {
      setIsGeneratingModel(false);
    }
  };

  return (
    <aside className="w-full h-full bg-white/80 backdrop-blur-2xl border border-white/40 rounded-3xl flex flex-col shrink-0 overflow-y-auto select-none p-6 gap-6 shadow-[0_8px_32px_rgba(0,0,0,0.08)] z-20">
      {/* Header title */}
      <div className="flex items-center justify-between border-b border-hairline pb-4">
        <div>
          <h2 className="font-jakarta text-heading-xs font-800 text-charcoal tracking-tight flex items-center gap-2">
            <Brain size={18} className="text-indigo" />
            <span>AI Layout Engine</span>
          </h2>
          <p className="font-body text-[11px] text-stone mt-0.5">
            Configure generative spatial floor parameters.
          </p>
        </div>
        <span className="px-2.5 py-0.5 bg-indigo-light text-indigo text-[10px] font-bold uppercase rounded-full border border-indigo/15">
          v1.0 GNN
        </span>
      </div>

      {/* Steppers count */}
      <div className="space-y-4">
        <h4 className="font-jakarta text-xs font-bold text-charcoal uppercase tracking-wider">
          Room Configurations
        </h4>

        {/* Bedrooms count */}
        <div className="flex items-center justify-between bg-alabaster border border-hairline p-3 rounded-xl">
          <div className="flex flex-col gap-0.5">
            <span className="font-jakarta text-xs font-bold text-charcoal">Bedrooms</span>
            <span className="font-body text-[10px] text-stone">Sleep constraints</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setBeds(Math.max(1, beds - 1))}
              className="w-8 h-8 rounded-lg bg-white border border-hairline flex items-center justify-center text-stone hover:text-charcoal hover:bg-gray-50 outline-none"
            >
              <Minus size={14} />
            </button>
            <span className="font-mono text-base font-bold text-charcoal w-6 text-center">
              {beds}
            </span>
            <button
              onClick={() => setBeds(Math.min(6, beds + 1))}
              className="w-8 h-8 rounded-lg bg-white border border-hairline flex items-center justify-center text-stone hover:text-charcoal hover:bg-gray-50 outline-none"
            >
              <Plus size={14} />
            </button>
          </div>
        </div>

        {/* Bathrooms count */}
        <div className="flex items-center justify-between bg-alabaster border border-hairline p-3 rounded-xl">
          <div className="flex flex-col gap-0.5">
            <span className="font-jakarta text-xs font-bold text-charcoal">Bathrooms</span>
            <span className="font-body text-[10px] text-stone">Hygiene spaces</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setBaths(Math.max(1, baths - 1))}
              className="w-8 h-8 rounded-lg bg-white border border-hairline flex items-center justify-center text-stone hover:text-charcoal hover:bg-gray-50 outline-none"
            >
              <Minus size={14} />
            </button>
            <span className="font-mono text-base font-bold text-charcoal w-6 text-center">
              {baths}
            </span>
            <button
              onClick={() => setBaths(Math.min(4, baths + 1))}
              className="w-8 h-8 rounded-lg bg-white border border-hairline flex items-center justify-center text-stone hover:text-charcoal hover:bg-gray-50 outline-none"
            >
              <Plus size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Target footprint slider */}
      <div className="space-y-3">
        <div className="flex justify-between items-center flex-wrap gap-2">
          <span className="font-jakarta text-xs font-bold text-charcoal uppercase tracking-wider">
            Total Target Area
          </span>
          <span className="font-body text-xs font-bold text-indigo">
            {area} sq ft
          </span>
        </div>
        <Slider.Root
          min={400}
          max={4000}
          step={50}
          value={[area]}
          onValueChange={(val) => val[0] && setArea(val[0])}
          className="relative flex items-center select-none touch-none w-full h-5"
        >
          <Slider.Track className="bg-indigo-light relative grow h-1.5 rounded-full">
            <Slider.Range className="absolute bg-indigo h-full rounded-full" />
          </Slider.Track>
          <Slider.Thumb className="block w-5 h-5 bg-white border-2 border-indigo rounded-full shadow-sm cursor-pointer outline-none" />
        </Slider.Root>
        <span className="font-body text-[10px] text-stone leading-relaxed block">
          Footprint: {formatArea(area)}
        </span>
      </div>

      {/* Style selections */}
      <div className="space-y-3">
        <span className="font-jakarta text-xs font-bold text-charcoal uppercase tracking-wider block">
          Layout Topology Style
        </span>
        <div className="grid grid-cols-2 gap-2">
          {[
            { id: "open-plan", label: "Open Plan" },
            { id: "traditional", label: "Traditional" },
            { id: "l-shape", label: "L-Shape" },
            { id: "studio", label: "Studio Loft" },
          ].map((styleOpt) => (
            <button
              key={styleOpt.id}
              onClick={() => setStyle(styleOpt.id as "open-plan" | "traditional" | "l-shape" | "studio")}
              className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all duration-200 outline-none ${
                style === styleOpt.id
                  ? "bg-indigo-light border-indigo text-charcoal shadow-sm"
                  : "bg-white border-hairline text-stone hover:bg-gray-50 hover:text-charcoal"
              }`}
            >
              <span className="font-jakarta text-xs font-bold">{styleOpt.label}</span>
              <span className="font-body text-[9px] opacity-75">Layout default</span>
            </button>
          ))}
        </div>
      </div>

      {/* Natural light & accessibility switch */}
      <div className="space-y-4 pt-2 border-t border-hairline">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-0.5">
            <span className="font-jakarta text-xs font-bold text-charcoal">Natural Light</span>
            <span className="font-body text-[10px] text-stone">Optimize window positions</span>
          </div>
          <Switch.Root
            checked={naturalLight}
            onCheckedChange={setNaturalLight}
            className="w-10 h-6 bg-gray-200 rounded-full relative p-0.5 data-[state=checked]:bg-indigo transition-colors outline-none cursor-pointer"
          >
            <Switch.Thumb className="block w-5 h-5 bg-white rounded-full transition-transform duration-200 translate-x-0 data-[state=checked]:translate-x-4 shadow-sm" />
          </Switch.Root>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-0.5">
            <span className="font-jakarta text-xs font-bold text-charcoal">ADA Compliance</span>
            <span className="font-body text-[10px] text-stone">Ensure handicap pathways</span>
          </div>
          <Switch.Root
            checked={accessibility}
            onCheckedChange={setAccessibility}
            className="w-10 h-6 bg-gray-200 rounded-full relative p-0.5 data-[state=checked]:bg-indigo transition-colors outline-none cursor-pointer"
          >
            <Switch.Thumb className="block w-5 h-5 bg-white rounded-full transition-transform duration-200 translate-x-0 data-[state=checked]:translate-x-4 shadow-sm" />
          </Switch.Root>
        </div>
      </div>

      {/* Special room multichip selection */}
      <div className="space-y-3 pt-2 border-t border-hairline flex-1">
        <span className="font-jakarta text-xs font-bold text-charcoal uppercase tracking-wider block">
          Additional Rooms
        </span>
        <div className="flex flex-wrap gap-1.5">
          {specialOptions.map((opt) => {
            const isSelected = specialRooms.includes(opt);
            return (
              <button
                key={opt}
                onClick={() => handleToggleSpecial(opt)}
                className={`px-3 py-1.5 rounded-lg border text-[10px] font-bold uppercase tracking-wider transition-all outline-none ${
                  isSelected
                    ? "bg-indigo text-white border-indigo shadow-sm"
                    : "bg-white text-stone border-hairline hover:bg-gray-50"
                }`}
              >
                {opt}
              </button>
            );
          })}
        </div>
      </div>

      {/* Text-to-3D Generative Prompt */}
      <div className="space-y-3 pt-2 border-t border-hairline flex-1">
        <span className="font-jakarta text-xs font-bold text-charcoal uppercase tracking-wider block flex items-center gap-2">
          <Cuboid size={12} className="text-indigo" />
          Generative 3D Asset
        </span>
        <div className="flex flex-col gap-2">
          <input
            type="text"
            value={modelPrompt}
            onChange={(e) => setModelPrompt(e.target.value)}
            placeholder="e.g. Leather lounge chair"
            className="w-full bg-white border border-hairline rounded-xl px-3 py-2 text-xs font-body text-charcoal outline-none focus:border-indigo"
            onKeyDown={(e) => {
              if (e.key === "Enter") handleGenerate3DModel();
            }}
          />
          <button
            onClick={handleGenerate3DModel}
            disabled={isGeneratingModel || !modelPrompt.trim()}
            className="w-full h-9 bg-charcoal text-white hover:bg-black text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          >
            {isGeneratingModel ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Cuboid size={14} />
            )}
            <span>Synthesize 3D Model</span>
          </button>
        </div>
      </div>

      {/* Upload Blueprint BIM Analysis */}
      <div className="space-y-3 pt-2 border-t border-hairline flex-1">
        <span className="font-jakarta text-xs font-bold text-charcoal uppercase tracking-wider block flex items-center gap-2">
          <Scan size={12} className="text-indigo" />
          Vision Blueprint Parsing
        </span>
        <div className="flex flex-col gap-2">
          <label className="w-full h-9 bg-white border border-hairline hover:border-indigo text-charcoal text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer">
            {isGenerating ? <Loader2 size={14} className="animate-spin" /> : <UploadCloud size={14} />}
            <span>Upload Blueprint Image</span>
            <input 
              type="file" 
              className="hidden" 
              accept="image/png, image/jpeg"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                try {
                  setGenerating(true);
                  toast.loading("Analyzing blueprint with GPT-4o Vision...", { id: "bim" });
                  const formData = new FormData();
                  formData.append("file", file);
                  const res = await fetch("/api/bim-analysis", { method: "POST", body: formData });
                  const data = await res.json();
                  if (data.ok) {
                    toast.success("Blueprint parsed successfully!", { id: "bim" });
                    setFloorPlan(data.data);
                  } else {
                    toast.error(data.error || "Parsing failed.", { id: "bim" });
                  }
                } catch (err) {
                  toast.error("Vision API Error.", { id: "bim" });
                } finally {
                  setGenerating(false);
                }
              }}
            />
          </label>
        </div>
      </div>

      {/* Generate button */}
      <button
        onClick={handleGenerate}
        disabled={isGenerating}
        className="w-full h-13 btn-primary bg-indigo hover:bg-indigoDark text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 shadow-button transition-colors disabled:opacity-50 mt-auto"
      >
        {isGenerating ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            <span>Calculating Topology...</span>
          </>
        ) : (
          <>
            <Sparkles size={16} />
            <span>Generate Layouts</span>
          </>
        )}
      </button>
    </aside>
  );
}
