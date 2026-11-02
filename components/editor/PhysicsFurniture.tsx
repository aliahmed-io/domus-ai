"use client";

import { Mesh, MeshStandardMaterial } from "three";
import type { Material as Finish } from "@/types/puter";
import { useEditorStore } from "@/store/useEditorStore";
import React, { Suspense, useEffect } from "react";
import { RigidBody } from "@react-three/rapier";
import { toast } from "sonner";
import { useGLTF, Html } from "@react-three/drei";

// Robust WebGL/Three.js error boundary to catch GLTF remote loading/offline failures
class ThreeErrorBoundary extends React.Component<
  {
    children: React.ReactNode;
    fallback: React.ReactNode;
  },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; fallback: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    toast.error("A furniture model could not load. Its placeholder is marked in the scene. You can remove it or import another file.", { id: "model-load-error" });
    console.warn(
      "A furniture model could not be loaded:",
      error,
      errorInfo,
    );
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

interface PhysicsFurnitureProps {
  id?: string | undefined;
  name?: string | undefined;
  position: [number, number, number];
  rotation?: [number, number, number] | undefined;
  scale?: [number, number, number] | undefined;
  color: string;
  args?: [number, number, number] | undefined;
  modelUrl?: string | undefined;
  attachmentType?: "floor" | "ceiling" | "surface" | "wall" | undefined;
  isSelected?: boolean | undefined;
  onSelect?: (() => void) | undefined;
}

// Progressive GLTF Loader Component
function GltfModel({
  url,
  finish,
}: {
  url: string;
  finish?: Finish | undefined;
}) {
  const { scene } = useGLTF(url);
  const clonedScene = React.useMemo(() => {
    const copy = scene.clone(true);
    if (finish)
      copy.traverse((object) => {
        if (!(object instanceof Mesh)) return;
        const customize = (source: MeshStandardMaterial) => {
          const material = source.clone();
          if (material instanceof MeshStandardMaterial) {
            if (finish.color) material.color.set(finish.color);
            material.roughness = finish.roughness;
            material.metalness = finish.metalness;
          }
          return material;
        };
        object.material = Array.isArray(object.material)
          ? object.material.map(customize)
          : customize(object.material);
      });
    return copy;
  }, [scene, finish]);
  useEffect(
    () => () => {
      if (finish)
        clonedScene.traverse((object) => {
          if (object instanceof Mesh)
            (Array.isArray(object.material)
              ? object.material
              : [object.material]
            ).forEach((material) => material.dispose());
        });
    },
    [clonedScene, finish],
  );
  return <primitive object={clonedScene} castShadow receiveShadow />;
}

/**
 * Commercial-grade spatial furniture rigid-body mesh
 * Integrates Rapier physics with PMNDRS Drei LOD & progressive GLTF loaders.
 * Supports floor/ceiling attachment semantics with suspension cables and lighting.
 */
export default function PhysicsFurniture({
  id,
  name,
  position,
  rotation = [0, 0, 0],
  scale = [1, 1, 1],
  color,
  args = [0.85, 0.75, 0.85],
  modelUrl,
  attachmentType = "floor",
  isSelected = false,
  onSelect,
}: PhysicsFurnitureProps) {
  const finish = useEditorStore((state) =>
    id ? state.materials[id] : undefined,
  );
  const isRug = Boolean(name && /rug|carpet|mat/i.test(name));

  const fallbackBox = isRug ? (
    <mesh position={[0, 0.01, 0]} receiveShadow>
      <boxGeometry args={[1.8, 0.02, 2.4]} />
      <meshStandardMaterial
        color={isSelected ? "#4F46E5" : color}
        roughness={0.9}
        emissive={isSelected ? "#312E81" : "#000000"}
        emissiveIntensity={isSelected ? 0.25 : 0}
      />
    </mesh>
  ) : (
    <mesh position={[0, args[1] / 2, 0]} castShadow receiveShadow>
      <boxGeometry args={args} />
      <meshStandardMaterial
        color={isSelected ? "#4F46E5" : color}
        roughness={0.45}
        metalness={0.1}
        emissive={isSelected ? "#312E81" : "#000000"}
        emissiveIntensity={isSelected ? 0.25 : 0}
      />
    </mesh>
  );

  return (
    // kinematicPosition = stays exactly where placed, not affected by physics gravity
    <RigidBody
      type="kinematicPosition"
      position={position}
      rotation={rotation}
      colliders="trimesh"
    >
      <group
        scale={scale}
        onClick={(e) => {
          if (onSelect) {
            e.stopPropagation();
            onSelect();
          }
        }}
      >
        {isSelected && (
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]}>
            <ringGeometry args={[0.55, 0.62, 32]} />
            <meshBasicMaterial color="#4F46E5" transparent opacity={0.85} />
          </mesh>
        )}

        {attachmentType === "ceiling" && (
          <>
            {/* Ceiling canopy and suspension wire */}
            <mesh position={[0, 0.3, 0]}>
              <cylinderGeometry args={[0.005, 0.005, 0.6]} />
              <meshStandardMaterial
                color="#2B2D42"
                roughness={0.3}
                metalness={0.8}
              />
            </mesh>
            {/* Architectural warm point light from fixture */}
            <pointLight
              position={[0, -0.1, 0]}
              intensity={1.5}
              distance={6}
              decay={2}
              color="#FFF4E0"
            />
          </>
        )}

        {modelUrl ? (
          <ThreeErrorBoundary key={modelUrl} fallback={<group>{fallbackBox}<Html position={[0,1.1,0]} center style={{pointerEvents:"none"}}><span className="model-load-error">Model unavailable</span></Html></group>}>
            <Suspense fallback={fallbackBox}>
              <GltfModel url={modelUrl} finish={finish} />
            </Suspense>
          </ThreeErrorBoundary>
        ) : (
          fallbackBox
        )}
      </group>
    </RigidBody>
  );
}
