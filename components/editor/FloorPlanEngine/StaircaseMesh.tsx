"use client";

import React from "react";
import { useEditorStore } from "@/store/useEditorStore";
import { useShallow } from "zustand/react/shallow";
import { feetToMeters } from "@/lib/utils";
import type { Staircase } from "@/types/puter";

export default function StaircaseMesh() {
  const { staircases } = useEditorStore(
    useShallow((s) => ({
      staircases: s.staircases,
    }))
  );

  return (
    <group>
      {staircases.map((stair) => {
        const riserMeters = feetToMeters(stair.riserHeight / 12);
        const widthMeters = feetToMeters(stair.width / 12);
        const treadDepthMeters = 0.28; // standard 11 inch tread depth (in meters)

        // Generate coordinates for each step
        const steps = Array.from({ length: stair.riserCount });

        return (
          <group
            key={stair.id}
            position={[stair.position.x, stair.position.y, stair.position.z]}
            rotation={[stair.rotation.x, stair.rotation.y, stair.rotation.z]}
          >
            {steps.map((_, idx) => {
              // Calculate progressive riser height and forward tread offsets
              const stepHeight = 0.04; // thickness of wood step tread
              const stepWidth = widthMeters;
              const stepLength = treadDepthMeters;

              // Position of this tread
              const px = 0;
              const py = idx * riserMeters;
              const pz = -idx * treadDepthMeters;

              // Position of the structural riser vertical panel behind it
              const rx = 0;
              const ry = py - riserMeters / 2;
              const rz = pz + stepLength / 2 - 0.02;

              return (
                <group key={idx}>
                  {/* Step Wood Tread */}
                  <mesh position={[px, py, pz]} castShadow receiveShadow>
                    <boxGeometry args={[stepWidth, stepHeight, stepLength]} />
                    <meshStandardMaterial 
                      color="#8C7662" // Warm Oak wood color matching our theme
                      roughness={0.4} 
                      metalness={0.1} 
                    />
                  </mesh>

                  {/* Step Riser Support Panel */}
                  {idx > 0 && (
                    <mesh position={[rx, ry, rz]} castShadow receiveShadow>
                      <boxGeometry args={[stepWidth, riserMeters, 0.04]} />
                      <meshStandardMaterial 
                        color="#FAF8F5" // Alabaster white structure color
                        roughness={0.8}
                        metalness={0.0}
                      />
                    </mesh>
                  )}
                </group>
              );
            })}

            {/* Handrail on the left */}
            <mesh position={[-widthMeters / 2 - 0.05, (stair.riserCount * riserMeters) / 2, -(stair.riserCount * treadDepthMeters) / 2]}>
              <cylinderGeometry args={[0.02, 0.02, stair.riserCount * 0.35, 8]} />
              <meshStandardMaterial color="#C2A585" metalness={0.9} roughness={0.1} /> {/* Gold handrail */}
            </mesh>
            
            {/* Handrail on the right */}
            <mesh position={[widthMeters / 2 + 0.05, (stair.riserCount * riserMeters) / 2, -(stair.riserCount * treadDepthMeters) / 2]}>
              <cylinderGeometry args={[0.02, 0.02, stair.riserCount * 0.35, 8]} />
              <meshStandardMaterial color="#C2A585" metalness={0.9} roughness={0.1} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}
