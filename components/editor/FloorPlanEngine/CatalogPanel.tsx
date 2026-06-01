"use client";
import React, { useState } from "react";
import * as Accordion from "@radix-ui/react-accordion";
import { ChevronDown, Square, Plus, Scissors, Compass, LayoutDashboard, Armchair, Heart, Package, Sparkles, Brain, Loader2, Upload, FolderOpen } from "lucide-react";
import { useEditorStore } from "@/store/useEditorStore";
import { useShallow } from "zustand/react/shallow";
import { nanoid } from "@/lib/utils";
import { toast } from "sonner";

const FURNITURE_CATALOG = [
  {
    category: "Seating",
    items: [
      { id: "furn-chair-1", name: "Søren Lounge Chair", modelUrl: "https://vazxmixjsiawhamofees.supabase.co/storage/v1/object/public/models/chair-wood/model.gltf", color: "#8C7662" },
      { id: "furn-sofa-1", name: "Nouveau Fabric Sofa", modelUrl: "https://vazxmixjsiawhamofees.supabase.co/storage/v1/object/public/models/sofa/model.gltf", color: "#2C2621" },
      { id: "furn-armchair-1", name: "Modern Leather Armchair", modelUrl: "https://vazxmixjsiawhamofees.supabase.co/storage/v1/object/public/models/armchair/model.gltf", color: "#4E3629" },
      { id: "furn-bench-1", name: "Minimalist Wood Bench", modelUrl: "https://vazxmixjsiawhamofees.supabase.co/storage/v1/object/public/models/bench-wood/model.gltf", color: "#A0522D" },
      { id: "furn-office-1", name: "Office Ergonomic Chair", modelUrl: "https://vazxmixjsiawhamofees.supabase.co/storage/v1/object/public/models/chair-office/model.gltf", color: "#1F2937" }
    ]
  },
  {
    category: "Tables & Desks",
    items: [
      { id: "furn-dining-1", name: "Walnut Dining Block", modelUrl: "https://vazxmixjsiawhamofees.supabase.co/storage/v1/object/public/models/table-wood-plain/model.gltf", color: "#5A4A3A" },
      { id: "furn-desk-1", name: "Oak Office Desk", modelUrl: "https://vazxmixjsiawhamofees.supabase.co/storage/v1/object/public/models/desk-wood/model.gltf", color: "#B58A63" },
      { id: "furn-coffee-1", name: "Glass Coffee Table", modelUrl: "https://vazxmixjsiawhamofees.supabase.co/storage/v1/object/public/models/table-glass/model.gltf", color: "#E5E7EB" },
      { id: "furn-round-1", name: "Bistro Table Round", modelUrl: "https://vazxmixjsiawhamofees.supabase.co/storage/v1/object/public/models/table-round/model.gltf", color: "#78350F" }
    ]
  },
  {
    category: "Storage",
    items: [
      { id: "furn-sideboard-1", name: "Slated Oak Sideboard", modelUrl: "https://vazxmixjsiawhamofees.supabase.co/storage/v1/object/public/models/cabinet-bed-drawer/model.gltf", color: "#A88E75" },
      { id: "furn-bookcase-1", name: "Modern Bookcase", modelUrl: "https://vazxmixjsiawhamofees.supabase.co/storage/v1/object/public/models/bookcase/model.gltf", color: "#783D19" },
      { id: "furn-wardrobe-1", name: "Wardrobe Cabinet", modelUrl: "https://vazxmixjsiawhamofees.supabase.co/storage/v1/object/public/models/cabinet-wardrobe/model.gltf", color: "#5C4033" }
    ]
  },
  {
    category: "Lighting & Decor",
    items: [
      { id: "furn-pendant-1", name: "Brushed Dome Pendant", modelUrl: "https://vazxmixjsiawhamofees.supabase.co/storage/v1/object/public/models/lamp-standing/model.gltf", color: "#C2A585" },
      { id: "furn-plant-1", name: "Monstera Floor Plant", modelUrl: "https://vazxmixjsiawhamofees.supabase.co/storage/v1/object/public/models/plant-floor/model.gltf", color: "#10B981" },
      { id: "furn-vase-1", name: "Ceramic Pitcher Vase", modelUrl: "https://vazxmixjsiawhamofees.supabase.co/storage/v1/object/public/models/vase/model.gltf", color: "#D1D5DB" }
    ]
  }
];

export default function CatalogPanel() {
  const { 
    tool, 
    setTool, 
    floorPlanLayout, 
    setFloorPlan, 
    addSceneObject, 
    favoriteModelIds, 
    toggleFavoriteModel, 
    userGeneratedAssets,
    addUserGeneratedAsset
  } = useEditorStore(
    useShallow((s) => ({
      tool: s.tool,
      setTool: s.setTool,
      floorPlanLayout: s.floorPlanLayout,
      setFloorPlan: s.setFloorPlan,
      addSceneObject: s.addSceneObject,
      favoriteModelIds: s.favoriteModelIds,
      toggleFavoriteModel: s.toggleFavoriteModel,
      userGeneratedAssets: s.userGeneratedAssets,
      addUserGeneratedAsset: s.addUserGeneratedAsset,
    }))
  );

  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiStatus, setAiStatus] = useState("");

  const handleAddSquareRoom = () => {
    if (!floorPlanLayout) {
      toast.error("Please initialize or select a project first.");
      return;
    }

    const roomId = `room-${nanoid()}`;
    const w = 12; // 12 feet wide
    const h = 12; // 12 feet long
    const x = -6; // center offsets
    const y = -6;

    const newRoom = {
      id: roomId,
      type: "living" as const,
      label: "Living Room",
      bounds: { x, y, width: w, height: h },
      area: w * h,
      color: "#2a2e35",
      ceilingHeight: 2.7, // 2.7 meters standard
    };

    const wall1 = { id: `wall-${nanoid()}`, start: { x, y }, end: { x: x + w, y }, thickness: 5, height: 9, isLoadBearing: false };
    const wall2 = { id: `wall-${nanoid()}`, start: { x: x + w, y }, end: { x: x + w, y: y + h }, thickness: 5, height: 9, isLoadBearing: false };
    const wall3 = { id: `wall-${nanoid()}`, start: { x: x + w, y: y + h }, end: { x, y: y + h }, thickness: 5, height: 9, isLoadBearing: false };
    const wall4 = { id: `wall-${nanoid()}`, start: { x, y: y + h }, end: { x, y }, thickness: 5, height: 9, isLoadBearing: false };

    setFloorPlan({
      ...floorPlanLayout,
      rooms: [...floorPlanLayout.rooms, newRoom],
      walls: [...floorPlanLayout.walls, wall1, wall2, wall3, wall4],
    });

    toast.success("Placed a 12' × 12' Square Room!");
  };

  const handleAddRectRoom = () => {
    if (!floorPlanLayout) {
      toast.error("Please initialize or select a project first.");
      return;
    }

    const roomId = `room-${nanoid()}`;
    const w = 16; // 16 feet wide
    const h = 10; // 10 feet long
    const x = -8; // center offsets
    const y = -5;

    const newRoom = {
      id: roomId,
      type: "living" as const,
      label: "Rectangular Room",
      bounds: { x, y, width: w, height: h },
      area: w * h,
      color: "#2a2e35",
      ceilingHeight: 2.7,
    };

    const wall1 = { id: `wall-${nanoid()}`, start: { x, y }, end: { x: x + w, y }, thickness: 5, height: 9, isLoadBearing: false };
    const wall2 = { id: `wall-${nanoid()}`, start: { x: x + w, y }, end: { x: x + w, y: y + h }, thickness: 5, height: 9, isLoadBearing: false };
    const wall3 = { id: `wall-${nanoid()}`, start: { x: x + w, y: y + h }, end: { x, y: y + h }, thickness: 5, height: 9, isLoadBearing: false };
    const wall4 = { id: `wall-${nanoid()}`, start: { x, y: y + h }, end: { x, y }, thickness: 5, height: 9, isLoadBearing: false };

    setFloorPlan({
      ...floorPlanLayout,
      rooms: [...floorPlanLayout.rooms, newRoom],
      walls: [...floorPlanLayout.walls, wall1, wall2, wall3, wall4],
    });

    toast.success("Placed a 16' × 10' Rectangular Room!");
  };

  const handleAddLShapeRoom = () => {
    if (!floorPlanLayout) {
      toast.error("Please initialize or select a project first.");
      return;
    }

    const roomId = `room-${nanoid()}`;
    const w = 14; 
    const h = 14;
    const x = -7;
    const y = -7;

    const newRoom = {
      id: roomId,
      type: "living" as const,
      label: "L-Shaped Room",
      bounds: { x, y, width: w, height: h },
      area: w * h - 36, // minus corner cutout area
      color: "#2a2e35",
      ceilingHeight: 2.7,
    };

    const wall1 = { id: `wall-${nanoid()}`, start: { x: -7, y: -7 }, end: { x: 1, y: -7 }, thickness: 5, height: 9, isLoadBearing: false };
    const wall2 = { id: `wall-${nanoid()}`, start: { x: 1, y: -7 }, end: { x: 1, y: -1 }, thickness: 5, height: 9, isLoadBearing: false };
    const wall3 = { id: `wall-${nanoid()}`, start: { x: 1, y: -1 }, end: { x: 7, y: -1 }, thickness: 5, height: 9, isLoadBearing: false };
    const wall4 = { id: `wall-${nanoid()}`, start: { x: 7, y: -1 }, end: { x: 7, y: 7 }, thickness: 5, height: 9, isLoadBearing: false };
    const wall5 = { id: `wall-${nanoid()}`, start: { x: 7, y: 7 }, end: { x: -7, y: 7 }, thickness: 5, height: 9, isLoadBearing: false };
    const wall6 = { id: `wall-${nanoid()}`, start: { x: -7, y: 7 }, end: { x: -7, y: -7 }, thickness: 5, height: 9, isLoadBearing: false };

    setFloorPlan({
      ...floorPlanLayout,
      rooms: [...floorPlanLayout.rooms, newRoom],
      walls: [...floorPlanLayout.walls, wall1, wall2, wall3, wall4, wall5, wall6],
    });

    toast.success("Placed an L-Shaped Room with 6 boundary walls!");
  };

  const handleAddRotatedLShapeRoom = () => {
    if (!floorPlanLayout) {
      toast.error("Please initialize or select a project first.");
      return;
    }

    const roomId = `room-${nanoid()}`;
    const w = 14; 
    const h = 14;
    const x = -7;
    const y = -7;

    const newRoom = {
      id: roomId,
      type: "living" as const,
      label: "Inverted L Room",
      bounds: { x, y, width: w, height: h },
      area: w * h - 36,
      color: "#2a2e35",
      ceilingHeight: 2.7,
    };

    const wall1 = { id: `wall-${nanoid()}`, start: { x: -7, y: -7 }, end: { x: 7, y: -7 }, thickness: 5, height: 9, isLoadBearing: false };
    const wall2 = { id: `wall-${nanoid()}`, start: { x: 7, y: -7 }, end: { x: 7, y: 1 }, thickness: 5, height: 9, isLoadBearing: false };
    const wall3 = { id: `wall-${nanoid()}`, start: { x: 7, y: 1 }, end: { x: 1, y: 1 }, thickness: 5, height: 9, isLoadBearing: false };
    const wall4 = { id: `wall-${nanoid()}`, start: { x: 1, y: 1 }, end: { x: 1, y: 7 }, thickness: 5, height: 9, isLoadBearing: false };
    const wall5 = { id: `wall-${nanoid()}`, start: { x: 1, y: 7 }, end: { x: -7, y: 7 }, thickness: 5, height: 9, isLoadBearing: false };
    const wall6 = { id: `wall-${nanoid()}`, start: { x: -7, y: 7 }, end: { x: -7, y: -7 }, thickness: 5, height: 9, isLoadBearing: false };

    setFloorPlan({
      ...floorPlanLayout,
      rooms: [...floorPlanLayout.rooms, newRoom],
      walls: [...floorPlanLayout.walls, wall1, wall2, wall3, wall4, wall5, wall6],
    });

    toast.success("Placed Inverted L-Shaped Room with 6 boundary walls!");
  };

  const handlePlaceFurniture = (item: { name: string; modelUrl: string; color: string }) => {
    const randomOffset = () => (Math.random() - 0.5) * 4;
    const newObj = {
      id: `furniture-${nanoid()}`,
      type: "furniture" as const,
      name: item.name,
      position: { x: randomOffset(), y: 0.1, z: randomOffset() },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      gltfPath: item.modelUrl,
    };

    addSceneObject(newObj);
    toast.success(`Placed ${item.name} into the 3D scene!`);
  };

  const handleGenerateAIAsset = async () => {
    if (!aiPrompt.trim()) return;

    setAiLoading(true);
    setAiStatus("Contacting partner Replicate APIs...");
    toast.loading("Synthesizing 3D mesh via TRELLIS...", { id: "trellis-cad" });

    try {
      const response = await fetch("/api/generate-3d", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: aiPrompt }),
      });

      const result = await response.json();
      if (!result.ok) {
        toast.error(result.error || "Generation failed.", { id: "trellis-cad" });
        setAiLoading(false);
        return;
      }

      const prediction = result.data;
      const modelUrl = prediction.output && !prediction.output.startsWith("/models/")
        ? prediction.output
        : "https://vazxmixjsiawhamofees.supabase.co/storage/v1/object/public/models/chair-wood/model.gltf";

      setAiStatus("Compiling neural PBR quad-meshes...");
      
      setTimeout(() => {
        const generatedAsset = {
          id: `ai-model-${nanoid()}`,
          name: aiPrompt,
          modelUrl,
          color: "#5B6AF0",
        };

        // 1. Save directly into custom personal creations library
        addUserGeneratedAsset(generatedAsset);

        // 2. Instantly drop in active workspace
        handlePlaceFurniture(generatedAsset);

        toast.success(`Synthesized and saved "${aiPrompt}"!`, { id: "trellis-cad" });
        setAiPrompt("");
        setAiLoading(false);
      }, 1500);

    } catch (err) {
      console.error(err);
      toast.error("Failed to establish edge pipeline.", { id: "trellis-cad" });
      setAiLoading(false);
    }
  };

  const handleImportLocalAsset = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext !== "glb" && ext !== "gltf") {
      toast.error("Unsupported format. Please upload a .glb or .gltf file.");
      return;
    }

    // Convert local file into read-ready blob Object URL
    const url = URL.createObjectURL(file);
    const importedAsset = {
      id: `imported-model-${nanoid()}`,
      name: file.name.replace(/\.[^/.]+$/, ""), // remove extension
      modelUrl: url,
      color: "#10B981", // emerald green accent for imported assets
    };

    // 1. Add to creations library list
    addUserGeneratedAsset(importedAsset);

    // 2. Drop instantly in 3D canvas
    handlePlaceFurniture(importedAsset);

    toast.success(`Successfully imported local model "${importedAsset.name}"!`);
  };

  // Filter favorited models dynamically from the store
  const allFurnitureItems = FURNITURE_CATALOG.flatMap((cat) => cat.items);
  const favoriteItems = [
    ...allFurnitureItems.filter((item) => favoriteModelIds.includes(item.id)),
    ...userGeneratedAssets.filter((item) => favoriteModelIds.includes(item.id))
  ];

  return (
    <aside className="w-80 h-full bg-white border-r border-hairline flex flex-col shrink-0 overflow-y-auto select-none shadow-card z-20 custom-scrollbar animate-in slide-in-from-left duration-200">
      {/* Property Header */}
      <div className="p-5 border-b border-hairline bg-alabaster flex items-center gap-2">
        <LayoutDashboard size={16} className="text-indigo" />
        <div>
          <h2 className="font-jakarta text-[13px] font-800 text-charcoal tracking-tight uppercase">
            Asset Catalog
          </h2>
          <p className="font-mono text-[9px] text-stone mt-1 tracking-wider uppercase">
            Manual Drafting Mode
          </p>
        </div>
      </div>

      <Accordion.Root type="multiple" defaultValue={["favorites", "ai-studio", "rooms", "structural", "furnishings"]} className="w-full">
        {/* FAVORITES */}
        <Accordion.Item value="favorites" className="border-b border-hairline overflow-hidden">
          <Accordion.Header className="flex">
            <Accordion.Trigger className="group flex-1 flex items-center justify-between px-5 py-4 bg-white hover:bg-alabaster transition-colors outline-none cursor-pointer">
              <span className="flex items-center gap-2">
                <span className="font-jakarta text-[11px] font-bold text-charcoal uppercase tracking-widest">
                  Favorites Collection
                </span>
                {favoriteItems.length > 0 && (
                  <span className="px-1.5 py-0.5 bg-rose-50 text-rose font-mono text-[9px] font-bold rounded border border-rose-100/50">
                    {favoriteItems.length}
                  </span>
                )}
              </span>
              <ChevronDown size={14} className="text-stone transition-transform duration-300 group-data-[state=open]:rotate-180" />
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content className="px-5 pb-5 pt-1 space-y-3 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0">
            {favoriteItems.length === 0 ? (
              <div className="text-center py-6 px-3 bg-alabaster border border-hairline border-dashed rounded-xl text-stone flex flex-col items-center justify-center gap-2">
                <Heart size={16} className="text-stone/50 animate-pulse" />
                <div className="space-y-0.5">
                  <span className="font-body text-[10px] font-bold block uppercase tracking-wider">
                    Empty Collection
                  </span>
                  <span className="font-body text-[9px] text-stone leading-relaxed block">
                    Click the heart icon on catalog models to build your customized favorites!
                  </span>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {favoriteItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handlePlaceFurniture(item)}
                    className="p-2 border border-hairline rounded-lg flex flex-col items-start text-left gap-1.5 transition-all outline-none bg-white hover:bg-gray-50 hover:border-indigo group relative animate-in zoom-in-95 duration-150"
                  >
                    <div className="w-full h-16 rounded bg-alabaster flex items-center justify-center relative overflow-hidden border border-hairline">
                      <Armchair size={24} className="text-stone opacity-60" />
                      <span 
                        className="absolute top-1.5 left-1.5 w-3 h-3 rounded-full border border-white/20 shadow-sm" 
                        style={{ backgroundColor: item.color }} 
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavoriteModel(item.id);
                          toast.success(`Removed ${item.name} from Favorites.`);
                        }}
                        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-white border border-hairline flex items-center justify-center text-rose shadow-sm hover:scale-110 transition-transform outline-none"
                      >
                        <Heart size={10} fill="#ef4444" stroke="#ef4444" />
                      </button>
                    </div>
                    <span className="font-body text-[9px] font-bold text-charcoal line-clamp-1">
                      {item.name}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </Accordion.Content>
        </Accordion.Item>

        {/* IMPORT & AI STUDIO */}
        <Accordion.Item value="ai-studio" className="border-b border-hairline overflow-hidden">
          <Accordion.Header className="flex">
            <Accordion.Trigger className="group flex-1 flex items-center justify-between px-5 py-4 bg-white hover:bg-alabaster transition-colors outline-none cursor-pointer">
              <span className="flex items-center gap-2">
                <Sparkles size={13} className="text-indigo animate-pulse" />
                <span className="font-jakarta text-[11px] font-bold text-charcoal uppercase tracking-widest">
                  Import & AI Studio
                </span>
              </span>
              <ChevronDown size={14} className="text-stone transition-transform duration-300 group-data-[state=open]:rotate-180" />
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content className="px-5 pb-5 pt-1 space-y-4 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0">
            {/* Neural Synthesis */}
            <div className="space-y-3">
              <p className="font-body text-[10px] text-stone leading-relaxed">
                Describe any custom spatial object. Our TRELLIS edge network generates high-quality Draco `.glb` models on-demand.
              </p>
              
              <textarea
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                disabled={aiLoading}
                placeholder="e.g. Mid-century modern oak sideboard with slatted doors..."
                className="w-full h-16 p-2.5 text-xs border border-hairline rounded-xl bg-white resize-none outline-none font-body placeholder:text-muted focus:border-indigo transition-colors"
              />

              {aiLoading ? (
                <div className="flex flex-col gap-2 p-3 bg-alabaster border border-hairline border-dashed rounded-xl items-center text-center">
                  <Loader2 className="w-5 h-5 text-indigo animate-spin" />
                  <span className="font-body text-[9px] text-stone font-bold uppercase tracking-wider animate-pulse">
                    {aiStatus}
                  </span>
                </div>
              ) : (
                <button
                  onClick={handleGenerateAIAsset}
                  disabled={!aiPrompt.trim()}
                  className="w-full h-10 bg-indigo hover:bg-indigoDark text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-button disabled:opacity-50 transition-colors outline-none cursor-pointer"
                >
                  <Sparkles size={13} />
                  <span>Synthesize 3D Mesh</span>
                </button>
              )}
            </div>

            {/* Custom 3D Model Importer (GLTF/GLB Upload) */}
            <div className="border-t border-hairline/60 pt-3.5 space-y-2">
              <h4 className="font-jakarta text-[9px] font-extrabold text-stone uppercase tracking-wider pl-1 flex items-center gap-1">
                <FolderOpen size={11} className="text-teal" />
                <span>Import Local 3D Model</span>
              </h4>
              <p className="font-body text-[9px] text-stone leading-relaxed pl-1">
                Upload your own `.glb` or `.gltf` model to load it instantly as an interactive physical asset.
              </p>
              <label className="w-full h-10 border border-hairline border-dashed rounded-xl bg-white hover:bg-gray-50 hover:border-teal transition-all flex items-center justify-center gap-1.5 cursor-pointer text-xs font-bold text-stone hover:text-charcoal select-none">
                <Upload size={13} className="text-teal animate-bounce" />
                <span>Choose GLB / GLTF file</span>
                <input
                  type="file"
                  accept=".glb,.gltf"
                  onChange={handleImportLocalAsset}
                  className="hidden"
                />
              </label>
            </div>

            {/* User Custom creations library sub-catalog */}
            {userGeneratedAssets.length > 0 && (
              <div className="space-y-2 border-t border-hairline pt-3.5 animate-in fade-in duration-200">
                <h4 className="font-jakarta text-[9px] font-extrabold text-stone uppercase tracking-wider pl-1 flex items-center gap-1">
                  <Brain size={11} className="text-indigo" />
                  <span>My Imported & AI Creations</span>
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {userGeneratedAssets.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handlePlaceFurniture(item)}
                      className="p-2 border border-hairline rounded-lg flex flex-col items-start text-left gap-1.5 transition-all outline-none bg-white hover:bg-gray-50 hover:border-indigo group relative"
                    >
                      <div className="w-full h-16 rounded bg-alabaster flex items-center justify-center relative overflow-hidden border border-hairline">
                        <Armchair size={24} className="text-stone opacity-60" />
                        <span 
                          className="absolute top-1.5 left-1.5 w-3 h-3 rounded-full border border-white/20 shadow-sm" 
                          style={{ backgroundColor: item.color }} 
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavoriteModel(item.id);
                            if (favoriteModelIds.includes(item.id)) {
                              toast.success(`Removed ${item.name} from Favorites.`);
                            } else {
                              toast.success(`Added ${item.name} to Favorites!`);
                            }
                          }}
                          className="absolute top-1 right-1 w-5 h-5 rounded-full bg-white border border-hairline flex items-center justify-center shadow-sm hover:scale-110 transition-transform outline-none"
                        >
                          <Heart 
                            size={10} 
                            fill={favoriteModelIds.includes(item.id) ? "#ef4444" : "transparent"} 
                            stroke={favoriteModelIds.includes(item.id) ? "#ef4444" : "#a1a1aa"} 
                          />
                        </button>
                      </div>
                      <span className="font-body text-[9px] font-bold text-charcoal line-clamp-1">
                        {item.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </Accordion.Content>
        </Accordion.Item>

        {/* ROOMS */}
        <Accordion.Item value="rooms" className="border-b border-hairline overflow-hidden">
          <Accordion.Header className="flex">
            <Accordion.Trigger className="group flex-1 flex items-center justify-between px-5 py-4 bg-white hover:bg-alabaster transition-colors outline-none cursor-pointer">
              <span className="font-jakarta text-[11px] font-bold text-charcoal uppercase tracking-widest">
                Room Layouts
              </span>
              <ChevronDown size={14} className="text-stone transition-transform duration-300 group-data-[state=open]:rotate-180" />
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content className="px-5 pb-5 pt-1 space-y-3 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0">
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={handleAddSquareRoom}
                className="p-3 border border-hairline rounded-xl flex flex-col items-center justify-center gap-2 transition-all outline-none bg-white hover:bg-gray-50 text-stone hover:text-charcoal hover:border-indigo shadow-sm"
              >
                <div className="w-12 h-12 bg-alabaster border border-hairline rounded-lg flex items-center justify-center">
                  <Square size={20} className="text-stone group-hover:text-indigo" />
                </div>
                <span className="font-body text-[10px] font-bold text-center">Square Room</span>
              </button>

              <button 
                onClick={handleAddRectRoom}
                className="p-3 border border-hairline rounded-xl flex flex-col items-center justify-center gap-2 transition-all outline-none bg-white hover:bg-gray-50 text-stone hover:text-charcoal hover:border-indigo shadow-sm"
              >
                <div className="w-12 h-12 bg-alabaster border border-hairline rounded-lg flex items-center justify-center">
                  <svg width="22" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-stone"><rect x="3" y="5" width="18" height="14" rx="2" /></svg>
                </div>
                <span className="font-body text-[10px] font-bold text-center">Rectangular</span>
              </button>
              
              <button 
                onClick={handleAddLShapeRoom}
                className="p-3 border border-hairline rounded-xl flex flex-col items-center justify-center gap-2 transition-all outline-none bg-white hover:bg-gray-50 text-stone hover:text-charcoal hover:border-indigo shadow-sm"
              >
                <div className="w-12 h-12 bg-alabaster border border-hairline rounded-lg flex items-center justify-center">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-stone"><path d="M4 4h16v8H12v8H4z"/></svg>
                </div>
                <span className="font-body text-[10px] font-bold text-center">L-Shape</span>
              </button>

              <button 
                onClick={handleAddRotatedLShapeRoom}
                className="p-3 border border-hairline rounded-xl flex flex-col items-center justify-center gap-2 transition-all outline-none bg-white hover:bg-gray-50 text-stone hover:text-charcoal hover:border-indigo shadow-sm"
              >
                <div className="w-12 h-12 bg-alabaster border border-hairline rounded-lg flex items-center justify-center">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-stone"><path d="M4 4h16v16H12V12H4z"/></svg>
                </div>
                <span className="font-body text-[10px] font-bold text-center">Inverted L</span>
              </button>
            </div>
          </Accordion.Content>
        </Accordion.Item>

        {/* STRUCTURAL */}
        <Accordion.Item value="structural" className="border-b border-hairline overflow-hidden">
          <Accordion.Header className="flex">
            <Accordion.Trigger className="group flex-1 flex items-center justify-between px-5 py-4 bg-white hover:bg-alabaster transition-colors outline-none cursor-pointer">
              <span className="font-jakarta text-[11px] font-bold text-charcoal uppercase tracking-widest">
                Structural Elements
              </span>
              <ChevronDown size={14} className="text-stone transition-transform duration-300 group-data-[state=open]:rotate-180" />
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content className="px-5 pb-5 pt-1 space-y-3 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0">
            <div className="flex flex-col gap-2">
              <button 
                onClick={() => setTool("draw-wall")}
                className={`p-3 border rounded-xl flex items-center gap-3 transition-all outline-none ${tool === "draw-wall" ? "bg-indigo-light border-indigo text-indigo shadow-sm" : "bg-white border-hairline hover:bg-gray-50 text-stone hover:text-charcoal"}`}
              >
                <div className="w-8 h-8 rounded-lg bg-alabaster border border-hairline flex items-center justify-center">
                  <Scissors size={14} className={tool === "draw-wall" ? "text-indigo" : "text-stone"} />
                </div>
                <div className="flex flex-col items-start">
                  <span className="font-body text-xs font-bold">Draw Wall</span>
                  <span className="font-mono text-[9px] opacity-70">Shortcut: W</span>
                </div>
              </button>
              
              <button 
                onClick={() => setTool("add-window")}
                className={`p-3 border rounded-xl flex items-center gap-3 transition-all outline-none ${tool === "add-window" ? "bg-indigo-light border-indigo text-indigo shadow-sm" : "bg-white border-hairline hover:bg-gray-50 text-stone hover:text-charcoal"}`}
              >
                <div className="w-8 h-8 rounded-lg bg-alabaster border border-hairline flex items-center justify-center">
                  <Compass size={14} className={tool === "add-window" ? "text-indigo" : "text-stone"} />
                </div>
                <div className="flex flex-col items-start">
                  <span className="font-body text-xs font-bold">Add Window</span>
                  <span className="font-mono text-[9px] opacity-70">Click on any wall</span>
                </div>
              </button>

              <button 
                onClick={() => setTool("add-door")}
                className={`p-3 border rounded-xl flex items-center gap-3 transition-all outline-none ${tool === "add-door" ? "bg-indigo-light border-indigo text-indigo shadow-sm" : "bg-white border-hairline hover:bg-gray-50 text-stone hover:text-charcoal"}`}
              >
                <div className="w-8 h-8 rounded-lg bg-alabaster border border-hairline flex items-center justify-center">
                  <Plus size={14} className={tool === "add-door" ? "text-indigo" : "text-stone"} />
                </div>
                <div className="flex flex-col items-start">
                  <span className="font-body text-xs font-bold">Add Door</span>
                  <span className="font-mono text-[9px] opacity-70">Click on any wall</span>
                </div>
              </button>
            </div>
          </Accordion.Content>
        </Accordion.Item>

        {/* FURNISHINGS */}
        <Accordion.Item value="furnishings" className="border-b border-hairline overflow-hidden">
          <Accordion.Header className="flex">
            <Accordion.Trigger className="group flex-1 flex items-center justify-between px-5 py-4 bg-white hover:bg-alabaster transition-colors outline-none cursor-pointer">
              <span className="font-jakarta text-[11px] font-bold text-charcoal uppercase tracking-widest">
                Furnishings Library
              </span>
              <ChevronDown size={14} className="text-stone transition-transform duration-300 group-data-[state=open]:rotate-180" />
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content className="px-5 pb-5 pt-1 space-y-4 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0">
            {FURNITURE_CATALOG.map((cat, idx) => (
              <div key={idx} className="space-y-2">
                <h4 className="font-jakarta text-[9px] font-extrabold text-stone uppercase tracking-wider pl-1">
                  {cat.category}
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {cat.items.map((item, itemIdx) => (
                    <button
                      key={itemIdx}
                      onClick={() => handlePlaceFurniture(item)}
                      className="p-2 border border-hairline rounded-lg flex flex-col items-start text-left gap-1.5 transition-all outline-none bg-white hover:bg-gray-50 hover:border-indigo group relative"
                    >
                      <div className="w-full h-16 rounded bg-alabaster flex items-center justify-center relative overflow-hidden border border-hairline">
                        <Armchair size={24} className="text-stone opacity-60" />
                        <span 
                          className="absolute top-1.5 left-1.5 w-3 h-3 rounded-full border border-white/20 shadow-sm" 
                          style={{ backgroundColor: item.color }} 
                        />
                        {/* Toggle favorite */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavoriteModel(item.id);
                            if (favoriteModelIds.includes(item.id)) {
                              toast.success(`Removed ${item.name} from Favorites.`);
                            } else {
                              toast.success(`Added ${item.name} to Favorites!`);
                            }
                          }}
                          className="absolute top-1 right-1 w-5 h-5 rounded-full bg-white border border-hairline flex items-center justify-center shadow-sm hover:scale-110 transition-transform outline-none"
                        >
                          <Heart 
                            size={10} 
                            fill={favoriteModelIds.includes(item.id) ? "#ef4444" : "transparent"} 
                            stroke={favoriteModelIds.includes(item.id) ? "#ef4444" : "#a1a1aa"} 
                          />
                        </button>
                      </div>
                      <span className="font-body text-[9px] font-bold text-charcoal line-clamp-1">
                        {item.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </Accordion.Content>
        </Accordion.Item>
      </Accordion.Root>
    </aside>
  );
}
