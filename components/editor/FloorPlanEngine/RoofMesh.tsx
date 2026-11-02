"use client";

import React, { useMemo } from "react";
import { useEditorStore } from "@/store/useEditorStore";
import { useShallow } from "zustand/react/shallow";
import RoomSurface from "./RoomSurface";
import { feetToMeters } from "@/lib/utils";

export default function RoofMesh() {
  const { floorPlanLayout, showRoof, roofType, storeys } = useEditorStore(
    useShallow((s) => ({
      floorPlanLayout: s.floorPlanLayout,
      showRoof: s.showRoof,
      roofType: s.roofType,
      storeys: s.storeys,
    }))
  );

  const roofData = useMemo(() => {
    const visibleStoreys = (storeys || []).filter((st) => st.isVisible !== false);
    const topStorey =
      visibleStoreys.length > 0
        ? visibleStoreys.reduce((prev, curr) => (curr.elevation >= prev.elevation ? curr : prev))
        : null;
    const targetLayout = topStorey ? topStorey.floorPlanLayout : floorPlanLayout;
    const topElevMeters = topStorey ? feetToMeters(topStorey.elevation) : 0;

    if (!targetLayout || targetLayout.walls.length === 0) return null;

    // Find perimeter bounding box from walls
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    let maxWallHeight = 0;

    targetLayout.walls.forEach((w) => {
      const sx = feetToMeters(w.start.x);
      const sy = feetToMeters(w.start.y);
      const ex = feetToMeters(w.end.x);
      const ey = feetToMeters(w.end.y);

      minX = Math.min(minX, sx, ex);
      maxX = Math.max(maxX, sx, ex);
      minY = Math.min(minY, sy, ey);
      maxY = Math.max(maxY, sy, ey);

      const h = feetToMeters(w.height);
      if (h > maxWallHeight) maxWallHeight = h;
    });

    const cx = (minX + maxX) / 2;
    const cz = (minY + maxY) / 2;
    const width = maxX - minX;
    const depth = maxY - minY;

    return {
      cx,
      cz,
      width,
      depth,
      rooms: targetLayout.rooms,
      wallHeight: topElevMeters + (maxWallHeight || 3.0),
      minX,
      maxX,
      minY,
      maxY,
    };
  }, [floorPlanLayout, storeys]);

  if (!showRoof || !roofData) return null;

  const { cx, cz, width, depth, wallHeight } = roofData;
  const coveredArea = roofData.rooms.reduce((sum, room) => sum + room.area * .3048 * .3048, 0);
  if (roofData.rooms.length && coveredArea < width * depth - .05) {
    return <group>{roofData.rooms.map(room => <RoomSurface key={room.id} room={room} thickness={.15} top={wallHeight} color="#8b8072" />)}</group>;
  }
  const overhang = 0.4; // 400mm architectural eave overhang
  const totalW = width + overhang * 2;
  const totalD = depth + overhang * 2;

  // ─── 1. Flat Roof with Perimeter Parapet & Coping Cap ───
  if (roofType === "flat") {
    const parapetH = 0.45; // 450mm parapet wall
    const parapetThick = 0.18;
    return (
      <group position={[cx, wallHeight, cz]}>
        {/* Main flat roof slab */}
        <mesh position={[0, -0.05, 0]} receiveShadow>
          <boxGeometry args={[width + 0.1, 0.15, depth + 0.1]} />
          <meshStandardMaterial color="#64748B" roughness={0.9} />
        </mesh>

        {/* Parapet Walls (North, South, East, West) */}
        <group position={[0, parapetH / 2, 0]}>
          {/* North */}
          <mesh position={[0, 0, -depth / 2]} castShadow receiveShadow>
            <boxGeometry args={[width + parapetThick * 2, parapetH, parapetThick]} />
            <meshStandardMaterial color="#E2E8F0" roughness={0.8} />
          </mesh>
          {/* South */}
          <mesh position={[0, 0, depth / 2]} castShadow receiveShadow>
            <boxGeometry args={[width + parapetThick * 2, parapetH, parapetThick]} />
            <meshStandardMaterial color="#E2E8F0" roughness={0.8} />
          </mesh>
          {/* West */}
          <mesh position={[-width / 2, 0, 0]} castShadow receiveShadow>
            <boxGeometry args={[parapetThick, parapetH, depth]} />
            <meshStandardMaterial color="#E2E8F0" roughness={0.8} />
          </mesh>
          {/* East */}
          <mesh position={[width / 2, 0, 0]} castShadow receiveShadow>
            <boxGeometry args={[parapetThick, parapetH, depth]} />
            <meshStandardMaterial color="#E2E8F0" roughness={0.8} />
          </mesh>
        </group>

        {/* Architectural Metal Coping Cap */}
        <group position={[0, parapetH + 0.015, 0]}>
          <mesh position={[0, 0, -depth / 2]} castShadow>
            <boxGeometry args={[width + parapetThick * 2 + 0.05, 0.03, parapetThick + 0.04]} />
            <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.3} />
          </mesh>
          <mesh position={[0, 0, depth / 2]} castShadow>
            <boxGeometry args={[width + parapetThick * 2 + 0.05, 0.03, parapetThick + 0.04]} />
            <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.3} />
          </mesh>
          <mesh position={[-width / 2, 0, 0]} castShadow>
            <boxGeometry args={[parapetThick + 0.04, 0.03, depth]} />
            <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.3} />
          </mesh>
          <mesh position={[width / 2, 0, 0]} castShadow>
            <boxGeometry args={[parapetThick + 0.04, 0.03, depth]} />
            <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.3} />
          </mesh>
        </group>
      </group>
    );
  }

  // ─── 2. Gable Roof with Eaves & Fascia ───
  if (roofType === "gable") {
    const isLongX = width >= depth;
    const span = isLongX ? depth : width;
    const pitch = 0.45; // ~24 degree slope
    const ridgeH = (span / 2) * pitch + 0.8;
    const slopeLen = Math.hypot(span / 2 + overhang, ridgeH);
    const slopeAngle = Math.atan2(ridgeH, span / 2 + overhang);

    return (
      <group position={[cx, wallHeight, cz]}>
        {isLongX ? (
          <>
            {/* North Slope */}
            <mesh
              position={[0, ridgeH / 2, -(depth / 4 + overhang / 2)]}
              rotation={[slopeAngle, 0, 0]}
              castShadow
              receiveShadow
            >
              <boxGeometry args={[totalW, 0.08, slopeLen]} />
              <meshStandardMaterial color="#334155" roughness={0.7} metalness={0.3} />
            </mesh>
            {/* South Slope */}
            <mesh
              position={[0, ridgeH / 2, depth / 4 + overhang / 2]}
              rotation={[-slopeAngle, 0, 0]}
              castShadow
              receiveShadow
            >
              <boxGeometry args={[totalW, 0.08, slopeLen]} />
              <meshStandardMaterial color="#334155" roughness={0.7} metalness={0.3} />
            </mesh>
            {/* Ridge Cap */}
            <mesh position={[0, ridgeH, 0]} castShadow>
              <boxGeometry args={[totalW + 0.05, 0.06, 0.18]} />
              <meshStandardMaterial color="#1E293B" metalness={0.8} roughness={0.2} />
            </mesh>
            {/* Triangular Gable End Infill Walls */}
            {[-width / 2, width / 2].map((xPos, idx) => (
              <mesh key={`gable-end-${idx}`} position={[xPos, ridgeH / 2, 0]} castShadow receiveShadow>
                <coneGeometry args={[span / 2, ridgeH, 3]} />
                <meshStandardMaterial color="#F1F5F9" roughness={0.8} />
              </mesh>
            ))}
          </>
        ) : (
          <>
            {/* West Slope */}
            <mesh
              position={[-(width / 4 + overhang / 2), ridgeH / 2, 0]}
              rotation={[0, 0, -slopeAngle]}
              castShadow
              receiveShadow
            >
              <boxGeometry args={[slopeLen, 0.08, totalD]} />
              <meshStandardMaterial color="#334155" roughness={0.7} metalness={0.3} />
            </mesh>
            {/* East Slope */}
            <mesh
              position={[width / 4 + overhang / 2, ridgeH / 2, 0]}
              rotation={[0, 0, slopeAngle]}
              castShadow
              receiveShadow
            >
              <boxGeometry args={[slopeLen, 0.08, totalD]} />
              <meshStandardMaterial color="#334155" roughness={0.7} metalness={0.3} />
            </mesh>
            {/* Ridge Cap */}
            <mesh position={[0, ridgeH, 0]} castShadow>
              <boxGeometry args={[0.18, 0.06, totalD + 0.05]} />
              <meshStandardMaterial color="#1E293B" metalness={0.8} roughness={0.2} />
            </mesh>
          </>
        )}
      </group>
    );
  }

  // ─── 3. Authentic Hip Roof Assembly (4-way pitch to central ridge) ───
  const isLongX = totalW >= totalD;
  const ridgeLength = isLongX ? Math.max(0.5, totalW - totalD) : Math.max(0.5, totalD - totalW);
  const hipPitch = 0.42;
  const halfMinSpan = Math.min(totalW, totalD) / 2;
  const hipHeight = halfMinSpan * hipPitch + 0.6;

  return (
    <group position={[cx, wallHeight, cz]}>
      {/* 4-sided Hip Roof Prism Geometry */}
      <mesh position={[0, hipHeight / 2, 0]} castShadow receiveShadow>
        <cylinderGeometry
          args={[
            isLongX ? ridgeLength / 2 : 0.1,
            Math.max(totalW, totalD) / 2,
            hipHeight,
            4,
            1,
            false,
            Math.PI / 4
          ]}
        />
        <meshStandardMaterial color="#38332E" roughness={0.8} metalness={0.2} />
      </mesh>

      {/* Ridge Cap */}
      <mesh position={[0, hipHeight, 0]} castShadow>
        <boxGeometry args={[isLongX ? ridgeLength + 0.2 : 0.18, 0.06, isLongX ? 0.18 : ridgeLength + 0.2]} />
        <meshStandardMaterial color="#1E293B" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Perimeter Fascia Board */}
      <mesh position={[0, 0.04, 0]} castShadow receiveShadow>
        <boxGeometry args={[totalW, 0.12, totalD]} />
        <meshStandardMaterial color="#E2E8F0" roughness={0.6} />
      </mesh>
    </group>
  );
}

