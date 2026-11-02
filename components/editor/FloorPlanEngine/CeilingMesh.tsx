"use client";

import React from "react";
import * as THREE from "three";
import { useEditorStore } from "@/store/useEditorStore";
import { useShallow } from "zustand/react/shallow";
import { roomShape } from "@/lib/room-shape";
import { feetToMeters } from "@/lib/utils";

export default function CeilingMesh() {
  const { floorPlanLayout, showRoof } = useEditorStore(
    useShallow((s) => ({
      floorPlanLayout: s.floorPlanLayout,
      showRoof: s.showRoof,
    }))
  );

  if (!floorPlanLayout || !floorPlanLayout.rooms) return null;

  return (
    <group>
      {floorPlanLayout.rooms.map((room) => {
        // Default ceiling height to 9ft (2.74m) if not specified; convert feet to meters if > 4.5
        const rawHeight = room.ceilingHeight || 9;
        const cHeight = rawHeight > 4.5 ? feetToMeters(rawHeight) : rawHeight;

        return (
          <mesh
            key={room.id}
            position={[0, cHeight, 0]}
            rotation={[Math.PI / 2, 0, 0]} // Rotate to lay flat
            receiveShadow
          >
            <shapeGeometry args={[roomShape(room)]} />
            {/* The plane faces down, so FrontSide shows the ceiling from inside and keeps the overhead view open */}
            <meshStandardMaterial
              color="#FFFFFF"
              roughness={0.9}
              side={showRoof ? THREE.DoubleSide : THREE.FrontSide}
            />
          </mesh>
        );
      })}
    </group>
  );
}
