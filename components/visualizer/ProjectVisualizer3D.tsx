"use client";

import React, { useState, useRef, Suspense, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Grid, Center, PerspectiveCamera } from "@react-three/drei";
import * as THREE from "three";
import { Box, RotateCcw, LayoutGrid, Brain, Sparkles, Plus, Minus, Check, Code, Shield } from "lucide-react";
import type { ProjectType } from "@/types/puter";

interface VisualizerProps {
  type: ProjectType;
  title: string;
}

// ─── Sub-Component: 3D Scene Content ──────────────────────────────────────────

interface SceneProps {
  beds: number;
  baths: number;
  layoutStyle: "open-plan" | "l-shape" | "studio";
  wireframe: boolean;
}

function SceneContent({ beds, baths, layoutStyle, wireframe }: SceneProps) {
  // Common material config for structural walls
  const wallMaterialProps = {
    wireframe: wireframe,
    roughness: 0.6,
    metalness: 0.05,
    transparent: wireframe,
    opacity: wireframe ? 0.6 : 1.0,
  };

  // Common wood material config
  const woodMaterialProps = {
    wireframe: wireframe,
    roughness: 0.8,
    metalness: 0.1,
  };

  return (
    <group position={[0, -0.6, 0]}>
      {/* ─── LUXURY FLOOR PLATES ─── */}
      {/* Light Oak Wood Flooring with High Roughness */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, 0.01, 0]}>
        <planeGeometry args={[11.5, 8.5]} />
        <meshStandardMaterial
          color={wireframe ? "#8C7662" : "#D9C9B6"}
          roughness={0.8}
          transparent
          opacity={wireframe ? 0.3 : 1.0}
        />
      </mesh>

      {/* Textured Rugs for Visual Depth */}
      {!wireframe && (
        <>
          {/* Living Room Area Rug (Cream Bouclé) */}
          <mesh position={[0.2, 0.02, 1.2]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[3.2, 2.4]} />
            <meshStandardMaterial color="#FAF5EC" roughness={0.9} />
          </mesh>
          {/* Master Bedroom Area Rug (Soft Grey Wool) */}
          <mesh position={[-3.6, 0.02, 0.2]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[2.4, 2.6]} />
            <meshStandardMaterial color="#E6E3DC" roughness={0.95} />
          </mesh>
        </>
      )}

      {/* ─── STRUCTURAL WALL SYSTEM (Beige Ivory Drywall with Rich Walnut Caps) ─── */}
      {/* Exterior Perimeter Walls */}
      {/* Left Wall */}
      <mesh position={[-5.6, 0.8, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.18, 1.6, 8.5]} />
        <meshStandardMaterial {...wallMaterialProps} color={wireframe ? "#8C7662" : "#EBE6DC"} />
      </mesh>
      {/* Right Wall */}
      <mesh position={[5.6, 0.8, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.18, 1.6, 8.5]} />
        <meshStandardMaterial {...wallMaterialProps} color={wireframe ? "#8C7662" : "#EBE6DC"} />
      </mesh>
      {/* Back Wall */}
      <mesh position={[0, 0.8, -4.25]} castShadow receiveShadow>
        <boxGeometry args={[11.38, 1.6, 0.18]} />
        <meshStandardMaterial {...wallMaterialProps} color={wireframe ? "#8C7662" : "#EBE6DC"} />
      </mesh>
      {/* Front Wall (with double entry door opening) */}
      <mesh position={[-3.7, 0.8, 4.25]} castShadow receiveShadow>
        <boxGeometry args={[4.0, 1.6, 0.18]} />
        <meshStandardMaterial {...wallMaterialProps} color={wireframe ? "#8C7662" : "#EBE6DC"} />
      </mesh>
      <mesh position={[3.7, 0.8, 4.25]} castShadow receiveShadow>
        <boxGeometry args={[4.0, 1.6, 0.18]} />
        <meshStandardMaterial {...wallMaterialProps} color={wireframe ? "#8C7662" : "#EBE6DC"} />
      </mesh>

      {/* Rich Walnut Capping Rails on Top of Exterior Walls */}
      {!wireframe && (
        <>
          <mesh position={[-5.6, 1.61, 0]}>
            <boxGeometry args={[0.2, 0.02, 8.52]} />
            <meshStandardMaterial color="#5A4A3A" roughness={0.7} />
          </mesh>
          <mesh position={[5.6, 1.61, 0]}>
            <boxGeometry args={[0.2, 0.02, 8.52]} />
            <meshStandardMaterial color="#5A4A3A" roughness={0.7} />
          </mesh>
          <mesh position={[0, 1.61, -4.25]}>
            <boxGeometry args={[11.4, 0.02, 0.2]} />
            <meshStandardMaterial color="#5A4A3A" roughness={0.7} />
          </mesh>
        </>
      )}

      {/* ─── INTERNAL PARTITIONS (Dynamically shift based on beds/baths matrix) ─── */}
      {/* Master Bedroom Partition (Always present if beds >= 1) */}
      {beds >= 1 && (
        <group>
          <mesh position={[-1.8, 0.8, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.16, 1.6, 8.5]} />
            <meshStandardMaterial {...wallMaterialProps} color={wireframe ? "#8C7662" : "#EBE6DC"} />
          </mesh>
          {!wireframe && (
            <mesh position={[-1.8, 1.61, 0]}>
              <boxGeometry args={[0.18, 0.02, 8.52]} />
              <meshStandardMaterial color="#5A4A3A" />
            </mesh>
          )}
        </group>
      )}

      {/* Bathroom 1 Partition */}
      {baths >= 1 && (
        <group position={[2.2, 0, -0.6]}>
          <mesh position={[0, 0.8, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.16, 1.6, 7.3]} />
            <meshStandardMaterial {...wallMaterialProps} color={wireframe ? "#8C7662" : "#EBE6DC"} />
          </mesh>
          <mesh position={[1.7, 0.8, 3.55]} castShadow receiveShadow>
            <boxGeometry args={[3.24, 1.6, 0.16]} />
            <meshStandardMaterial {...wallMaterialProps} color={wireframe ? "#8C7662" : "#EBE6DC"} />
          </mesh>
          {!wireframe && (
            <>
              <mesh position={[0, 1.61, 0]}>
                <boxGeometry args={[0.18, 0.02, 7.32]} />
                <meshStandardMaterial color="#5A4A3A" />
              </mesh>
              <mesh position={[1.7, 1.61, 3.55]}>
                <boxGeometry args={[3.26, 0.02, 0.18]} />
                <meshStandardMaterial color="#5A4A3A" />
              </mesh>
            </>
          )}
        </group>
      )}

      {/* Bed 2 Partition (Activated when beds >= 2) */}
      {beds >= 2 && (
        <group position={[2.2, 0, 1.8]}>
          <mesh position={[0, 0.8, 1.2]} castShadow receiveShadow>
            <boxGeometry args={[0.16, 1.6, 2.5]} />
            <meshStandardMaterial {...wallMaterialProps} color={wireframe ? "#8C7662" : "#EBE6DC"} />
          </mesh>
          {!wireframe && (
            <mesh position={[0, 1.61, 1.2]}>
              <boxGeometry args={[0.18, 0.02, 2.52]} />
              <meshStandardMaterial color="#5A4A3A" />
            </mesh>
          )}
        </group>
      )}

      {/* Bathroom 2 Partition (Activated when baths >= 2) */}
      {baths >= 2 && (
        <group position={[-3.6, 0, 2.2]}>
          <mesh position={[0, 0.8, 0]} castShadow receiveShadow>
            <boxGeometry args={[3.6, 1.6, 0.16]} />
            <meshStandardMaterial {...wallMaterialProps} color={wireframe ? "#8C7662" : "#EBE6DC"} />
          </mesh>
          {!wireframe && (
            <mesh position={[0, 1.61, 0]}>
              <boxGeometry args={[3.62, 0.02, 0.18]} />
              <meshStandardMaterial color="#5A4A3A" />
            </mesh>
          )}
        </group>
      )}

      {/* ─── REALISTIC WOOD DOORS & METAL HARDWARE ─── */}
      {!wireframe && (
        <>
          {/* Master Bedroom Door (Open at 45 degrees) */}
          {beds >= 1 && (
            <group position={[-1.8, 0, -1.8]} rotation={[0, -Math.PI / 4, 0]}>
              <mesh position={[0, 0.75, 0.425]} castShadow>
                <boxGeometry args={[0.04, 1.5, 0.85]} />
                <meshStandardMaterial color="#8C7662" roughness={0.6} />
              </mesh>
              {/* Chrome handle */}
              <mesh position={[0.03, 0.75, 0.75]}>
                <sphereGeometry args={[0.025, 8, 8]} />
                <meshStandardMaterial color="#C2A585" metalness={0.8} roughness={0.2} />
              </mesh>
            </group>
          )}

          {/* Bathroom 1 Door */}
          {baths >= 1 && (
            <group position={[2.2, 0, 2.4]} rotation={[0, Math.PI / 3, 0]}>
              <mesh position={[0, 0.75, 0.425]} castShadow>
                <boxGeometry args={[0.04, 1.5, 0.85]} />
                <meshStandardMaterial color="#8C7662" roughness={0.6} />
              </mesh>
              <mesh position={[-0.03, 0.75, 0.75]}>
                <sphereGeometry args={[0.025, 8, 8]} />
                <meshStandardMaterial color="#C2A585" metalness={0.8} roughness={0.2} />
              </mesh>
            </group>
          )}
        </>
      )}

      {/* ─── HIGH-FIDELITY FURNITURE SYSTEM ─── */}
      {!wireframe && (
        <>
          {/* ── 1. MASTER BEDROOM (Left Suite) ── */}
          {beds >= 1 && (
            <group>
              {/* Layered Luxury Double Bed */}
              <group position={[-3.6, 0, 0.2]}>
                {/* Wood Bed Frame Base */}
                <mesh position={[0, 0.1, 0]} castShadow>
                  <boxGeometry args={[2.04, 0.2, 2.14]} />
                  <meshStandardMaterial color="#5A4A3A" {...woodMaterialProps} />
                </mesh>
                {/* Mattress Block */}
                <mesh position={[0, 0.3, 0]} castShadow>
                  <boxGeometry args={[2.0, 0.4, 2.1]} />
                  <meshStandardMaterial color="#FAF6F0" roughness={0.9} />
                </mesh>
                {/* Slatted Walnut Headboard with Slat Gaps */}
                <group position={[-1.0, 0.5, 0]}>
                  <mesh position={[0, 0, 0]} castShadow>
                    <boxGeometry args={[0.08, 0.9, 2.2]} />
                    <meshStandardMaterial color="#5A4A3A" roughness={0.7} />
                  </mesh>
                  {/* Decorative Slat Overlays */}
                  {[-1.0, -0.6, -0.2, 0.2, 0.6, 1.0].map((zPos, sIdx) => (
                    <mesh key={sIdx} position={[0.05, 0, zPos]}>
                      <boxGeometry args={[0.02, 0.9, 0.05]} />
                      <meshStandardMaterial color="#8C7662" />
                    </mesh>
                  ))}
                </group>
                {/* Soft Earthy Olive Duvet Overlay */}
                <mesh position={[0.4, 0.32, 0]} castShadow>
                  <boxGeometry args={[1.25, 0.42, 2.12]} />
                  <meshStandardMaterial color="#8E8A75" roughness={0.8} />
                </mesh>
                {/* Pair of Plump Sleeping Pillows */}
                <mesh position={[-0.6, 0.52, 0.45]} castShadow>
                  <boxGeometry args={[0.35, 0.08, 0.65]} />
                  <meshStandardMaterial color="#FAF6F0" roughness={0.9} />
                </mesh>
                <mesh position={[-0.6, 0.52, -0.45]} castShadow>
                  <boxGeometry args={[0.35, 0.08, 0.65]} />
                  <meshStandardMaterial color="#FAF6F0" roughness={0.9} />
                </mesh>
              </group>

              {/* Nightstands with Sconces / Lamps */}
              {[-1.5, 1.9].map((zOffset, tIdx) => (
                <group key={tIdx} position={[-4.6, 0, zOffset]}>
                  {/* Stand */}
                  <mesh position={[0, 0.2, 0]} castShadow>
                    <boxGeometry args={[0.45, 0.4, 0.45]} />
                    <meshStandardMaterial color="#5A4A3A" roughness={0.8} />
                  </mesh>
                  {/* Fine Drawer Pull Handles (Gold) */}
                  <mesh position={[0.23, 0.2, 0]}>
                    <boxGeometry args={[0.02, 0.02, 0.15]} />
                    <meshStandardMaterial color="#C2A585" metalness={0.9} />
                  </mesh>
                  {/* Glowing basic light fixture */}
                  <mesh position={[0, 0.45, 0]}>
                    <cylinderGeometry args={[0.03, 0.03, 0.12]} />
                    <meshStandardMaterial color="#C2A585" />
                  </mesh>
                  <mesh position={[0, 0.54, 0]}>
                    <sphereGeometry args={[0.07, 16, 16]} />
                    <meshBasicMaterial color="#FFF3D1" />
                  </mesh>
                  <pointLight position={[0, 0.7, 0]} intensity={0.6} color="#FFECA1" distance={2.5} />
                </group>
              ))}

              {/* Tall Walnut Wardrobe with Detailed Doors */}
              <group position={[-4.8, 0.8, -3.1]}>
                <mesh castShadow>
                  <boxGeometry args={[0.65, 1.6, 1.2]} />
                  <meshStandardMaterial color="#5A4A3A" roughness={0.7} />
                </mesh>
                {/* Wardrobe door divisions */}
                <mesh position={[0.33, 0, 0]}>
                  <boxGeometry args={[0.02, 1.6, 0.01]} />
                  <meshStandardMaterial color="#2C2621" />
                </mesh>
              </group>

              {/* Floor Mirror with Brass Frame */}
              <group position={[-2.2, 0, -3.2]} rotation={[0, Math.PI / 6, 0]}>
                {/* Mirror Frame */}
                <mesh position={[0, 0.7, 0]} castShadow>
                  <boxGeometry args={[0.1, 1.4, 0.6]} />
                  <meshStandardMaterial color="#C2A585" metalness={0.9} roughness={0.1} />
                </mesh>
                {/* Mirror Glass face */}
                <mesh position={[0.051, 0.7, 0]}>
                  <boxGeometry args={[0.001, 1.3, 0.5]} />
                  <meshStandardMaterial color="#DFE6F5" roughness={0.0} metalness={1.0} />
                </mesh>
              </group>

              {/* Fiddle Leaf Fig Decorative Corner Plant */}
              <group position={[-2.4, 0, 3.2]}>
                <mesh position={[0, 0.15, 0]} castShadow>
                  <cylinderGeometry args={[0.18, 0.12, 0.3]} />
                  <meshStandardMaterial color="#FAF8F5" roughness={0.5} />
                </mesh>
                {/* Stalk */}
                <mesh position={[0, 0.45, 0]}>
                  <cylinderGeometry args={[0.015, 0.015, 0.6]} />
                  <meshStandardMaterial color="#5A4A3A" />
                </mesh>
                {/* Layered Foliage Spheres representing leaves */}
                <mesh position={[0, 0.6, 0]} castShadow>
                  <sphereGeometry args={[0.26, 12, 12]} />
                  <meshStandardMaterial color="#8A8E74" roughness={0.9} />
                </mesh>
                <mesh position={[0.1, 0.8, -0.05]} castShadow>
                  <sphereGeometry args={[0.2, 12, 12]} />
                  <meshStandardMaterial color="#8A8E74" roughness={0.9} />
                </mesh>
                <mesh position={[-0.05, 0.7, 0.1]} castShadow>
                  <sphereGeometry args={[0.22, 12, 12]} />
                  <meshStandardMaterial color="#8D9278" roughness={0.9} />
                </mesh>
              </group>
            </group>
          )}

          {/* ── 2. BEDROOM 2 (Secondary suite, bottom right) ── */}
          {beds >= 2 && (
            <group position={[3.8, 0, 2.2]}>
              {/* Twin Bed */}
              <mesh position={[0, 0.25, 0]} castShadow>
                <boxGeometry args={[1.2, 0.5, 2.0]} />
                <meshStandardMaterial color="#FAF8F5" roughness={0.8} />
              </mesh>
              <mesh position={[0, 0.27, 0.3]} castShadow>
                <boxGeometry args={[1.22, 0.52, 1.4]} />
                <meshStandardMaterial color="#8C7662" roughness={0.85} />
              </mesh>
              {/* Study Desk */}
              <mesh position={[-1.1, 0.38, -0.3]} castShadow>
                <boxGeometry args={[0.8, 0.76, 0.5]} />
                <meshStandardMaterial color="#5A4A3A" roughness={0.7} />
              </mesh>
              {/* Minimal Computer Display */}
              <mesh position={[-1.1, 0.95, -0.3]} castShadow>
                <boxGeometry args={[0.1, 0.35, 0.45]} />
                <meshStandardMaterial color="#1E1A17" metalness={0.7} roughness={0.2} />
              </mesh>
            </group>
          )}

          {/* ── 3. BEDROOM 3 / GUEST DAYBED (Top Center) ── */}
          {beds >= 3 && (
            <group position={[0, 0, -2.8]}>
              {/* Guest Daybed Sofa */}
              <mesh position={[0, 0.24, 0]} castShadow>
                <boxGeometry args={[1.8, 0.48, 0.8]} />
                <meshStandardMaterial color="#E6DFD5" roughness={0.9} />
              </mesh>
              {/* Bookcase */}
              <mesh position={[-1.2, 0.7, 0]} castShadow>
                <boxGeometry args={[0.5, 1.4, 0.6]} />
                <meshStandardMaterial color="#5A4A3A" roughness={0.8} />
              </mesh>
            </group>
          )}

          {/* ── 4. LIVING ROOM LOUNGE (Center) ── */}
          {/* Detailed Sectional Sofa (Bouclé Linen Cream) */}
          <group position={[0.2, 0, 0.6]}>
            {/* Sofa Base */}
            <mesh position={[0, 0.05, 0]} castShadow>
              <boxGeometry args={[2.2, 0.1, 0.75]} />
              <meshStandardMaterial color="#5A4A3A" roughness={0.8} />
            </mesh>
            <mesh position={[0.75, 0.05, -0.6]} castShadow>
              <boxGeometry args={[0.7, 0.1, 1.25]} />
              <meshStandardMaterial color="#5A4A3A" roughness={0.8} />
            </mesh>
            {/* Cylindrical metal feet */}
            {[-1.0, 0.0, 1.0].map((xF, fIdx) => (
              <mesh key={fIdx} position={[xF, 0.02, 0.3]} castShadow>
                <cylinderGeometry args={[0.025, 0.025, 0.04]} />
                <meshStandardMaterial color="#A88E75" metalness={0.8} />
              </mesh>
            ))}
            {/* Sofa Cushions */}
            <mesh position={[0, 0.28, 0]} castShadow>
              <boxGeometry args={[2.2, 0.36, 0.75]} />
              <meshStandardMaterial color="#FAF8F5" roughness={0.85} />
            </mesh>
            <mesh position={[0.75, 0.28, -0.6]} castShadow>
              <boxGeometry args={[0.7, 0.36, 1.25]} />
              <meshStandardMaterial color="#FAF8F5" roughness={0.85} />
            </mesh>
            {/* Backrest Cushions */}
            <mesh position={[0, 0.5, 0.32]} castShadow>
              <boxGeometry args={[2.2, 0.25, 0.12]} />
              <meshStandardMaterial color="#FAF8F5" roughness={0.85} />
            </mesh>
            <mesh position={[1.05, 0.5, -0.6]} castShadow>
              <boxGeometry args={[0.12, 0.25, 1.25]} />
              <meshStandardMaterial color="#FAF8F5" roughness={0.85} />
            </mesh>
          </group>

          {/* Designer Armchair (Beige/Green) */}
          <group position={[-1.1, 0, 2.0]} rotation={[0, Math.PI / 4, 0]}>
            <mesh position={[0, 0.23, 0]} castShadow>
              <boxGeometry args={[0.65, 0.46, 0.65]} />
              <meshStandardMaterial color="#8A8E74" roughness={0.8} />
            </mesh>
          </group>

          {/* Walnut Architectural Coffee Table */}
          <mesh position={[0.1, 0.12, 1.8]} castShadow>
            <boxGeometry args={[1.2, 0.22, 0.7]} />
            <meshStandardMaterial color="#5A4A3A" roughness={0.8} />
          </mesh>

          {/* Television slatted walnut accent wall */}
          <group position={[-1.71, 0, 0.5]}>
            {/* TV Console */}
            <mesh position={[0, 0.18, 0]} castShadow>
              <boxGeometry args={[0.08, 0.36, 1.6]} />
              <meshStandardMaterial color="#5A4A3A" roughness={0.8} />
            </mesh>
            {/* Slatted wood background */}
            <mesh position={[-0.03, 0.8, 0]}>
              <boxGeometry args={[0.02, 1.6, 1.6]} />
              <meshStandardMaterial color="#8C7662" roughness={0.9} />
            </mesh>
            {/* Thin OLED Display panel */}
            <mesh position={[0.02, 0.7, 0]} castShadow>
              <boxGeometry args={[0.03, 0.75, 1.15]} />
              <meshStandardMaterial color="#1E1A17" roughness={0.4} metalness={0.7} />
            </mesh>
          </group>


          {/* ── 5. OPEN-PLAN KITCHEN (Top Right) ── */}
          {/* L-Shape Luxury Counters and Overhead Cabinets */}
          <group position={[4.1, 0, -3.35]}>
            <mesh position={[0, 0.45, 0]} castShadow>
              <boxGeometry args={[3.0, 0.9, 0.6]} />
              <meshStandardMaterial color="#FAF8F5" roughness={0.5} />
            </mesh>
            <mesh position={[0, 0.91, 0]}>
              <boxGeometry args={[3.02, 0.02, 0.62]} />
              <meshStandardMaterial color="#5A4A3A" roughness={0.7} />
            </mesh>
            {/* Cabinet drawers panel lines */}
            {[-1.0, 0.0, 1.0].map((xD, dIdx) => (
              <mesh key={dIdx} position={[xD, 0.45, 0.301]}>
                <boxGeometry args={[0.01, 0.9, 0.005]} />
                <meshStandardMaterial color="#E6DFD5" />
              </mesh>
            ))}
          </group>

          <group position={[5.2, 0, -2.05]}>
            <mesh position={[0, 0.45, 0]} castShadow>
              <boxGeometry args={[0.6, 0.9, 2.0]} />
              <meshStandardMaterial color="#FAF8F5" roughness={0.5} />
            </mesh>
            <mesh position={[0, 0.91, 0]}>
              <boxGeometry args={[0.62, 0.02, 2.02]} />
              <meshStandardMaterial color="#5A4A3A" roughness={0.7} />
            </mesh>
          </group>

          {/* Stainless Bronze Refrigerator */}
          <mesh position={[5.2, 0.85, -0.6]} castShadow>
            <boxGeometry args={[0.65, 1.7, 0.65]} />
            <meshStandardMaterial color="#A88E75" roughness={0.4} metalness={0.4} />
          </mesh>

          {/* Kitchen Island Counter */}
          <group position={[3.1, 0, -1.55]}>
            <mesh position={[0, 0.45, 0]} castShadow>
              <boxGeometry args={[1.2, 0.9, 0.6]} />
              <meshStandardMaterial color="#FAF8F5" roughness={0.5} />
            </mesh>
            <mesh position={[0, 0.91, 0]}>
              <boxGeometry args={[1.22, 0.02, 0.62]} />
              <meshStandardMaterial color="#5A4A3A" roughness={0.7} />
            </mesh>
          </group>

          {/* Fine Stools */}
          <group position={[2.4, 0, -1.55]}>
            <mesh position={[0, 0.25, 0.18]} castShadow>
              <boxGeometry args={[0.22, 0.5, 0.22]} />
              <meshStandardMaterial color="#5A4A3A" />
            </mesh>
            <mesh position={[0, 0.25, -0.18]} castShadow>
              <boxGeometry args={[0.22, 0.5, 0.22]} />
              <meshStandardMaterial color="#5A4A3A" />
            </mesh>
          </group>


          {/* ── 6. ENSUITE BATHROOM (Right Center / Bottom) ── */}
          {baths >= 1 && (
            <group>
              {/* Glass Shower Cubicle with Detailed Chrome Hardware */}
              <group position={[4.9, 0, 3.1]}>
                <mesh position={[0, 0.8, 0]} castShadow>
                  <boxGeometry args={[1.1, 1.6, 1.1]} />
                  <meshStandardMaterial color="#C2D5F7" transparent opacity={0.35} roughness={0.1} />
                </mesh>
                <mesh position={[0, 0.02, 0]}>
                  <boxGeometry args={[1.12, 0.04, 1.12]} />
                  <meshStandardMaterial color="#E6DFD5" />
                </mesh>
                {/* Shower Head */}
                <mesh position={[0, 1.4, -0.45]}>
                  <cylinderGeometry args={[0.04, 0.04, 0.02]} />
                  <meshStandardMaterial color="#C2A585" metalness={0.9} />
                </mesh>
              </group>

              {/* Floating Vanity Sink Block */}
              <group position={[3.3, 0, 3.35]}>
                <mesh position={[0, 0.4, 0]} castShadow>
                  <boxGeometry args={[0.95, 0.8, 0.5]} />
                  <meshStandardMaterial color="#5A4A3A" roughness={0.8} />
                </mesh>
                <mesh position={[0, 0.81, 0]}>
                  <boxGeometry args={[0.75, 0.04, 0.42]} />
                  <meshStandardMaterial color="#FAF8F5" />
                </mesh>
                {/* Tap faucet */}
                <mesh position={[0, 0.88, -0.15]}>
                  <cylinderGeometry args={[0.015, 0.015, 0.12]} />
                  <meshStandardMaterial color="#C2A585" metalness={0.9} />
                </mesh>
                {/* Wall Mirror */}
                <mesh position={[0, 1.25, 0.24]} rotation={[Math.PI / 2, 0, 0]}>
                  <cylinderGeometry args={[0.26, 0.26, 0.02]} />
                  <meshStandardMaterial color="#DFE6F5" roughness={0.0} metalness={0.9} />
                </mesh>
              </group>

              {/* Bathroom Toilet Bowl */}
              <group position={[4.9, 0, 1.2]}>
                <mesh position={[0, 0.18, 0]} castShadow>
                  <boxGeometry args={[0.38, 0.36, 0.5]} />
                  <meshStandardMaterial color="#FAF8F5" roughness={0.5} />
                </mesh>
                <mesh position={[0, 0.55, 0.18]} castShadow>
                  <boxGeometry args={[0.38, 0.45, 0.18]} />
                  <meshStandardMaterial color="#FAF8F5" roughness={0.5} />
                </mesh>
                {/* Silver Flush plate */}
                <mesh position={[0, 0.62, 0.272]}>
                  <boxGeometry args={[0.1, 0.08, 0.01]} />
                  <meshStandardMaterial color="#C2A585" metalness={0.8} />
                </mesh>
              </group>
            </group>
          )}

          {/* Bathroom 2 (Activated when baths >= 2) */}
          {baths >= 2 && (
            <group position={[-3.6, 0, 3.2]}>
              <mesh position={[0, 0.18, 0]} castShadow>
                <boxGeometry args={[0.38, 0.36, 0.5]} />
                <meshStandardMaterial color="#FAF8F5" />
              </mesh>
              <mesh position={[0.7, 0.4, 0]} castShadow>
                <boxGeometry args={[0.6, 0.8, 0.5]} />
                <meshStandardMaterial color="#5A4A3A" />
              </mesh>
            </group>
          )}
        </>
      )}
    </group>
  );
}

// ─── Main Canvas Visualizer Wrapper with Embedded Control Panel ───────────────

export default function ProjectVisualizer3D({ type, title }: VisualizerProps) {
  const [wireframe, setWireframe] = useState(false);
  const [viewMode, setViewMode] = useState<"3d" | "2d">("3d");
  const controlsRef = useRef<any>(null);

  // Dynamic parameters for live interactive generation
  const [beds, setBeds] = useState(1);
  const [baths, setBaths] = useState(1);
  const [layoutStyle, setLayoutStyle] = useState<"open-plan" | "l-shape" | "studio">("open-plan");
  
  // Real-time AI solve states
  const [isSolving, setIsSolving] = useState(false);
  const [solveStep, setSolveStep] = useState(0);
  const [promptInput, setPromptInput] = useState("Spatially optimized layout prioritizing cross-circulation and natural sunlight in the master suite.");

  const resetCamera = () => {
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
  };

  // Simulates standard GNN edge solvers
  const handleGenerate = () => {
    setIsSolving(true);
    setSolveStep(0);
  };

  useEffect(() => {
    if (!isSolving) return;

    const interval = setInterval(() => {
      setSolveStep((prev) => {
        if (prev >= 4) {
          clearInterval(interval);
          setIsSolving(false);
          return 4;
        }
        return prev + 1;
      });
    }, 600);

    return () => clearInterval(interval);
  }, [isSolving]);

  const telemetryLogs = [
    "Establishing link to generative edge routing solver...",
    "Computing Microsoft TRELLIS v2 quad-mesh parameters...",
    "Resolving wall vectors and doors swing bounds...",
    "Verifying local ADA spatial clearances...",
    "Spatially allocating PBR materials. Layout Compiled!"
  ];

  // Dynamic calculation metrics
  const totalArea = layoutStyle === "studio" ? 540 : beds * 380 + baths * 140 + 360;
  const solveTime = (1.8 + beds * 0.4 + baths * 0.3).toFixed(1);
  const complianceScore = 95 + beds - baths;

  return (
    <div className="relative w-full flex flex-col lg:flex-row bg-gradient-to-br from-[#FAF8F5] via-[#F5EFE6] to-[#FAF8F5] border border-[#E5DFD9] rounded-2xl shadow-[0_24px_64px_rgba(42,39,36,0.08)] overflow-hidden">
      
      {/* ─── 1. INTERACTIVE CONTROL PANEL (Left Sidebar) ─── */}
      <aside className="w-full lg:w-[320px] bg-white border-b lg:border-b-0 lg:border-r border-hairline flex flex-col shrink-0 p-5 gap-5 shadow-card select-none z-20">
        
        {/* Header Title */}
        <div className="flex items-center gap-2 border-b border-hairline pb-3">
          <Brain size={18} className="text-indigo animate-pulse" />
          <div>
            <h3 className="font-jakarta text-xs font-bold text-charcoal uppercase tracking-wider">
              AI Spatial Solver
            </h3>
            <p className="text-[10px] text-stone font-body">Expose real-time layout variants.</p>
          </div>
        </div>

        {/* Room configuration Matrix */}
        <div className="space-y-4">
          <label className="font-jakarta text-[10px] font-bold text-stone uppercase tracking-wider block">
            Room Target Matrix
          </label>

          {/* Bedrooms */}
          <div className="flex items-center justify-between bg-alabaster border border-hairline p-2.5 rounded-xl">
            <span className="font-body text-xs font-bold text-charcoal">Bedrooms</span>
            <div className="flex items-center gap-3">
              <button
                disabled={beds <= 1 || isSolving}
                onClick={() => setBeds(beds - 1)}
                className="w-7 h-7 bg-white border border-hairline rounded-lg flex items-center justify-center text-stone hover:text-charcoal hover:bg-gray-50 disabled:opacity-40 transition-all cursor-pointer"
              >
                <Minus size={12} />
              </button>
              <span className="font-mono text-xs font-bold text-charcoal w-4 text-center">{beds}</span>
              <button
                disabled={beds >= 3 || isSolving}
                onClick={() => setBeds(beds + 1)}
                className="w-7 h-7 bg-white border border-hairline rounded-lg flex items-center justify-center text-stone hover:text-charcoal hover:bg-gray-50 disabled:opacity-40 transition-all cursor-pointer"
              >
                <Plus size={12} />
              </button>
            </div>
          </div>

          {/* Bathrooms */}
          <div className="flex items-center justify-between bg-alabaster border border-hairline p-2.5 rounded-xl">
            <span className="font-body text-xs font-bold text-charcoal">Bathrooms</span>
            <div className="flex items-center gap-3">
              <button
                disabled={baths <= 1 || isSolving}
                onClick={() => setBaths(baths - 1)}
                className="w-7 h-7 bg-white border border-hairline rounded-lg flex items-center justify-center text-stone hover:text-charcoal hover:bg-gray-50 disabled:opacity-40 transition-all cursor-pointer"
              >
                <Minus size={12} />
              </button>
              <span className="font-mono text-xs font-bold text-charcoal w-4 text-center">{baths}</span>
              <button
                disabled={baths >= 2 || isSolving}
                onClick={() => setBaths(baths + 1)}
                className="w-7 h-7 bg-white border border-hairline rounded-lg flex items-center justify-center text-stone hover:text-charcoal hover:bg-gray-50 disabled:opacity-40 transition-all cursor-pointer"
              >
                <Plus size={12} />
              </button>
            </div>
          </div>
        </div>

        {/* Layout Style Model */}
        <div className="space-y-2">
          <label className="font-jakarta text-[10px] font-bold text-stone uppercase tracking-wider block">
            Layout Footprint Model
          </label>
          <div className="grid grid-cols-3 gap-1.5">
            {(["open-plan", "l-shape", "studio"] as const).map((styleOpt) => {
              const active = layoutStyle === styleOpt;
              return (
                <button
                  key={styleOpt}
                  disabled={isSolving}
                  onClick={() => setLayoutStyle(styleOpt)}
                  className={`py-1.5 rounded-lg border text-[10px] font-bold uppercase transition-all cursor-pointer outline-none ${
                    active
                      ? "bg-indigo-light border-indigo text-indigo"
                      : "bg-white border-hairline text-stone hover:bg-gray-50 hover:text-charcoal"
                  }`}
                >
                  {styleOpt === "open-plan" ? "Open" : styleOpt === "l-shape" ? "L-Shape" : "Studio"}
                </button>
              );
            })}
          </div>
        </div>

        {/* Prompt Input guidelines */}
        <div className="space-y-2">
          <label className="font-jakarta text-[10px] font-bold text-stone uppercase tracking-wider block">
            AI Prompt Requirements
          </label>
          <textarea
            disabled={isSolving}
            value={promptInput}
            onChange={(e) => setPromptInput(e.target.value)}
            placeholder="Describe extra layout parameters..."
            className="w-full h-16 p-2 bg-white border border-hairline focus:border-indigo rounded-xl text-[10px] font-body text-charcoal outline-none resize-none placeholder:text-stone/60 transition-colors"
          />
        </div>

        {/* Compile solver CTA button */}
        <button
          onClick={handleGenerate}
          disabled={isSolving}
          className="w-full h-11 bg-indigo hover:bg-indigo-dark text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-button disabled:opacity-50 transition-colors outline-none cursor-pointer mt-auto"
        >
          <Sparkles size={13} className={isSolving ? "animate-spin" : ""} />
          <span>{isSolving ? "Solving Spatial Layout..." : "Generate House Plan"}</span>
        </button>

      </aside>

      {/* ─── 2. PRIMARY WEBGL CANVAS (Right Viewport) ─── */}
      <div className="flex-grow aspect-[16/10] relative flex flex-col cursor-grab active:cursor-grabbing">
        
        {/* Floating WebGL Toolbar */}
        <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between pointer-events-none">
          {/* Left indicator status */}
          <div className="flex items-center gap-2 pointer-events-auto">
            <span className="px-2.5 py-1 bg-white/80 backdrop-blur-md text-charcoal border border-hairline rounded-full text-[9px] font-bold uppercase tracking-wider shadow-sm flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-success rounded-full animate-pulse" />
              AI Layout Compiled
            </span>
          </div>

          {/* Right viewport controllers */}
          <div className="flex items-center gap-1.5 pointer-events-auto">
            <button
              onClick={() => setWireframe((prev) => !prev)}
              className={`w-7.5 h-7.5 rounded-lg flex items-center justify-center border transition-all duration-200 outline-none cursor-pointer ${
                wireframe
                  ? "bg-indigo border-transparent text-white shadow-[0_0_12px_rgba(140,118,98,0.4)]"
                  : "bg-white/80 backdrop-blur-md border border-hairline text-stone hover:text-charcoal hover:bg-gray-50"
              }`}
              title="Toggle Holographic Wireframe"
            >
              <Box size={14} />
            </button>
            <button
              onClick={() => setViewMode((prev) => (prev === "2d" ? "3d" : "2d"))}
              className={`w-7.5 h-7.5 rounded-lg flex items-center justify-center border transition-all duration-200 outline-none cursor-pointer ${
                viewMode === "2d"
                  ? "bg-indigo border-transparent text-white shadow-[0_0_12px_rgba(140,118,98,0.4)]"
                  : "bg-white/80 backdrop-blur-md border border-hairline text-stone hover:text-charcoal hover:bg-gray-50"
              }`}
              title="Toggle Orthographic Plan"
            >
              <LayoutGrid size={14} />
            </button>
            <button
              onClick={resetCamera}
              className="w-7.5 h-7.5 bg-white/80 backdrop-blur-md border border-hairline rounded-lg flex items-center justify-center text-stone hover:text-charcoal hover:bg-gray-50 transition-all outline-none cursor-pointer"
              title="Reset Camera View"
            >
              <RotateCcw size={14} />
            </button>
          </div>
        </div>

        {/* 3D Canvas Environment */}
        <div className="w-full h-full relative">
          <Canvas shadows gl={{ antialias: true, alpha: false }}>
            <color attach="background" args={["#FAF8F5"]} />
            
            <PerspectiveCamera
              makeDefault
              position={viewMode === "2d" ? [0, 9.5, 0.01] : [6, 6.2, 8]}
              fov={45}
            />

            {/* Lighting Studio */}
            <ambientLight intensity={wireframe ? 0.95 : 0.6} />
            <directionalLight
              position={[8, 12, 5]}
              intensity={1.2}
              castShadow
              shadow-mapSize-width={1024}
              shadow-mapSize-height={1024}
              shadow-bias={-0.0001}
            />
            <pointLight position={[-6, 4, -4]} intensity={0.5} color="#FAF8F5" />
            <pointLight position={[6, -2, 6]} intensity={0.3} color="#C2A585" />

            {/* Layout Grid */}
            {viewMode === "3d" && (
              <Grid
                position={[0, -0.6, 0]}
                args={[15, 15]}
                cellSize={0.5}
                cellThickness={0.5}
                cellColor="#EAE5DF"
                sectionSize={2.5}
                sectionThickness={1}
                sectionColor="#8C7662"
                fadeDistance={18}
                infiniteGrid
              />
            )}

            {/* Scene Mesh Components */}
            <Center>
              <SceneContent
                beds={beds}
                baths={baths}
                layoutStyle={layoutStyle}
                wireframe={wireframe}
              />
            </Center>

            <OrbitControls
              ref={controlsRef}
              enableDamping
              dampingFactor={0.05}
              minDistance={3}
              maxDistance={15}
              maxPolarAngle={viewMode === "2d" ? 0.01 : Math.PI / 1.85}
              minPolarAngle={viewMode === "2d" ? 0 : 0.1}
            />
          </Canvas>

          {/* Real-time Dynamic AI Solve Progress Blur Overlay */}
          {isSolving && (
            <div className="absolute inset-0 bg-white/75 backdrop-blur-md flex flex-col justify-center items-center p-6 text-center z-30 select-none animate-fadeIn">
              <div className="w-[300px] space-y-4">
                {/* Micro spinner */}
                <div className="flex justify-center">
                  <div className="w-8 h-8 rounded-full border-2 border-indigo-light border-t-indigo animate-spin" />
                </div>
                {/* Telemetry log title */}
                <div className="space-y-1">
                  <h4 className="font-jakarta text-xs font-bold text-charcoal uppercase tracking-wider">
                    Spatially Resolving GNN Layout
                  </h4>
                  <p className="text-[10px] font-mono text-stone font-bold uppercase tracking-wider animate-pulse">
                    Stage {solveStep + 1}/5
                  </p>
                </div>
                {/* Log terminal */}
                <div className="p-3 bg-[#FAF8F5] border border-hairline rounded-xl text-left font-mono text-[9px] text-stone leading-relaxed">
                  {telemetryLogs.slice(0, solveStep + 1).map((log, lIdx) => (
                    <div key={lIdx} className="flex gap-1.5 items-start">
                      <span className="text-indigo font-bold">✓</span>
                      <span>{log}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 3. Floating Bottom Performance Metrics (Expose live solve calculations) */}
        <div className="absolute bottom-4 left-4 right-4 z-10 grid grid-cols-3 gap-3.5 pointer-events-none">
          <div className="bg-white/90 backdrop-blur-md border border-hairline rounded-xl p-3 shadow-[0_12px_24px_rgba(42,39,36,0.03)] flex flex-col justify-center gap-0.5">
            <span className="font-mono text-xs font-bold text-charcoal tracking-tight">
              {totalArea} sq ft
            </span>
            <span className="text-[9px] text-stone font-semibold uppercase tracking-wider">
              Total Footprint
            </span>
          </div>
          <div className="bg-white/90 backdrop-blur-md border border-hairline rounded-xl p-3 shadow-[0_12px_24px_rgba(42,39,36,0.03)] flex flex-col justify-center gap-0.5">
            <span className="font-mono text-xs font-bold text-charcoal tracking-tight">
              {solveTime}s Solve
            </span>
            <span className="text-[9px] text-stone font-semibold uppercase tracking-wider">
              Edge Solve Time
            </span>
          </div>
          <div className="bg-white/90 backdrop-blur-md border border-[#E6DFD5] rounded-xl p-3 shadow-[0_12px_24px_rgba(42,39,36,0.03)] flex flex-col justify-center gap-0.5">
            <span className="font-mono text-xs font-bold text-charcoal tracking-tight">
              {complianceScore}% Fit
            </span>
            <span className="text-[9px] text-stone font-semibold uppercase tracking-wider">
              Code Clearance
            </span>
          </div>
        </div>
      </div>

    </div>
  );
}
