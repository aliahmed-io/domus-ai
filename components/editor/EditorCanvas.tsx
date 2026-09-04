"use client";

import React, { Suspense } from "react";
import * as THREE from "three";
import { Loader2 } from "lucide-react";
import { Leva } from "leva";
import SunLight from "./SunLight";
import { EffectComposer, N8AO, SMAA, Bloom } from "@react-three/postprocessing";
import { useEditorStore } from "@/store/useEditorStore";
import { useMultiplayerSync } from "@/lib/multiplayer";
import { Canvas, useThree, useFrame } from "@react-three/fiber";
import {
  OrbitControls,
  PointerLockControls,
  Grid,
  Environment,
  Bvh,
  AccumulativeShadows,
  RandomizedLight,
  Loader,
} from "@react-three/drei";
import { feetToMeters } from "@/lib/utils";
import { useIsClient } from "@/lib/useIsClient";
import { XR } from "@react-three/xr";
import { Physics } from "@react-three/rapier";

// CameraSync aligns the Three.js camera to the Konva 2D stage position and zoom
function CameraSync() {
  const size = useThree((s) => s.size);
  const mode = useEditorStore((s) => s.mode);
  const stageScale = useEditorStore((s) => s.stageScale);
  const stageX = useEditorStore((s) => s.stageX);
  const stageY = useEditorStore((s) => s.stageY);

  useFrame(({ camera }) => {
    if (mode === "2d") {
      const SCALE = 50; // pixels per meter
      // Convert Konva screen pan offsets to world meters
      const panX = -(stageX - size.width / 2) / (SCALE * stageScale);
      const panZ = -(stageY - size.height / 2) / (SCALE * stageScale);

      camera.position.set(panX, 15, panZ);
      camera.up.set(0, 0, -1);
      camera.lookAt(panX, 0, panZ);

      if (camera instanceof THREE.OrthographicCamera) {
        if (camera.zoom !== SCALE * stageScale) {
          camera.zoom = SCALE * stageScale;
          camera.updateProjectionMatrix();
        }
      }
    } else {
      if (camera.up.y !== 1) {
        camera.up.set(0, 1, 0);
      }
    }
  });

  return null;
}

function SectionCutManager() {
  const sectionCutHeight = useEditorStore((s) => s.sectionCutHeight);

  useFrame(({ gl }) => {
    if (sectionCutHeight !== null) {
      const heightM = feetToMeters(sectionCutHeight);
      gl.clippingPlanes = [new THREE.Plane(new THREE.Vector3(0, -1, 0), heightM)];
    } else if (gl.clippingPlanes.length > 0) {
      gl.clippingPlanes = [];
    }
  });

  return null;
}

function FirstPersonWalkController() {
  const keys = React.useRef<Record<string, boolean>>({});
  const initializedRef = React.useRef(false);
  const moveSpeed = 4.0;
  const eyeHeight = 1.7; // ~5.5 ft architectural eye level

  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      keys.current[e.code] = true;
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keys.current[e.code] = false;
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  useFrame(({ camera }, delta) => {
    if (!initializedRef.current) {
      initializedRef.current = true;
      if (camera.position.y > 3) {
        camera.position.set(0, eyeHeight, 5);
        camera.lookAt(0, eyeHeight, 0);
      }
    }

    const dt = Math.min(delta, 0.1);
    const forward = new THREE.Vector3();
    camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();

    const right = new THREE.Vector3();
    right.crossVectors(camera.up, forward).negate().normalize();

    const moveVector = new THREE.Vector3();

    if (keys.current["KeyW"] || keys.current["ArrowUp"]) {
      moveVector.add(forward);
    }
    if (keys.current["KeyS"] || keys.current["ArrowDown"]) {
      moveVector.sub(forward);
    }
    if (keys.current["KeyD"] || keys.current["ArrowRight"]) {
      moveVector.add(right);
    }
    if (keys.current["KeyA"] || keys.current["ArrowLeft"]) {
      moveVector.sub(right);
    }

    if (moveVector.lengthSq() > 0) {
      moveVector.normalize();
      camera.position.addScaledVector(moveVector, moveSpeed * dt);
    }

    camera.position.y = eyeHeight;
  });

  return <PointerLockControls makeDefault />;
}

import type { XRStore } from "@react-three/xr";

// We must create the XR store outside of the React render loop
let xrStore: XRStore | null = null;
if (typeof window !== "undefined") {
  import("@react-three/xr").then((m) => {
    xrStore = m.createXRStore() as unknown as XRStore;
  });
}
export { xrStore };

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
  const mounted = useIsClient();
  const isDev = process.env.NODE_ENV === "development";
  const mode = useEditorStore((s) => s.mode);
  const xrScale = useEditorStore((s) => s.xrScale);

  // Defer WebXR AR trigger until the Three.js canvas has mounted and bound successfully
  React.useEffect(() => {
    if (mounted && mode === "ar" && xrStore) {
      const t = setTimeout(() => {
        xrStore?.enterAR().catch((err) => {
          console.warn("WebGL XR Session error, could not start AR:", err);
        });
      }, 800);
      return () => clearTimeout(t);
    }
  }, [mode, mounted]);

  // Initialize WebRTC Y.js Multiplayer Synchronization
  useMultiplayerSync();

  if (!mounted) {
    return (
      <div className="relative w-full h-full bg-dark-surface-alt flex flex-col items-center justify-center text-stone gap-3">
        <Loader2 size={32} className="animate-spin text-indigo" />
        <span className="font-body text-xs font-medium">
          Initializing WebGL Context...
        </span>
      </div>
    );
  }

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
          shadows={{ type: THREE.PCFShadowMap }}
          gl={{ antialias: true, preserveDrawingBuffer: true, localClippingEnabled: true }}
          camera={
            cameraMode === "orthographic" || mode === "2d"
              ? { position: [0, 15, 0], fov: 50, up: [0, 0, -1] }
              : { position: [8, 8, 8], fov: 45 }
          }
        >
          {/* Synchronize camera viewport with 2D stage in 2D mode */}
          <CameraSync />

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

          {/* Section Plane Manager */}
          <SectionCutManager />

          {/* Interactive controls */}
          <OrbitControls
            enabled={mode !== "2d" && mode !== "walk"}
            enableDamping
            dampingFactor={0.05}
            maxPolarAngle={cameraMode === "orthographic" ? Math.PI / 2.1 : Math.PI / 2}
          />

          {/* First-Person Architectural Walk Controls */}
          {mode === "walk" && <FirstPersonWalkController />}

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
          {xrStore ? (
            <XR store={xrStore}>
              <group scale={[xrScale, xrScale, xrScale]}>
                <Physics gravity={[0, -9.81, 0]}>
                  <Bvh firstHitOnly>
                    {children}
                  </Bvh>
                </Physics>
              </group>
            </XR>
          ) : (
            <group scale={[xrScale, xrScale, xrScale]}>
              <Physics gravity={[0, -9.81, 0]}>
                <Bvh firstHitOnly>
                  {children}
                </Bvh>
              </Physics>
            </group>
          )}

          {/* Post-Processing Pipeline */}
          <EffectComposer multisampling={0}>
            <N8AO aoRadius={2} intensity={1} />
            <Bloom luminanceThreshold={1} mipmapBlur intensity={0.4} />
            <SMAA />
          </EffectComposer>

          {/* Developer FPS stats disabled due to Turbopack woff.mjs compilation bug */}
        </Canvas>
      </Suspense>
      {mode === "walk" && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-20 pointer-events-none bg-charcoal/85 backdrop-blur-md text-white text-xs px-5 py-2.5 rounded-full border border-white/20 shadow-xl flex items-center gap-2.5 select-none">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-medium">Walk Mode Active</span>
          <span className="text-white/40">|</span>
          <span className="text-white/80">Click canvas to lock cursor · WASD to walk · ESC to unlock</span>
        </div>
      )}
      <Loader />
    </div>
  );
}

