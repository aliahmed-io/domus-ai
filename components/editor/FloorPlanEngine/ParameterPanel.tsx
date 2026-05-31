"use client";

import React, { useState } from "react";
import * as Slider from "@radix-ui/react-slider";
import * as Switch from "@radix-ui/react-switch";
import * as Accordion from "@radix-ui/react-accordion";
import { Sparkles, Brain, Minus, Plus, Loader2, Cuboid, Scan, UploadCloud, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { useQueryState, parseAsInteger, parseAsStringEnum } from "nuqs";
import { useEditorStore } from "@/store/useEditorStore";
import { useShallow } from "zustand/react/shallow";
import { formatArea } from "@/lib/utils";
import { furnishRooms } from "@/lib/geometry-solver";
import { StandardCatalog } from "@/lib/standard-catalog";
import type { FloorPlanLayout, ApiResult, SceneObject } from "@/types/puter";
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
  const [autoFurnish, setAutoFurnish] = useState(false);

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

        // Auto-furnish
        if (autoFurnish) {
          const furnishings = furnishRooms(activeLayout.rooms);
          furnishings.forEach(f => addSceneObject(f));
        }

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
    <aside className="w-full h-full bg-white border border-hairline rounded-none flex flex-col shrink-0 select-none shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-20">
      {/* Header title */}
      <div className="flex items-center justify-between border-b border-hairline p-5 bg-alabaster">
        <div>
          <h2 className="font-jakarta text-[13px] font-800 text-charcoal tracking-tight flex items-center gap-2 uppercase">
            <Brain size={14} className="text-indigo" />
            <span>AI Layout Engine</span>
          </h2>
          <p className="font-mono text-[9px] text-stone mt-1 tracking-wider">
            PARAMETERS // V1.0.GNN
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <Accordion.Root type="single" collapsible defaultValue="structure" className="w-full">
          
          {/* ACCORDION 1: STRUCTURE */}
          <Accordion.Item value="structure" className="border-b border-hairline overflow-hidden">
            <Accordion.Header className="flex">
              <Accordion.Trigger className="group flex-1 flex items-center justify-between px-5 py-4 bg-white hover:bg-alabaster transition-colors outline-none cursor-pointer">
                <span className="font-jakarta text-[11px] font-bold text-charcoal uppercase tracking-widest">
                  1. Structure & Topology
                </span>
                <ChevronDown size={14} className="text-stone transition-transform duration-300 group-data-[state=open]:rotate-180" />
              </Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Content className="px-5 pb-5 pt-1 space-y-6 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0">
              
              {/* Steppers */}
              <div className="space-y-3">

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
      </div>        {/* Natural light & accessibility switch */}
        <div className="space-y-3 border-t border-hairline pt-5">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-0.5">
              <span className="font-jakarta text-[11px] font-bold text-charcoal tracking-wider uppercase">Natural Light Opt</span>
            </div>
            <Switch.Root
              checked={naturalLight}
              onCheckedChange={setNaturalLight}
              className="w-10 h-5 bg-gray-200 rounded-none relative p-0.5 data-[state=checked]:bg-charcoal transition-colors outline-none cursor-pointer"
            >
              <Switch.Thumb className="block w-4 h-4 bg-white rounded-none transition-transform duration-200 translate-x-0 data-[state=checked]:translate-x-5 shadow-sm" />
            </Switch.Root>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-0.5">
              <span className="font-jakarta text-[11px] font-bold text-charcoal tracking-wider uppercase">ADA Compliant</span>
            </div>
            <Switch.Root
              checked={accessibility}
              onCheckedChange={setAccessibility}
              className="w-10 h-5 bg-gray-200 rounded-none relative p-0.5 data-[state=checked]:bg-charcoal transition-colors outline-none cursor-pointer"
            >
              <Switch.Thumb className="block w-4 h-4 bg-white rounded-none transition-transform duration-200 translate-x-0 data-[state=checked]:translate-x-5 shadow-sm" />
            </Switch.Root>
          </div>
        </div>
            </Accordion.Content>
          </Accordion.Item>

          {/* ACCORDION 2: FURNISHINGS */}
          <Accordion.Item value="furnishings" className="border-b border-hairline overflow-hidden">
            <Accordion.Header className="flex">
              <Accordion.Trigger className="group flex-1 flex items-center justify-between px-5 py-4 bg-white hover:bg-alabaster transition-colors outline-none cursor-pointer">
                <span className="font-jakarta text-[11px] font-bold text-charcoal uppercase tracking-widest">
                  2. Interior & Furnishing
                </span>
                <ChevronDown size={14} className="text-stone transition-transform duration-300 group-data-[state=open]:rotate-180" />
              </Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Content className="px-5 pb-5 pt-1 space-y-6 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0">
              
              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-0.5">
                  <span className="font-jakarta text-[11px] font-bold text-charcoal uppercase tracking-wider">Auto-Furnish Rooms</span>
                  <span className="font-mono text-[9px] text-stone">Standard Asset Snap</span>
                </div>
                <Switch.Root
                  checked={autoFurnish}
                  onCheckedChange={setAutoFurnish}
                  className="w-10 h-5 bg-gray-200 rounded-none relative p-0.5 data-[state=checked]:bg-indigo transition-colors outline-none cursor-pointer"
                >
                  <Switch.Thumb className="block w-4 h-4 bg-white rounded-none transition-transform duration-200 translate-x-0 data-[state=checked]:translate-x-5 shadow-sm" />
                </Switch.Root>
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

      {/* Standard Furniture Catalog */}
      <div className="space-y-3 pt-2 border-t border-hairline flex-1">
        <span className="font-jakarta text-xs font-bold text-charcoal uppercase tracking-wider block">
          Standard Catalog
        </span>
        <div className="flex flex-wrap gap-1.5">
          {Object.values(StandardCatalog).map((item) => (
            <button
              key={item.id}
              onClick={() => {
                const f: SceneObject = {
                  id: `furnish-${item.id}-${Date.now()}`,
                  type: "furniture",
                  name: item.name,
                  position: { x: 0, y: 0.5, z: 0 },
                  rotation: { x: 0, y: 0, z: 0 },
                  scale: { x: 1, y: 1, z: 1 },
                  materialId: `color-${item.color}`
                };
                addSceneObject(f);
                toast.success(`Dropped ${item.name} into scene`);
              }}
              className="px-3 py-1.5 rounded-lg border text-[10px] font-bold tracking-wider transition-all outline-none bg-white text-stone border-hairline hover:bg-gray-50"
            >
              {item.name}
            </button>
          ))}
        </div>
      </div>      <div className="space-y-3 pt-5 border-t border-hairline">
        <span className="font-jakarta text-[11px] font-bold text-charcoal uppercase tracking-widest block flex items-center gap-2">
          <Cuboid size={12} className="text-charcoal" />
          Generative 3D Asset
        </span>
        <div className="flex flex-col gap-2">
          <input
            type="text"
            value={modelPrompt}
            onChange={(e) => setModelPrompt(e.target.value)}
            placeholder="e.g. Leather lounge chair"
            className="w-full h-10 px-3 bg-white border border-hairline outline-none focus:border-charcoal transition-colors font-body text-xs rounded-none placeholder:text-gray-300"
          />
          <button
            disabled={!modelPrompt.trim() || isGeneratingModel}
            onClick={handleGenerate3DModel}
            className="w-full h-10 bg-charcoal hover:bg-black text-white rounded-none font-jakarta text-[10px] font-bold uppercase tracking-wider transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isGeneratingModel ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
            Synthesize Model
          </button>
        </div>
      </div>

            </Accordion.Content>
          </Accordion.Item>

          {/* ACCORDION 3: BIM VISION */}
          <Accordion.Item value="bim" className="border-b border-hairline overflow-hidden">
            <Accordion.Header className="flex">
              <Accordion.Trigger className="group flex-1 flex items-center justify-between px-5 py-4 bg-white hover:bg-alabaster transition-colors outline-none cursor-pointer">
                <span className="font-jakarta text-[11px] font-bold text-charcoal uppercase tracking-widest">
                  3. BIM Vision
                </span>
                <ChevronDown size={14} className="text-stone transition-transform duration-300 group-data-[state=open]:rotate-180" />
              </Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Content className="px-5 pb-5 pt-1 space-y-4 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0">
            <label className="w-full h-10 bg-white border border-hairline hover:border-charcoal text-charcoal text-[10px] font-bold rounded-none flex items-center justify-center gap-2 transition-colors cursor-pointer uppercase tracking-widest">
            {isGenerating ? <Loader2 size={14} className="animate-spin" /> : <UploadCloud size={14} />}
            <span>{isGenerating ? "Analyzing..." : "Upload Blueprint"}</span>
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
                    if (autoFurnish) {
                      const furnishings = furnishRooms(data.data.rooms);
                      furnishings.forEach(f => addSceneObject(f));
                    }
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
            </Accordion.Content>
          </Accordion.Item>
        </Accordion.Root>
      </div>

      {/* Main Generate Action */}
      <div className="p-5 border-t border-hairline bg-alabaster">
        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="w-full h-12 bg-charcoal text-white hover:bg-black rounded-none font-jakarta text-[11px] font-bold uppercase tracking-widest transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
        >
          {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Brain size={16} />}
          {isGenerating ? "Synthesizing Layout..." : "Generate Spatial Layout"}
        </button>
      </div>
    </aside>
  );
}
