import React, { useMemo } from "react";
import * as THREE from "three";
import { useEditorStore } from "@/store/useEditorStore";
import { useShallow } from "zustand/react/shallow";
import { feetToMeters } from "@/lib/utils";

export default function RoofMesh() {
  const { floorPlanLayout, showRoof } = useEditorStore(
    useShallow((s) => ({
      floorPlanLayout: s.floorPlanLayout,
      showRoof: s.showRoof,
    }))
  );

  const geometry = useMemo(() => {
    if (!floorPlanLayout || floorPlanLayout.walls.length === 0) return null;

    // Find the perimeter bounding box from walls
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    
    floorPlanLayout.walls.forEach(w => {
      const sx = feetToMeters(w.start.x);
      const sy = feetToMeters(w.start.y);
      const ex = feetToMeters(w.end.x);
      const ey = feetToMeters(w.end.y);
      
      minX = Math.min(minX, sx, ex);
      maxX = Math.max(maxX, sx, ex);
      minY = Math.min(minY, sy, ey);
      maxY = Math.max(maxY, sy, ey);
    });

    const width = maxX - minX;
    const depth = maxY - minY;
    
    // Create a pyramid/hip roof shape using ConeGeometry or custom BufferGeometry
    // We'll use a simple Cone for now mapped to the bounding box as a fast Hip roof mock
    // A better approach would be generating a true straight skeleton, but this works for visualization
    const geo = new THREE.ConeGeometry(Math.max(width, depth) * 0.7, 2.5, 4);
    geo.rotateY(Math.PI / 4); // Align the 4 corners
    
    // Position it at the center
    const cx = (minX + maxX) / 2;
    const cz = (minY + maxY) / 2;
    const height = feetToMeters(floorPlanLayout.walls[0]?.height || 10);
    
    geo.translate(cx, height + 1.25, cz); // 1.25 is half the cone height

    return geo;
  }, [floorPlanLayout]);

  if (!showRoof || !geometry) return null;

  return (
    <mesh geometry={geometry} castShadow receiveShadow>
      <meshStandardMaterial color="#475569" roughness={0.9} metalness={0.1} />
    </mesh>
  );
}
