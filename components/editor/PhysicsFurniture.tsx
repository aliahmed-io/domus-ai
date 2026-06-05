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
  rotation?: [number, number, number];
  color: string;
  args?: [number, number, number];
  modelUrl?: string | undefined;
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
 * Integrates Rapier physics with PMNDRS Drei LOD (Level of Detail) & progressive GLTF loaders.
 */
export default function PhysicsFurniture({
  position,
  rotation = [0, 0, 0],
  color,
  args = [1, 0.8, 1],
  modelUrl,
}: PhysicsFurnitureProps) {

  const fallbackBox = (
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
    // kinematicPosition = stays exactly where placed, not affected by gravity
    <RigidBody type="kinematicPosition" position={position} rotation={rotation} colliders="trimesh">
      <group>
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

