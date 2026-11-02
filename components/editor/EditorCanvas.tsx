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
  Lightformer,
  ContactShadows,
  Loader,
  PerspectiveCamera,
  OrthographicCamera,
} from "@react-three/drei";
import { feetToMeters } from "@/lib/utils";
import { useIsClient } from "@/lib/useIsClient";
import { XR, createXRStore } from "@react-three/xr";
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
      gl.clippingPlanes = [
        new THREE.Plane(new THREE.Vector3(0, -1, 0), heightM),
      ];
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

// Called only after mount or from a user interaction. Server and first client renders stay identical.
let sharedXRStore: ReturnType<typeof createXRStore> | null = null;
const xrListeners = new Set<() => void>();
export function getXRStore() {
  if (!sharedXRStore) {
    sharedXRStore = createXRStore({ emulate: false });
    xrListeners.forEach((listener) => listener());
  }
  return sharedXRStore;
}
const subscribeXR = (listener: () => void) => {
  xrListeners.add(listener);
  getXRStore();
  return () => {
    xrListeners.delete(listener);
  };
};
const getXRRuntime = () => sharedXRStore;
const getServerXRRuntime = () => null;

function SceneCamera({
  orthographic,
  center,
  span,
}: {
  orthographic: boolean;
  center: [number, number, number];
  span: number;
}) {
  const size = useThree((state) => state.size);
  const zoom = Math.min(size.width, size.height) / Math.max(span * 1.5, 10);
  const position: [number, number, number] = [
    center[0] + span * 1.1 * Math.max(1, size.height / size.width),
    span * 1.3 * Math.max(1, size.height / size.width),
    center[2] + span * 1.1 * Math.max(1, size.height / size.width),
  ];
  return orthographic ? (
    <OrthographicCamera
      makeDefault
      position={position}
      zoom={zoom}
      near={0.01}
      far={2000}
    />
  ) : (
    <PerspectiveCamera
      makeDefault
      position={position}
      fov={42}
      near={0.05}
      far={2000}
    />
  );
}

interface EditorCanvasProps {
  children?: React.ReactNode;
  cameraMode?: "perspective" | "orthographic";
  showGrid?: boolean;
}

export default function EditorCanvas({
  children,
  cameraMode = "perspective",
  showGrid = false,
}: EditorCanvasProps) {
  const mounted = useIsClient();
  const xrRuntime = React.useSyncExternalStore(
    subscribeXR,
    getXRRuntime,
    getServerXRRuntime,
  );
  const lighting = useEditorStore((state) => state.sceneLighting);
  const isDev = process.env.NODE_ENV === "development";
  const mode = useEditorStore((s) => s.mode);
  const xrScale = useEditorStore((s) => s.xrScale);

  const layout = useEditorStore((state) => state.floorPlanLayout);
  const framing = React.useMemo(() => {
    const points =
      layout?.walls.flatMap((wall) => [wall.start, wall.end]) ?? [];
    if (!points.length)
      return { center: [0, 0, 0] as [number, number, number], span: 8 };
    const xs = points.map((point) => feetToMeters(point.x));
    const zs = points.map((point) => feetToMeters(point.y));
    const minX = Math.min(...xs),
      maxX = Math.max(...xs),
      minZ = Math.min(...zs),
      maxZ = Math.max(...zs);
    return {
      center: [(minX + maxX) / 2, 0, (minZ + maxZ) / 2] as [
        number,
        number,
        number,
      ],
      span: Math.max(maxX - minX, maxZ - minZ, 4),
    };
  }, [layout]);

  // Initialize WebRTC Y.js Multiplayer Synchronization
  useMultiplayerSync();

  if (!mounted || !xrRuntime) {
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
          frameloop={mode === "walk" || mode === "ar" ? "always" : "demand"}
          shadows={{ type: THREE.PCFShadowMap }}
          gl={{
            antialias: true,
            preserveDrawingBuffer: true,
            localClippingEnabled: true,
          }}
        >
          <color attach="background" args={["#f2f1ed"]} />
          <SceneCamera
            key={`${mode}-${cameraMode}`}
            orthographic={
              mode !== "walk" &&
              (cameraMode === "orthographic" || mode === "2d")
            }
            center={framing.center}
            span={framing.span}
          />
          {/* Synchronize camera viewport with 2D stage in 2D mode */}
          <CameraSync />

          <ambientLight intensity={0.3} />
          <hemisphereLight args={["#ffffff", "#e2ddd5", 0.65]} />
          <Environment resolution={128} frames={1} environmentIntensity={0.45}>
            <Lightformer
              intensity={1.3}
              position={[0, 8, 0]}
              scale={12}
              target={[0, 0, 0]}
            />
            <Lightformer
              intensity={1}
              position={[-8, 4, 6]}
              scale={8}
              target={[0, 0, 0]}
            />
          </Environment>
          {lighting === "sun" ? (
            <SunLight />
          ) : (
            <directionalLight
              position={[-6, 12, 8]}
              intensity={1.1}
              castShadow
              shadow-mapSize-width={1024}
              shadow-mapSize-height={1024}
              shadow-bias={-0.0005}
              shadow-radius={4}
            />
          )}
          <ContactShadows
            position={[0, -0.019, 0]}
            opacity={0.18}
            scale={35}
            blur={2.5}
            far={5}
            resolution={512}
            color="#8b8175"
          />

          {/* Section Plane Manager */}
          <SectionCutManager />

          {/* Interactive controls */}
          <OrbitControls
            makeDefault
            target={framing.center}
            enabled={mode !== "2d" && mode !== "walk"}
            enableDamping
            dampingFactor={0.05}
            maxPolarAngle={
              cameraMode === "orthographic" ? Math.PI / 2.1 : Math.PI / 2
            }
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
              cellColor="#b8aa99"
              sectionSize={2}
              sectionThickness={1}
              sectionColor="#9e8c79"
              fadeDistance={25}
              infiniteGrid
            />
          )}

          {/* Render children models inside high-speed Bvh raycaster and Physics simulator */}
          {xrRuntime ? (
            <XR store={xrRuntime}>
              <group scale={[xrScale, xrScale, xrScale]}>
                <Physics gravity={[0, -9.81, 0]}>
                  <>{children}</>
                </Physics>
              </group>
            </XR>
          ) : (
            <group scale={[xrScale, xrScale, xrScale]}>
              <Physics gravity={[0, -9.81, 0]}>
                <>{children}</>
              </Physics>
            </group>
          )}

          {/* Post-Processing Pipeline */}
          <EffectComposer multisampling={0}>
            <N8AO aoRadius={0.5} intensity={0.35} />
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
          <span className="text-white/80">
            Click canvas to lock cursor · WASD to walk · ESC to unlock
          </span>
        </div>
      )}
      <Loader />
    </div>
  );
}
