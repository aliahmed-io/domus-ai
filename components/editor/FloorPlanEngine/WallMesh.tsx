"use client";

import React, { useRef, useState, useMemo } from "react";
import type { Mesh } from "three";
import { useEditorStore } from "@/store/useEditorStore";
import { useShallow } from "zustand/react/shallow";
import { feetToMeters } from "@/lib/utils";
import type { Wall } from "@/types/puter";
import PhysicsBoundary from "../PhysicsBoundary";
import { useTexture } from "@react-three/drei";
import { Geometry, Base, Subtraction } from "@react-three/csg";

interface WallMeshProps {
  wall: Wall;
}

function WallMaterial({
  materialId,
  isSelected,
  hovered,
  isLoadBearing,
}: {
  materialId?: string | undefined;
  isSelected: boolean;
  hovered: boolean;
  isLoadBearing: boolean;
}) {
  const materials = useEditorStore((s) => s.materials);
  const activeMaterial = materialId ? materials[materialId] : null;

  const mapUrl = activeMaterial?.texture.map || "";
  const normalMapUrl = activeMaterial?.texture.normalMap || "";
  const roughnessMapUrl = activeMaterial?.texture.roughnessMap || "";

  // 1x1 transparent pixel base64 string to keep useTexture hooks unconditional
  const dummyPixel = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

  const textures = useTexture({
    map: mapUrl || dummyPixel,
    normalMap: normalMapUrl || dummyPixel,
    roughnessMap: roughnessMapUrl || dummyPixel,
  });

  return (
    <meshStandardMaterial
      map={mapUrl ? textures.map : null}
      normalMap={normalMapUrl ? textures.normalMap : null}
      roughnessMap={roughnessMapUrl ? textures.roughnessMap : null}
      color={
        isSelected
          ? "#5B6AF0"
          : hovered
            ? "#8B95F5"
            : activeMaterial
              ? "#FFFFFF"
              : isLoadBearing
                ? "#726555"
                : "#AFAFA9"
      }
      roughness={activeMaterial ? activeMaterial.roughness : 0.7}
      metalness={activeMaterial ? activeMaterial.metalness : 0.1}
    />
  );
}

export default function WallMesh({ wall }: WallMeshProps) {
  const meshRef = useRef<Mesh>(null);
  const { selectedObjectId, setSelectedObject, floorPlanLayout } = useEditorStore(
    useShallow((s) => ({
      selectedObjectId: s.selectedObjectId,
      setSelectedObject: s.setSelectedObject,
      floorPlanLayout: s.floorPlanLayout,
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

  // Find doors and windows belonging to this wall segment
  const wallDoors = floorPlanLayout?.doors.filter((d) => d.wallId === wall.id) || [];
  const wallWindows = floorPlanLayout?.windows.filter((w) => w.wallId === wall.id) || [];

  // Stringify complex arrays outside useMemo to comply with static dependency check rules
  const wallDoorsStr = JSON.stringify(wallDoors);
  const wallWindowsStr = JSON.stringify(wallWindows);

  // Memoize CSG geometry to prevent expensive recalculations on hover/re-render
  const csgGeometry = useMemo(() => {
    const doors = JSON.parse(wallDoorsStr) as typeof wallDoors;
    const windows = JSON.parse(wallWindowsStr) as typeof wallWindows;
    return (
      <Geometry computeVertexNormals>
        <Base>
          <boxGeometry args={[length, wallHeight, wallThickness]} />
        </Base>
        {doors.map((door) => {
          const doorWidth = feetToMeters(door.width / 12);
          const doorHeight = feetToMeters(6.8); // 80 inches
          const localX = door.position * length - length / 2;
          const localY = (doorHeight / 2) - (wallHeight / 2);
          return (
            <Subtraction key={door.id} position={[localX, localY, 0]}>
              <boxGeometry args={[doorWidth, doorHeight, wallThickness * 1.5]} />
            </Subtraction>
          );
        })}
        {windows.map((win) => {
          const winWidth = feetToMeters(win.width / 12);
          const winHeight = feetToMeters(win.height / 12);
          const sillHeight = feetToMeters(win.sillHeight / 12);
          const localX = win.position * length - length / 2;
          const localY = (sillHeight + winHeight / 2) - (wallHeight / 2);
          return (
            <Subtraction key={win.id} position={[localX, localY, 0]}>
              <boxGeometry args={[winWidth, winHeight, wallThickness * 1.5]} />
            </Subtraction>
          );
        })}
      </Geometry>
    );
  }, [length, wallHeight, wallThickness, wallDoorsStr, wallWindowsStr]);

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
        {csgGeometry}
        <WallMaterial
          materialId={(wall as { materialId?: string }).materialId}
          isSelected={isSelected}
          hovered={hovered}
          isLoadBearing={wall.isLoadBearing}
        />
      </mesh>

      {/* Registers wall static collider box in Rapier physics engine */}
      <PhysicsBoundary
        position={[midX, wallHeight / 2, midZ]}
        rotation={[0, angle, 0]}
        args={[length, wallHeight, wallThickness]}
      />
    </group>
  );
}
