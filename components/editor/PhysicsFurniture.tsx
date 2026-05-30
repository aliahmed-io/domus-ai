"use client";

import React from "react";
import { useBox } from "@react-three/cannon";

interface PhysicsFurnitureProps {
  position: [number, number, number];
  color: string;
  args?: [number, number, number];
}

/**
 * High-performance physical furniture box
 * Uses @react-three/cannon for real-time rigid body dynamics.
 * Clicking the mesh applies a physical impulse (pops the furniture up).
 */
export default function PhysicsFurniture({
  position,
  color,
  args = [1, 0.8, 1],
}: PhysicsFurnitureProps) {
  // Register dynamic box collider with mass in Cannon physics engine
  const [ref, api] = useBox(() => ({
    mass: 8, // 8kg weight
    position,
    args,
    allowSleep: true,
  }));

  const handlePointerDown = (e: any) => {
    e.stopPropagation();
    // Pop the furniture in the air with upward vertical impulse & random rotation torque
    api.velocity.set(0, 4.5, 0);
    api.angularVelocity.set(
      (Math.random() - 0.5) * 6,
      (Math.random() - 0.5) * 4,
      (Math.random() - 0.5) * 6
    );
  };

  return (
    <mesh
      ref={ref as any}
      castShadow
      receiveShadow
      onPointerDown={handlePointerDown}
    >
      <boxGeometry args={args} />
      <meshStandardMaterial
        color={color}
        roughness={0.4}
        metalness={0.1}
      />
    </mesh>
  );
}
