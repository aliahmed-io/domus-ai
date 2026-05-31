"use client";

import React, { useState, useEffect } from "react";
import { Stage, Layer, Rect, Text, Group, Line as KonvaLine } from "react-konva";
import { useEditorStore } from "@/store/useEditorStore";
import { useShallow } from "zustand/react/shallow";
import { feetToMeters } from "@/lib/utils";

export default function BlueprintCanvas2D() {
  const { floorPlanLayout, dimensionLines } = useEditorStore(
    useShallow((s) => ({
      floorPlanLayout: s.floorPlanLayout,
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
      // Find the parent container
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

  // We want to scale our CAD layout to fit nicely in the view.
  // 1 meter = 50 pixels (just an arbitrary zoom factor)
  const SCALE = 50; 
  
  // Center origin
  const offsetX = stageSize.width / 2;
  const offsetY = stageSize.height / 2;

  return (
    <div id="blueprint-container" className="w-full h-full bg-[#1e2025] overflow-hidden">
      <Stage width={stageSize.width} height={stageSize.height} draggable>
        <Layer>
          {/* Base Grid Pattern */}
          <Group>
             {/* A simple implementation of a grid could go here if performance permits */}
          </Group>

          {/* Group that centers and scales everything */}
          <Group x={offsetX} y={offsetY} scaleX={SCALE} scaleY={SCALE}>
            
            {/* Draw Rooms */}
            {floorPlanLayout.rooms.map((room) => {
              const width = feetToMeters(room.bounds.width);
              const height = feetToMeters(room.bounds.height);
              const x = feetToMeters(room.bounds.x);
              const y = feetToMeters(room.bounds.y); // using 2d y

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

            {/* Draw Walls */}
            {floorPlanLayout.walls.map((wall) => {
              const sx = feetToMeters(wall.start.x);
              const sy = feetToMeters(wall.start.y);
              const ex = feetToMeters(wall.end.x);
              const ey = feetToMeters(wall.end.y);
              const thickness = feetToMeters(wall.thickness / 12);

              return (
                <KonvaLine
                  key={wall.id}
                  points={[sx, sy, ex, ey]}
                  stroke={wall.isLoadBearing ? "#94a3b8" : "#64748b"}
                  strokeWidth={thickness}
                  lineCap="square"
                />
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

              // We render doors in 2D as an arc / simple yellow line segment
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

            {/* Draw Dimension Lines */}
            {dimensionLines.map((dim) => {
              return (
                <Group key={dim.id}>
                  <KonvaLine
                    points={[dim.start.x, dim.start.z, dim.end.x, dim.end.z]} // using z as y in 2d
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
      
      <div className="absolute bottom-6 left-6 text-[#a1a1aa] font-mono text-xs pointer-events-none">
        DRAG TO PAN • SCROLL TO ZOOM (COMING SOON)
      </div>
    </div>
  );
}
