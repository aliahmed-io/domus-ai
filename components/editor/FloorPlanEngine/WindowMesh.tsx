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

export default function WindowMesh({ window: win, walls }: WindowMeshProps) {
  const meshRef = useRef<Mesh>(null);
  const { selectedObjectId, setSelectedObject } = useEditorStore(
    useShallow((s) => ({
      selectedObjectId: s.selectedObjectId,
      setSelectedObject: s.setSelectedObject,
    }))
  );
  const [hovered, setHovered] = useState(false);

  // Find the parent wall
  const parentWall = walls.find((w) => w.id === win.wallId);
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
  const p = win.position; // 0-1
  const winX = startX + p * dx;
  const winZ = startZ + p * dz;

  // Convert dimensions to meters
  const winWidth = feetToMeters(win.width / 12);
  const winHeight = feetToMeters(win.height / 12);
  const sillHeight = feetToMeters(win.sillHeight / 12);
  const wallThickness = feetToMeters(parentWall.thickness / 12);

  const isSelected = selectedObjectId === win.id;

  // Frame dimensioning (architectural profile)
  const frameThick = 0.045; // 45mm width
  const frameDepth = wallThickness + 0.015; // slightly proud of wall
  const innerW = Math.max(0.1, winWidth - frameThick * 2);
  const innerH = Math.max(0.1, winHeight - frameThick * 2);

  const frameColor = isSelected
    ? "#3B82F6"
    : hovered
      ? "#60A5FA"
      : win.frameColor || "#23201D"; // Anodized bronze / architectural charcoal

  const windowType = win.windowType || "grid-2x2";

  return (
    <group position={[winX, sillHeight, winZ]} rotation={[0, angle, 0]}>
      {/* Invisible raycast / click boundary */}
      <mesh
        ref={meshRef}
        position={[0, winHeight / 2, 0]}
        onClick={(e) => {
          e.stopPropagation();
          setSelectedObject(win.id);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={() => setHovered(false)}
        visible={false}
      >
        <boxGeometry args={[winWidth, winHeight, wallThickness * 1.6]} />
      </mesh>

      {/* ─── Architectural Perimeter Frame (Hollow opening, not solid box) ─── */}
      <group>
        {/* Top Header */}
        <mesh position={[0, winHeight - frameThick / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[winWidth, frameThick, frameDepth]} />
          <meshStandardMaterial
            color={frameColor}
            roughness={0.4}
            metalness={0.6}
            emissive={isSelected ? "#1D4ED8" : "#000000"}
            emissiveIntensity={isSelected ? 0.25 : 0}
          />
        </mesh>

        {/* Bottom Sill Rail */}
        <mesh position={[0, frameThick / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[winWidth, frameThick, frameDepth]} />
          <meshStandardMaterial
            color={frameColor}
            roughness={0.4}
            metalness={0.6}
            emissive={isSelected ? "#1D4ED8" : "#000000"}
            emissiveIntensity={isSelected ? 0.25 : 0}
          />
        </mesh>

        {/* Left Jamb */}
        <mesh position={[-winWidth / 2 + frameThick / 2, winHeight / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[frameThick, innerH, frameDepth]} />
          <meshStandardMaterial
            color={frameColor}
            roughness={0.4}
            metalness={0.6}
            emissive={isSelected ? "#1D4ED8" : "#000000"}
            emissiveIntensity={isSelected ? 0.25 : 0}
          />
        </mesh>

        {/* Right Jamb */}
        <mesh position={[winWidth / 2 - frameThick / 2, winHeight / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[frameThick, innerH, frameDepth]} />
          <meshStandardMaterial
            color={frameColor}
            roughness={0.4}
            metalness={0.6}
            emissive={isSelected ? "#1D4ED8" : "#000000"}
            emissiveIntensity={isSelected ? 0.25 : 0}
          />
        </mesh>
      </group>

      {/* ─── Exterior Sloped Sill / Stool with Drip Edge ─── */}
      <mesh
        position={[0, -0.015, -wallThickness / 2 - 0.03]}
        rotation={[0.08, 0, 0]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[winWidth + 0.06, 0.035, 0.07]} />
        <meshStandardMaterial color={frameColor} roughness={0.3} metalness={0.7} />
      </mesh>

      {/* ─── Double-Glazed Insulated Glass Unit (Physical Material) ─── */}
      <mesh position={[0, winHeight / 2, 0]} castShadow>
        <boxGeometry args={[innerW, innerH, 0.022]} />
        <meshPhysicalMaterial
          color={win.glassTint || "#E8F4F8"}
          transparent
          opacity={0.35}
          roughness={0.03}
          metalness={0.05}
          transmission={0.96}
          ior={1.52}
          thickness={0.03}
          clearcoat={1.0}
          clearcoatRoughness={0.04}
        />
      </mesh>

      {/* ─── Parametric Mullions & Muntin Grid ─── */}
      {windowType !== "picture" && (
        <group position={[0, winHeight / 2, 0]}>
          {/* Horizontal Muntin / Meeting Rail */}
          {(windowType === "grid-2x2" || windowType === "single-hung" || windowType === "double-hung") && (
            <mesh position={[0, windowType === "grid-2x2" ? 0 : 0.05, 0]} castShadow>
              <boxGeometry
                args={[
                  innerW,
                  windowType === "grid-2x2" ? 0.02 : 0.035,
                  windowType === "grid-2x2" ? 0.024 : 0.03,
                ]}
              />
              <meshStandardMaterial color={frameColor} roughness={0.4} metalness={0.6} />
            </mesh>
          )}

          {/* Vertical Muntin */}
          {(windowType === "grid-2x2" || windowType === "casement") && (
            <mesh position={[0, 0, 0]} castShadow>
              <boxGeometry args={[0.02, innerH, 0.024]} />
              <meshStandardMaterial color={frameColor} roughness={0.4} metalness={0.6} />
            </mesh>
          )}
        </group>
      )}

      {/* ─── Interior Trim Casing / Architrave ─── */}
      <group position={[0, 0, wallThickness / 2 + 0.006]}>
        {/* Top casing */}
        <mesh position={[0, winHeight + 0.025, 0]} castShadow>
          <boxGeometry args={[winWidth + 0.08, 0.05, 0.012]} />
          <meshStandardMaterial color="#EAE7E2" roughness={0.7} />
        </mesh>
        {/* Left casing */}
        <mesh position={[-winWidth / 2 - 0.025, winHeight / 2, 0]} castShadow>
          <boxGeometry args={[0.05, winHeight, 0.012]} />
          <meshStandardMaterial color="#EAE7E2" roughness={0.7} />
        </mesh>
        {/* Right casing */}
        <mesh position={[winWidth / 2 + 0.025, winHeight / 2, 0]} castShadow>
          <boxGeometry args={[0.05, winHeight, 0.012]} />
          <meshStandardMaterial color="#EAE7E2" roughness={0.7} />
        </mesh>
      </group>
    </group>
  );
}
