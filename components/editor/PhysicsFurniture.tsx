"use client";

import React, { Suspense } from "react";
import { RigidBody, CuboidCollider } from "@react-three/rapier";
import { Detailed, useGLTF } from "@react-three/drei";

interface PhysicsFurnitureProps {
  position: [number, number, number];
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

  const halfExtents: [number, number, number] = [args[0] / 2, args[1] / 2, args[2] / 2];

  return (
    <RigidBody position={position} colliders={false} mass={12}>
      <CuboidCollider args={halfExtents} />
      <group>
        {modelUrl ? (
          <Detailed distances={[0, 12, 28]}>
            {/* HIGH LOD: Real-time Draco GLTF primitives */}
            <Suspense fallback={fallbackBox}>
              <GltfModel url={modelUrl} />
            </Suspense>

            {/* MEDIUM LOD: simplified colored box */}
            {fallbackBox}

            {/* LOW LOD: wireframe box helper to optimize draw calls for distant cameras */}
            <mesh>
              <boxGeometry args={args} />
              <meshBasicMaterial color={color} wireframe />
            </mesh>
          </Detailed>
        ) : (
          fallbackBox
        )}
      </group>
    </RigidBody>
  );
}

