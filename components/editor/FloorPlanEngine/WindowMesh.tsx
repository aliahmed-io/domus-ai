"use client";

import React, { useRef, useState } from "react";
import type { Mesh } from "three";
import { useEditorStore } from "@/store/useEditorStore";
import { useShallow } from "zustand/react/shallow";
import { feetToMeters } from "@/lib/utils";
import type { Window2D, Wall } from "@/types/puter";

interface WindowMeshProps {
  window: Window2D;
  walls: Wall[];
}

export default function WindowMesh({ window, walls }: WindowMeshProps) {
  const meshRef = useRef<Mesh>(null);
  const { selectedObjectId, setSelectedObject } = useEditorStore(
    useShallow((s) => ({
      selectedObjectId: s.selectedObjectId,
      setSelectedObject: s.setSelectedObject,
    }))
  );
  const [hovered, setHovered] = useState(false);

  // Find the parent wall
  const parentWall = walls.find((w) => w.id === window.wallId);
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
  const p = window.position; // 0-1
  const winX = startX + p * dx;
  const winZ = startZ + p * dz;

  // Convert dimensions to meters
  const winWidth = feetToMeters(window.width / 12);
  const winHeight = feetToMeters(window.height / 12);
  const sillHeight = feetToMeters(window.sillHeight / 12);
  const wallThickness = feetToMeters(parentWall.thickness / 12);

  const isSelected = selectedObjectId === window.id;

  return (
    <group
      position={[winX, sillHeight, winZ]}
      rotation={[0, angle, 0]}
    >
      {/* Interactive area / click box */}
      <mesh
        ref={meshRef}
        position={[0, winHeight / 2, 0]}
        onClick={(e) => {
          e.stopPropagation();
          setSelectedObject(window.id);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={() => setHovered(false)}
        visible={false}
      >
        <boxGeometry args={[winWidth, winHeight, wallThickness * 1.5]} />
      </mesh>

      {/* Outer Window Frame */}
      <mesh position={[0, winHeight / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[winWidth, winHeight, wallThickness * 1.05]} />
        {/* Render a wireframe-like border or simple open box geometry to make it look like a frame */}
        <meshStandardMaterial
          color={
            isSelected
              ? "#5B6AF0"
              : hovered
                ? "#8B95F5"
                : "#2C2621" // dark bronze/charcoal frame
          }
          roughness={0.5}
          metalness={0.8}
          wireframe={false}
        />
      </mesh>

      {/* Inner translucent glass pane */}
      <mesh position={[0, winHeight / 2, 0]} castShadow>
        <boxGeometry args={[winWidth - 0.08, winHeight - 0.08, 0.02]} />
        <meshPhysicalMaterial
          color="#A9D4E2"
          transparent
          opacity={0.4}
          roughness={0.1}
          metalness={0.9}
          transmission={0.9}
          ior={1.5}
          thickness={0.1}
        />
      </mesh>

      {/* Frame details (crossbars for classic architectural look) */}
      <group>
        {/* Horizontal separator */}
        <mesh position={[0, winHeight / 2, 0]} castShadow>
          <boxGeometry args={[winWidth - 0.08, 0.02, 0.03]} />
          <meshStandardMaterial color="#2C2621" roughness={0.5} metalness={0.8} />
        </mesh>
        {/* Vertical separator */}
        <mesh position={[0, winHeight / 2, 0]} castShadow>
          <boxGeometry args={[0.02, winHeight - 0.08, 0.03]} />
          <meshStandardMaterial color="#2C2621" roughness={0.5} metalness={0.8} />
        </mesh>
      </group>
    </group>
  );
}
