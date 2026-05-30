"use client";

import React, { useRef, useState } from "react";
import type { Mesh } from "three";
import { useEditorStore } from "@/store/useEditorStore";
import { useShallow } from "zustand/react/shallow";
import { feetToMeters } from "@/lib/utils";
import type { Door, Wall } from "@/types/puter";

interface DoorMeshProps {
  door: Door;
  walls: Wall[];
}

export default function DoorMesh({ door, walls }: DoorMeshProps) {
  const meshRef = useRef<Mesh>(null);
  const { selectedObjectId, setSelectedObject } = useEditorStore(
    useShallow((s) => ({
      selectedObjectId: s.selectedObjectId,
      setSelectedObject: s.setSelectedObject,
    }))
  );
  const [hovered, setHovered] = useState(false);

  // Find the parent wall
  const parentWall = walls.find((w) => w.id === door.wallId);
  if (!parentWall) return null;

  // Calculate parent wall vectors in meters
  const startX = feetToMeters(parentWall.start.x);
  const startZ = feetToMeters(parentWall.start.y);
  const endX = feetToMeters(parentWall.end.x);
  const endZ = feetToMeters(parentWall.end.y);

  const dx = endX - startX;
  const dz = endZ - startZ;
  const angle = -Math.atan2(dz, dx);

  // Position along the wall
  const p = door.position; // 0-1
  const doorX = startX + p * dx;
  const doorZ = startZ + p * dz;

  // Convert dimensions to meters
  const doorWidth = feetToMeters(door.width / 12); // inches to feet to meters
  const doorHeight = feetToMeters(6.8); // standard 80 inches (6.8 feet)
  const wallThickness = feetToMeters(parentWall.thickness / 12);

  const isSelected = selectedObjectId === door.id;

  return (
    <group
      position={[doorX, 0, doorZ]}
      rotation={[0, angle, 0]}
    >
      {/* Interactive area / click box */}
      <mesh
        ref={meshRef}
        position={[0, doorHeight / 2, 0]}
        onClick={(e) => {
          e.stopPropagation();
          setSelectedObject(door.id);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={() => setHovered(false)}
        visible={false}
      >
        <boxGeometry args={[doorWidth, doorHeight, wallThickness * 1.5]} />
      </mesh>

      {/* Door Frame (Left/Right/Top Posts) */}
      <group>
        {/* Left post */}
        <mesh position={[-doorWidth / 2 + 0.02, doorHeight / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.04, doorHeight, wallThickness * 1.1]} />
          <meshStandardMaterial color="#3D2E20" roughness={0.6} metalness={0.1} />
        </mesh>
        {/* Right post */}
        <mesh position={[doorWidth / 2 - 0.02, doorHeight / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.04, doorHeight, wallThickness * 1.1]} />
          <meshStandardMaterial color="#3D2E20" roughness={0.6} metalness={0.1} />
        </mesh>
        {/* Top header */}
        <mesh position={[0, doorHeight - 0.02, 0]} castShadow receiveShadow>
          <boxGeometry args={[doorWidth, 0.04, wallThickness * 1.1]} />
          <meshStandardMaterial color="#3D2E20" roughness={0.6} metalness={0.1} />
        </mesh>
      </group>

      {/* Door Panel (Rendered partially open at a 45-degree angle for visual premium look) */}
      <group position={[-doorWidth / 2 + 0.04, 0, 0]} rotation={[0, Math.PI / 4, 0]}>
        <mesh position={[doorWidth / 2 - 0.02, doorHeight / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[doorWidth - 0.06, doorHeight - 0.06, 0.04]} />
          <meshStandardMaterial
            color={
              isSelected
                ? "#5B6AF0" // Indigo active
                : hovered
                  ? "#8B95F5"
                  : "#C2A585" // Brushed gold/brown wood door
            }
            roughness={0.4}
            metalness={0.2}
          />
        </mesh>
        {/* Door handle knob */}
        <mesh position={[doorWidth - 0.12, doorHeight / 2, 0.05]} castShadow>
          <sphereGeometry args={[0.025, 16, 16]} />
          <meshStandardMaterial color="#FFD700" roughness={0.1} metalness={0.9} />
        </mesh>
        <mesh position={[doorWidth - 0.12, doorHeight / 2, -0.05]} castShadow>
          <sphereGeometry args={[0.025, 16, 16]} />
          <meshStandardMaterial color="#FFD700" roughness={0.1} metalness={0.9} />
        </mesh>
      </group>

      {/* Swing arc indicator on the floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]} receiveShadow>
        <ringGeometry args={[doorWidth - 0.06, doorWidth, 32, 1, 0, Math.PI / 4]} />
        <meshBasicMaterial
          color={isSelected ? "#5B6AF0" : "#C2A585"}
          opacity={0.3}
          transparent
        />
      </mesh>
    </group>
  );
}
