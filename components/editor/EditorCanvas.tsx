"use client";

import React, { Suspense } from "react";
import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";
import { Perf } from "r3f-perf";
import { Leva } from "leva";

// Dynamically import Three.js components to prevent SSR errors
const Canvas = dynamic(
  () => import("@react-three/fiber").then((m) => m.Canvas),
  { ssr: false }
);

const OrbitControls = dynamic(
  () => import("@react-three/drei").then((m) => m.OrbitControls),
  { ssr: false }
);

const Grid = dynamic(
  () => import("@react-three/drei").then((m) => m.Grid),
  { ssr: false }
);

const Stats = dynamic(
  () => import("@react-three/drei").then((m) => m.Stats),
  { ssr: false }
);

const SoftShadows = dynamic(
  () => import("@react-three/drei").then((m) => m.SoftShadows),
  { ssr: false }
);

const Environment = dynamic(
  () => import("@react-three/drei").then((m) => m.Environment),
  { ssr: false }
);

const Bvh = dynamic(
  () => import("@react-three/drei").then((m) => m.Bvh),
  { ssr: false }
);

const Physics = dynamic(
  () => import("@react-three/cannon").then((m) => m.Physics),
  { ssr: false }
);

const Loader = dynamic(
  () => import("@react-three/drei").then((m) => m.Loader),
  { ssr: false }
);

interface EditorCanvasProps {
  children?: React.ReactNode;
  cameraMode?: "perspective" | "orthographic";
  showGrid?: boolean;
}

export default function EditorCanvas({
  children,
  cameraMode = "perspective",
  showGrid = true,
}: EditorCanvasProps) {
  const isDev = process.env.NODE_ENV === "development";

  return (
    <div className="relative w-full h-full bg-dark-surface-alt">
      {isDev && <Leva collapsed hidden={!isDev} />}
      <Suspense
        fallback={
          <div className="absolute inset-0 flex flex-col items-center justify-center text-stone gap-3">
            <Loader2 size={32} className="animate-spin text-indigo" />
            <span className="font-body text-xs font-medium">
              Initializing WebGL Context...
            </span>
          </div>
        }
      >
        <Canvas
          frameloop="demand"
          shadows
          gl={{ antialias: true, preserveDrawingBuffer: true }}
          camera={
            cameraMode === "orthographic"
              ? { position: [0, 15, 0], fov: 50, up: [0, 0, -1] }
              : { position: [8, 8, 8], fov: 45 }
          }
        >
          {/* General Scene Lighting */}
          <SoftShadows size={25} focus={0} samples={16} />
          <Environment preset="apartment" />
          <ambientLight intensity={0.5} />
          <directionalLight
            position={[12, 18, 12]}
            intensity={1.2}
            castShadow
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
            shadow-bias={-0.0001}
          />
          <pointLight position={[-10, 10, -10]} intensity={0.4} />

          {/* Interactive controls */}
          <OrbitControls
            enableDamping
            dampingFactor={0.05}
            maxPolarAngle={cameraMode === "orthographic" ? Math.PI / 2.1 : Math.PI / 2}
          />

          {/* Infinite Spatial Helper Grid */}
          {showGrid && (
            <Grid
              renderOrder={-1}
              position={[0, -0.01, 0]}
              args={[30, 30]}
              cellSize={0.5}
              cellThickness={0.5}
              cellColor="#6f738a"
              sectionSize={2}
              sectionThickness={1}
              sectionColor="#5B6AF0"
              fadeDistance={25}
              infiniteGrid
            />
          )}

          {/* Render children models inside high-speed Bvh raycaster and Physics simulator */}
          <Physics gravity={[0, -9.81, 0]}>
            <Bvh firstHitOnly>
              {children}
            </Bvh>
          </Physics>

          {/* Developer FPS stats */}
          {isDev && <Perf position="top-left" />}
          {isDev && <Stats className="!absolute !left-auto !right-6 !bottom-6 !top-auto" />}
        </Canvas>
      </Suspense>
      <Loader />
    </div>
  );
}
