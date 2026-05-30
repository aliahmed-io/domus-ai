"use client";

import React, { useRef } from "react";
import * as THREE from "three";
import { useEditorStore } from "@/store/useEditorStore";
import { useShallow } from "zustand/react/shallow";

/**
 * 3D Sun light component that dynamically converts altitude and azimuth (degrees)
 * into high-performance directional lighting and shadow projections.
 */
export default function SunLight() {
  const { sunAltitude, sunAzimuth } = useEditorStore(
    useShallow((s) => ({
      sunAltitude: s.sunAltitude,
      sunAzimuth: s.sunAzimuth,
    }))
  );

  const lightRef = useRef<THREE.DirectionalLight>(null);

  // Convert altitude and azimuth to radians
  const altRad = (sunAltitude * Math.PI) / 180;
  const azRad = (sunAzimuth * Math.PI) / 180;

  // Position vector from spherical angles at a 15-meter radius
  const radius = 15;
  const y = radius * Math.sin(altRad);
  const x = radius * Math.cos(altRad) * Math.sin(azRad);
  const z = radius * Math.cos(altRad) * Math.cos(azRad);

  // Calculate warm/cool sun color based on solar altitude (sunset vs midday)
  const isNight = sunAltitude <= 0;
  
  // Warm sunset/sunrise color (gold/orange) vs bright white midday sun
  const sunColor = isNight 
    ? "#1E293B" 
    : sunAltitude < 15 
      ? "#F59E0B" // warm golden hour
      : sunAltitude < 30
        ? "#FBBF24"
        : "#FAF8F5"; // crisp architectural white

  const intensity = isNight ? 0.05 : Math.max(0.1, 1.5 * Math.sin(altRad));

  return (
    <group>
      {/* Dynamic Solar Orbit Directional Light */}
      <directionalLight
        ref={lightRef}
        position={[x, y, z]}
        intensity={intensity}
        color={sunColor}
        castShadow={!isNight}
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-bias={-0.0001}
        shadow-camera-near={0.5}
        shadow-camera-far={40}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
      />

      {/* Sun visual glowing helper sphere rendered in the skybox */}
      {!isNight && (
        <mesh position={[x, y, z]}>
          <sphereGeometry args={[0.4, 16, 16]} />
          <meshBasicMaterial color={sunColor} />
        </mesh>
      )}

      {/* Subtle blue sky ambient fill at night */}
      {isNight && (
        <ambientLight intensity={0.15} color="#0F172A" />
      )}
    </group>
  );
}
