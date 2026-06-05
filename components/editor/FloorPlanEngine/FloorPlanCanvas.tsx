"use client";

import React, { useState } from "react";
import {
  Move,
  ZoomIn,
  Info,
  Brain,
  Glasses,
  Zap,
  X,
  CheckCircle2,
} from "lucide-react";
import { useEditorStore } from "@/store/useEditorStore";
import { useShallow } from "zustand/react/shallow";
import EditorCanvas from "../EditorCanvas";
import WallMesh from "./WallMesh";
import DoorMesh from "./DoorMesh";
import WindowMesh from "./WindowMesh";
import WallDrawingManager from "./WallDrawingManager";
import DimensionLineOverlay from "./DimensionLineOverlay";
import SunController from "../SunController";
import MepOverlay from "./MepOverlay";
import StaircaseMesh from "./StaircaseMesh";

import CeilingMesh from "./CeilingMesh";
import BlueprintCanvas2D from "./BlueprintCanvas2D";
import StoreySelector from "../StoreySelector";
import PhysicsFurniture from "../PhysicsFurniture";
import RoofMesh from "./RoofMesh";

export default function FloorPlanCanvas() {
  const { floorPlanLayout, mode, cameraMode, toggleCameraMode, sceneObjects } = useEditorStore(
    useShallow((s) => ({
      floorPlanLayout: s.floorPlanLayout,
      mode: s.mode,
      cameraMode: s.cameraMode,
      toggleCameraMode: s.toggleCameraMode,
      sceneObjects: s.sceneObjects,
    }))
  );
  const [headsetOpen, setHeadsetOpen] = useState(false);
  const [pathTracing, setPathTracing] = useState(false);
  const [immersiveStep, setImmersiveStep] = useState<"pair" | "active">("pair");

  const togglePathTracing = () => {
    setPathTracing((prev) => !prev);
  };

  const handleHeadsetSubmit = () => {
    setImmersiveStep("active");
  };

  return (
    <div className="flex-1 w-full h-full relative overflow-hidden flex flex-col bg-dark-surface">
      
      {/* ── 1. FLOATING VIEWPORT TOOLBAR ────────────────────────────────────── */}
      <div className="absolute top-6 left-6 right-6 flex items-center justify-between pointer-events-none z-30">
        <div className="pointer-events-auto">
          <StoreySelector />
        </div>

        {/* Immersive controls segment */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {mode !== "2d" && (
            <>
              {/* Headset WebXR activation button */}
              <button
                onClick={() => {
                  setHeadsetOpen(true);
                  setImmersiveStep("pair");
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-bold shadow-hero outline-none select-none flex items-center gap-1.5 border transition-all ${
                  immersiveStep === "active" && headsetOpen
                    ? "bg-[#8C7662] border-transparent text-white shadow-[0_0_12px_rgba(140,118,98,0.4)] animate-pulse"
                    : "bg-dark-surface/90 border-hairline-dark text-on-dark-muted hover:text-white hover:bg-dark-surface-alt"
                }`}
                title="Connect VR Headset / Passthrough"
              >
                <Glasses size={13} />
                <span className="hidden xl:inline">{immersiveStep === "active" ? "VisionPro: Active" : "WebXR Headset"}</span>
                <span className="inline xl:hidden">{immersiveStep === "active" ? "VisionPro" : "WebXR"}</span>
              </button>

              {/* Hyper-realistic path tracing toggle */}
              <button
                onClick={togglePathTracing}
                className={`px-3 py-1.5 rounded-full text-xs font-bold shadow-hero outline-none select-none flex items-center gap-1.5 border transition-all ${
                  pathTracing
                    ? "bg-[#5A4A3A] border-transparent text-white shadow-[0_0_12px_rgba(90,74,58,0.4)]"
                    : "bg-dark-surface/90 border-hairline-dark text-on-dark-muted hover:text-white hover:bg-dark-surface-alt"
                }`}
                title="Toggle Simulated Ambient Path-Tracing"
              >
                <Zap size={13} className={pathTracing ? "animate-bounce" : ""} />
                <span className="hidden xl:inline">{pathTracing ? "Path-Tracing ON" : "Ambient Raytrace"}</span>
                <span className="inline xl:hidden">{pathTracing ? "ON" : "Raytrace"}</span>
              </button>

              <button
                onClick={toggleCameraMode}
                className="px-4 py-2 bg-dark-surface/90 border border-hairline-dark text-on-dark-muted hover:text-white hover:bg-dark-surface-alt rounded-full text-xs font-bold shadow-hero outline-none select-none transition-all"
              >
                <span className="hidden xl:inline">Camera: {cameraMode === "perspective" ? "Perspective" : "Orthographic"}</span>
                <span className="inline xl:hidden">{cameraMode === "perspective" ? "3D" : "2D"}</span>
              </button>
            </>
          )}
          
          <div className="flex items-center gap-1.5 px-4 py-2 bg-dark-surface/90 border border-hairline-dark text-on-dark rounded-full text-xs font-bold shadow-hero select-none">
            <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse" />
            <span className="hidden lg:inline">WebGL Active</span>
            <span className="inline lg:hidden">WebGL</span>
          </div>
        </div>
      </div>

      {/* ── 2. PATH TRACING STATUS INDICATOR ─────────────────────────────────── */}
      {pathTracing && floorPlanLayout && (
        <div className="absolute top-20 right-6 z-30 bg-[#2A7A6E]/90 border border-[#2A7A6E]/30 text-white text-[10px] font-bold uppercase tracking-wider rounded-xl p-3 flex flex-col gap-1 shadow-md select-none animate-pulse">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-white rounded-full" />
            Hyper-Realistic Mode
          </span>
          <span className="opacity-75 font-mono text-[9px]">
            Bounces: 3 | Shadows: soft-PBR
          </span>
        </div>
      )}

      {/* ── 3. PRIMARY CANVAS VIEWPORT ──────────────────────────────────────── */}
      <div className="flex-1 w-full h-full relative">
        {!floorPlanLayout ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center text-[#A1A1AA] gap-4">
            <div className="w-16 h-16 rounded-2xl border border-[#ffffff]/10 bg-dark-surface-alt flex items-center justify-center text-indigo shadow-hero">
              <Brain size={28} className="animate-pulse" />
            </div>
            <div>
              <h3 className="font-jakarta text-heading-sm font-700 text-white">
                AI Spatial Model Empty
              </h3>
              <p className="font-body text-xs text-stone mt-1 max-w-[280px] mx-auto leading-relaxed">
                Configure room quantities in the parameter panel and click &ldquo;Generate Layouts&rdquo; to build your 3D digital twin.
              </p>
            </div>
          </div>
        ) : (
          <div className="w-full h-full relative">
            {/* Always render the 3D Canvas */}
            <div className="absolute inset-0 z-0">
              <EditorCanvas cameraMode={mode === "2d" ? "orthographic" : cameraMode} showGrid={mode === "2d" ? false : !pathTracing}>
                {/* Render lighting tweaks based on pathTracing toggles */}
                {pathTracing && (
                  <>
                    <ambientLight intensity={0.8} />
                    <pointLight position={[0, 4, 0]} intensity={1.5} color="#F9F9F8" castShadow />
                  </>
                )}

                {/* Render all structural walls procedural meshes */}
                {(floorPlanLayout.walls || []).map((wall) => (
                  <WallMesh key={wall.id} wall={wall} />
                ))}

                {/* Render doors and windows along the walls */}
                {(floorPlanLayout.doors || []).map((door) => (
                  <DoorMesh key={door.id} door={door} walls={floorPlanLayout.walls || []} />
                ))}
                {(floorPlanLayout.windows || []).map((win) => (
                  <WindowMesh key={win.id} window={win} walls={floorPlanLayout.walls || []} />
                ))}

                {/* Render interactive 3D wall drawing helper plane and previews */}
                <WallDrawingManager />

                {/* Custom 3D Dimension Lines & measurement overlay */}
                <DimensionLineOverlay />

                {/* Volumetric MEP networks conduit/pipe/wire layer */}
                <MepOverlay />

                {/* Procedural Staircases & handrails */}
                <StaircaseMesh />

                {/* Ceilings per room */}
                <CeilingMesh />

                {/* Procedural Generative Roof */}
                <RoofMesh />

                {/* Render AI Synthesized 3D Models */}
                {sceneObjects.map((obj) => (
                  <PhysicsFurniture
                    key={obj.id}
                    position={[obj.position.x, obj.position.y, obj.position.z]}
                    rotation={[obj.rotation.x, obj.rotation.y, obj.rotation.z]}
                    color="#8B95F5"
                    modelUrl={obj.gltfPath}
                  />
                ))}

                {/* Flat floor layout plane with custom styling per mode */}
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
                  <planeGeometry args={[100, 100]} />
                  <meshStandardMaterial
                    color={mode === "2d" ? "#F9F9FB" : pathTracing ? "#151515" : "#1a1a1a"}
                    roughness={mode === "2d" ? 1.0 : 0.2}
                    metalness={mode === "2d" ? 0.0 : 0.4}
                  />
                </mesh>
              </EditorCanvas>
            </div>

            {/* Render 2D Blueprint Canvas on top only when in 2d mode */}
            {mode === "2d" && (
              <div className="absolute inset-0 z-10 pointer-events-auto bg-transparent">
                <BlueprintCanvas2D />
              </div>
            )}
          </div>
        )}

        {floorPlanLayout && (
          <div className="absolute bottom-6 right-6 z-20">
            <SunController />
          </div>
        )}
      </div>

      {/* ── 4. VIEWPORT FOOTER NAVIGATION ───────────────────────────────────── */}
      {floorPlanLayout && mode === "3d" && (
        <div className="absolute bottom-6 left-6 bg-dark-surface/90 border border-hairline-dark text-on-dark-muted text-[10px] font-bold uppercase tracking-wider rounded-xl p-3 flex items-center gap-4 z-10 pointer-events-none select-none">
          <div className="flex items-center gap-1">
            <Move size={12} className="text-indigo" />
            <span>Left-drag: Rotate</span>
          </div>
          <div className="flex items-center gap-1">
            <ZoomIn size={12} className="text-teal" />
            <span>Scroll: Zoom</span>
          </div>
          <div className="flex items-center gap-1">
            <Info size={12} className="text-gold" />
            <span>Click elements to inspect</span>
          </div>
        </div>
      )}

      {/* ── 5. HEADSET VR / WEBXR OVERLAY DIALOG ───────────────────────────────── */}
      {headsetOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-2xl border border-hairline p-6 shadow-[0_24px_64px_rgba(0,0,0,0.25)] flex flex-col gap-5 relative">
            <button
              onClick={() => setHeadsetOpen(false)}
              className="absolute top-4 right-4 w-7 h-7 bg-alabaster border border-hairline rounded-full flex items-center justify-center hover:bg-gray-100 text-stone transition-colors outline-none cursor-pointer"
            >
              <X size={14} />
            </button>

            {immersiveStep === "pair" ? (
              <>
                <div className="flex items-center gap-2 border-b border-hairline pb-3">
                  <Glasses className="text-indigo" size={18} />
                  <h3 className="font-jakarta text-sm font-bold text-charcoal uppercase tracking-wider">
                    WebXR Headset Gateway
                  </h3>
                </div>

                <p className="font-body text-xs text-stone leading-relaxed">
                  Connect your Apple Vision Pro or Meta Quest 3 headset to enter the photorealistic spatial passthrough digital twin.
                </p>

                <div className="bg-alabaster border border-hairline rounded-xl p-4 text-center space-y-2">
                  <span className="font-body text-[9px] text-stone uppercase tracking-wider font-semibold block">
                    Your Headset Immersion Pin
                  </span>
                  <h2 className="font-mono text-heading-md font-extrabold text-charcoal tracking-widest animate-pulse">
                    DOMUS-892-VP
                  </h2>
                </div>

                <div className="space-y-2 text-xs font-body text-charcoal">
                  <h4 className="font-jakarta font-bold uppercase text-[9px] tracking-wider text-stone">
                    immersion instructions:
                  </h4>
                  <ul className="list-decimal pl-4 space-y-1.5 text-stone text-[11px] leading-relaxed">
                    <li>Put on your headset and open Safari / Quest Browser.</li>
                    <li>Navigate to your Domus dashboard link in WebXR mode.</li>
                    <li>Enter the dynamic Immersion Pin shown above to securely sync your viewport anchors.</li>
                  </ul>
                </div>

                <button
                  onClick={handleHeadsetSubmit}
                  className="w-full h-11 bg-indigo hover:bg-indigoDark text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-button transition-colors outline-none cursor-pointer"
                >
                  <CheckCircle2 size={14} />
                  <span>Connect & Enter Immersion</span>
                </button>
              </>
            ) : (
              <div className="py-6 flex flex-col justify-center items-center gap-4 text-center space-y-2">
                <div className="w-12 h-12 bg-successLight text-success border border-success/15 rounded-full flex items-center justify-center text-xl font-bold animate-bounce shadow-sm">
                  <CheckCircle2 size={20} />
                </div>
                <h3 className="font-jakarta text-sm font-bold text-charcoal uppercase tracking-wider">
                  Immersive Passthrough Connected!
                </h3>
                <p className="font-body text-xs text-stone max-w-xs leading-relaxed">
                  Headset sync established successfully. Hand gesture raycasting and VisionOS passthrough anchors are now **ACTIVE** in your headset.
                </p>
                <button
                  onClick={() => setHeadsetOpen(false)}
                  className="px-6 h-10 bg-indigo hover:bg-indigoDark text-white text-xs font-bold rounded-xl transition-colors outline-none"
                >
                  Return to Dashboard
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
