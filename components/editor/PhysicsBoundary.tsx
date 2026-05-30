"use client";

import React from "react";
import { RigidBody, CuboidCollider } from "@react-three/rapier";

interface BoundaryProps {
  position: [number, number, number];
  rotation?: [number, number, number];
  args: [number, number, number];
}

/**
 * Static physical bounding box collider
 * Registers structural walls/floors natively into the Rapier physics engine
 * prevents furniture and scanning items from clipping.
 */
export default function PhysicsBoundary({
  position,
  rotation = [0, 0, 0],
  args,
}: BoundaryProps) {
  // args for boxGeometry are [width, height, depth], 
  // CuboidCollider args are half-extents [hx, hy, hz]
  const halfExtents: [number, number, number] = [args[0] / 2, args[1] / 2, args[2] / 2];

  return (
    <RigidBody type="fixed" position={position} rotation={rotation}>
      <CuboidCollider args={halfExtents} />
      <mesh>
        <boxGeometry args={args} />
        <meshBasicMaterial transparent opacity={0.0} depthWrite={false} />
      </mesh>
    </RigidBody>
  );
}

