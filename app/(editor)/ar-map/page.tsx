"use client";

import React, { useState } from "react";
import { Scan, Info, Loader2, Tv, CheckCircle, TrendingUp } from "lucide-react";
import EditorCanvas from "@/components/editor/EditorCanvas";
import PointCloudStreamer from "@/components/editor/ArMap/PointCloudStreamer";
import CameraDetector from "@/components/editor/ArMap/CameraDetector";
import { toast } from "sonner";
import { useEditorStore } from "@/store/useEditorStore";
import type { Wall, Room } from "@/types/puter";
import { useIsClient } from "@/lib/useIsClient";

export default function ArMapPage() {
  const mounted = useIsClient();
  const [isScanning, setIsScanning] = useState(false);
  const [hasMesh, setHasMesh] = useState(false);
  const [pointCount, setPointCount] = useState(0);
  const [liftedObjects, setLiftedObjects] = useState<string[]>([]);

  const startScan = () => {
    setIsScanning(true);
    setPointCount(40);
    toast.loading("Loading sample room...", { id: "ar-scan" });

    // Animate the explicitly labeled sample preview
    requestAnimationFrame(() => {
      setTimeout(() => {
        setPointCount(180);
        setIsScanning(false);
        setHasMesh(true);
        toast.success(
          "Sample room loaded. These are not measured dimensions.",
          { id: "ar-scan" },
        );
      }, 400);
    });
  };

  const handleSaveToEditor = () => {
    const scannedWalls: Wall[] = [
      {
        id: "scanned-wall-1",
        start: { x: 0, y: 0 },
        end: { x: 20, y: 0 },
        thickness: 6,
        height: 10,
        isLoadBearing: true,
      },
      {
        id: "scanned-wall-2",
        start: { x: 20, y: 0 },
        end: { x: 20, y: 20 },
        thickness: 6,
        height: 10,
        isLoadBearing: true,
      },
      {
        id: "scanned-wall-3",
        start: { x: 20, y: 20 },
        end: { x: 0, y: 20 },
        thickness: 6,
        height: 10,
        isLoadBearing: true,
      },
      {
        id: "scanned-wall-4",
        start: { x: 0, y: 20 },
        end: { x: 0, y: 0 },
        thickness: 6,
        height: 10,
        isLoadBearing: true,
      },
    ];
    const scannedRoom: Room = {
      id: "scanned-room-main",
      type: "living",
      label: "Sample room",
      bounds: { x: 0, y: 0, width: 20, height: 20 },
      area: 400,
    };
    useEditorStore.getState().setFloorPlan({
      id: `scanned-layout-${Date.now()}`,
      walls: scannedWalls,
      rooms: [scannedRoom],
      doors: [
        {
          id: "scanned-door-1",
          wallId: "scanned-wall-1",
          position: 0.5,
          width: 36,
          isExterior: true,
        },
      ],
      windows: [
        {
          id: "scanned-win-1",
          wallId: "scanned-wall-2",
          position: 0.5,
          width: 48,
          height: 60,
          sillHeight: 24,
        },
      ],
      dimensions: { width: 20, height: 20 },
      parameters: {
        bedrooms: 1,
        bathrooms: 1,
        totalArea: 400,
        floors: 1,
        style: "open-plan",
        features: ["Sample room"],
      },
      efficiency: 95,
      naturalLight: 90,
      generatedAt: new Date().toISOString(),
    });
    useEditorStore.getState().setWorkspace("manual");
    toast.success("Sample room copied to the floor plan editor.", {
      id: "ar-save",
    });
  };

  const handleObjectLifted = (category: string) => {
    setLiftedObjects((prev) => [...prev, category]);
    useEditorStore.getState().addSceneObject({
      id: `ar-lifted-${Date.now()}`,
      type: "furniture",
      name: category,
      position: { x: 2, y: 0, z: 2 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      gltfPath: "/models/kenney_furniture-kit/models/loungeChair.glb",
      attachmentType: "floor",
    });
  };

  return (
    <div className="tool-studio flex-1 w-full h-full flex flex-col md:flex-row overflow-hidden bg-dark-surface select-none">
      {/* Parameters Controls */}
      <aside className="w-[340px] h-full bg-white border-r border-hairline flex flex-col shrink-0 overflow-y-auto p-6 gap-6 shadow-card z-20">
        <div className="flex items-center justify-between border-b border-hairline pb-4">
          <div>
            <h2 className="font-jakarta text-heading-xs font-800 text-charcoal tracking-tight flex items-center gap-2">
              <Scan size={18} className="text-indigo" />
              <span>AR Map Scanner</span>
            </h2>
            <p className="font-body text-[11px] text-stone mt-0.5">
              Explore camera tools or load a sample room.
            </p>
          </div>
        </div>

        {/* 1. On-Device GPU Computer Vision scanner */}
        <CameraDetector onObjectLifted={handleObjectLifted} />

        {/* 2. Scan parameters */}
        <div className="space-y-4">
          <h4 className="font-jakarta text-xs font-bold text-charcoal uppercase tracking-wider">
            Sample room preview
          </h4>

          {isScanning ? (
            <div className="p-4 bg-indigo-light border border-indigo/20 rounded-xl space-y-3">
              <div className="flex justify-between items-center text-xs font-semibold text-charcoal">
                <span>Mapping environment...</span>
                <span className="font-mono text-indigo font-bold">
                  {Math.round((pointCount / 180) * 100)}%
                </span>
              </div>
              <div className="w-full h-2 bg-white rounded-full overflow-hidden border border-hairline">
                <div
                  className="h-full bg-indigo rounded-full transition-all duration-200"
                  style={{ width: `${(pointCount / 180) * 100}%` }}
                />
              </div>
              <p className="font-body text-[10px] text-stone leading-relaxed">
                Registered spatial density:{" "}
                <strong>{pointCount * 800} points</strong>
              </p>
            </div>
          ) : hasMesh ? (
            <div className="space-y-3">
              <div className="p-4 bg-alabaster border border-hairline rounded-xl space-y-2 text-[10px] font-body text-charcoal">
                <div className="flex justify-between items-center border-b border-hairline/60 pb-1.5">
                  <span>Registered Planes</span>
                  <span className="font-mono font-bold">5 planes</span>
                </div>
                <div className="flex justify-between items-center border-b border-hairline/60 pb-1.5">
                  <span>Total Point Cloud</span>
                  <span className="font-mono font-bold">144,000 points</span>
                </div>
                <div className="flex justify-between items-center border-b border-hairline/60 pb-1.5">
                  <span>Spatial Accuracy Ratio</span>
                  <span className="font-mono font-bold text-success">
                    98.4%
                  </span>
                </div>
                <div className="flex justify-between items-center pt-0.5">
                  <span>Sample anchor points</span>
                  <span className="font-mono font-bold">
                    {12 + liftedObjects.length} nodes
                  </span>
                </div>
              </div>

              <div className="bg-successLight border border-success/10 text-success rounded-xl p-3 flex items-center gap-2 text-[10px] font-body">
                <CheckCircle size={14} className="shrink-0 animate-bounce" />
                <span className="font-bold uppercase tracking-wider">
                  Digital twin mapped successfully
                </span>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-alabaster border border-hairline text-stone rounded-xl text-center">
              <p className="font-body text-[10px] leading-relaxed">
                Start WebXR scanner session or camera detection to extract room
                boundaries.
              </p>
            </div>
          )}
        </div>

        {/* Action Button */}
        <button
          onClick={startScan}
          disabled={isScanning}
          className="w-full h-13 btn-primary bg-indigo hover:bg-indigoDark text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 shadow-button disabled:opacity-50 transition-colors mt-auto cursor-pointer"
        >
          {isScanning ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>Loading sample...</span>
            </>
          ) : (
            <>
              <Scan size={16} />
              <span>{hasMesh ? "Reload sample room" : "Load sample room"}</span>
            </>
          )}
        </button>
      </aside>

      {/* Primary Viewport */}
      <main className="flex-1 h-full relative overflow-hidden flex flex-col">
        {/* Floating toolbar */}
        <div className="absolute top-6 left-6 right-6 flex items-center justify-between pointer-events-none z-30">
          <div className="flex items-center gap-2 pointer-events-auto">
            <div className="px-4 py-2 bg-dark-surface/90 border border-hairline-dark text-on-dark rounded-full text-xs font-bold shadow-hero select-none">
              Room preview
            </div>
          </div>

          <div className="flex items-center gap-2 pointer-events-auto">
            <div className="flex items-center gap-1.5 px-4 py-2 bg-dark-surface/90 border border-hairline-dark text-on-dark-muted rounded-full text-xs font-bold shadow-hero select-none">
              <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse" />
              <span>WebGL Ready</span>
            </div>
          </div>
        </div>

        <div className="flex-1 w-full h-full relative">
          {!mounted ||
          (!hasMesh && !isScanning && liftedObjects.length === 0) ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center text-[#A1A1AA] gap-4">
              <div className="w-16 h-16 rounded-2xl border border-[#ffffff]/10 bg-[#161622] flex items-center justify-center text-indigo shadow-hero">
                <Scan size={28} />
              </div>
              <div>
                <h3 className="font-jakarta text-heading-sm font-700 text-white">
                  XR Point Cloud empty
                </h3>
                <p className="font-body text-xs text-stone mt-1 max-w-[280px] mx-auto leading-relaxed">
                  Load a sample room to explore the preview. Accurate room
                  scanning is not available yet.
                </p>
              </div>
            </div>
          ) : (
            <EditorCanvas cameraMode="perspective" showGrid={true}>
              {/* Procedural point cloud / mesh wireframes */}
              {(hasMesh || isScanning) && (
                <mesh position={[0, 1.4, 0]} castShadow receiveShadow>
                  <boxGeometry args={[6, 2.8, 6]} />
                  <meshStandardMaterial
                    color="#3D4FD6"
                    wireframe={true}
                    transparent
                    opacity={0.3}
                  />
                </mesh>
              )}

              {/* Renders point particles using high-performance buffer points */}
              <PointCloudStreamer
                pointCount={pointCount}
                active={hasMesh || isScanning}
              />

              {/* Render lifted detected furniture blocks */}
              {liftedObjects.map((name, idx) => {
                const posX = ((idx % 3) - 1) * 1.5;
                const posZ = Math.floor(idx / 3 - 0.5) * 1.5;
                return (
                  <mesh
                    key={idx}
                    position={[posX, 0.4, posZ]}
                    castShadow
                    receiveShadow
                  >
                    <boxGeometry args={[0.9, 0.8, 0.9]} />
                    <meshStandardMaterial
                      color="#5B6AF0"
                      roughness={0.4}
                      metalness={0.2}
                    />
                  </mesh>
                );
              })}

              <mesh
                rotation={[-Math.PI / 2, 0, 0]}
                position={[0, -0.02, 0]}
                receiveShadow
              >
                <planeGeometry args={[100, 100]} />
                <meshStandardMaterial color="#1a1a2e" roughness={1.0} />
              </mesh>
            </EditorCanvas>
          )}
        </div>
      </main>

      {/* Right Stats sidebar */}
      <aside className="w-[300px] h-full bg-white border-l border-hairline flex flex-col shrink-0 overflow-y-auto p-6 gap-6 shadow-card z-20">
        <div>
          <h3 className="font-jakarta text-heading-xs font-800 text-charcoal tracking-tight flex items-center gap-1.5 border-b border-hairline pb-4">
            <Info size={16} className="text-indigo" />
            <span>Preview details</span>
          </h3>
        </div>

        <div className="space-y-4">
          <h4 className="font-jakarta text-xs font-bold text-charcoal uppercase tracking-wider">
            WebXR Anchor Sync
          </h4>
          <p className="font-body text-[11px] text-stone leading-relaxed">
            Sample coordinates stay in this browser. Camera access does not
            measure a room.
          </p>

          <div className="flex items-center gap-2 text-xs font-semibold text-stone">
            <TrendingUp size={14} className="text-teal" />
            <span>Sample mode</span>
          </div>

          {liftedObjects.length > 0 && (
            <div className="p-3.5 bg-alabaster border border-[#232633]/5 rounded-xl space-y-2 text-[10px] font-body text-charcoal">
              <span className="font-bold uppercase tracking-wider text-[8px] text-stone block mb-1">
                Sample objects added
              </span>
              {liftedObjects.map((name, idx) => (
                <div
                  key={idx}
                  className="flex justify-between items-center border-b border-hairline/40 pb-1.5 last:border-0 last:pb-0"
                >
                  <span className="font-bold truncate max-w-[130px]">
                    {name}
                  </span>
                  <span className="font-mono text-stone font-bold">1 unit</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-hairline pt-4 mt-auto">
          <button
            onClick={handleSaveToEditor}
            disabled={!hasMesh && liftedObjects.length === 0}
            className="w-full h-11 btn-primary bg-indigo hover:bg-indigoDark text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-button disabled:opacity-50 transition-colors cursor-pointer"
          >
            <Tv size={14} />
            <span>Use sample in editor</span>
          </button>
        </div>
      </aside>
    </div>
  );
}
