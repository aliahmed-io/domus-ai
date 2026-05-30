"use client";

import React, { Suspense } from "react";
import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";
import { Leva } from "leva";
import SunLight from "./SunLight";
import { EffectComposer, N8AO, SMAA, Bloom } from "@react-three/postprocessing";

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

const AccumulativeShadows = dynamic(
  () => import("@react-three/drei").then((m) => m.AccumulativeShadows),
  { ssr: false }
);

const RandomizedLight = dynamic(
  () => import("@react-three/drei").then((m) => m.RandomizedLight),
  { ssr: false }
);

const Physics = dynamic(
  () => import("@react-three/rapier").then((m) => m.Physics),
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
          <Environment preset="apartment" />
          <ambientLight intensity={0.5} />
          <SunLight />
          <pointLight position={[-10, 10, -10]} intensity={0.4} />

          {/* High Fidelity Baked Shadows */}
          <AccumulativeShadows
            temporal
            frames={100}
            color="black"
            colorBlend={0.5}
            alphaTest={0.9}
            scale={50}
            position={[0, -0.005, 0]}
          >
            <RandomizedLight
              amount={8}
              radius={4}
              ambient={0.5}
              intensity={1}
              position={[5, 5, -10]}
              bias={0.001}
            />
          </AccumulativeShadows>

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

          {/* Post-Processing Pipeline */}
          <EffectComposer multisampling={0}>
            <N8AO aoRadius={2} intensity={1} />
            <Bloom luminanceThreshold={1} mipmapBlur intensity={0.4} />
            <SMAA />
          </EffectComposer>

          {/* Developer FPS stats */}
          {isDev && <Stats className="!absolute !left-auto !right-6 !bottom-6 !top-auto" />}
        </Canvas>
      </Suspense>
      <Loader />
    </div>
  );
}

