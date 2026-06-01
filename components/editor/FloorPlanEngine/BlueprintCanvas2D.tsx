"use client";

import React, { useState, useEffect } from "react";
import { Stage, Layer, Rect, Text, Group, Line as KonvaLine } from "react-konva";
import { useEditorStore } from "@/store/useEditorStore";
import { useShallow } from "zustand/react/shallow";
import { feetToMeters } from "@/lib/utils";
import { toast } from "sonner";

export default function BlueprintCanvas2D() {
  const { floorPlanLayout, setFloorPlan, dimensionLines } = useEditorStore(
    useShallow((s) => ({
      floorPlanLayout: s.floorPlanLayout,
      setFloorPlan: s.setFloorPlan,
      dimensionLines: s.dimensionLines,
    }))
  );

  const [stageSize, setStageSize] = useState({ width: 800, height: 600 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const handleMounted = requestAnimationFrame(() => {
      setMounted(true);
    });
    const updateSize = () => {
      const container = document.getElementById("blueprint-container");
      if (container) {
        setStageSize({
          width: container.offsetWidth,
          height: container.offsetHeight,
        });
      }
    };
    
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => {
      window.removeEventListener("resize", updateSize);
      cancelAnimationFrame(handleMounted);
    };
  }, []);

  if (!mounted || !floorPlanLayout) return null;

  // 1 meter = 50 pixels (zoom scale)
  const SCALE = 50; 
  
  // Center origin
  const offsetX = stageSize.width / 2;
  const offsetY = stageSize.height / 2;

  // Handle dynamic mathematical wall resizing from 2D click badges
  const handleResizeWall2D = (wallId: string, newLengthFt: number) => {
    if (isNaN(newLengthFt) || newLengthFt <= 0.5) {
      toast.error("Invalid wall dimension entered.");
      return;
    }

    const updatedWalls = floorPlanLayout.walls.map((w) => {
      if (w.id !== wallId) return w;

      const dx = w.end.x - w.start.x;
      const dy = w.end.y - w.start.y;
      const currentLen = Math.hypot(dx, dy);

      if (currentLen === 0) return w;

      // Retain the exact same heading angle, just scale the length
      const unitX = dx / currentLen;
      const unitY = dy / currentLen;

      return {
        ...w,
        end: {
          x: w.start.x + unitX * newLengthFt,
          y: w.start.y + unitY * newLengthFt,
        },
      };
    });

    setFloorPlan({
      ...floorPlanLayout,
      walls: updatedWalls,
    });

    toast.success(`Wall segment resized to ${newLengthFt.toFixed(1)} ft!`);
  };

  return (
    <div id="blueprint-container" className="w-full h-full bg-[#1e2025] overflow-hidden relative">
      <Stage width={stageSize.width} height={stageSize.height} draggable>
        <Layer>
          {/* Base Grid Pattern */}
          <Group>
             {/* Simple grid lines can be drawn here if needed */}
          </Group>

          {/* Group that centers and scales everything */}
          <Group x={offsetX} y={offsetY} scaleX={SCALE} scaleY={SCALE}>
            
            {/* Draw Rooms */}
            {floorPlanLayout.rooms.map((room) => {
              const width = feetToMeters(room.bounds.width);
              const height = feetToMeters(room.bounds.height);
              const x = feetToMeters(room.bounds.x);
              const y = feetToMeters(room.bounds.y);

              return (
                <Group key={room.id} x={x} y={y}>
                  <Rect
                    width={width}
                    height={height}
                    fill="#2a2e35"
                    stroke="#3f4552"
                    strokeWidth={1 / SCALE}
                  />
                  {/* Room Label */}
                  <Text
                    text={`${room.label}\n${room.area.toFixed(0)} sqft`}
                    x={0}
                    y={height / 2 - 0.5}
                    width={width}
                    align="center"
                    fontSize={12 / SCALE}
                    fill="#a1a1aa"
                    fontFamily="monospace"
                  />
                </Group>
              );
            })}

            {/* Draw Walls & Interactive Dimension Labels */}
            {floorPlanLayout.walls.map((wall) => {
              const sx = feetToMeters(wall.start.x);
              const sy = feetToMeters(wall.start.y);
              const ex = feetToMeters(wall.end.x);
              const ey = feetToMeters(wall.end.y);
              const thickness = feetToMeters(wall.thickness / 12);

              const wallLengthFt = Math.hypot(wall.end.x - wall.start.x, wall.end.y - wall.start.y);

              // Center coordinates for dimension capsule overlay
              const mx = (sx + ex) / 2;
              const my = (sy + ey) / 2;

              // Capsule sizing metrics (in scaled meters)
              const badgeW = 1.1;
              const badgeH = 0.45;

              return (
                <Group key={wall.id}>
                  {/* The Structural Wall line segment */}
                  <KonvaLine
                    points={[sx, sy, ex, ey]}
                    stroke={wall.isLoadBearing ? "#94a3b8" : "#64748b"}
                    strokeWidth={thickness}
                    lineCap="square"
                  />

                  {/* Interactive Dimension Badge Center-aligned */}
                  <Group x={mx} y={my}>
                    <Rect
                      x={-badgeW / 2}
                      y={-badgeH / 2}
                      width={badgeW}
                      height={badgeH}
                      fill="#ffffff"
                      stroke="#5B6AF0"
                      strokeWidth={2 / SCALE}
                      cornerRadius={0.1}
                      shadowColor="#000000"
                      shadowBlur={6}
                      shadowOpacity={0.25}
                      onClick={() => {
                        const val = prompt(`Enter new wall length (in feet):`, wallLengthFt.toFixed(1));
                        if (val !== null) {
                          const parsed = parseFloat(val);
                          if (!isNaN(parsed) && parsed > 0.5) {
                            handleResizeWall2D(wall.id, parsed);
                          } else {
                            toast.error("Invalid wall dimension entered.");
                          }
                        }
                      }}
                    />
                    <Text
                      text={`${wallLengthFt.toFixed(1)} ft`}
                      x={-badgeW / 2}
                      y={-0.12}
                      width={badgeW}
                      align="center"
                      fontSize={11 / SCALE}
                      fontFamily="monospace"
                      fill="#1e1b4b"
                      fontStyle="bold"
                      onClick={() => {
                        const val = prompt(`Enter new wall length (in feet):`, wallLengthFt.toFixed(1));
                        if (val !== null) {
                          const parsed = parseFloat(val);
                          if (!isNaN(parsed) && parsed > 0.5) {
                            handleResizeWall2D(wall.id, parsed);
                          } else {
                            toast.error("Invalid wall dimension entered.");
                          }
                        }
                      }}
                    />
                  </Group>
                </Group>
              );
            })}

            {/* Draw Doors */}
            {floorPlanLayout.doors.map((door) => {
              const wall = floorPlanLayout.walls.find((w) => w.id === door.wallId);
              if (!wall) return null;

              const sx = feetToMeters(wall.start.x);
              const sy = feetToMeters(wall.start.y);
              const ex = feetToMeters(wall.end.x);
              const ey = feetToMeters(wall.end.y);
              
              const dx = ex - sx;
              const dy = ey - sy;
              const length = Math.hypot(dx, dy);
              if (length === 0) return null;

              const px = sx + (dx / length) * (door.position * length);
              const py = sy + (dy / length) * (door.position * length);
              const doorWidth = feetToMeters(door.width / 12);

              return (
                <Group key={door.id} x={px} y={py} rotation={(Math.atan2(dy, dx) * 180) / Math.PI}>
                  <Rect
                    x={-doorWidth / 2}
                    y={-0.1}
                    width={doorWidth}
                    height={0.2}
                    fill="#f59e0b" // gold color
                  />
                </Group>
              );
            })}

            {/* Draw Windows */}
            {(floorPlanLayout.windows || []).map((win) => {
              const wall = floorPlanLayout.walls.find((w) => w.id === win.wallId);
              if (!wall) return null;

              const sx = feetToMeters(wall.start.x);
              const sy = feetToMeters(wall.start.y);
              const ex = feetToMeters(wall.end.x);
              const ey = feetToMeters(wall.end.y);
              
              const dx = ex - sx;
              const dy = ey - sy;
              const length = Math.hypot(dx, dy);
              if (length === 0) return null;

              const px = sx + (dx / length) * (win.position * length);
              const py = sy + (dy / length) * (win.position * length);
              const winWidth = feetToMeters(win.width / 12);
              const thickness = feetToMeters(wall.thickness / 12);

              return (
                <Group key={win.id} x={px} y={py} rotation={(Math.atan2(dy, dx) * 180) / Math.PI}>
                  <Rect
                    x={-winWidth / 2}
                    y={-thickness / 2}
                    width={winWidth}
                    height={thickness}
                    fill="#38bdf8" // sky blue
                    stroke="#1d4ed8"
                    strokeWidth={0.5 / SCALE}
                  />
                </Group>
              );
            })}

            {/* Draw Dimension Lines */}
            {dimensionLines.map((dim) => {
              return (
                <Group key={dim.id}>
                  <KonvaLine
                    points={[dim.start.x, dim.start.z, dim.end.x, dim.end.z]}
                    stroke="#FFD700"
                    strokeWidth={2 / SCALE}
                    dash={[5 / SCALE, 5 / SCALE]}
                  />
                  <Text
                    text={dim.label}
                    x={(dim.start.x + dim.end.x) / 2}
                    y={(dim.start.z + dim.end.z) / 2 - 0.5}
                    fontSize={14 / SCALE}
                    fill="#FFD700"
                  />
                </Group>
              );
            })}

          </Group>
        </Layer>
      </Stage>
      
      <div className="absolute bottom-6 left-6 text-on-dark-muted font-mono text-[10px] tracking-wider pointer-events-none select-none bg-dark-surface-alt/70 px-3 py-1.5 rounded-lg border border-hairline-dark backdrop-blur-sm shadow-md">
        💡 CLICK ANY DIMENSION BADGE TO PRECISELY RESIZE WALL LENGTHS INSTANTLY
      </div>
    </div>
  );
}
