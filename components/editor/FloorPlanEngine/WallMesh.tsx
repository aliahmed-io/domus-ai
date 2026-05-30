"use client";

import React, { useRef, useState } from "react";
import type { Mesh } from "three";
import { useEditorStore } from "@/store/useEditorStore";
import { useShallow } from "zustand/react/shallow";
import { feetToMeters } from "@/lib/utils";
import type { Wall } from "@/types/puter";
import PhysicsBoundary from "../PhysicsBoundary";

interface WallMeshProps {
  wall: Wall;
}

export default function WallMesh({ wall }: WallMeshProps) {
  const meshRef = useRef<Mesh>(null);
  const { selectedObjectId, setSelectedObject } = useEditorStore(
    useShallow((s) => ({
      selectedObjectId: s.selectedObjectId,
      setSelectedObject: s.setSelectedObject,
    }))
  );
  const [hovered, setHovered] = useState(false);

  // 1. CALCULATE WALL VECTORS IN METERS
  const startX = feetToMeters(wall.start.x);
  const startZ = feetToMeters(wall.start.y); // maps 2D y to 3D z
  const endX = feetToMeters(wall.end.x);
  const endZ = feetToMeters(wall.end.y);

  // Calculate length and midpoint in meters
  const dx = endX - startX;
  const dz = endZ - startZ;
  const length = Math.sqrt(dx * dx + dz * dz);
  const midX = (startX + endX) / 2;
  const midZ = (startZ + endZ) / 2;

  // Calculate rotation angle in horizontal plane
  const angle = -Math.atan2(dz, dx); // reverse sign to match three.js coordinates

  // 2. CONVERT HEIGHT AND THICKNESS TO METERS
  const wallHeight = feetToMeters(wall.height);
  const wallThickness = feetToMeters(wall.thickness / 12); // inches to feet to meters

  // Selected state
  const isSelected = selectedObjectId === wall.id;

  // Render wall with its physical boundary
  return (
    <group>
      <mesh
        ref={meshRef}
        position={[midX, wallHeight / 2, midZ]}
        rotation={[0, angle, 0]}
        castShadow
        receiveShadow
        onClick={(e) => {
          e.stopPropagation();
          setSelectedObject(wall.id);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={() => setHovered(false)}
      >
        <boxGeometry args={[length, wallHeight, wallThickness]} />
        <meshStandardMaterial
          color={
            isSelected
              ? "#5B6AF0" // active indigo
              : hovered
                ? "#8B95F5" // hover indigo-light
                : wall.isLoadBearing
                  ? "#726555" // brown load bearing
                  : "#AFAFA9" // warm grey drywall
          }
          roughness={0.7}
          metalness={0.1}
        />
      </mesh>

      {/* Registers wall static collider box in Cannon engine */}
      <PhysicsBoundary
        position={[midX, wallHeight / 2, midZ]}
        rotation={[0, angle, 0]}
        args={[length, wallHeight, wallThickness]}
      />
    </group>
  );
}
