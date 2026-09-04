"use client";

import React, { useRef, useState } from "react";
import type { Mesh } from "three";
import { useEditorStore } from "@/store/useEditorStore";
import { useShallow } from "zustand/react/shallow";
import { feetToMeters } from "@/lib/utils";
import type { Door, Wall } from "@/types/puter";

interface DoorMeshProps {
  door: Door;
  walls: Wall[];
}

export default function DoorMesh({ door, walls }: DoorMeshProps) {
  const meshRef = useRef<Mesh>(null);
  const { selectedObjectId, setSelectedObject, floorPlanLayout, setFloorPlan } = useEditorStore(
    useShallow((s) => ({
      selectedObjectId: s.selectedObjectId,
      setSelectedObject: s.setSelectedObject,
      floorPlanLayout: s.floorPlanLayout,
      setFloorPlan: s.setFloorPlan,
    }))
  );
  const [hovered, setHovered] = useState(false);

  // Find the parent wall
  const parentWall = walls.find((w) => w.id === door.wallId);
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
  const p = door.position; // 0-1
  const doorX = startX + p * dx;
  const doorZ = startZ + p * dz;

  // Convert dimensions to meters
  const doorWidth = feetToMeters(door.width / 12);
  const doorHeight = feetToMeters((door.height || 80) / 12);
  const wallThickness = feetToMeters(parentWall.thickness / 12);

  const isSelected = selectedObjectId === door.id;

  const doorType = door.doorType || "single";
  const swingSide = door.swingSide || "left";
  const swingDirection = door.swingDirection || "inward";
  const isOpen = (door.openAngle ?? 0.5) > 0.1;

  // Jamb and leaf dimensions
  const jambThick = 0.045; // 45mm
  const jambDepth = wallThickness + 0.012;
  const leafW = doorType === "double" ? (doorWidth - jambThick * 2) / 2 : doorWidth - jambThick * 2;
  const leafH = doorHeight - jambThick;
  const leafThick = 0.04;

  const frameColor = door.frameColor || "#2C2621";
  const panelColor = isSelected ? "#3B82F6" : hovered ? "#60A5FA" : door.color || "#C2A585"; // Premium warm oak / walnut

  // Toggle open angle on click
  const handleToggleOpen = () => {
    if (!floorPlanLayout) return;
    const currentAngle = door.openAngle ?? 0.5;
    const nextAngle = currentAngle > 0.1 ? 0 : 0.85; // toggle between closed and 85-degree open
    const updatedDoors = floorPlanLayout.doors.map((d) =>
      d.id === door.id ? { ...d, openAngle: nextAngle } : d
    );
    setFloorPlan({ ...floorPlanLayout, doors: updatedDoors });
  };

  // Rotation angle calculation
  const swingSign = (swingDirection === "inward" ? 1 : -1) * (swingSide === "left" ? 1 : -1);
  const activeSwingRad = (door.openAngle ?? 0.5) * (Math.PI / 2) * swingSign;

  return (
    <group position={[doorX, 0, doorZ]} rotation={[0, angle, 0]}>
      {/* Invisible raycast / click box */}
      <mesh
        ref={meshRef}
        position={[0, doorHeight / 2, 0]}
        onClick={(e) => {
          e.stopPropagation();
          setSelectedObject(door.id);
          handleToggleOpen();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={() => setHovered(false)}
        visible={false}
      >
        <boxGeometry args={[doorWidth, doorHeight, wallThickness * 1.6]} />
      </mesh>

      {/* ─── Architectural Jamb Frame (Header + Left + Right) ─── */}
      <group>
        {/* Top Header */}
        <mesh position={[0, doorHeight - jambThick / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[doorWidth, jambThick, jambDepth]} />
          <meshStandardMaterial color={frameColor} roughness={0.5} metalness={0.2} />
        </mesh>
        {/* Left Jamb */}
        <mesh position={[-doorWidth / 2 + jambThick / 2, doorHeight / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[jambThick, doorHeight, jambDepth]} />
          <meshStandardMaterial color={frameColor} roughness={0.5} metalness={0.2} />
        </mesh>
        {/* Right Jamb */}
        <mesh position={[doorWidth / 2 - jambThick / 2, doorHeight / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[jambThick, doorHeight, jambDepth]} />
          <meshStandardMaterial color={frameColor} roughness={0.5} metalness={0.2} />
        </mesh>
        {/* Exterior Threshold Saddle Plate */}
        {door.isExterior && (
          <mesh position={[0, 0.008, 0]} receiveShadow>
            <boxGeometry args={[doorWidth, 0.016, wallThickness + 0.04]} />
            <meshStandardMaterial color="#4A453F" roughness={0.3} metalness={0.8} />
          </mesh>
        )}
      </group>

      {/* ─── Interior & Exterior Casing Trim ─── */}
      {[-wallThickness / 2 - 0.006, wallThickness / 2 + 0.006].map((zPos, idx) => (
        <group key={`casing-${idx}`} position={[0, 0, zPos]}>
          {/* Top casing */}
          <mesh position={[0, doorHeight + 0.025, 0]} castShadow>
            <boxGeometry args={[doorWidth + 0.08, 0.05, 0.012]} />
            <meshStandardMaterial color="#EAE7E2" roughness={0.7} />
          </mesh>
          {/* Left casing */}
          <mesh position={[-doorWidth / 2 - 0.025, doorHeight / 2, 0]} castShadow>
            <boxGeometry args={[0.05, doorHeight, 0.012]} />
            <meshStandardMaterial color="#EAE7E2" roughness={0.7} />
          </mesh>
          {/* Right casing */}
          <mesh position={[doorWidth / 2 + 0.025, doorHeight / 2, 0]} castShadow>
            <boxGeometry args={[0.05, doorHeight, 0.012]} />
            <meshStandardMaterial color="#EAE7E2" roughness={0.7} />
          </mesh>
        </group>
      ))}

      {/* ─── Door Panels ─── */}
      {doorType === "single" && (
        <group
          position={[
            swingSide === "left" ? -doorWidth / 2 + jambThick : doorWidth / 2 - jambThick,
            0,
            0,
          ]}
          rotation={[0, activeSwingRad, 0]}
        >
          {/* Leaf panel */}
          <mesh
            position={[
              swingSide === "left" ? leafW / 2 : -leafW / 2,
              leafH / 2,
              0,
            ]}
            castShadow
            receiveShadow
          >
            <boxGeometry args={[leafW, leafH, leafThick]} />
            <meshStandardMaterial
              color={panelColor}
              roughness={0.35}
              metalness={0.15}
              emissive={isSelected ? "#1D4ED8" : "#000000"}
              emissiveIntensity={isSelected ? 0.2 : 0}
            />
          </mesh>

          {/* Luxury Architectural Tubular Lever Handles */}
          {[-leafThick / 2 - 0.005, leafThick / 2 + 0.005].map((zHandle, hIdx) => {
            const handleX = swingSide === "left" ? leafW - 0.08 : -leafW + 0.08;
            const handleY = 0.95; // 950mm standard latch height
            return (
              <group key={`handle-${hIdx}`} position={[handleX, handleY, zHandle]}>
                {/* Escutcheon rosette backplate */}
                <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
                  <cylinderGeometry args={[0.025, 0.025, 0.008, 24]} />
                  <meshStandardMaterial color="#D4AF37" roughness={0.2} metalness={0.85} />
                </mesh>
                {/* Horizontal ergonomic lever */}
                <mesh
                  position={[swingSide === "left" ? -0.045 : 0.045, 0, hIdx === 0 ? -0.035 : 0.035]}
                  rotation={[0, 0, Math.PI / 2]}
                  castShadow
                >
                  <cylinderGeometry args={[0.009, 0.009, 0.11, 16]} />
                  <meshStandardMaterial color="#D4AF37" roughness={0.2} metalness={0.85} />
                </mesh>
              </group>
            );
          })}
        </group>
      )}

      {/* ─── French Double Doors ─── */}
      {doorType === "double" && (
        <group>
          {/* Left Leaf */}
          <group
            position={[-doorWidth / 2 + jambThick, 0, 0]}
            rotation={[0, (door.openAngle ?? 0.5) * (Math.PI / 2) * (swingDirection === "inward" ? 1 : -1), 0]}
          >
            <mesh position={[leafW / 2, leafH / 2, 0]} castShadow receiveShadow>
              <boxGeometry args={[leafW, leafH, leafThick]} />
              <meshStandardMaterial color={panelColor} roughness={0.35} metalness={0.15} />
            </mesh>
            {/* Glass lite insert */}
            <mesh position={[leafW / 2, leafH / 2, 0]}>
              <boxGeometry args={[leafW - 0.14, leafH - 0.2, 0.015]} />
              <meshPhysicalMaterial
                color="#E8F4F8"
                transparent
                opacity={0.35}
                transmission={0.95}
                ior={1.52}
                roughness={0.04}
              />
            </mesh>
          </group>

          {/* Right Leaf */}
          <group
            position={[doorWidth / 2 - jambThick, 0, 0]}
            rotation={[0, -(door.openAngle ?? 0.5) * (Math.PI / 2) * (swingDirection === "inward" ? 1 : -1), 0]}
          >
            <mesh position={[-leafW / 2, leafH / 2, 0]} castShadow receiveShadow>
              <boxGeometry args={[leafW, leafH, leafThick]} />
              <meshStandardMaterial color={panelColor} roughness={0.35} metalness={0.15} />
            </mesh>
            {/* Glass lite insert */}
            <mesh position={[-leafW / 2, leafH / 2, 0]}>
              <boxGeometry args={[leafW - 0.14, leafH - 0.2, 0.015]} />
              <meshPhysicalMaterial
                color="#E8F4F8"
                transparent
                opacity={0.35}
                transmission={0.95}
                ior={1.52}
                roughness={0.04}
              />
            </mesh>
          </group>
        </group>
      )}

      {/* ─── Sliding Patio / Bypass Doors ─── */}
      {doorType === "sliding" && (
        <group>
          {/* Fixed Glass Panel */}
          <mesh position={[-doorWidth / 4, leafH / 2, 0.02]} castShadow receiveShadow>
            <boxGeometry args={[doorWidth / 2, leafH, leafThick]} />
            <meshStandardMaterial color={panelColor} roughness={0.4} />
          </mesh>
          <mesh position={[-doorWidth / 4, leafH / 2, 0.02]}>
            <boxGeometry args={[doorWidth / 2 - 0.1, leafH - 0.1, 0.015]} />
            <meshPhysicalMaterial color="#E8F4F8" transparent opacity={0.3} transmission={0.96} ior={1.5} />
          </mesh>
          {/* Sliding Glass Panel (shifts with openAngle) */}
          <mesh
            position={[
              doorWidth / 4 - (door.openAngle ?? 0.5) * (doorWidth / 2 - 0.05),
              leafH / 2,
              -0.02,
            ]}
            castShadow
            receiveShadow
          >
            <boxGeometry args={[doorWidth / 2, leafH, leafThick]} />
            <meshStandardMaterial color={panelColor} roughness={0.4} />
          </mesh>
          <mesh
            position={[
              doorWidth / 4 - (door.openAngle ?? 0.5) * (doorWidth / 2 - 0.05),
              leafH / 2,
              -0.02,
            ]}
          >
            <boxGeometry args={[doorWidth / 2 - 0.1, leafH - 0.1, 0.015]} />
            <meshPhysicalMaterial color="#E8F4F8" transparent opacity={0.3} transmission={0.96} ior={1.5} />
          </mesh>
        </group>
      )}

      {/* ─── Pocket Door ─── */}
      {doorType === "pocket" && (
        <mesh
          position={[
            -doorWidth / 2 + jambThick + leafW / 2 - (door.openAngle ?? 0.5) * leafW,
            leafH / 2,
            0,
          ]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[leafW, leafH, leafThick]} />
          <meshStandardMaterial color={panelColor} roughness={0.4} />
        </mesh>
      )}

      {/* ─── Floor Swing Arc Clearance Guideline (Architectural 2D/3D visual) ─── */}
      {doorType === "single" && isOpen && (
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[
            swingSide === "left" ? -doorWidth / 2 + jambThick : doorWidth / 2 - jambThick,
            0.005,
            0,
          ]}
          receiveShadow
        >
          <ringGeometry
            args={[
              leafW - 0.02,
              leafW,
              32,
              1,
              swingSide === "left" ? 0 : Math.PI - Math.abs(activeSwingRad),
              Math.abs(activeSwingRad),
            ]}
          />
          <meshBasicMaterial
            color={isSelected ? "#3B82F6" : "#A8A29E"}
            opacity={0.4}
            transparent
          />
        </mesh>
      )}
    </group>
  );
}
