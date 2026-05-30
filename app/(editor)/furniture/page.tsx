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
}

const ASSET_CATALOG: FurnitureItem[] = [
  { id: "furn-chair-1", name: "Søren Lounge Chair", category: "Seating", modelUrl: "", color: "#E0DBCE" },
  { id: "furn-sofa-1", name: "Nouveau Fabric Sofa", category: "Seating", modelUrl: "", color: "#2E3A4F" },
  { id: "furn-table-1", name: "Walnut Dining Block", category: "Tables", modelUrl: "", color: "#543C2E" },
  { id: "furn-light-1", name: "Brushed Dome Pendant", category: "Lighting", modelUrl: "", color: "#B89E46" },
  { id: "furn-cab-1", name: "Slated Oak Sideboard", category: "Storage", modelUrl: "", color: "#7A685B" },
];

export default function FurnitureSwapPage() {
  const [selectedAsset, setSelectedAsset] = useState<string>("furn-chair-1");
  const [placedAssets, setPlacedAssets] = useState<FurnitureItem[]>([]);

  const handlePlaceAsset = (asset: FurnitureItem) => {
    setPlacedAssets([...placedAssets, { ...asset, id: `${asset.id}-${Date.now()}` }]);
  };

  const handleAssetGenerated = (modelUrl: string, name: string) => {
    const customAsset: FurnitureItem = {
      id: `custom-g-${Date.now()}`,
      name: name,
      category: "Generative AI",
      modelUrl: modelUrl,
      color: "#5B6AF0",
    };
    handlePlaceAsset(customAsset);
  };

  const handleClear = () => {
    setPlacedAssets([]);
  };

  return (
    <div className="flex-1 w-full h-full flex flex-col md:flex-row overflow-hidden bg-darkSurface select-none">
      {/* Parameter inputs (Left Sidebar, 340px) */}
      <aside className="w-[340px] h-full bg-white border-r border-hairline flex flex-col shrink-0 overflow-y-auto p-6 gap-6 shadow-card z-20">
        <div className="flex items-center justify-between border-b border-hairline pb-4">
          <div>
            <h2 className="font-jakarta text-heading-xs font-800 text-charcoal tracking-tight flex items-center gap-2">
              <Package size={18} className="text-stone" />
              <span>Furniture Swap</span>
            </h2>
            <p className="font-body text-[11px] text-stone mt-0.5">
              Insert pre-optimized high-performance digital asset blocks.
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
                <button
                  key={asset.id}
                  onClick={() => {
                    setSelectedAsset(asset.id);
                    handlePlaceAsset(asset);
                  }}
                  className={`p-3 rounded-xl border text-left flex items-center gap-3 transition-all duration-200 outline-none w-full ${
                    isSelected
                      ? "bg-indigo-light border-indigo text-charcoal shadow-sm"
                      : "bg-white border-hairline text-stone hover:bg-gray-50 hover:text-charcoal"
                  }`}
                >
                  <div
                    className="w-10 h-10 rounded-lg shrink-0 flex items-center justify-center border border-hairline"
                    style={{ backgroundColor: asset.color }}
                  >
                    <Armchair size={18} className="text-white" style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.15))" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-jakarta text-xs font-bold text-charcoal truncate">
                      {asset.name}
                    </h4>
                    <p className="font-body text-[10px] text-stone mt-0.5">
                      {asset.category} • DRACO GLB
                    </p>
                  </div>
                  <span className="w-6 h-6 rounded-lg bg-gray-50 hover:bg-indigo-light border border-hairline flex items-center justify-center text-stone hover:text-indigo transition-colors shrink-0">
                    <Plus size={14} />
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </aside>

      {/* Primary Viewport */}
      <main className="flex-1 h-full relative overflow-hidden flex flex-col">
        {/* Floating toolbar */}
        <div className="absolute top-6 left-6 right-6 flex items-center justify-between pointer-events-none z-30">
          <div className="flex items-center gap-2 pointer-events-auto">
            <div className="px-4 py-2 bg-darkSurface/90 border border-hairlineDark text-onDark rounded-full text-xs font-bold shadow-hero select-none">
              Digital Twin Asset Placer Viewport
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
          <EditorCanvas cameraMode="perspective" showGrid={true}>
            {/* Render procedurally placed furniture blocks inside Cannon dynamic body boundaries */}
            {placedAssets.map((asset, idx) => {
              const posX = (idx % 3 - 1) * 1.8;
              // Start slightly higher so they drop nicely onto the ground with gravity!
              const posY = 3.5 + Math.floor(idx / 3) * 1.2;
              const posZ = Math.floor(idx / 3 - 0.5) * 1.8;
              return (
                <PhysicsFurniture
                  key={asset.id}
                  position={[posX, posY, posZ]}
                  color={asset.color}
                  args={[1, 0.8, 1]}
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

        <div className="space-y-4">
          <h4 className="font-jakarta text-xs font-bold text-charcoal uppercase tracking-wider">
            Furniture Instanciation
          </h4>

          {placedAssets.length > 0 ? (
            <div className="space-y-3">
              <div className="p-3.5 bg-alabaster border border-hairline rounded-xl space-y-2 text-[10px] font-body text-charcoal max-h-56 overflow-y-auto">
                {placedAssets.map((asset, idx) => (
                  <div key={idx} className="flex justify-between items-center border-b border-hairline/60 pb-1.5 last:border-0 last:pb-0">
                    <span className="font-bold truncate max-w-[130px]">{asset.name}</span>
                    <span className="font-mono text-stone font-bold">1 unit</span>
                  </div>
                ))}
              </div>

              <div className="bg-indigo-light border border-indigo/10 text-indigo rounded-xl p-3 flex flex-col gap-1.5 text-[10px] font-body">
                <div className="flex items-center gap-2">
                  <CheckCircle size={14} className="shrink-0 text-indigo" />
                  <span className="font-bold uppercase tracking-wider">
                    Interactive Physics Active
                  </span>
                </div>
                <p className="text-stone text-[9px] leading-normal font-medium">
                  💡 <strong>Dynamic twin mode:</strong> Click on any furniture box in the 3D viewport to apply upward force impulse and watch it spin/fall under real gravity constraints!
                </p>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-alabaster border border-hairline text-stone rounded-xl text-center">
              <p className="font-body text-[10px] leading-relaxed">
                Click on asset blocks on the left catalog grid to place meshes in WebGL canvas space.
              </p>
            </div>
          )}
        </div>

        {placedAssets.length > 0 && (
          <button
            onClick={handleClear}
            className="w-full h-10 bg-white border border-hairline hover:bg-gray-50 text-stone hover:text-error text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all outline-none mt-auto"
          >
            <span>Clear Viewport Assets</span>
          </button>
        )}
      </aside>
    </div>
  );
}
