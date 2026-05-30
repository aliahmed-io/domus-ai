"use client";

import React, { useState } from "react";
import { useEditorStore } from "@/store/useEditorStore";
import { useShallow } from "zustand/react/shallow";
import { feetToMeters, metersToFeet, nanoid } from "@/lib/utils";
import { snapToGrid, snapToWallEndpoints } from "@/lib/snap";
import { Line, Html } from "@react-three/drei";
import type { Vec2D, DimensionLine } from "@/types/puter";

export default function DimensionLineOverlay() {
  const { tool, dimensionLines, addDimensionLine, removeDimensionLine, floorPlanLayout } = useEditorStore(
    useShallow((s) => ({
      tool: s.tool,
      dimensionLines: s.dimensionLines,
      addDimensionLine: s.addDimensionLine,
      removeDimensionLine: s.removeDimensionLine,
      floorPlanLayout: s.floorPlanLayout,
    }))
  );

  const [startPoint, setStartPoint] = useState<Vec2D | null>(null);
  const [currentPoint, setCurrentPoint] = useState<Vec2D | null>(null);

  const walls = floorPlanLayout?.walls || [];

  // Handle pointer movements to update snapper
  const handlePointerMove = (e: any) => {
    e.stopPropagation();
    const rawX = metersToFeet(e.point.x);
    const rawY = metersToFeet(e.point.z); // Maps 3D Z to 2D Y
    const pt: Vec2D = { x: rawX, y: rawY };

    let snapped = snapToGrid(pt, 0.5); // finer snaps for measurements: 6-inch increments
    snapped = snapToWallEndpoints(snapped, walls, 1.5); // snap to wall ends magnetically

    setCurrentPoint(snapped);
  };

  // Handle clicking on the floor to anchor/commit the measurement line
  const handlePointerDown = (e: any) => {
    e.stopPropagation();
    if (!currentPoint) return;

    if (!startPoint) {
      setStartPoint(currentPoint);
    } else {
      const dx = currentPoint.x - startPoint.x;
      const dy = currentPoint.y - startPoint.y;
      const dist = Math.hypot(dx, dy);

      if (dist > 0.5) {
        const lineId = `dim-${nanoid()}`;
        const newDim: DimensionLine = {
          id: lineId,
          start: { x: feetToMeters(startPoint.x), y: 0.1, z: feetToMeters(startPoint.y) },
          end: { x: feetToMeters(currentPoint.x), y: 0.1, z: feetToMeters(currentPoint.y) },
          label: `${dist.toFixed(1)} ft`,
        };
        addDimensionLine(newDim);
      }
      setStartPoint(null);
    }
  };

  // Calculate live preview distance
  let previewLine = null;
  if (startPoint && currentPoint) {
    const dx = currentPoint.x - startPoint.x;
    const dy = currentPoint.y - startPoint.y;
    const dist = Math.hypot(dx, dy);

    const sX = feetToMeters(startPoint.x);
    const sZ = feetToMeters(startPoint.y);
    const cX = feetToMeters(currentPoint.x);
    const cZ = feetToMeters(currentPoint.y);

    const midX = (sX + cX) / 2;
    const midZ = (sZ + cZ) / 2;

    previewLine = (
      <group>
        <Line
          points={[[sX, 0.05, sZ], [cX, 0.05, cZ]]}
          color="#FFD700"
          lineWidth={2.5}
          dashed
          dashSize={0.2}
          gapSize={0.1}
        />
        {/* Hover label styling in the middle */}
        <Html position={[midX, 0.2, midZ]} center>
          <div className="bg-dark-surface/90 border border-gold/40 text-gold font-mono text-[10px] font-bold px-2 py-1 rounded shadow-md whitespace-nowrap">
            {dist.toFixed(1)} ft
          </div>
        </Html>
      </group>
    );
  }

  return (
    <group>
      {/* ── 1. RENDER COMITTED DIMENSIONS ───────────────────────────────────── */}
      {dimensionLines.map((line) => {
        const midX = (line.start.x + line.end.x) / 2;
        const midY = (line.start.y + line.end.y) / 2 + 0.1;
        const midZ = (line.start.z + line.end.z) / 2;

        return (
          <group key={line.id}>
            {/* Draw dimension rule line */}
            <Line
              points={[
                [line.start.x, line.start.y, line.start.z],
                [line.end.x, line.end.y, line.end.z],
              ]}
              color="#A88E75" // Beautiful premium bronze/gold accent color
              lineWidth={2}
            />
            {/* Tick mark at start */}
            <mesh position={[line.start.x, line.start.y, line.start.z]}>
              <cylinderGeometry args={[0.03, 0.03, 0.1, 8]} />
              <meshBasicMaterial color="#A88E75" />
            </mesh>
            {/* Tick mark at end */}
            <mesh position={[line.end.x, line.end.y, line.end.z]}>
              <cylinderGeometry args={[0.03, 0.03, 0.1, 8]} />
              <meshBasicMaterial color="#A88E75" />
            </mesh>

            {/* Glassmorphic overlay card badge for the measurement distance text */}
            <Html position={[midX, midY, midZ]} center>
              <div className="relative group/dim bg-dark-surface/90 border border-hairline-dark text-on-dark font-mono text-[9px] font-bold px-1.5 py-0.5 rounded shadow-lg flex items-center gap-1 select-none pointer-events-auto transition-all hover:bg-red-950/90 hover:border-red-900/50 hover:text-red-300">
                <span>{line.label}</span>
                <button
                  onClick={() => removeDimensionLine(line.id)}
                  className="opacity-0 group-hover/dim:opacity-100 transition-opacity text-red-400 hover:text-red-200 ml-1 font-sans font-normal text-[8px]"
                  title="Delete Measurement"
                >
                  ✕
                </button>
              </div>
            </Html>
          </group>
        );
      })}

      {/* ── 2. ACTIVE MEASUREMENT MODE HANDLERS ───────────────────────────── */}
      {tool === "measure" && (
        <>
          {/* Raycasting interceptor floor plane */}
          <mesh
            rotation={[-Math.PI / 2, 0, 0]}
            position={[0, 0.02, 0]}
            onPointerMove={handlePointerMove}
            onPointerDown={handlePointerDown}
            visible={false}
          >
            <planeGeometry args={[200, 200]} />
          </mesh>

          {/* Active node snaped pointer element */}
          {currentPoint && (
            <mesh position={[feetToMeters(currentPoint.x), 0.05, feetToMeters(currentPoint.y)]}>
              <cylinderGeometry args={[0.06, 0.06, 0.01, 16]} />
              <meshBasicMaterial color="#FFD700" />
            </mesh>
          )}

          {/* Render active measurement preview lines */}
          {previewLine}
        </>
      )}
    </group>
  );
}
