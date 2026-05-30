"use client";

import React from "react";
import { useBox } from "@react-three/cannon";

interface BoundaryProps {
  position: [number, number, number];
  rotation?: [number, number, number];
  args: [number, number, number];
}

/**
 * Static physical bounding box collider
 * Registers structural walls/floors natively into the Cannon physics engine
 * prevents furniture and scanning items from clipping.
 */
export default function PhysicsBoundary({
  position,
  rotation = [0, 0, 0],
  args,
}: BoundaryProps) {
  // Register static bounding collider in Cannon
  const [ref] = useBox(() => ({
    type: "Static",
    position,
    rotation,
    args,
  }));

  return (
    <mesh ref={ref as any}>
      <boxGeometry args={args} />
      <meshBasicMaterial transparent opacity={0.0} depthWrite={false} />
    </mesh>
  );
}
