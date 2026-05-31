"use client";

import React, { useState } from "react";
import { useEditorStore } from "@/store/useEditorStore";
import { useShallow } from "zustand/react/shallow";
import { Line, Html } from "@react-three/drei";
import { nanoid } from "@/lib/utils";
import type { MEPNode, MEPEdge, Vec3D } from "@/types/puter";
import { calculateMepPath } from "@/lib/mep-router";

import type { ThreeEvent } from "@react-three/fiber";

export default function MepOverlay() {
  const { tool, mepNodes, mepEdges, addMepNode, addMepEdge, floorPlanLayout } = useEditorStore(
    useShallow((s) => ({
      tool: s.tool,
      mepNodes: s.mepNodes,
      mepEdges: s.mepEdges,
      addMepNode: s.addMepNode,
      addMepEdge: s.addMepEdge,
      floorPlanLayout: s.floorPlanLayout,
    }))
  );

  const [activeMepType, setActiveMepType] = useState<"electrical" | "plumbing" | "hvac">("electrical");
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // Check if we are drawing or placing MEP entities
  const isMepActive = tool === "add-room"; // use add-room as our custom MEP placement trigger

  const handleFloorClick = (e: ThreeEvent<PointerEvent>) => {
    if (!isMepActive) return;
    e.stopPropagation();

    // 3D coordinate clicked
    const pos: Vec3D = {
      x: e.point.x,
      y: activeMepType === "electrical" ? 0.8 : activeMepType === "hvac" ? 2.5 : 0.05,
      z: e.point.z,
    };

    const nodeId = `mep-${activeMepType}-${nanoid()}`;
    const newNode: MEPNode = {
      id: nodeId,
      type: activeMepType,
      system: activeMepType === "electrical" ? "power" : activeMepType === "hvac" ? "air" : "supply",
      position: pos,
      label: `${activeMepType.toUpperCase()} Node`,
    };

    addMepNode(newNode);

    // If there was a previously selected node of the same type, wire/pipe them automatically!
    if (selectedNodeId) {
      const prevNode = mepNodes.find((n) => n.id === selectedNodeId);
      if (prevNode && prevNode.type === activeMepType) {
        // Use advanced A* pathfinding to route avoiding rooms and traveling through walls
        let path: Vec3D[];
        if (floorPlanLayout) {
          path = calculateMepPath(prevNode.position, pos, floorPlanLayout);
        } else {
          path = [
            prevNode.position,
            { x: pos.x, y: prevNode.position.y, z: prevNode.position.z },
            pos,
          ];
        }

        const edgeId = `edge-${nanoid()}`;
        const newEdge: MEPEdge = {
          id: edgeId,
          fromNodeId: selectedNodeId,
          toNodeId: nodeId,
          type: activeMepType === "electrical" ? "wire" : activeMepType === "hvac" ? "duct" : "pipe",
          path,
        };
        addMepEdge(newEdge);
      }
      setSelectedNodeId(null);
    } else {
      setSelectedNodeId(nodeId);
    }
  };

  const getSystemColor = (type: "electrical" | "plumbing" | "hvac") => {
    switch (type) {
      case "electrical": return "#3B82F6"; // Electric Blue
      case "plumbing": return "#06B6D4"; // Cyan Water
      case "hvac": return "#94A3B8"; // Silver duct
    }
  };

  return (
    <group>
      {/* ── 1. CLICKABLE INTERCEPTOR PLANE WHEN MEP ACTIVE ───────────────── */}
      {isMepActive && (
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 0.01, 0]}
          onPointerDown={handleFloorClick}
          visible={false}
        >
          <planeGeometry args={[200, 200]} />
        </mesh>
      )}

      {/* ── 2. RENDER MEP NODES ────────────────────────────────────────────── */}
      {mepNodes.map((node) => {
        const color = getSystemColor(node.type);
        const isSelected = selectedNodeId === node.id;

        return (
          <group key={node.id} position={[node.position.x, node.position.y, node.position.z]}>
            {/* 3D mesh node cylinder representer */}
            <mesh 
              onClick={(e) => {
                e.stopPropagation();
                setSelectedNodeId(isSelected ? null : node.id);
              }}
            >
              {node.type === "electrical" ? (
                <boxGeometry args={[0.15, 0.25, 0.1]} />
              ) : (
                <cylinderGeometry args={[0.15, 0.15, 0.2, 12]} />
              )}
              <meshStandardMaterial 
                color={color} 
                roughness={0.2}
                emissive={color}
                emissiveIntensity={isSelected ? 0.6 : 0.1}
              />
            </mesh>

            {/* Glowing selection ring */}
            {isSelected && (
              <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]}>
                <ringGeometry args={[0.2, 0.25, 16]} />
                <meshBasicMaterial color="#FFD700" side={2} />
              </mesh>
            )}

            {/* Overlay label */}
            <Html center position={[0, 0.35, 0]}>
              <div className="bg-dark-surface/95 border border-hairline-dark rounded px-1 py-0.5 text-[7.5px] font-bold text-on-dark uppercase tracking-wider whitespace-nowrap">
                {node.label}
              </div>
            </Html>
          </group>
        );
      })}

      {/* ── 3. RENDER MEP ROUTED WIRES & PIPES ───────────────────────────── */}
      {mepEdges.map((edge) => {
        const fromNode = mepNodes.find((n) => n.id === edge.fromNodeId);
        const toNode = mepNodes.find((n) => n.id === edge.toNodeId);
        if (!fromNode || !toNode) return null;

        const color = getSystemColor(fromNode.type);
        
        // Map Vec3D[] coordinates to R3F Line points tuple
        const points = edge.path.map((p) => [p.x, p.y, p.z] as [number, number, number]);

        return (
          <group key={edge.id}>
            {/* Main conduit/pipe/wire line */}
            <Line
              points={points}
              color={color}
              lineWidth={edge.type === "duct" ? 5 : edge.type === "pipe" ? 3.5 : 2}
            />

            {/* Pipe volumetric cylinder sleeves along path */}
            {edge.type === "pipe" && points.map((pt, i) => {
              if (i === points.length - 1) return null;
              const nextPt = points[i + 1]!;
              const mid = [(pt[0] + nextPt[0]) / 2, (pt[1] + nextPt[1]) / 2, (pt[2] + nextPt[2]) / 2];
              const dist = Math.hypot(pt[0] - nextPt[0], pt[1] - nextPt[1], pt[2] - nextPt[2]);
              
              return (
                <mesh key={i} position={mid as [number, number, number]} rotation={[0, 0, 0]}>
                  <cylinderGeometry args={[0.06, 0.06, dist, 8]} />
                  <meshStandardMaterial color={color} roughness={0.1} metalness={0.8} />
                </mesh>
              );
            })}
          </group>
        );
      })}

      {/* ── 4. FLOATING MEP LAYER TOGGLE WIDGET ──────────────────────────── */}
      {isMepActive && (
        <Html position={[0, 3.2, 0]} center>
          <div className="bg-dark-surface/95 border border-hairline-dark text-on-dark rounded-2xl p-3 shadow-2xl flex flex-col gap-2 w-48 pointer-events-auto select-none">
            <span className="font-jakarta text-[9px] font-bold text-stone uppercase tracking-widest block border-b border-hairline-dark/60 pb-1">
              MEP Routing System
            </span>
            <div className="flex flex-col gap-1">
              {(["electrical", "plumbing", "hvac"] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => {
                    setActiveMepType(type);
                    setSelectedNodeId(null);
                  }}
                  className={`w-full text-left px-2 py-1 rounded text-[9px] font-bold uppercase tracking-wider transition-all border outline-none cursor-pointer ${
                    activeMepType === type
                      ? "bg-indigo-light border-indigo text-indigo"
                      : "bg-dark-surface-alt border-hairline-dark text-stone hover:bg-gray-800"
                  }`}
                >
                  <span className="inline-block w-1.5 h-1.5 rounded-full mr-2" style={{ backgroundColor: getSystemColor(type) }} />
                  {type} System
                </button>
              ))}
            </div>
            <span className="text-[7.5px] text-stone leading-tight text-center mt-1">
              💡 Click on floor to place outlets/drains. Click two nodes sequentially to route connection lines.
            </span>
          </div>
        </Html>
      )}
    </group>
  );
}
