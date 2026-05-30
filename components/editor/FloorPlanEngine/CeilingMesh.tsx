"use client";

import React from "react";
import * as THREE from "three";
import { useEditorStore } from "@/store/useEditorStore";
import { useShallow } from "zustand/react/shallow";
import { feetToMeters } from "@/lib/utils";

export default function CeilingMesh() {
  const { floorPlanLayout } = useEditorStore(
    useShallow((s) => ({
      floorPlanLayout: s.floorPlanLayout,
    }))
  );

  if (!floorPlanLayout || !floorPlanLayout.rooms) return null;

  return (
    <group>
      {floorPlanLayout.rooms.map((room) => {
        // bounds are in feet
        const width = feetToMeters(room.bounds.width);
        const depth = feetToMeters(room.bounds.height);
        
        const midX = feetToMeters(room.bounds.x + room.bounds.width / 2);
        const midZ = feetToMeters(room.bounds.y + room.bounds.height / 2);
        
        // Default ceiling height to 9ft (2.74m) if not specified
        const cHeight = room.ceilingHeight || 2.74;

        return (
          <mesh
            key={room.id}
            position={[midX, cHeight, midZ]}
            rotation={[Math.PI / 2, 0, 0]} // Rotate to lay flat
            receiveShadow
          >
            <planeGeometry args={[width, depth]} />
            {/* BackSide makes it invisible from the top, visible from the bottom inside the room */}
            <meshStandardMaterial color="#FFFFFF" roughness={0.9} side={THREE.BackSide} />
          </mesh>
        );
      })}
    </group>
  );
}
