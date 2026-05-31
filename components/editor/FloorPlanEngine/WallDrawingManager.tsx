"use client";

import React, { useState } from "react";
import { useEditorStore } from "@/store/useEditorStore";
import { useShallow } from "zustand/react/shallow";
import { feetToMeters, metersToFeet, nanoid } from "@/lib/utils";
import { snapToGrid, snapToWallEndpoints, snapToAngle } from "@/lib/snap";
import type { Vec2D, Wall } from "@/types/puter";

import type { ThreeEvent } from "@react-three/fiber";

export default function WallDrawingManager() {
  const { tool, floorPlanLayout, setFloorPlan } = useEditorStore(
    useShallow((s) => ({
      tool: s.tool,
      floorPlanLayout: s.floorPlanLayout,
      setFloorPlan: s.setFloorPlan,
    }))
  );

  const [startPoint, setStartPoint] = useState<Vec2D | null>(null);
  const [currentPoint, setCurrentPoint] = useState<Vec2D | null>(null);

  if (tool !== "draw-wall" || !floorPlanLayout) return null;

  const walls = floorPlanLayout.walls;

  const handlePointerMove = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    // Intersect coordinate at floor level y = 0
    const rawX = metersToFeet(e.point.x);
    const rawY = metersToFeet(e.point.z); // maps 3D Z to 2D Y
    const pt: Vec2D = { x: rawX, y: rawY };

    // Apply snaps: 1. Snaps to Grid (1.0 ft increments), 2. Snaps magnetically to existing wall endpoints
    let snapped = snapToGrid(pt, 1.0);
    snapped = snapToWallEndpoints(snapped, walls, 1.5);

    // If drawing in progress, apply 45/90 degree angle constraints
    if (startPoint) {
      snapped = snapToAngle(startPoint, snapped);
    }

    setCurrentPoint(snapped);
  };

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    if (!currentPoint) return;

    if (!startPoint) {
      // First click: anchor start point
      setStartPoint(currentPoint);
    } else {
      // Second click: commit the wall segment
      const dx = currentPoint.x - startPoint.x;
      const dy = currentPoint.y - startPoint.y;
      const dist = Math.hypot(dx, dy);

      // Only draw if length is non-trivial (at least 2 feet)
      if (dist >= 2.0) {
        const newWall: Wall = {
          id: `wall-drawn-${nanoid()}`,
          start: { ...startPoint },
          end: { ...currentPoint },
          thickness: 5, // standard interior thickness
          height: 9, // default 9ft height
          isLoadBearing: false,
        };

        setFloorPlan({
          ...floorPlanLayout,
          walls: [...walls, newWall],
        });
      }

      // Reset drawing chain anchor
      setStartPoint(null);
    }
  };

  // Compute preview metrics in meters
  let previewMesh = null;
  if (startPoint && currentPoint) {
    const sX = feetToMeters(startPoint.x);
    const sZ = feetToMeters(startPoint.y);
    const eX = feetToMeters(currentPoint.x);
    const eZ = feetToMeters(currentPoint.y);

    const dx = eX - sX;
    const dz = eZ - sZ;
    const len = Math.sqrt(dx * dx + dz * dz);
    const midX = (sX + eX) / 2;
    const midZ = (sZ + eZ) / 2;
    const angle = -Math.atan2(dz, dx);
    const thickness = feetToMeters(5 / 12);
    const height = feetToMeters(9);

    previewMesh = (
      <group>
        {/* Wall extrusion preview */}
        <mesh position={[midX, height / 2, midZ]} rotation={[0, angle, 0]}>
          <boxGeometry args={[len, height, thickness]} />
          <meshBasicMaterial color="#5B6AF0" opacity={0.5} transparent />
        </mesh>
        
        {/* Visual guide line indicator */}
        <mesh position={[midX, 0.05, midZ]} rotation={[0, angle, 0]}>
          <planeGeometry args={[len, 0.05]} />
          <meshBasicMaterial color="#FFD700" />
        </mesh>
      </group>
    );
  }

  return (
    <group>
      {/* Invisible raycast interceptor plane sitting at floor level */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, 0]}
        onPointerMove={handlePointerMove}
        onPointerDown={handlePointerDown}
        visible={false}
      >
        <planeGeometry args={[200, 200]} />
      </mesh>

      {/* Snapping indicator node */}
      {currentPoint && (
        <mesh position={[feetToMeters(currentPoint.x), 0.05, feetToMeters(currentPoint.y)]}>
          <cylinderGeometry args={[0.08, 0.08, 0.02, 16]} />
          <meshBasicMaterial color="#FFD700" />
        </mesh>
      )}

      {/* Wall drawing preview extrusions */}
      {previewMesh}
    </group>
  );
}
