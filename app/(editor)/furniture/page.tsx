"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Package, Plus, Info, CheckCircle, Armchair, Move, Trash2, Loader2, Upload, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import EditorCanvas from "@/components/editor/EditorCanvas";
import TrellisGenerator from "@/components/editor/FurnitureSwap/TrellisGenerator";
import PhysicsFurniture from "@/components/editor/PhysicsFurniture";
import PhysicsBoundary from "@/components/editor/PhysicsBoundary";
import { useIsClient } from "@/lib/useIsClient";
import { useEditorStore } from "@/store/useEditorStore";
import { useShallow } from "zustand/react/shallow";
import type { SceneObject } from "@/types/puter";

interface FurnitureCatalogItem {
  id: string;
  name: string;
  category: string;
  modelUrl: string;
  color: string;
  attachmentType?: "floor" | "ceiling" | "surface" | "wall";
}

const ASSET_CATALOG: FurnitureCatalogItem[] = [
  {
    id: "furn-chair-1",
    name: "Søren Lounge Chair",
    category: "Seating",
    modelUrl: "/models/kenney_furniture-kit/models/loungeChair.glb",
    color: "#8C7662",
    attachmentType: "floor",
  },
  {
    id: "furn-sofa-1",
    name: "Nouveau Fabric Sofa",
    category: "Seating",
    modelUrl: "/models/kenney_furniture-kit/models/loungeSofa.glb",
    color: "#2C2621",
    attachmentType: "floor",
  },
  {
    id: "furn-table-1",
    name: "Walnut Dining Block",
    category: "Tables",
    modelUrl: "/models/kenney_furniture-kit/models/table.glb",
    color: "#5A4A3A",
    attachmentType: "floor",
  },
  {
    id: "furn-light-1",
    name: "Brushed Dome Floor Lamp",
    category: "Lighting",
    modelUrl: "/models/kenney_furniture-kit/models/lampRoundFloor.glb",
    color: "#C2A585",
    attachmentType: "floor",
  },
  {
    id: "furn-cab-1",
    name: "Slated Oak Sideboard",
    category: "Storage",
    modelUrl: "/models/kenney_furniture-kit/models/cabinetBedDrawer.glb",
    color: "#A88E75",
    attachmentType: "floor",
  },
  {
    id: "furn-bookcase-1",
    name: "Architectural Bookcase",
    category: "Storage",
    modelUrl: "/models/kenney_furniture-kit/models/bookcaseClosed.glb",
    color: "#783D19",
    attachmentType: "floor",
  },
  {
    id: "furn-plant-1",
    name: "Monstera Floor Plant",
    category: "Decor",
    modelUrl: "/models/kenney_furniture-kit/models/pottedPlant.glb",
    color: "#10B981",
    attachmentType: "floor",
  },
];

function generateRandomOffset(): number {
  return Number(((Math.random() - 0.5) * 4).toFixed(2));
}

function generateUniqueId(baseId: string): string {
  return `${baseId}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

export default function FurnitureSwapPage() {
  const router = useRouter();
  const mounted = useIsClient();
  const [selectedAsset, setSelectedAsset] = useState<string>("furn-chair-1");
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const {
    sceneObjects,
    addSceneObject,
    removeSceneObject,
    selectedObjectId,
    setSelectedObject,
    activeStoreyId,
    setWorkspace,
  } = useEditorStore(
    useShallow((s) => ({
      sceneObjects: s.sceneObjects,
      addSceneObject: s.addSceneObject,
      removeSceneObject: s.removeSceneObject,
      selectedObjectId: s.selectedObjectId,
      setSelectedObject: s.setSelectedObject,
      activeStoreyId: s.activeStoreyId,
      setWorkspace: s.setWorkspace,
    })),
  );

  const instantiateAsset = (
    asset: FurnitureCatalogItem,
    coords?: { x: number; z: number },
  ) => {
    const layout = useEditorStore.getState().floorPlanLayout;
    const points =
      layout?.walls.flatMap((wall) => [wall.start, wall.end]) ?? [];
    const centerX = points.length
      ? ((Math.min(...points.map((p) => p.x)) +
          Math.max(...points.map((p) => p.x))) *
          0.3048) /
        2
      : 0;
    const centerZ = points.length
      ? ((Math.min(...points.map((p) => p.y)) +
          Math.max(...points.map((p) => p.y))) *
          0.3048) /
        2
      : 0;
    const posX = coords ? coords.x : layout ? centerX : generateRandomOffset();
    const posZ = coords ? coords.z : layout ? centerZ : generateRandomOffset();
    const newObj: SceneObject = {
      id: generateUniqueId(asset.id),
      type: "furniture",
      name: asset.name,
      position: { x: posX, y: 0, z: posZ },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      gltfPath: asset.modelUrl,
      attachmentType: asset.attachmentType || "floor",
      storeyId: activeStoreyId,
    };
    addSceneObject(newObj);
    setSelectedObject(newObj.id);
    toast.success(`Placed "${asset.name}" into active project scene`);
  };

  const handleAssetGenerated = (modelUrl: string, name: string) => {
    instantiateAsset({
      id: "custom-trellis",
      name: name || "Furniture model",
      category: "Generative AI",
      modelUrl,
      color: "#5B6AF0",
      attachmentType: "floor",
    });
  };

  const handleClear = () => {
    sceneObjects.forEach((obj) => removeSceneObject(obj.id));
    toast.success("Cleared furniture assets from scene.");
  };

  const handleImportCustomModel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext !== "glb" || file.size > 2 * 1024 * 1024) {
      toast.error(
        "Use a self-contained GLB up to 2 MB so it can be saved in this browser.",
      );
      return;
    }
    const reader = new FileReader();
    reader.onerror = () =>
      toast.error("Could not read that model. Try a different GLB.");
    reader.onload = () => {
      if (typeof reader.result !== "string") return;
      instantiateAsset({
        id: "imported",
        name: file.name.replace(/\.[^/.]+$/, ""),
        category: "Imported 3D",
        modelUrl: reader.result,
        color: "#10B981",
        attachmentType: "floor",
      });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleDragStart = (e: React.DragEvent, asset: FurnitureCatalogItem) => {
    e.dataTransfer.setData("application/json", JSON.stringify(asset));
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(true);
  };

  const handleDragLeave = () => {
    setIsDraggingOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);

    try {
      const dataStr = e.dataTransfer.getData("application/json");
      if (!dataStr) return;

      const asset = JSON.parse(dataStr) as FurnitureCatalogItem;
      const rect = e.currentTarget.getBoundingClientRect();

      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const pctX = (x / rect.width) * 2 - 1;
      const pctY = -(y / rect.height) * 2 + 1;

      const dropX = Number((pctX * 5).toFixed(2));
      const dropZ = Number((-pctY * 5).toFixed(2));

      instantiateAsset(asset, { x: dropX, z: dropZ });
    } catch (err) {
      console.error("Drop error:", err);
    }
  };

  return (
    <div className="tool-studio flex-1 w-full h-full flex flex-col md:flex-row overflow-hidden bg-dark-surface select-none">
      {/* Parameter inputs (Left Sidebar, 340px) */}
      <aside className="w-[340px] h-full bg-white border-r border-hairline flex flex-col shrink-0 overflow-y-auto p-6 gap-6 shadow-card z-20">
        <div className="flex items-center justify-between border-b border-hairline pb-4">
          <div>
            <h2 className="font-jakarta text-heading-xs font-800 text-charcoal tracking-tight flex items-center gap-2">
              <Package size={18} className="text-indigo" />
              <span>Furniture Studio</span>
            </h2>
            <p className="font-body text-[11px] text-stone mt-0.5">
              Add furniture from the catalog, import a model, or try image-to-3D.
            </p>
          </div>
        </div>

        {/* 1. Generative AI Prompt Panel */}
        <TrellisGenerator onAssetGenerated={handleAssetGenerated} />

        {/* 2. Asset Catalog Grid */}
        <div className="space-y-3">
          <label className="font-jakarta text-xs font-bold text-charcoal uppercase tracking-wider block">
            Digital Asset Catalog
          </label>

          <div className="grid grid-cols-1 gap-2.5">
            {ASSET_CATALOG.map((asset) => {
              const isSelected = selectedAsset === asset.id;
              return (
                <div
                  key={asset.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, asset)}
                  onClick={() => {
                    setSelectedAsset(asset.id);
                    instantiateAsset(asset);
                  }}
                  className={`p-3 rounded-xl border text-left flex items-center gap-3 transition-all duration-200 cursor-grab active:cursor-grabbing w-full hover:shadow-sm ${
                    isSelected
                      ? "bg-indigo-light border-indigo text-charcoal"
                      : "bg-white border-hairline text-stone hover:bg-gray-50 hover:text-charcoal"
                  }`}
                >
                  <div
                    className="w-10 h-10 rounded-lg shrink-0 flex items-center justify-center border border-hairline shadow-inner"
                    style={{ backgroundColor: asset.color }}
                  >
                    <Armchair
                      size={18}
                      className="text-white"
                      style={{
                        filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.15))",
                      }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-jakarta text-xs font-bold text-charcoal truncate">
                      {asset.name}
                    </h4>
                    <p className="font-body text-[10px] text-stone mt-0.5">
                      {asset.category} &bull; Local GLB Mesh
                    </p>
                  </div>
                  <span className="w-6 h-6 rounded-lg bg-gray-50 hover:bg-indigo-light border border-hairline flex items-center justify-center text-stone hover:text-indigo transition-colors shrink-0">
                    <Plus size={14} />
                  </span>
                </div>
              );
            })}
          </div>
          <span className="text-[10px] text-stone flex items-center justify-center gap-1 text-center mt-1 font-medium">
            <Info size={11} className="text-indigo shrink-0" />
            <span>
              Drag cards above and drop them anywhere in the viewport!
            </span>
          </span>

          {/* Custom 3D Model Importer (GLTF/GLB Upload) */}
          <div className="border-t border-hairline pt-3 space-y-2">
            <label className="w-full h-10 border border-hairline border-dashed rounded-xl bg-white hover:bg-gray-50 hover:border-indigo transition-all flex items-center justify-center gap-1.5 cursor-pointer text-xs font-bold text-stone hover:text-charcoal select-none">
              <Upload size={13} className="text-indigo" />
              <span>Import GLB (up to 2 MB)</span>
              <input
                type="file"
                accept=".glb"
                onChange={handleImportCustomModel}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </aside>

      {/* Primary Viewport */}
      <main className="flex-1 h-full relative overflow-hidden flex flex-col">
        {/* Floating toolbar */}
        <div className="absolute top-6 left-6 right-6 flex items-center justify-between pointer-events-none z-30">
          <div className="flex items-center gap-2 pointer-events-auto">
            <div className="px-4 py-2 bg-dark-surface/95 border border-hairline-dark text-on-dark rounded-full text-xs font-bold shadow-hero select-none flex items-center gap-2">
              <Move size={12} className="text-gold" />
              <span>Digital Twin Asset Placer Viewport</span>
            </div>
          </div>

          <div className="flex items-center gap-2 pointer-events-auto">
            <div className="flex items-center gap-1.5 px-4 py-2 bg-dark-surface/95 border border-hairline-dark text-teal rounded-full text-xs font-bold shadow-hero select-none">
              <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
              <span>Synced with CAD Store ({sceneObjects.length} items)</span>
            </div>
          </div>
        </div>

        {/* Drop zone canvas wrapper */}
        <div
          className={`flex-1 w-full h-full relative transition-all duration-300 ${
            isDraggingOver
              ? "outline-4 outline-dashed outline-gold outline-offset-[-12px] bg-dark-surface-alt/80 z-10"
              : ""
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {isDraggingOver && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 pointer-events-none z-20">
              <div className="bg-dark-surface/90 border border-gold/40 text-gold px-6 py-4 rounded-2xl shadow-2xl flex flex-col items-center gap-2 animate-bounce">
                <Plus size={24} className="text-gold" />
                <span className="font-jakarta text-xs font-bold uppercase tracking-wider">
                  Drop Here to Instantiate Mesh
                </span>
              </div>
            </div>
          )}

          {mounted ? (
            <EditorCanvas cameraMode="perspective" showGrid={true}>
              {sceneObjects.map((obj) => (
                <PhysicsFurniture
                  key={obj.id}
                  id={obj.id}
                  name={obj.name}
                  position={[obj.position.x, obj.position.y, obj.position.z]}
                  rotation={[obj.rotation.x, obj.rotation.y, obj.rotation.z]}
                  scale={[obj.scale.x, obj.scale.y, obj.scale.z]}
                  color="#8C7662"
                  modelUrl={obj.gltfPath}
                  attachmentType={obj.attachmentType}
                  isSelected={selectedObjectId === obj.id}
                  onSelect={() => setSelectedObject(obj.id)}
                />
              ))}

              <PhysicsBoundary position={[0, -0.4, 0]} args={[100, 0.8, 100]} />

              <mesh
                rotation={[-Math.PI / 2, 0, 0]}
                position={[0, -0.02, 0]}
                receiveShadow
              >
                <planeGeometry args={[100, 100]} />
                <meshStandardMaterial color="#1a1a2e" roughness={0.85} />
              </mesh>
            </EditorCanvas>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-dark-surface-alt text-stone gap-3">
              <Loader2 size={32} className="animate-spin text-indigo" />
              <span className="font-body text-xs font-medium">
                Initializing 3D Viewport...
              </span>
            </div>
          )}
        </div>
      </main>

      {/* Right Stats Sidebar (300px) */}
      <aside className="w-[300px] h-full bg-white border-l border-hairline flex flex-col shrink-0 overflow-y-auto p-6 gap-6 shadow-card z-20">
        <div>
          <h3 className="font-jakarta text-heading-xs font-800 text-charcoal tracking-tight flex items-center gap-1.5 border-b border-hairline pb-4">
            <Info size={16} className="text-stone" />
            <span>Placed Scene Assets</span>
          </h3>
        </div>

        <div className="space-y-4 flex-1 overflow-y-auto">
          <h4 className="font-jakarta text-xs font-bold text-charcoal uppercase tracking-wider">
            Active Project Inventory ({sceneObjects.length})
          </h4>

          {sceneObjects.length > 0 ? (
            <div className="space-y-3">
              <div className="p-3.5 bg-alabaster border border-hairline rounded-xl space-y-2 text-[10px] font-body text-charcoal max-h-64 overflow-y-auto shadow-inner">
                {sceneObjects.map((obj) => (
                  <div
                    key={obj.id}
                    onClick={() => setSelectedObject(obj.id)}
                    className={`flex justify-between items-center border-b border-hairline/60 pb-1.5 last:border-0 last:pb-0 px-1.5 py-1 rounded cursor-pointer ${
                      selectedObjectId === obj.id
                        ? "bg-indigo-light text-indigo"
                        : ""
                    }`}
                  >
                    <span className="font-bold truncate max-w-[140px]">
                      {obj.name}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeSceneObject(obj.id);
                      }}
                      className="text-stone hover:text-red-500 transition-colors cursor-pointer"
                      title="Remove asset"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="bg-indigo-light border border-indigo/10 text-indigo rounded-xl p-3.5 flex flex-col gap-1.5 text-[10px] font-body">
                <div className="flex items-center gap-2">
                  <CheckCircle size={14} className="shrink-0 text-indigo" />
                  <span className="font-bold uppercase tracking-wider">
                    Live Store Sync Active
                  </span>
                </div>
                <p className="text-stone text-[9px] leading-normal font-medium">
                  All assets placed here are automatically synchronized with
                  your 2D/3D Floor Plan Studio and BOM cost calculator.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-alabaster border border-hairline text-stone rounded-xl text-center">
              <p className="font-body text-[10px] leading-relaxed">
                Add a catalog item or import a model to fill
                your project scene.
              </p>
            </div>
          )}
        </div>

        <div className="mt-auto space-y-2 pt-4 border-t border-hairline">
          <button
            onClick={() => {
              setWorkspace("manual");
              router.push("/floor-plan");
            }}
            className="w-full h-10 bg-indigo hover:bg-indigoDark text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all outline-none shadow-button cursor-pointer"
          >
            <span>Open in 2D/3D CAD Studio</span>
            <ArrowRight size={13} />
          </button>

          {sceneObjects.length > 0 && (
            <button
              onClick={handleClear}
              className="w-full h-9 bg-white border border-hairline hover:bg-gray-50 text-stone hover:text-red-500 hover:border-red-200 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all outline-none shadow-sm cursor-pointer"
            >
              <Trash2 size={13} />
              <span>Clear Scene Furniture</span>
            </button>
          )}
        </div>
      </aside>
    </div>
  );
}
