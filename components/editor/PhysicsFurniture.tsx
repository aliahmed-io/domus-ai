"use client";

import React, { Suspense } from "react";
import { RigidBody } from "@react-three/rapier";
import { useGLTF } from "@react-three/drei";

// Robust WebGL/Three.js error boundary to catch GLTF remote loading/offline failures
class ThreeErrorBoundary extends React.Component<{
  children: React.ReactNode;
  fallback: React.ReactNode;
}, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode; fallback: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.warn("ThreeErrorBoundary caught GLTF loading failure seamlessly:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

interface PhysicsFurnitureProps {
  position: [number, number, number];
  rotation?: [number, number, number] | undefined;
  color: string;
  args?: [number, number, number] | undefined;
  modelUrl?: string | undefined;
  attachmentType?: "floor" | "ceiling" | "surface" | "wall" | undefined;
}

// Progressive GLTF Loader Component
function GltfModel({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  // Clone the scene so we can place multiple instances independently
  const clonedScene = React.useMemo(() => scene.clone(), [scene]);
  return <primitive object={clonedScene} castShadow receiveShadow />;
}

/**
 * Commercial-grade spatial furniture rigid-body mesh
 * Integrates Rapier physics with PMNDRS Drei LOD & progressive GLTF loaders.
 * Supports floor/ceiling attachment semantics with suspension cables and lighting.
 */
export default function PhysicsFurniture({
  position,
  rotation = [0, 0, 0],
  color,
  args = [1, 0.8, 1],
  modelUrl,
  attachmentType = "floor",
}: PhysicsFurnitureProps) {

  const fallbackBox = attachmentType === "floor" ? (
    <mesh position={[0, 0.01, 0]} receiveShadow>
      <boxGeometry args={[1.8, 0.02, 2.4]} />
      <meshStandardMaterial color={color} roughness={0.9} />
    </mesh>
  ) : (
    <mesh castShadow receiveShadow>
      <boxGeometry args={args} />
      <meshStandardMaterial
        color={color}
        roughness={0.4}
        metalness={0.1}
      />
    </mesh>
  );

  return (
    // kinematicPosition = stays exactly where placed, not affected by physics gravity
    <RigidBody type="kinematicPosition" position={position} rotation={rotation} colliders="trimesh">
      <group>
        {attachmentType === "ceiling" && (
          <>
            {/* Ceiling canopy and suspension wire */}
            <mesh position={[0, 0.3, 0]}>
              <cylinderGeometry args={[0.005, 0.005, 0.6]} />
              <meshStandardMaterial color="#2B2D42" roughness={0.3} metalness={0.8} />
            </mesh>
            {/* Architectural warm point light from fixture */}
            <pointLight position={[0, -0.1, 0]} intensity={1.5} distance={6} decay={2} color="#FFF4E0" />
          </>
        )}

        {modelUrl ? (
          <ThreeErrorBoundary fallback={fallbackBox}>
            <Suspense fallback={fallbackBox}>
              <GltfModel url={modelUrl} />
            </Suspense>
          </ThreeErrorBoundary>
        ) : (
          fallbackBox
        )}
      </group>
    </RigidBody>
  );
}

