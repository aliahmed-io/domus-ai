"use client";

import React from "react";
import { useEditorStore } from "@/store/useEditorStore";
import { useShallow } from "zustand/react/shallow";

export default function StaircaseMesh() {
  const { staircases, storeys, selectedObjectId, setSelectedObject } = useEditorStore(
    useShallow((s) => ({
      staircases: s.staircases,
      storeys: s.storeys,
      selectedObjectId: s.selectedObjectId,
      setSelectedObject: s.setSelectedObject,
    }))
  );

  return (
    <group>
      {staircases.filter(stair => storeys.some(level => level.id === stair.startStoreyId && level.isVisible !== false) && storeys.some(level => level.id === stair.endStoreyId && level.isVisible !== false)).map((stair) => {
        const riserMeters = stair.riserHeight * 0.0254;
        const widthMeters = stair.width * 0.0254;
        const treadDepthMeters = 0.28; // standard 11 inch tread depth (in meters)
        const isSelected = selectedObjectId === stair.id;
        const treadColor = isSelected ? "#4F46E5" : "#8C7662";
        const steps = Array.from({ length: stair.riserCount });
        const halfCount = Math.floor(stair.riserCount / 2);

        return (
          <group
            key={stair.id}
            position={[stair.position.x, stair.position.y, stair.position.z]}
            rotation={[stair.rotation.x, stair.rotation.y, stair.rotation.z]}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedObject(stair.id);
            }}
          >
            {stair.type === "spiral" ? (
              <group>
                {/* Central Structural Steel Column */}
                <mesh
                  position={[0, (stair.riserCount * riserMeters) / 2, 0]}
                  castShadow
                  receiveShadow
                >
                  <cylinderGeometry
                    args={[0.1, 0.1, stair.riserCount * riserMeters + 0.9, 16]}
                  />
                  <meshStandardMaterial color="#2C2621" metalness={0.8} roughness={0.25} />
                </mesh>
                {steps.map((_, idx) => {
                  const angle = (idx / Math.max(1, stair.riserCount)) * Math.PI * 1.75;
                  const py = (idx + 1) * riserMeters;
                  const radius = widthMeters * 0.55;
                  return (
                    <group key={idx} position={[0, py, 0]} rotation={[0, angle, 0]}>
                      <mesh position={[radius, 0, 0]} castShadow receiveShadow>
                        <boxGeometry args={[widthMeters * 0.9, 0.04, treadDepthMeters]} />
                        <meshStandardMaterial
                          color={treadColor}
                          roughness={0.4}
                          metalness={0.1}
                          emissive={isSelected ? "#312E81" : "#000000"}
                          emissiveIntensity={isSelected ? 0.25 : 0}
                        />
                      </mesh>
                      {/* Outer baluster post */}
                      <mesh position={[widthMeters * 0.95, 0.45, 0]}>
                        <cylinderGeometry args={[0.012, 0.012, 0.9, 8]} />
                        <meshStandardMaterial color="#C2A585" metalness={0.85} roughness={0.15} />
                      </mesh>
                    </group>
                  );
                })}
              </group>
            ) : stair.type === "l-shape" ? (
              <group>
                {steps.map((_, idx) => {
                  const stepHeight = 0.04;
                  if (idx < halfCount) {
                    const py = (idx + 1) * riserMeters;
                    const pz = -idx * treadDepthMeters;
                    return (
                      <mesh key={idx} position={[0, py, pz]} castShadow receiveShadow>
                        <boxGeometry args={[widthMeters, stepHeight, treadDepthMeters]} />
                        <meshStandardMaterial color={treadColor} roughness={0.4} metalness={0.1} />
                      </mesh>
                    );
                  }
                  const turnIdx = idx - halfCount;
                  const landingZ = -halfCount * treadDepthMeters - widthMeters / 2;
                  const py = (idx + 1) * riserMeters;
                  const px = widthMeters / 2 + (turnIdx + 0.5) * treadDepthMeters;
                  return (
                    <mesh key={idx} position={[px, py, landingZ]} castShadow receiveShadow>
                      <boxGeometry args={[treadDepthMeters, stepHeight, widthMeters]} />
                      <meshStandardMaterial color={treadColor} roughness={0.4} metalness={0.1} />
                    </mesh>
                  );
                })}
                {/* L-Shape Landing Platform */}
                <mesh
                  position={[
                    0,
                    halfCount * riserMeters,
                    -halfCount * treadDepthMeters - widthMeters / 2,
                  ]}
                  castShadow
                  receiveShadow
                >
                  <boxGeometry args={[widthMeters, 0.06, widthMeters]} />
                  <meshStandardMaterial color={treadColor} roughness={0.45} metalness={0.1} />
                </mesh>
              </group>
            ) : stair.type === "u-shape" ? (
              <group>
                {steps.map((_, idx) => {
                  const stepHeight = 0.04;
                  if (idx < halfCount) {
                    const py = (idx + 1) * riserMeters;
                    const pz = -idx * treadDepthMeters;
                    return (
                      <mesh key={idx} position={[0, py, pz]} castShadow receiveShadow>
                        <boxGeometry args={[widthMeters, stepHeight, treadDepthMeters]} />
                        <meshStandardMaterial color={treadColor} roughness={0.4} metalness={0.1} />
                      </mesh>
                    );
                  }
                  const returnIdx = idx - halfCount;
                  const py = (idx + 1) * riserMeters;
                  const pz = -(halfCount - 1 - returnIdx) * treadDepthMeters;
                  const px = widthMeters * 1.15;
                  return (
                    <mesh key={idx} position={[px, py, pz]} castShadow receiveShadow>
                      <boxGeometry args={[widthMeters, stepHeight, treadDepthMeters]} />
                      <meshStandardMaterial color={treadColor} roughness={0.4} metalness={0.1} />
                    </mesh>
                  );
                })}
                {/* U-Shape Double Landing Platform */}
                <mesh
                  position={[
                    widthMeters * 0.575,
                    halfCount * riserMeters,
                    -halfCount * treadDepthMeters - widthMeters / 2,
                  ]}
                  castShadow
                  receiveShadow
                >
                  <boxGeometry args={[widthMeters * 2.15, 0.06, widthMeters]} />
                  <meshStandardMaterial color={treadColor} roughness={0.45} metalness={0.1} />
                </mesh>
              </group>
            ) : (
              <>
                {steps.map((_, idx) => {
                  const stepHeight = 0.04;
                  const stepWidth = widthMeters;
                  const stepLength = treadDepthMeters;

                  const px = 0;
                  const py = (idx + 1) * riserMeters;
                  const pz = -idx * treadDepthMeters;

                  const rx = 0;
                  const ry = py - riserMeters / 2;
                  const rz = pz + stepLength / 2 - 0.02;

                  return (
                    <group key={idx}>
                      <mesh position={[px, py, pz]} castShadow receiveShadow>
                        <boxGeometry args={[stepWidth, stepHeight, stepLength]} />
                        <meshStandardMaterial
                          color={treadColor}
                          roughness={0.4}
                          metalness={0.1}
                          emissive={isSelected ? "#312E81" : "#000000"}
                          emissiveIntensity={isSelected ? 0.25 : 0}
                        />
                      </mesh>

                      {idx > 0 && (
                        <mesh position={[rx, ry, rz]} castShadow receiveShadow>
                          <boxGeometry args={[stepWidth, riserMeters, 0.04]} />
                          <meshStandardMaterial
                            color="#FAF8F5"
                            roughness={0.8}
                            metalness={0.0}
                          />
                        </mesh>
                      )}
                    </group>
                  );
                })}

                {[-1, 1].map(side => {
                  const rise = (stair.riserCount - 1) * riserMeters;
                  const run = (stair.riserCount - 1) * treadDepthMeters;
                  return <mesh key={side}
                    position={[side * (widthMeters / 2 + 0.03), riserMeters + rise / 2 + 0.85, -run / 2]}
                    rotation={[-Math.atan2(run, rise), 0, 0]}>
                    <cylinderGeometry args={[0.025, 0.025, Math.hypot(rise, run), 8]} />
                    <meshStandardMaterial color="#8C7662" metalness={0.4} roughness={0.4} />
                  </mesh>;
                })}
              </>
            )}
          </group>
        );
      })}
    </group>
  );
}
