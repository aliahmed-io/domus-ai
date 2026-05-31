"use client";

import React, { useState } from "react";
import {
  Package,
  Plus,
  Info,
  CheckCircle,
  HelpCircle,
  Armchair,
  Tv,
  Move,
  Trash2,
} from "lucide-react";
import EditorCanvas from "@/components/editor/EditorCanvas";
import TrellisGenerator from "@/components/editor/FurnitureSwap/TrellisGenerator";
import PhysicsFurniture from "@/components/editor/PhysicsFurniture";
import PhysicsBoundary from "@/components/editor/PhysicsBoundary";

interface FurnitureItem {
  id: string;
  name: string;
  category: string;
  modelUrl: string;
  color: string;
  customPosition?: [number, number, number];
}

const ASSET_CATALOG: FurnitureItem[] = [
  { 
    id: "furn-chair-1", 
    name: "Søren Lounge Chair", 
    category: "Seating", 
    modelUrl: "https://vazxmixjsiawhamofees.supabase.co/storage/v1/object/public/models/chair-wood/model.gltf", 
    color: "#8C7662" 
  },
  { 
    id: "furn-sofa-1", 
    name: "Nouveau Fabric Sofa", 
    category: "Seating", 
    modelUrl: "https://vazxmixjsiawhamofees.supabase.co/storage/v1/object/public/models/sofa/model.gltf", 
    color: "#2C2621" 
  },
  { 
    id: "furn-table-1", 
    name: "Walnut Dining Block", 
    category: "Tables", 
    modelUrl: "https://vazxmixjsiawhamofees.supabase.co/storage/v1/object/public/models/table-wood-plain/model.gltf", 
    color: "#5A4A3A" 
  },
  { 
    id: "furn-light-1", 
    name: "Brushed Dome Pendant", 
    category: "Lighting", 
    modelUrl: "https://vazxmixjsiawhamofees.supabase.co/storage/v1/object/public/models/lamp-standing/model.gltf", 
    color: "#C2A585" 
  },
  { 
    id: "furn-cab-1", 
    name: "Slated Oak Sideboard", 
    category: "Storage", 
    modelUrl: "https://vazxmixjsiawhamofees.supabase.co/storage/v1/object/public/models/cabinet-bed-drawer/model.gltf", 
    color: "#A88E75" 
  },
];

// Helper utilities defined outside the React component to comply with strict hook purity rules
function generateRandomOffset(): number {
  return (Math.random() - 0.5) * 4;
}

function generateUniqueId(baseId: string): string {
  return `${baseId}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

export default function FurnitureSwapPage() {
  const [selectedAsset, setSelectedAsset] = useState<string>("furn-chair-1");
  const [placedAssets, setPlacedAssets] = useState<FurnitureItem[]>([]);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const handlePlaceAsset = (asset: FurnitureItem) => {
    // Determine random start offset near center so multiple placements don't land exactly overlapping
    const offsetX = generateRandomOffset();
    const offsetZ = generateRandomOffset();
    
    setPlacedAssets([
      ...placedAssets,
      { 
        ...asset, 
        id: generateUniqueId(asset.id),
        customPosition: [offsetX, 4.0, offsetZ]
      }
    ]);
  };

  const handleAssetGenerated = (modelUrl: string, name: string) => {
    const customAsset: FurnitureItem = {
      id: generateUniqueId("custom-g"),
      name: name,
      category: "Generative AI",
      modelUrl: modelUrl,
      color: "#5B6AF0",
      customPosition: [0, 4.0, 0]
    };
    setPlacedAssets((prev) => [...prev, customAsset]);
  };

  const handleClear = () => {
    setPlacedAssets([]);
  };

  // HTML5 Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent, asset: FurnitureItem) => {
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
      
      const asset = JSON.parse(dataStr) as FurnitureItem;
      const rect = e.currentTarget.getBoundingClientRect();
      
      // Calculate cursor position inside drop zone canvas
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      // Convert layout width percentages to relative spatial metrics (e.g. 10m range)
      const pctX = (x / rect.width) * 2 - 1;
      const pctY = -(y / rect.height) * 2 + 1;
      
      const dropX = pctX * 8;
      const dropZ = -pctY * 8;
      
      setPlacedAssets((prev) => [
        ...prev,
        {
          ...asset,
          id: generateUniqueId(asset.id),
          customPosition: [dropX, 4.0, dropZ]
        }
      ]);
    } catch (err) {
      console.error("Drop error:", err);
    }
  };

  return (
    <div className="flex-1 w-full h-full flex flex-col md:flex-row overflow-hidden bg-dark-surface select-none">
      {/* Parameter inputs (Left Sidebar, 340px) */}
      <aside className="w-[340px] h-full bg-white border-r border-hairline flex flex-col shrink-0 overflow-y-auto p-6 gap-6 shadow-card z-20">
        <div className="flex items-center justify-between border-b border-hairline pb-4">
          <div>
            <h2 className="font-jakarta text-heading-xs font-800 text-charcoal tracking-tight flex items-center gap-2">
              <Package size={18} className="text-indigo" />
              <span>Furniture Swap</span>
            </h2>
            <p className="font-body text-[11px] text-stone mt-0.5">
              Drag-and-drop spatial assets directly into the viewport layout.
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
                    handlePlaceAsset(asset);
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
                    <Armchair size={18} className="text-white" style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.15))" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-jakarta text-xs font-bold text-charcoal truncate">
                      {asset.name}
                    </h4>
                    <p className="font-body text-[10px] text-stone mt-0.5">
                      {asset.category} • LOD Draco GLTF
                    </p>
                  </div>
                  <span className="w-6 h-6 rounded-lg bg-gray-50 hover:bg-indigo-light border border-hairline flex items-center justify-center text-stone hover:text-indigo transition-colors shrink-0">
                    <Plus size={14} />
                  </span>
                </div>
              );
            })}
          </div>
          <span className="text-[9px] text-stone italic block text-center mt-1">
            💡 Drag cards above and drop them anywhere in the viewport!
          </span>
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
              <span>WebGL Ready</span>
            </div>
          </div>
        </div>

        {/* Drop zone canvas wrapper */}
        <div 
          className={`flex-1 w-full h-full relative transition-all duration-300 ${
            isDraggingOver ? "outline-4 outline-dashed outline-gold outline-offset-[-12px] bg-dark-surface-alt/80 z-10" : ""
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

          <EditorCanvas cameraMode="perspective" showGrid={true}>
            {/* Render procedurally placed furniture blocks inside Cannon dynamic body boundaries */}
            {placedAssets.map((asset) => {
              const pos = asset.customPosition || [0, 4.0, 0];
              return (
                <PhysicsFurniture
                  key={asset.id}
                  position={pos}
                  color={asset.color}
                  modelUrl={asset.modelUrl}
                  args={[1.2, 0.9, 1.2]}
                />
              );
            })}

            {/* Static floor collider boundary to prevent physics objects from falling infinitely */}
            <PhysicsBoundary position={[0, -0.4, 0]} args={[100, 0.8, 100]} />

            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
              <planeGeometry args={[100, 100]} />
              <meshStandardMaterial color="#1a1a2e" roughness={1.0} />
            </mesh>
          </EditorCanvas>
        </div>
      </main>

      {/* Right Stats Sidebar (300px) */}
      <aside className="w-[300px] h-full bg-white border-l border-hairline flex flex-col shrink-0 overflow-y-auto p-6 gap-6 shadow-card z-20">
        <div>
          <h3 className="font-jakarta text-heading-xs font-800 text-charcoal tracking-tight flex items-center gap-1.5 border-b border-hairline pb-4">
            <Info size={16} className="text-stone" />
            <span>Placed Assets</span>
          </h3>
        </div>

        <div className="space-y-4 flex-1 overflow-y-auto">
          <h4 className="font-jakarta text-xs font-bold text-charcoal uppercase tracking-wider">
            Furniture Instantiation
          </h4>

          {placedAssets.length > 0 ? (
            <div className="space-y-3">
              <div className="p-3.5 bg-alabaster border border-hairline rounded-xl space-y-2 text-[10px] font-body text-charcoal max-h-56 overflow-y-auto shadow-inner">
                {placedAssets.map((asset, idx) => (
                  <div key={asset.id} className="flex justify-between items-center border-b border-hairline/60 pb-1.5 last:border-0 last:pb-0">
                    <span className="font-bold truncate max-w-[130px]">{asset.name}</span>
                    <button
                      onClick={() => setPlacedAssets(placedAssets.filter(p => p.id !== asset.id))}
                      className="text-stone hover:text-red-500 transition-colors"
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
                    Interactive Physics Active
                  </span>
                </div>
                <p className="text-stone text-[9px] leading-normal font-medium">
                  💡 <strong>Twin simulator:</strong> Digital twin meshes drop with real physics gravity constraints and stack seamlessly on top of one another!
                </p>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-alabaster border border-hairline text-stone rounded-xl text-center">
              <p className="font-body text-[10px] leading-relaxed">
                Drag cards from the catalog or click on them to drop spatial blocks in WebGL canvas space.
              </p>
            </div>
          )}
        </div>

        {placedAssets.length > 0 && (
          <button
            onClick={handleClear}
            className="w-full h-10 bg-white border border-hairline hover:bg-gray-50 text-stone hover:text-red-500 hover:border-red-200 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all outline-none mt-auto shadow-sm"
          >
            <Trash2 size={13} />
            <span>Clear Viewport Assets</span>
          </button>
        )}
      </aside>
    </div>
  );
}
