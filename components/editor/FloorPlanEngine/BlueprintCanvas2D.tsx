"use client";

import { fitPlanViewport } from "@/lib/plan-viewport";
import BlueprintUnderlay from "./BlueprintUnderlay";
import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Stage,
  Layer,
  Rect,
  Text,
  Group,
  Line as KonvaLine,
  Circle,
  Path as KonvaPath,
  Arc,
} from "react-konva";
import type Konva from "konva";
import { useEditorStore } from "@/store/useEditorStore";
import { useShallow } from "zustand/react/shallow";
import { feetToMeters, metersToFeet } from "@/lib/utils";
import { getWallPolygon } from "@/lib/geometry";
import { toast } from "sonner";
import type {
  Room,
  Wall,
  SceneObject,
  Door,
  Window2D,
  Staircase,
} from "@/types/puter";
import {
  snapCloseWallEndpoints,
  snapToWallEndpoints,
  snapToAngle,
  snapToWallMidpoints,
} from "@/lib/snap";
import { detectAllRooms } from "@/lib/room-detection";

// 1 meter = 50 pixels default base scaling
const SCALE = 50;

let elementCounter = 0;
function generateElementId(prefix: string): string {
  elementCounter += 1;
  return `${prefix}-${elementCounter}`;
}

function calculatePolygonAreaFt(points: { x: number; y: number }[]): number {
  let area = 0;
  const numPoints = points.length;
  for (let i = 0; i < numPoints; i++) {
    const p1 = points[i];
    const p2 = points[(i + 1) % numPoints];
    if (!p1 || !p2) continue;
    area += p1.x * p2.y - p2.x * p1.y; // Signed area (shoelace)
  }
  return area / 2;
}

function getRoomPolygonPoints(
  room: Room,
  walls: Wall[] = [],
): { x: number; y: number }[] {
  if (room.polygon && room.polygon.length >= 3) return room.polygon;
  if (room.wallIds && room.wallIds.length > 0) {
    const roomWalls = walls.filter((w) => room.wallIds!.includes(w.id));
    if (roomWalls.length > 0) {
      const points: { x: number; y: number }[] = [];
      const unvisited = [...roomWalls];

      const currentWall = unvisited.shift()!;
      points.push({ ...currentWall.start });
      let currentPoint = currentWall.end;
      points.push({ ...currentPoint });

      while (unvisited.length > 0) {
        const nextWallIdx = unvisited.findIndex(
          (w) =>
            (Math.abs(w.start.x - currentPoint.x) < 0.1 &&
              Math.abs(w.start.y - currentPoint.y) < 0.1) ||
            (Math.abs(w.end.x - currentPoint.x) < 0.1 &&
              Math.abs(w.end.y - currentPoint.y) < 0.1),
        );

        if (nextWallIdx !== -1) {
          const nextWall = unvisited.splice(nextWallIdx, 1)[0]!;
          if (
            Math.abs(nextWall.start.x - currentPoint.x) < 0.1 &&
            Math.abs(nextWall.start.y - currentPoint.y) < 0.1
          ) {
            currentPoint = nextWall.end;
          } else {
            currentPoint = nextWall.start;
          }
          if (
            unvisited.length > 0 ||
            (points[0] &&
              Math.hypot(
                currentPoint.x - points[0].x,
                currentPoint.y - points[0].y,
              ) > 0.1)
          ) {
            points.push({ ...currentPoint });
          }
        } else {
          break;
        }
      }
      return points;
    }
  }
  const rx = room.bounds.x;
  const ry = room.bounds.y;
  const rw = room.bounds.width;
  const rh = room.bounds.height;
  return [
    { x: rx, y: ry },
    { x: rx + rw, y: ry },
    { x: rx + rw, y: ry + rh },
    { x: rx, y: ry + rh },
  ];
}

interface DrawingWallPreviewProps {
  start: { x: number; y: number };
  end: { x: number; y: number };
  scale: number;
}

function DrawingWallPreview({ start, end, scale }: DrawingWallPreviewProps) {
  const sx = feetToMeters(start.x);
  const sy = feetToMeters(start.y);
  const ex = feetToMeters(end.x);
  const ey = feetToMeters(end.y);
  const lenMeters = Math.hypot(ex - sx, ey - sy);
  const lenFeet = metersToFeet(lenMeters);
  const angleRad = Math.atan2(ey - sy, ex - sx);
  let rawDeg = (angleRad * 180) / Math.PI;
  if (rawDeg < 0) rawDeg += 360;
  const displayDeg = Math.round(rawDeg);

  let textAngleDeg = (angleRad * 180) / Math.PI;
  if (textAngleDeg > 90 || textAngleDeg < -90) textAngleDeg += 180;

  const mx = (sx + ex) / 2 - Math.sin(angleRad) * 0.55;
  const my = (sy + ey) / 2 + Math.cos(angleRad) * 0.55;
  const badgeW = 2.0;
  const badgeH = 0.52;

  return (
    <Group>
      {/* Elastic rubberband dashed wall guide */}
      <KonvaLine
        points={[sx, sy, ex, ey]}
        stroke="#8a5a36"
        strokeWidth={5 / scale}
        dash={[8 / scale, 4 / scale]}
        lineCap="round"
      />

      {/* Start anchor snap indicator */}
      <Circle
        x={sx}
        y={sy}
        radius={7 / scale}
        fill="#10B981"
        stroke="#ffffff"
        strokeWidth={2 / scale}
      />

      {/* Active cursor endpoint snap indicator */}
      <Circle
        x={ex}
        y={ey}
        radius={8 / scale}
        fill="#8a5a36"
        stroke="#ffffff"
        strokeWidth={2.5 / scale}
      />
      <Circle
        x={ex}
        y={ey}
        radius={14 / scale}
        stroke="#8a5a36"
        strokeWidth={1.5 / scale}
        dash={[3 / scale, 3 / scale]}
      />

      {/* Floating CAD HUD Badge */}
      {lenFeet > 0.3 && (
        <Group x={mx} y={my} rotation={textAngleDeg}>
          <Rect
            x={-badgeW / 2}
            y={-badgeH / 2}
            width={badgeW}
            height={badgeH}
            fill="#1E293B"
            stroke="#8a5a36"
            strokeWidth={1.5 / scale}
            cornerRadius={0.08}
            shadowColor="rgba(0,0,0,0.3)"
            shadowBlur={6}
            shadowOffset={{ x: 0, y: 2 }}
          />
          <Text
            text={`${lenFeet.toFixed(1)}' (${lenMeters.toFixed(2)}m) · ${displayDeg}°`}
            x={-badgeW / 2}
            y={-0.18}
            width={badgeW}
            align="center"
            fontSize={9 / scale}
            fontFamily="monospace"
            fill="#FFFFFF"
            fontStyle="bold"
          />
          <Text
            text="Shift: Angle | Esc / R-Click: Finish"
            x={-badgeW / 2}
            y={-0.02}
            width={badgeW}
            align="center"
            fontSize={6.5 / scale}
            fontFamily="sans-serif"
            fill="#94A3B8"
          />
        </Group>
      )}
    </Group>
  );
}

export default function BlueprintCanvas2D() {
  const {
    floorPlanLayout,
    setFloorPlan,
    updateDoor,
    updateWindow,
    dimensionLines,
    sceneObjects,
    updateSceneObject,
    tool,
    setTool,
    addSceneObject,
    addDimensionLine,
    selectedObjectId,
    setSelectedObject,
    setStageViewport,
    storeys,
    activeStoreyId,
    staircases,
    addStaircase,
    updateStaircase,
  } = useEditorStore(
    useShallow((s) => ({
      floorPlanLayout: s.floorPlanLayout,
      setFloorPlan: s.setFloorPlan,
      updateDoor: s.updateDoor,
      updateWindow: s.updateWindow,
      dimensionLines: s.dimensionLines,
      sceneObjects: s.sceneObjects,
      updateSceneObject: s.updateSceneObject,
      tool: s.tool,
      setTool: s.setTool,
      addSceneObject: s.addSceneObject,
      addDimensionLine: s.addDimensionLine,
      selectedObjectId: s.selectedObjectId,
      setSelectedObject: s.setSelectedObject,
      setStageViewport: s.setStageViewport,
      storeys: s.storeys,
      activeStoreyId: s.activeStoreyId,
      staircases: s.staircases,
      addStaircase: s.addStaircase,
      updateStaircase: s.updateStaircase,
    })),
  );

  const underlayStoreys = useMemo(() => {
    if (!storeys || storeys.length <= 1) return [];
    return storeys.filter(
      (s) => s.id !== activeStoreyId && s.isVisible !== false,
    );
  }, [storeys, activeStoreyId]);

  const [stageSize, setStageSize] = useState({ width: 800, height: 600 });
  const [mounted, setMounted] = useState(false);
  const [canvasCursor, setCanvasCursor] = useState<"default" | "grabbing">(
    "default",
  );
  const containerRef = useRef<HTMLDivElement>(null);
  const masterGroupRef = useRef<Konva.Group | null>(null);
  const isPanningRef = useRef(false);

  useEffect(() => {
    document.body.style.cursor = canvasCursor;
    return () => {
      document.body.style.cursor = "default";
    };
  }, [canvasCursor]);

  useEffect(() => {
    const unsub = useEditorStore.subscribe((state, prevState) => {
      if (
        state.stageX !== prevState.stageX ||
        state.stageY !== prevState.stageY ||
        state.stageScale !== prevState.stageScale
      ) {
        if (masterGroupRef.current) {
          masterGroupRef.current.position({ x: state.stageX, y: state.stageY });
          masterGroupRef.current.scale({
            x: state.stageScale,
            y: state.stageScale,
          });
        }
      }
    });
    return unsub;
  }, []);

  // Local states for interactive drawing/measuring tools
  const [drawingWallStart, setDrawingWallStart] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [drawingMousePos, setDrawingMousePos] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [measureStart, setMeasureStart] = useState<{
    x: number;
    y: number;
  } | null>(null);

  // Active derived states (replaces useEffect state resets)
  const activeDrawingWallStart =
    tool === "draw-wall" || tool === "add-room" ? drawingWallStart : null;
  const activeDrawingMousePos =
    tool === "draw-wall" ||
    tool === "add-room" ||
    tool === "measure" ||
    tool === "add-door" ||
    tool === "add-window" ||
    tool === "add-stair"
      ? drawingMousePos
      : null;
  const activeMeasureStart = tool === "measure" ? measureStart : null;

  const dragContextRef = useRef<{
    type:
      | "room-move"
      | "wall-move"
      | "room-rotate"
      | "room-scale"
      | "wall-rotate"
      | "wall-scale"
      | "door-slide"
      | "window-slide";
    id: string;
    startMeters: { x: number; y: number };
    originalLayout: typeof floorPlanLayout;
  } | null>(null);

  const hasDraggedRef = useRef(false);

  const projectId = useEditorStore((state) => state.projectId);
  const fitRequest = useEditorStore((state) => state.fitPlanRequest);
  const showMeasurements = useEditorStore((state) => state.showMeasurements);
  const viewportRef = useRef<{
    width: number;
    height: number;
    x: number;
    y: number;
    scale: number;
    auto: boolean;
    key: string;
  } | null>(null);
  const currentMousePosMetersRef = useRef<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });
  const copiedObjectRef = useRef<{
    type: "furniture" | "wall" | "room";
    data: SceneObject | Wall | { room: Room; walls: Wall[] };
  } | null>(null);

  // Keyboard Copy / Paste shortcuts (Ctrl+C / Ctrl+V)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      if (
        activeEl &&
        (activeEl.tagName === "INPUT" || activeEl.tagName === "TEXTAREA")
      ) {
        return;
      }

      const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
      const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

      // Single-key CAD drafting tool hotkeys & Escape cancellation
      if (!cmdOrCtrl && !e.altKey) {
        const key = e.key.toLowerCase();
        if (key === "escape") {
          if (drawingWallStart) {
            setDrawingWallStart(null);
            setDrawingMousePos(null);
            toast.info("Wall drafting completed.");
          } else {
            setSelectedObject(null);
            setTool("select");
          }
          return;
        }

        if (key === "w") {
          setTool("draw-wall");
          setSelectedObject(null);
          return;
        }
        if (key === "o") {
          setTool("add-door");
          setSelectedObject(null);
          return;
        }
        if (key === "i") {
          setTool("add-window");
          setSelectedObject(null);
          return;
        }
        if (key === "s") {
          setTool("add-stair");
          setSelectedObject(null);
          return;
        }
        if (key === "f") {
          setTool("add-room");
          setSelectedObject(null);
          return;
        }
        if (key === "a") {
          setTool("place-furniture");
          setSelectedObject(null);
          return;
        }
        if (key === "d") {
          setTool("measure");
          setSelectedObject(null);
          return;
        }
        if (key === "v") {
          setTool("select");
          return;
        }
      }

      if (cmdOrCtrl && e.key.toLowerCase() === "c") {
        // Copy selected object
        const layout = useEditorStore.getState().floorPlanLayout;
        const currentSelectedId = useEditorStore.getState().selectedObjectId;
        if (!currentSelectedId) return;

        // 1. Check if selected is furniture
        const furniture = sceneObjects.find(
          (obj) => obj.id === currentSelectedId,
        );
        if (furniture) {
          copiedObjectRef.current = {
            type: "furniture",
            data: { ...furniture },
          };
          toast.success(`Copied furniture: ${furniture.name}`);
          return;
        }

        // 2. Check if selected is wall
        if (layout) {
          const wall = (layout.walls || []).find(
            (w) => w.id === currentSelectedId,
          );
          if (wall) {
            copiedObjectRef.current = {
              type: "wall",
              data: { ...wall },
            };
            toast.success("Copied wall.");
            return;
          }

          // 3. Check if selected is room
          const room = (layout.rooms || []).find(
            (r) => r.id === currentSelectedId,
          );
          if (room) {
            const roomWalls = (layout.walls || []).filter((w) =>
              room.wallIds?.includes(w.id),
            );
            copiedObjectRef.current = {
              type: "room",
              data: {
                room: { ...room },
                walls: roomWalls.map((w) => ({ ...w })),
              },
            };
            toast.success(`Copied room: ${room.label}`);
            return;
          }
        }
      }

      if (cmdOrCtrl && e.key.toLowerCase() === "v") {
        if (!copiedObjectRef.current) return;

        const layout = useEditorStore.getState().floorPlanLayout;
        const targetPt = currentMousePosMetersRef.current;
        const targetPtFeet = {
          x: metersToFeet(targetPt.x),
          y: metersToFeet(targetPt.y),
        };

        if (copiedObjectRef.current.type === "furniture") {
          const original = copiedObjectRef.current.data as SceneObject;
          const newObj: SceneObject = {
            ...original,
            id: generateElementId("furnish-copy"),
            position: { x: targetPt.x, y: original.position.y, z: targetPt.y },
          };
          addSceneObject(newObj);
          setSelectedObject(newObj.id);
          toast.success(`Pasted furniture: ${newObj.name}`);
        } else if (copiedObjectRef.current.type === "wall" && layout) {
          const original = copiedObjectRef.current.data as Wall;
          const dx = original.end.x - original.start.x;
          const dy = original.end.y - original.start.y;
          const startPt = e.shiftKey
            ? targetPtFeet
            : {
                x: Math.round(targetPtFeet.x * 2) / 2,
                y: Math.round(targetPtFeet.y * 2) / 2,
              };
          const endPt = { x: startPt.x + dx, y: startPt.y + dy };

          const newWall: Wall = {
            ...original,
            id: generateElementId("wall-copy"),
            start: startPt,
            end: endPt,
          };

          const newWalls = [...(layout.walls || []), newWall];
          const snappedWalls = snapCloseWallEndpoints(newWalls);
          const newRooms = detectAllRooms(snappedWalls, layout.rooms);
          setFloorPlan({
            ...layout,
            walls: snappedWalls,
            rooms: newRooms,
          });
          setSelectedObject(newWall.id);
          toast.success("Pasted wall.");
        } else if (copiedObjectRef.current.type === "room" && layout) {
          const { room, walls } = copiedObjectRef.current.data as {
            room: Room;
            walls: Wall[];
          };

          if (walls.length > 0) {
            const allPoints = walls.flatMap((w) => [w.start, w.end]);
            const cx =
              allPoints.reduce((sum, p) => sum + p.x, 0) / allPoints.length;
            const cy =
              allPoints.reduce((sum, p) => sum + p.y, 0) / allPoints.length;

            const dx = targetPtFeet.x - cx;
            const dy = targetPtFeet.y - cy;

            const wallIdMap = new Map<string, string>();
            const newWalls = [...(layout.walls || [])];
            const pastedWalls: Wall[] = [];

            walls.forEach((w) => {
              const newId = generateElementId("wall-copy");
              wallIdMap.set(w.id, newId);
              const nw = {
                ...w,
                id: newId,
                start: { x: w.start.x + dx, y: w.start.y + dy },
                end: { x: w.end.x + dx, y: w.end.y + dy },
              };
              newWalls.push(nw);
              pastedWalls.push(nw);
            });

            const newRoomId = generateElementId("room-copy");
            const newRoom: Room = {
              ...room,
              id: newRoomId,
              bounds: {
                x: room.bounds.x + dx,
                y: room.bounds.y + dy,
                width: room.bounds.width,
                height: room.bounds.height,
              },
              wallIds: room.wallIds?.map((id) => wallIdMap.get(id) || id) || [],
            };

            const snappedWalls = snapCloseWallEndpoints(newWalls);
            const updatedRooms = [...(layout.rooms || []), newRoom];
            setFloorPlan({
              ...layout,
              walls: snappedWalls,
              rooms: updatedRooms,
            });
            setSelectedObject(newRoomId);
            toast.success(`Pasted room: ${newRoom.label}`);
          } else {
            const dx = targetPtFeet.x - (room.bounds.x + room.bounds.width / 2);
            const dy =
              targetPtFeet.y - (room.bounds.y + room.bounds.height / 2);
            const newRoomId = generateElementId("room-copy");
            const newRoom: Room = {
              ...room,
              id: newRoomId,
              bounds: {
                x: room.bounds.x + dx,
                y: room.bounds.y + dy,
                width: room.bounds.width,
                height: room.bounds.height,
              },
            };
            const updatedRooms = [...(layout.rooms || []), newRoom];
            setFloorPlan({
              ...layout,
              rooms: updatedRooms,
            });
            setSelectedObject(newRoomId);
            toast.success(`Pasted room: ${newRoom.label}`);
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    sceneObjects,
    addSceneObject,
    setFloorPlan,
    setSelectedObject,
    setTool,
    drawingWallStart,
  ]);

  useEffect(() => {
    const handle = requestAnimationFrame(() => {
      setMounted(true);
    });

    if (!containerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width <= 0 || height <= 0) continue;
        setStageSize({ width, height });
        const state = useEditorStore.getState();
        const previous = viewportRef.current;
        const key = `${projectId}:${floorPlanLayout?.id}:${fitRequest}`;
        const untouched =
          previous?.auto &&
          Math.abs(state.stageX - previous.x) < 0.001 &&
          Math.abs(state.stageY - previous.y) < 0.001 &&
          Math.abs(state.stageScale - previous.scale) < 0.001;
        const auto = !previous || previous.key !== key || Boolean(untouched);
        const viewport = auto
          ? fitPlanViewport(state.floorPlanLayout, width, height)
          : {
              scale: state.stageScale,
              x: state.stageX + (width - previous.width) / 2,
              y: state.stageY + (height - previous.height) / 2,
            };
        setStageViewport(viewport.scale, viewport.x, viewport.y);
        viewportRef.current = { ...viewport, width, height, auto, key };
      }
    });

    observer.observe(containerRef.current);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(handle);
    };
  }, [mounted, setStageViewport, projectId, floorPlanLayout?.id, fitRequest]);

  const handleStartRoomMove = (
    e: Konva.KonvaEventObject<MouseEvent>,
    roomId: string,
  ) => {
    if (tool !== "select") return;
    const stage = e.target.getStage();
    if (!stage) return;
    const pt = getStagePointerMeters(stage);
    if (pt) {
      const layout = useEditorStore.getState().floorPlanLayout;
      if (layout) {
        useEditorStore.temporal.getState().pause();
        dragContextRef.current = {
          type: "room-move",
          id: roomId,
          startMeters: pt,
          originalLayout: layout,
        };
      }
      e.cancelBubble = true;
    }
  };

  const handleStartRoomRotate = (
    e: Konva.KonvaEventObject<MouseEvent>,
    roomId: string,
  ) => {
    const stage = e.target.getStage();
    if (!stage) return;
    const pt = getStagePointerMeters(stage);
    if (pt) {
      const layout = useEditorStore.getState().floorPlanLayout;
      if (layout) {
        useEditorStore.temporal.getState().pause();
        dragContextRef.current = {
          type: "room-rotate",
          id: roomId,
          startMeters: pt,
          originalLayout: layout,
        };
      }
      e.cancelBubble = true;
    }
  };

  const handleStartRoomScale = (
    e: Konva.KonvaEventObject<MouseEvent>,
    roomId: string,
  ) => {
    const stage = e.target.getStage();
    if (!stage) return;
    const pt = getStagePointerMeters(stage);
    if (pt) {
      const layout = useEditorStore.getState().floorPlanLayout;
      if (layout) {
        useEditorStore.temporal.getState().pause();
        dragContextRef.current = {
          type: "room-scale",
          id: roomId,
          startMeters: pt,
          originalLayout: layout,
        };
      }
      e.cancelBubble = true;
    }
  };

  const handleStartWallMove = (
    e: Konva.KonvaEventObject<MouseEvent>,
    wallId: string,
  ) => {
    if (tool !== "select") return;
    const stage = e.target.getStage();
    if (!stage) return;
    const pt = getStagePointerMeters(stage);
    const targetName = e.target.name();
    if (pt && (targetName === "wall-body" || targetName === "wall-group")) {
      const layout = useEditorStore.getState().floorPlanLayout;
      if (layout) {
        useEditorStore.temporal.getState().pause();
        dragContextRef.current = {
          type: "wall-move",
          id: wallId,
          startMeters: pt,
          originalLayout: layout,
        };
      }
      e.cancelBubble = true;
    }
  };

  const handleStartWallRotate = (
    e: Konva.KonvaEventObject<MouseEvent>,
    wallId: string,
  ) => {
    const stage = e.target.getStage();
    if (!stage) return;
    const pt = getStagePointerMeters(stage);
    if (pt) {
      const layout = useEditorStore.getState().floorPlanLayout;
      if (layout) {
        useEditorStore.temporal.getState().pause();
        dragContextRef.current = {
          type: "wall-rotate",
          id: wallId,
          startMeters: pt,
          originalLayout: layout,
        };
      }
      e.cancelBubble = true;
    }
  };

  const handleStartWallScale = (
    e: Konva.KonvaEventObject<MouseEvent>,
    wallId: string,
  ) => {
    const stage = e.target.getStage();
    if (!stage) return;
    const pt = getStagePointerMeters(stage);
    if (pt) {
      const layout = useEditorStore.getState().floorPlanLayout;
      if (layout) {
        useEditorStore.temporal.getState().pause();
        dragContextRef.current = {
          type: "wall-scale",
          id: wallId,
          startMeters: pt,
          originalLayout: layout,
        };
      }
      e.cancelBubble = true;
    }
  };

  if (!mounted || !floorPlanLayout) return null;

  const handleResizeWall2D = (wallId: string, newLengthFt: number) => {
    if (!Number.isFinite(newLengthFt) || newLengthFt <= 0.5) return;
    const layout = useEditorStore.getState().floorPlanLayout;
    if (!layout) return;
    const updatedWalls = layout.walls.map((w) => {
      if (w.id !== wallId) return w;
      const dx = w.end.x - w.start.x;
      const dy = w.end.y - w.start.y;
      const currentLen = Math.hypot(dx, dy);
      if (currentLen === 0) return w;
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
    const snappedWalls = snapCloseWallEndpoints(updatedWalls);
    const newRooms = detectAllRooms(snappedWalls, layout.rooms);
    setFloorPlan({ ...layout, walls: snappedWalls, rooms: newRooms });
  };

  const handleWallEndpointDrag = (
    wallId: string,
    isStart: boolean,
    newXMeters: number,
    newYMeters: number,
    isDragEnd: boolean,
    shiftKey?: boolean,
    altKey?: boolean,
  ) => {
    if (!floorPlanLayout) return;

    let newXFt = metersToFeet(newXMeters);
    let newYFt = metersToFeet(newYMeters);

    if (!shiftKey) {
      newXFt = Math.round(newXFt * 2) / 2;
      newYFt = Math.round(newYFt * 2) / 2;
    }

    // 1. Snapping to other wall endpoints
    if (!shiftKey) {
      const snapRadiusFt = 0.6;
      let closestDist = snapRadiusFt;
      let snapPt = { x: newXFt, y: newYFt };
      let snapped = false;

      (floorPlanLayout.walls || []).forEach((w) => {
        if (w.id === wallId) return;

        const distStart = Math.hypot(w.start.x - newXFt, w.start.y - newYFt);
        if (distStart < closestDist) {
          closestDist = distStart;
          snapPt = { x: w.start.x, y: w.start.y };
          snapped = true;
        }

        const distEnd = Math.hypot(w.end.x - newXFt, w.end.y - newYFt);
        if (distEnd < closestDist) {
          closestDist = distEnd;
          snapPt = { x: w.end.x, y: w.end.y };
          snapped = true;
        }
      });

      if (snapped) {
        newXFt = snapPt.x;
        newYFt = snapPt.y;
      }
    }

    // 2. Find originally connected endpoints (at the start of drag)
    const draggedWall = floorPlanLayout.walls.find((w) => w.id === wallId);
    if (!draggedWall) return;

    const originalPos = isStart ? draggedWall.start : draggedWall.end;

    const connectedPoints: { wallId: string; isStart: boolean }[] = [];
    if (!altKey) {
      (floorPlanLayout.walls || []).forEach((w) => {
        if (w.id === wallId) return;
        if (
          Math.hypot(w.start.x - originalPos.x, w.start.y - originalPos.y) <
          0.05
        ) {
          connectedPoints.push({ wallId: w.id, isStart: true });
        }
        if (
          Math.hypot(w.end.x - originalPos.x, w.end.y - originalPos.y) < 0.05
        ) {
          connectedPoints.push({ wallId: w.id, isStart: false });
        }
      });
    }

    // 3. Update walls in layout
    const updatedWalls = floorPlanLayout.walls.map((w) => {
      const nextWall = { ...w };

      if (w.id === wallId) {
        if (isStart) {
          nextWall.start = { x: newXFt, y: newYFt };
        } else {
          nextWall.end = { x: newXFt, y: newYFt };
        }
      }

      if (!altKey && connectedPoints.length > 0) {
        const matchStart = connectedPoints.find(
          (cp) => cp.wallId === w.id && cp.isStart,
        );
        if (matchStart) {
          nextWall.start = { x: newXFt, y: newYFt };
        }
        const matchEnd = connectedPoints.find(
          (cp) => cp.wallId === w.id && !cp.isStart,
        );
        if (matchEnd) {
          nextWall.end = { x: newXFt, y: newYFt };
        }
      }

      return nextWall;
    });

    if (isDragEnd) {
      const wallsChanged =
        JSON.stringify(
          floorPlanLayout.walls.map((w) => ({
            id: w.id,
            start: w.start,
            end: w.end,
          })),
        ) !==
        JSON.stringify(
          updatedWalls.map((w) => ({ id: w.id, start: w.start, end: w.end })),
        );
      if (wallsChanged) {
        const snappedWalls = snapCloseWallEndpoints(updatedWalls);
        const newRooms = detectAllRooms(snappedWalls, floorPlanLayout.rooms);
        useEditorStore.temporal.getState().resume();
        setFloorPlan({
          ...floorPlanLayout,
          walls: snappedWalls,
          rooms: newRooms,
        });
      } else {
        useEditorStore.temporal.getState().resume();
      }
    } else {
      const snappedWalls = snapCloseWallEndpoints(updatedWalls);
      setFloorPlan({
        ...floorPlanLayout,
        walls: snappedWalls,
      });
    }
  };

  const handleFurnitureDrag = (
    objId: string,
    newXMeters: number,
    newYMeters: number,
    isDragEnd: boolean,
    shiftKey?: boolean,
  ) => {
    const obj = sceneObjects.find((o) => o.id === objId);
    if (!obj) return;

    let x = newXMeters;
    let z = newYMeters;

    if (!shiftKey) {
      // Snap to 0.05m (5cm) increments by default for furniture layout alignment
      x = Math.round(x * 20) / 20;
      z = Math.round(z * 20) / 20;
    }

    if (isDragEnd) {
      const posChanged =
        Math.abs(obj.position.x - x) > 0.001 ||
        Math.abs(obj.position.z - z) > 0.001;
      if (posChanged) {
        useEditorStore.temporal.getState().resume();
        updateSceneObject(objId, {
          position: {
            ...obj.position,
            x,
            z,
          },
        });
      } else {
        useEditorStore.temporal.getState().resume();
      }
    } else {
      updateSceneObject(objId, {
        position: {
          ...obj.position,
          x,
          z,
        },
      });
    }
  };

  const getStagePointerMeters = (stage: Konva.Stage) => {
    const pointer = stage.getPointerPosition();
    if (!pointer) return null;
    const { stageX, stageY, stageScale } = useEditorStore.getState();
    const canvasX = (pointer.x - stageX) / stageScale;
    const canvasY = (pointer.y - stageY) / stageScale;
    return {
      x: canvasX / SCALE,
      y: canvasY / SCALE,
    };
  };

  const handleWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    const stage = e.target.getStage();
    if (!stage) return;

    const oldScale = useEditorStore.getState().stageScale;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const scaleBy = 1.08;
    const newScale = e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy;
    const clampedScale = Math.max(0.2, Math.min(newScale, 5.0));

    const { stageX, stageY } = useEditorStore.getState();
    const mousePointTo = {
      x: (pointer.x - stageX) / oldScale,
      y: (pointer.y - stageY) / oldScale,
    };

    const newPos = {
      x: pointer.x - mousePointTo.x * clampedScale,
      y: pointer.y - mousePointTo.y * clampedScale,
    };

    setStageViewport(clampedScale, newPos.x, newPos.y);
  };

  const handleStageClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (e.evt.button === 1 || e.evt.button === 2) return; // Middle or Right click

    const stage = e.target.getStage();
    if (!stage) return;
    const ptMeters = getStagePointerMeters(stage);
    if (!ptMeters) return;
    const ptFeet = { x: metersToFeet(ptMeters.x), y: metersToFeet(ptMeters.y) };

    // Select Object Logic
    if (tool === "select") {
      // Find what was clicked. We can use e.target.id() if we set it, or just rely on react-konva events.
      if (
        e.target === stage ||
        e.target.name() === "master-group" ||
        e.target.name() === "grid-bg"
      ) {
        setSelectedObject(null);
      }
      return; // Handled by onClick of individual items
    }

    const layout = useEditorStore.getState().floorPlanLayout;
    if (!layout) return;

    if (tool === "draw-wall") {
      // Snapping priority: wall endpoint -> wall midpoint -> 0.5ft grid
      let snapPt = {
        x: Math.round(ptFeet.x * 2) / 2,
        y: Math.round(ptFeet.y * 2) / 2,
      };
      const snappedEp = snapToWallEndpoints(ptFeet, layout.walls, 0.8);
      if (snappedEp.x !== ptFeet.x || snappedEp.y !== ptFeet.y) {
        snapPt = snappedEp;
      } else {
        const snappedMp = snapToWallMidpoints(ptFeet, layout.walls, 0.8);
        if (snappedMp.x !== ptFeet.x || snappedMp.y !== ptFeet.y) {
          snapPt = snappedMp;
        }
      }

      if (!drawingWallStart) {
        setDrawingWallStart(snapPt);
        setDrawingMousePos(snapPt);
      } else {
        let wallEnd = snapPt;
        if (e.evt.shiftKey) {
          // Strict CAD angle lock: 0, 45, 90, 135, 180, 225, 270, 315
          wallEnd = snapToAngle(drawingWallStart, ptFeet);
        } else {
          // Subtle orthogonal snap if drawing close to horizontal or vertical
          wallEnd = snapToAngle(drawingWallStart, snapPt, [0, 90, 180, 270], 4);
        }

        const newWall = {
          id: generateElementId("wall"),
          start: drawingWallStart,
          end: wallEnd,
          thickness: 6,
          height: 10,
          isLoadBearing: false,
        };

        const allWalls = [...layout.walls, newWall];
        const snappedWalls = snapCloseWallEndpoints(allWalls);
        const newRooms = detectAllRooms(snappedWalls, layout.rooms);

        setFloorPlan({
          ...layout,
          walls: snappedWalls,
          rooms: newRooms,
        });

        // Set next wall start to the snapped end point of the placed wall
        const snappedNewWall = snappedWalls.find((w) => w.id === newWall.id);
        const nextStart = snappedNewWall ? snappedNewWall.end : newWall.end;
        setDrawingWallStart(nextStart);
        setDrawingMousePos(nextStart);
      }
    } else if (tool === "place-furniture") {
      // Spawn a default 3-seater sofa if clicked on canvas
      const newObj = {
        id: generateElementId("furnish-sofa"),
        type: "furniture" as const,
        name: "Sofa 3-Seater",
        position: { x: ptMeters.x, y: 0.1, z: ptMeters.y },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
        materialId: "color-#1f2937",
      };
      addSceneObject(newObj);
      setTool("select");
      toast.success("Placed default sofa.");
    } else if (tool === "measure") {
      if (!measureStart) {
        setMeasureStart(ptMeters);
        setDrawingMousePos(ptFeet);
      } else {
        const distMeters = Math.hypot(
          ptMeters.x - measureStart.x,
          ptMeters.y - measureStart.y,
        );
        const distFeet = metersToFeet(distMeters);
        addDimensionLine({
          id: generateElementId("dim"),
          start: { x: measureStart.x, y: 0, z: measureStart.y },
          end: { x: ptMeters.x, y: 0, z: ptMeters.y },
          label: `${distFeet.toFixed(1)} ft`,
        });
        setMeasureStart(null);
        setDrawingMousePos(null);
      }
    } else if (tool === "add-door" || tool === "add-window") {
      // Find the wall closest to the click point (in feet)
      let closestWall: Wall | null = null;
      let minDistance = 3.0; // snap threshold in feet
      let bestT = 0.5;

      for (const wall of layout.walls) {
        const dx = wall.end.x - wall.start.x;
        const dy = wall.end.y - wall.start.y;
        const lenSq = dx * dx + dy * dy;
        if (lenSq < 0.01) continue;

        const t =
          ((ptFeet.x - wall.start.x) * dx + (ptFeet.y - wall.start.y) * dy) /
          lenSq;
        const clampedT = Math.max(0.1, Math.min(0.9, t));
        const projX = wall.start.x + clampedT * dx;
        const projY = wall.start.y + clampedT * dy;
        const dist = Math.hypot(ptFeet.x - projX, ptFeet.y - projY);

        if (dist < minDistance) {
          minDistance = dist;
          closestWall = wall;
          bestT = clampedT;
        }
      }

      if (closestWall) {
        if (tool === "add-door") {
          const newDoor: Door = {
            id: generateElementId("door"),
            wallId: closestWall.id,
            position: bestT,
            width: 36, // 36 inches (3 ft)
            isExterior: false,
            doorType: "single",
            swingSide: "left",
            swingDirection: "inward",
            openAngle: 0.8,
          };
          setFloorPlan({
            ...layout,
            doors: [...(layout.doors || []), newDoor],
          });
          setSelectedObject(newDoor.id);
          toast.success("Door placed into wall segment!");
        } else {
          const newWindow: Window2D = {
            id: generateElementId("window"),
            wallId: closestWall.id,
            position: bestT,
            width: 48, // 48 inches (4 ft)
            height: 48,
            sillHeight: 36,
            windowType: "single-hung",
          };
          setFloorPlan({
            ...layout,
            windows: [...(layout.windows || []), newWindow],
          });
          setSelectedObject(newWindow.id);
          toast.success("Window placed into wall segment!");
        }
      } else {
        toast.info("Click directly onto a wall to insert an opening.");
      }
    } else if (tool === "add-stair") {
      const activeStorey = storeys.find((s) => s.id === activeStoreyId);
      const elevationM = activeStorey
        ? feetToMeters(activeStorey.elevation)
        : 0;
      const newStair: Staircase = {
        id: generateElementId("stair"),
        startStoreyId: activeStoreyId || "storey-1",
        endStoreyId: "storey-2",
        width: 36, // 36 inches
        riserCount: 14,
        riserHeight: 7.7,
        position: { x: ptMeters.x, y: elevationM, z: ptMeters.y },
        rotation: { x: 0, y: 0, z: 0 },
        type: "straight",
      };
      addStaircase(newStair);
      setSelectedObject(newStair.id);
      toast.success("Staircase placed into layout!");
    }
  };

  const handleStageMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
    const stage = e.target.getStage();
    if (!stage) return;
    const ptMeters = getStagePointerMeters(stage);

    if (!ptMeters) return;

    currentMousePosMetersRef.current = ptMeters;

    // Pan with left-click on empty space, middle mouse, right mouse, or camera tool
    if (
      isPanningRef.current ||
      e.evt.buttons === 4 ||
      e.evt.buttons === 2 ||
      tool === "camera"
    ) {
      if (e.evt.buttons === 0 && isPanningRef.current) {
        isPanningRef.current = false;
        setCanvasCursor("default");
        return;
      }
      const state = useEditorStore.getState();
      setStageViewport(
        state.stageScale,
        state.stageX + e.evt.movementX,
        state.stageY + e.evt.movementY,
      );
      return;
    }

    if (dragContextRef.current) {
      const { type, id, startMeters, originalLayout } = dragContextRef.current;
      if (!originalLayout) return;
      hasDraggedRef.current = true;
      const dxFt = metersToFeet(ptMeters.x - startMeters.x);
      const dyFt = metersToFeet(ptMeters.y - startMeters.y);

      if (type === "door-slide") {
        const door = originalLayout.doors.find((d) => d.id === id);
        const wall = door
          ? originalLayout.walls.find((w) => w.id === door.wallId)
          : undefined;
        if (door && wall) {
          const wdx = wall.end.x - wall.start.x;
          const wdy = wall.end.y - wall.start.y;
          const lenSq = wdx * wdx + wdy * wdy;
          if (lenSq > 0.01) {
            const ptXFt = metersToFeet(ptMeters.x);
            const ptYFt = metersToFeet(ptMeters.y);
            const rawT =
              ((ptXFt - wall.start.x) * wdx + (ptYFt - wall.start.y) * wdy) /
              lenSq;
            const clampedT = Math.max(
              0.08,
              Math.min(0.92, Math.round(rawT * 100) / 100),
            );
            updateDoor(id, { position: clampedT });
          }
        }
        return;
      }

      if (type === "window-slide") {
        const win = originalLayout.windows.find((w) => w.id === id);
        const wall = win
          ? originalLayout.walls.find((w) => w.id === win.wallId)
          : undefined;
        if (win && wall) {
          const wdx = wall.end.x - wall.start.x;
          const wdy = wall.end.y - wall.start.y;
          const lenSq = wdx * wdx + wdy * wdy;
          if (lenSq > 0.01) {
            const ptXFt = metersToFeet(ptMeters.x);
            const ptYFt = metersToFeet(ptMeters.y);
            const rawT =
              ((ptXFt - wall.start.x) * wdx + (ptYFt - wall.start.y) * wdy) /
              lenSq;
            const clampedT = Math.max(
              0.08,
              Math.min(0.92, Math.round(rawT * 100) / 100),
            );
            updateWindow(id, { position: clampedT });
          }
        }
        return;
      }

      let updatedWalls = [...(originalLayout.walls || [])];

      if (type === "room-move") {
        const room = originalLayout.rooms.find((r) => r.id === id);
        if (room && room.wallIds) {
          updatedWalls = updatedWalls.map((w) => {
            if (room.wallIds!.includes(w.id)) {
              return {
                ...w,
                start: { x: w.start.x + dxFt, y: w.start.y + dyFt },
                end: { x: w.end.x + dxFt, y: w.end.y + dyFt },
              };
            }
            return w;
          });
        }
      } else if (type === "wall-move") {
        const wall = originalLayout.walls.find((w) => w.id === id);
        if (wall) {
          const isAttached = (
            p1: { x: number; y: number },
            p2: { x: number; y: number },
          ) => Math.hypot(p1.x - p2.x, p1.y - p2.y) < 0.1;
          updatedWalls = updatedWalls.map((w) => {
            if (w.id === id)
              return {
                ...w,
                start: { x: w.start.x + dxFt, y: w.start.y + dyFt },
                end: { x: w.end.x + dxFt, y: w.end.y + dyFt },
              };
            let newStart = w.start;
            let newEnd = w.end;
            if (
              isAttached(w.start, wall.start) ||
              isAttached(w.start, wall.end)
            )
              newStart = { x: w.start.x + dxFt, y: w.start.y + dyFt };
            if (isAttached(w.end, wall.start) || isAttached(w.end, wall.end))
              newEnd = { x: w.end.x + dxFt, y: w.end.y + dyFt };
            return { ...w, start: newStart, end: newEnd };
          });
        }
      } else if (type === "room-rotate") {
        const room = originalLayout.rooms.find((r) => r.id === id);
        if (room && room.wallIds) {
          const cx = room.bounds.x + room.bounds.width / 2;
          const cy = room.bounds.y + room.bounds.height / 2;
          const startAngle = Math.atan2(
            metersToFeet(startMeters.y) - cy,
            metersToFeet(startMeters.x) - cx,
          );
          const currAngle = Math.atan2(
            metersToFeet(ptMeters.y) - cy,
            metersToFeet(ptMeters.x) - cx,
          );
          const angleDelta = currAngle - startAngle;

          updatedWalls = updatedWalls.map((w) => {
            if (room.wallIds!.includes(w.id)) {
              const rot = (p: { x: number; y: number }) => {
                const dx = p.x - cx;
                const dy = p.y - cy;
                return {
                  x: cx + dx * Math.cos(angleDelta) - dy * Math.sin(angleDelta),
                  y: cy + dx * Math.sin(angleDelta) + dy * Math.cos(angleDelta),
                };
              };
              return { ...w, start: rot(w.start), end: rot(w.end) };
            }
            return w;
          });
        }
      } else if (type === "room-scale") {
        const room = originalLayout.rooms.find((r) => r.id === id);
        if (room && room.wallIds) {
          const cx = room.bounds.x + room.bounds.width / 2;
          const cy = room.bounds.y + room.bounds.height / 2;
          const startDist = Math.hypot(
            metersToFeet(startMeters.x) - cx,
            metersToFeet(startMeters.y) - cy,
          );
          const currDist = Math.hypot(
            metersToFeet(ptMeters.x) - cx,
            metersToFeet(ptMeters.y) - cy,
          );
          const factor = startDist > 0 ? currDist / startDist : 1;

          updatedWalls = updatedWalls.map((w) => {
            if (room.wallIds!.includes(w.id)) {
              const scl = (p: { x: number; y: number }) => ({
                x: cx + (p.x - cx) * factor,
                y: cy + (p.y - cy) * factor,
              });
              return { ...w, start: scl(w.start), end: scl(w.end) };
            }
            return w;
          });
        }
      } else if (type === "wall-rotate") {
        const wall = originalLayout.walls.find((w) => w.id === id);
        if (wall) {
          const cx = (wall.start.x + wall.end.x) / 2;
          const cy = (wall.start.y + wall.end.y) / 2;
          const startAngle = Math.atan2(
            metersToFeet(startMeters.y) - cy,
            metersToFeet(startMeters.x) - cx,
          );
          const currAngle = Math.atan2(
            metersToFeet(ptMeters.y) - cy,
            metersToFeet(ptMeters.x) - cx,
          );
          const angleDelta = currAngle - startAngle;

          updatedWalls = updatedWalls.map((w) => {
            if (w.id === id) {
              const rot = (p: { x: number; y: number }) => {
                const dx = p.x - cx;
                const dy = p.y - cy;
                return {
                  x: cx + dx * Math.cos(angleDelta) - dy * Math.sin(angleDelta),
                  y: cy + dx * Math.sin(angleDelta) + dy * Math.cos(angleDelta),
                };
              };
              return { ...w, start: rot(w.start), end: rot(w.end) };
            }
            return w;
          });
        }
      } else if (type === "wall-scale") {
        const wall = originalLayout.walls.find((w) => w.id === id);
        if (wall) {
          const cx = (wall.start.x + wall.end.x) / 2;
          const cy = (wall.start.y + wall.end.y) / 2;
          const startDist = Math.hypot(
            metersToFeet(startMeters.x) - cx,
            metersToFeet(startMeters.y) - cy,
          );
          const currDist = Math.hypot(
            metersToFeet(ptMeters.x) - cx,
            metersToFeet(ptMeters.y) - cy,
          );
          const factor = startDist > 0 ? currDist / startDist : 1;

          updatedWalls = updatedWalls.map((w) => {
            if (w.id === id) {
              const scl = (p: { x: number; y: number }) => ({
                x: cx + (p.x - cx) * factor,
                y: cy + (p.y - cy) * factor,
              });
              return { ...w, start: scl(w.start), end: scl(w.end) };
            }
            return w;
          });
        }
      }

      const layout = useEditorStore.getState().floorPlanLayout;
      if (layout) {
        setFloorPlan({ ...layout, walls: updatedWalls });
      }
      return;
    }

    if (
      !drawingWallStart &&
      !measureStart &&
      tool !== "add-door" &&
      tool !== "add-window" &&
      tool !== "add-stair"
    )
      return;
    // Snapping for live preview
    const ptFeet = { x: metersToFeet(ptMeters.x), y: metersToFeet(ptMeters.y) };
    let snapPt = {
      x: Math.round(ptFeet.x * 2) / 2,
      y: Math.round(ptFeet.y * 2) / 2,
    };

    if (tool === "draw-wall") {
      const layout = useEditorStore.getState().floorPlanLayout;
      if (layout) {
        const snappedEp = snapToWallEndpoints(ptFeet, layout.walls, 0.8);
        if (snappedEp.x !== ptFeet.x || snappedEp.y !== ptFeet.y) {
          snapPt = snappedEp;
        } else {
          const snappedMp = snapToWallMidpoints(ptFeet, layout.walls, 0.8);
          if (snappedMp.x !== ptFeet.x || snappedMp.y !== ptFeet.y) {
            snapPt = snappedMp;
          }
        }
      }

      let targetPos = snapPt;
      if (drawingWallStart) {
        if (e.evt.shiftKey) {
          targetPos = snapToAngle(drawingWallStart, ptFeet);
        } else {
          targetPos = snapToAngle(
            drawingWallStart,
            snapPt,
            [0, 90, 180, 270],
            4,
          );
        }
      }
      setDrawingMousePos(targetPos);
    } else if (tool === "add-room") {
      setDrawingMousePos(e.evt.shiftKey ? ptFeet : snapPt);
    } else if (
      tool === "measure" ||
      tool === "add-door" ||
      tool === "add-window" ||
      tool === "add-stair"
    ) {
      setDrawingMousePos(ptFeet);
    }
  };

  return (
    <div
      ref={containerRef}
      id="blueprint-container"
      className="w-full h-full bg-[#FAF8F5] overflow-hidden relative"
    >
      <Stage
        width={stageSize.width}
        height={stageSize.height}
        onWheel={handleWheel}
        onClick={handleStageClick}
        onMouseMove={handleStageMouseMove}
        onMouseDown={(e) => {
          const isMiddleOrRight = e.evt.button === 1 || e.evt.button === 2;

          if (isMiddleOrRight) {
            isPanningRef.current = true;
            setCanvasCursor("grabbing");
            return;
          }

          const stage = e.target.getStage();
          if (!stage) return;
          const ptMeters = getStagePointerMeters(stage);
          if (!ptMeters) return;
          const snapPt = {
            x: Math.round(metersToFeet(ptMeters.x) * 2) / 2,
            y: Math.round(metersToFeet(ptMeters.y) * 2) / 2,
          };

          if (tool === "add-room") {
            setDrawingWallStart(snapPt);
            setDrawingMousePos(snapPt);
            return;
          }

          const isEmptySpace =
            e.target === stage ||
            e.target.name() === "grid-bg" ||
            e.target.name() === "master-group";
          const isLeftClickOnEmpty =
            e.evt.button === 0 &&
            isEmptySpace &&
            (tool === "select" || tool === "camera");

          if (isLeftClickOnEmpty) {
            isPanningRef.current = true;
            setCanvasCursor("grabbing");
          }
        }}
        onMouseUp={() => {
          isPanningRef.current = false;
          if (dragContextRef.current) {
            const dragType = dragContextRef.current.type;
            const layout = useEditorStore.getState().floorPlanLayout;
            if (
              layout &&
              hasDraggedRef.current &&
              dragType !== "door-slide" &&
              dragType !== "window-slide"
            ) {
              const snappedWalls = snapCloseWallEndpoints(layout.walls);
              const newRooms = detectAllRooms(snappedWalls, layout.rooms);
              useEditorStore.temporal.getState().resume();
              setFloorPlan({ ...layout, walls: snappedWalls, rooms: newRooms });
            } else {
              useEditorStore.temporal.getState().resume();
            }
            dragContextRef.current = null;
            hasDraggedRef.current = false;
            setCanvasCursor("default");
            return;
          }

          setCanvasCursor("default");

          if (
            tool === "add-room" &&
            activeDrawingWallStart &&
            activeDrawingMousePos
          ) {
            const minX = Math.min(
              activeDrawingWallStart.x,
              activeDrawingMousePos.x,
            );
            const maxX = Math.max(
              activeDrawingWallStart.x,
              activeDrawingMousePos.x,
            );
            const minY = Math.min(
              activeDrawingWallStart.y,
              activeDrawingMousePos.y,
            );
            const maxY = Math.max(
              activeDrawingWallStart.y,
              activeDrawingMousePos.y,
            );

            if (maxX - minX >= 2 && maxY - minY >= 2) {
              // Minimum 2x2 room
              const walls: Wall[] = [
                {
                  id: generateElementId("wall-ar1"),
                  start: { x: minX, y: minY },
                  end: { x: maxX, y: minY },
                  thickness: 6,
                  height: 10,
                  isLoadBearing: false,
                },
                {
                  id: generateElementId("wall-ar2"),
                  start: { x: maxX, y: minY },
                  end: { x: maxX, y: maxY },
                  thickness: 6,
                  height: 10,
                  isLoadBearing: false,
                },
                {
                  id: generateElementId("wall-ar3"),
                  start: { x: maxX, y: maxY },
                  end: { x: minX, y: maxY },
                  thickness: 6,
                  height: 10,
                  isLoadBearing: false,
                },
                {
                  id: generateElementId("wall-ar4"),
                  start: { x: minX, y: maxY },
                  end: { x: minX, y: minY },
                  thickness: 6,
                  height: 10,
                  isLoadBearing: false,
                },
              ];
              const layout = useEditorStore.getState().floorPlanLayout;
              if (layout) {
                const allWalls = [...layout.walls, ...walls];
                const snappedWalls = snapCloseWallEndpoints(allWalls);
                const newRooms = detectAllRooms(snappedWalls, layout.rooms);
                setFloorPlan({
                  ...layout,
                  walls: snappedWalls,
                  rooms: newRooms,
                });
                toast.success("Room created.");
              }
            } else if (maxX - minX > 1.0 || maxY - minY > 1.0) {
              toast.error("Room too small. Must be at least 2x2 ft.");
            }
            setDrawingWallStart(null);
            setDrawingMousePos(null);
          }
        }}
        onContextMenu={(e) => {
          e.evt.preventDefault();
          if (drawingWallStart) {
            setDrawingWallStart(null);
            setDrawingMousePos(null);
            toast.info("Finished wall chain.");
          }
        }}
        onDblClick={() => {
          if (drawingWallStart) {
            setDrawingWallStart(null);
            setDrawingMousePos(null);
            toast.info("Finished wall chain.");
          }
        }}
      >
        <Layer>
          {/* Background rect to catch clicks if needed */}
          <Rect
            x={0}
            y={0}
            width={stageSize.width}
            height={stageSize.height}
            fill="transparent"
            name="grid-bg"
          />

          <Group
            name="master-group"
            listening={tool === "select"}
            ref={masterGroupRef}
            x={useEditorStore.getState().stageX}
            y={useEditorStore.getState().stageY}
            scaleX={useEditorStore.getState().stageScale}
            scaleY={useEditorStore.getState().stageScale}
          >
            {floorPlanLayout.blueprint && (
              <BlueprintUnderlay reference={floorPlanLayout.blueprint} />
            )}
            {/* Grid — 1 ft spacing in world feet, drawn in meter world-space */}
            <Group>
              {(() => {
                const grid = [];
                // Draw every 1 foot. Convert to meters for world coords.
                const range = 60; // ±60 feet visible
                const rangeM = feetToMeters(range);
                for (let ft = -range; ft <= range; ft++) {
                  const pos = feetToMeters(ft);
                  const isMajor = ft % 5 === 0; // every 5 ft is a heavier line
                  const isAxis = ft === 0;
                  const stroke = isAxis
                    ? "rgba(91, 106, 240, 0.5)"
                    : isMajor
                      ? "rgba(91, 106, 240, 0.18)"
                      : "rgba(100, 116, 139, 0.1)";
                  const sw = isAxis
                    ? 1.5 / SCALE
                    : isMajor
                      ? 1.0 / SCALE
                      : 0.6 / SCALE;
                  const dash: number[] = isAxis
                    ? []
                    : isMajor
                      ? []
                      : [3 / SCALE, 3 / SCALE];
                  grid.push(
                    <KonvaLine
                      key={`v-${ft}`}
                      points={[pos, -rangeM, pos, rangeM]}
                      stroke={stroke}
                      strokeWidth={sw}
                      dash={dash}
                    />,
                  );
                  grid.push(
                    <KonvaLine
                      key={`h-${ft}`}
                      points={[-rangeM, pos, rangeM, pos]}
                      stroke={stroke}
                      strokeWidth={sw}
                      dash={dash}
                    />,
                  );
                }
                return grid;
              })()}
            </Group>

            {/* Elements */}
            <Group scaleX={SCALE} scaleY={SCALE}>
              {/* ─── Architectural Multi-Storey Onion-Skin / Ghost Underlay ─── */}
              {underlayStoreys.map((uStorey) => (
                <Group
                  key={`underlay-${uStorey.id}`}
                  opacity={0.35}
                  listening={false}
                >
                  {(uStorey.floorPlanLayout.walls || []).map((uWall) => {
                    const sx = feetToMeters(uWall.start.x);
                    const sy = feetToMeters(uWall.start.y);
                    const ex = feetToMeters(uWall.end.x);
                    const ey = feetToMeters(uWall.end.y);
                    return (
                      <KonvaLine
                        key={`ghost-wall-${uWall.id}`}
                        points={[sx, sy, ex, ey]}
                        stroke="#64748B"
                        strokeWidth={2.5 / SCALE}
                        dash={[4 / SCALE, 4 / SCALE]}
                      />
                    );
                  })}
                </Group>
              ))}

              {/* Preview Lines for Wall Drawing */}
              {activeDrawingWallStart &&
                activeDrawingMousePos &&
                tool === "draw-wall" && (
                  <DrawingWallPreview
                    start={activeDrawingWallStart}
                    end={activeDrawingMousePos}
                    scale={SCALE}
                  />
                )}

              {/* Preview Rect for Add Room */}
              {activeDrawingWallStart &&
                activeDrawingMousePos &&
                tool === "add-room" && (
                  <Rect
                    x={feetToMeters(
                      Math.min(
                        activeDrawingWallStart.x,
                        activeDrawingMousePos.x,
                      ),
                    )}
                    y={feetToMeters(
                      Math.min(
                        activeDrawingWallStart.y,
                        activeDrawingMousePos.y,
                      ),
                    )}
                    width={feetToMeters(
                      Math.abs(
                        activeDrawingWallStart.x - activeDrawingMousePos.x,
                      ),
                    )}
                    height={feetToMeters(
                      Math.abs(
                        activeDrawingWallStart.y - activeDrawingMousePos.y,
                      ),
                    )}
                    fill="rgba(91, 106, 240, 0.15)"
                    stroke="#9d9386"
                    strokeWidth={2 / SCALE}
                    dash={[5 / SCALE, 5 / SCALE]}
                  />
                )}

              {/* Preview Line for Measurement */}
              {activeMeasureStart &&
                activeDrawingMousePos &&
                tool === "measure" &&
                (() => {
                  const sx = activeMeasureStart.x;
                  const sy = activeMeasureStart.y;
                  const ex = feetToMeters(activeDrawingMousePos.x);
                  const ey = feetToMeters(activeDrawingMousePos.y);
                  const lenMeters = Math.hypot(ex - sx, ey - sy);
                  const lenFeet = metersToFeet(lenMeters);
                  const angleRad = Math.atan2(ey - sy, ex - sx);
                  let angleDeg = angleRad * (180 / Math.PI);
                  if (angleDeg > 90 || angleDeg < -90) angleDeg += 180;

                  const mx = (sx + ex) / 2 - Math.sin(angleRad) * 0.5;
                  const my = (sy + ey) / 2 + Math.cos(angleRad) * 0.5;
                  const badgeW = 1.15;
                  const badgeH = 0.45;
                  return (
                    <Group>
                      <KonvaLine
                        points={[sx, sy, ex, ey]}
                        stroke="#85705c"
                        strokeWidth={3 / SCALE}
                        dash={[5 / SCALE, 5 / SCALE]}
                      />
                      {lenFeet > 0.1 && (
                        <Group x={mx} y={my} rotation={angleDeg}>
                          <Rect
                            x={-badgeW / 2}
                            y={-badgeH / 2}
                            width={badgeW}
                            height={badgeH}
                            fill="#ffffff"
                            stroke="#85705c"
                            strokeWidth={2 / SCALE}
                            cornerRadius={0.06}
                          />
                          <Text
                            text={`${lenFeet.toFixed(1)} ft`}
                            x={-badgeW / 2}
                            y={-0.12}
                            width={badgeW}
                            align="center"
                            fontSize={11 / SCALE}
                            fontFamily="monospace"
                            fill="#eab308"
                            fontStyle="bold"
                          />
                        </Group>
                      )}
                    </Group>
                  );
                })()}

              {/* Ghost Hover Preview for Add Door / Add Window */}
              {(tool === "add-door" || tool === "add-window") &&
                activeDrawingMousePos &&
                (() => {
                  const walls = floorPlanLayout?.walls || [];
                  let closestWall: Wall | null = null;
                  let minDist = 3.0;
                  let bestT = 0.5;

                  for (const wall of walls) {
                    const dx = wall.end.x - wall.start.x;
                    const dy = wall.end.y - wall.start.y;
                    const lenSq = dx * dx + dy * dy;
                    if (lenSq < 0.01) continue;
                    const t =
                      ((activeDrawingMousePos.x - wall.start.x) * dx +
                        (activeDrawingMousePos.y - wall.start.y) * dy) /
                      lenSq;
                    const clampedT = Math.max(0.1, Math.min(0.9, t));
                    const px = wall.start.x + clampedT * dx;
                    const py = wall.start.y + clampedT * dy;
                    const dist = Math.hypot(
                      activeDrawingMousePos.x - px,
                      activeDrawingMousePos.y - py,
                    );
                    if (dist < minDist) {
                      minDist = dist;
                      closestWall = wall;
                      bestT = clampedT;
                    }
                  }

                  if (!closestWall) return null;

                  const sx = feetToMeters(closestWall.start.x);
                  const sy = feetToMeters(closestWall.start.y);
                  const ex = feetToMeters(closestWall.end.x);
                  const ey = feetToMeters(closestWall.end.y);
                  const angleRad = Math.atan2(ey - sy, ex - sx);
                  const angleDeg = (angleRad * 180) / Math.PI;

                  const widthM =
                    tool === "add-door" ? feetToMeters(3) : feetToMeters(4);
                  const thickM = feetToMeters(closestWall.thickness / 12);
                  const cx = sx + bestT * (ex - sx);
                  const cy = sy + bestT * (ey - sy);

                  return (
                    <Group
                      x={cx}
                      y={cy}
                      rotation={angleDeg}
                      opacity={0.75}
                      listening={false}
                    >
                      <Rect
                        x={-widthM / 2}
                        y={-thickM / 2 - 0.03}
                        width={widthM}
                        height={thickM + 0.06}
                        fill="rgba(59, 130, 246, 0.2)"
                        stroke="#8a5a36"
                        strokeWidth={2 / SCALE}
                        dash={[4 / SCALE, 2 / SCALE]}
                      />
                      {tool === "add-door" ? (
                        <Arc
                          x={-widthM / 2}
                          y={0}
                          innerRadius={0}
                          outerRadius={widthM}
                          angle={90}
                          rotation={0}
                          stroke="#8a5a36"
                          strokeWidth={1.5 / SCALE}
                          dash={[3 / SCALE, 2 / SCALE]}
                        />
                      ) : (
                        <KonvaLine
                          points={[-widthM / 2, 0, widthM / 2, 0]}
                          stroke="#94785b"
                          strokeWidth={2 / SCALE}
                        />
                      )}
                    </Group>
                  );
                })()}

              {/* Draw Rooms */}
              {(floorPlanLayout.rooms || []).map((room) => {
                const polygonPoints = getRoomPolygonPoints(
                  room,
                  floorPlanLayout.walls,
                );
                const flatPoints = polygonPoints.flatMap((p) => [
                  feetToMeters(p.x),
                  feetToMeters(p.y),
                ]);
                const cx =
                  polygonPoints.reduce((sum, p) => sum + p.x, 0) /
                  polygonPoints.length;
                const cy =
                  polygonPoints.reduce((sum, p) => sum + p.y, 0) /
                  polygonPoints.length;
                const cxM = feetToMeters(cx);
                const cyM = feetToMeters(cy);
                const preciseAreaFt = calculatePolygonAreaFt(polygonPoints);
                const isSelected = selectedObjectId === room.id;
                const roomRotateGizmoY =
                  cyM - feetToMeters(room.bounds.height / 2) - 0.6;

                const matFloorColors: Record<string, string> = {
                  hardwood: "rgba(217, 171, 85, 0.14)",
                  tile: "rgba(14, 165, 233, 0.10)",
                  marble: "rgba(226, 232, 240, 0.45)",
                  carpet: "rgba(139, 92, 246, 0.11)",
                  concrete: "rgba(100, 116, 139, 0.14)",
                  terrazzo: "rgba(244, 114, 182, 0.11)",
                };
                const baseRoomFill = room.noTexture
                  ? "rgba(138, 119, 95, 0.02)"
                  : (room.floorMaterial &&
                      matFloorColors[room.floorMaterial.toLowerCase()]) ||
                    "rgba(138, 119, 95, 0.04)";

                return (
                  <Group
                    key={room.id}
                    onClick={(e) => {
                      e.cancelBubble = true;
                      setSelectedObject(room.id);
                    }}
                    onMouseDown={(e) => handleStartRoomMove(e, room.id)}
                  >
                    {/* Selection and Border Layer */}
                    <KonvaLine
                      points={flatPoints}
                      fill={
                        isSelected ? "rgba(138, 90, 54, 0.12)" : baseRoomFill
                      }
                      stroke={isSelected ? "#8a5a36" : "#9d9386"}
                      strokeWidth={isSelected ? 3.5 / SCALE : 1.5 / SCALE}
                      closed
                    />
                    <Text
                      text={`${room.label}\n${preciseAreaFt.toFixed(0)} sqft${room.floorMaterial && !room.noTexture ? ` · ${room.floorMaterial}` : ""}`}
                      x={cxM - 1.2}
                      y={cyM - 0.4}
                      width={2.4}
                      align="center"
                      fontSize={12.5 / SCALE}
                      fill={isSelected ? "#1d4ed8" : "#1e293b"}
                      fontStyle="bold"
                      fontFamily="sans-serif"
                    />

                    {/* Room Rotate Gizmo */}
                    {isSelected && tool === "select" && (
                      <Group
                        x={cxM}
                        y={roomRotateGizmoY}
                        onMouseDown={(e) => handleStartRoomRotate(e, room.id)}
                      >
                        {/* Stem line from room top to rotate handle */}
                        <KonvaLine
                          points={[0, 0, 0, 0.6]}
                          stroke="#8a5a36"
                          strokeWidth={1.5 / SCALE}
                        />
                        <Circle
                          radius={14 / SCALE}
                          fill="#8a5a36"
                          stroke="#fff"
                          strokeWidth={2 / SCALE}
                        />
                        <Text
                          text="↻"
                          x={-6 / SCALE}
                          y={-6 / SCALE}
                          fontSize={12 / SCALE}
                          fill="#fff"
                        />
                      </Group>
                    )}

                    {/* Room Scale Gizmo */}
                    {isSelected && tool === "select" && (
                      <Group
                        x={cxM + feetToMeters(room.bounds.width / 2)}
                        y={cyM + feetToMeters(room.bounds.height / 2)}
                        onMouseDown={(e) => handleStartRoomScale(e, room.id)}
                      >
                        <Circle
                          radius={12 / SCALE}
                          fill="#8a5a36"
                          stroke="#fff"
                          strokeWidth={2 / SCALE}
                        />
                        <Text
                          text="⤡"
                          x={-5 / SCALE}
                          y={-5 / SCALE}
                          fontSize={11 / SCALE}
                          fill="#fff"
                        />
                      </Group>
                    )}
                  </Group>
                );
              })}

              {/* Draw Furniture */}
              {sceneObjects.map((obj) => {
                const isSelected = selectedObjectId === obj.id;
                const name = obj.name.toLowerCase();
                let width = 0.8;
                let height = 0.8;
                let isCircle = false;

                if (name.includes("sofa")) {
                  width = 2.0;
                  height = 0.8;
                } else if (name.includes("bed")) {
                  width = 1.6;
                  height = 2.0;
                } else if (name.includes("round")) {
                  width = 1.2;
                  height = 1.2;
                  isCircle = true;
                } else if (name.includes("table") || name.includes("desk")) {
                  width = 1.6;
                  height = 0.8;
                } else if (
                  name.includes("sideboard") ||
                  name.includes("bookcase")
                ) {
                  width = 1.2;
                  height = 0.5;
                } else if (name.includes("plant") || name.includes("vase")) {
                  width = 0.4;
                  height = 0.4;
                  isCircle = true;
                }

                return (
                  <Group
                    key={obj.id}
                    x={obj.position.x}
                    y={obj.position.z}
                    rotation={((obj.rotation.y || 0) * 180) / Math.PI}
                    draggable={tool === "select"}
                    onClick={(e) => {
                      e.cancelBubble = true;
                      setSelectedObject(obj.id);
                    }}
                    onDragStart={() =>
                      useEditorStore.temporal.getState().pause()
                    }
                    onDragMove={(e) => {
                      if (e.target.name() === "furniture-group") {
                        handleFurnitureDrag(
                          obj.id,
                          e.target.x(),
                          e.target.y(),
                          false,
                          e.evt?.shiftKey,
                        );
                      }
                    }}
                    onDragEnd={(e) => {
                      if (e.target.name() === "furniture-group") {
                        handleFurnitureDrag(
                          obj.id,
                          e.target.x(),
                          e.target.y(),
                          true,
                          e.evt?.shiftKey,
                        );
                      }
                    }}
                    name="furniture-group"
                  >
                    {isCircle ? (
                      <Circle
                        radius={width / 2}
                        fill="rgba(255, 255, 255, 0.01)"
                        stroke={isSelected ? "#8a5a36" : "#9d9386"}
                        strokeWidth={isSelected ? 2 / SCALE : 1 / SCALE}
                      />
                    ) : (
                      <Rect
                        x={-width / 2}
                        y={-height / 2}
                        width={width}
                        height={height}
                        fill="rgba(255, 255, 255, 0.01)"
                        stroke={isSelected ? "#8a5a36" : "#9d9386"}
                        strokeWidth={isSelected ? 2 / SCALE : 1 / SCALE}
                        cornerRadius={0.06}
                      />
                    )}

                    {/* SVG Top-down stylization fallback */}
                    {!obj.thumbnailUrl &&
                      !isCircle &&
                      name.includes("chair") && (
                        <KonvaPath
                          x={-width / 4}
                          y={-height / 4}
                          data="M0 0 H 0.4 V 0.4 H 0 Z"
                          stroke="#9d9386"
                          strokeWidth={1 / SCALE}
                        />
                      )}

                    <Text
                      text={obj.name}
                      visible={isSelected}
                      x={-width / 2}
                      y={height / 2 + 0.05}
                      width={width}
                      align="center"
                      fontSize={8.5 / SCALE}
                      fill={isSelected ? "#1d4ed8" : "#475569"}
                      fontFamily="sans-serif"
                      fontStyle="bold"
                    />

                    {/* Rotation Gizmo */}
                    {isSelected && (
                      <Group
                        x={0}
                        y={-height / 2 - 0.4}
                        draggable
                        onDragStart={() =>
                          useEditorStore.temporal.getState().pause()
                        }
                        onDragMove={(e) => {
                          // Simple rot dragging logic based on pointer
                          const stage = e.target.getStage();
                          if (stage) {
                            const pt = getStagePointerMeters(stage);
                            if (pt) {
                              const angle = Math.atan2(
                                pt.y - obj.position.z,
                                pt.x - obj.position.x,
                              );
                              updateSceneObject(obj.id, {
                                rotation: {
                                  ...obj.rotation,
                                  y: angle + Math.PI / 2,
                                },
                              });
                            }
                          }
                          e.target.x(0);
                          e.target.y(-height / 2 - 0.4);
                        }}
                        onDragEnd={(e) => {
                          useEditorStore.temporal.getState().resume();
                          const stage = e.target.getStage();
                          if (stage) {
                            const pt = getStagePointerMeters(stage);
                            if (pt) {
                              const angle = Math.atan2(
                                pt.y - obj.position.z,
                                pt.x - obj.position.x,
                              );
                              updateSceneObject(obj.id, {
                                rotation: {
                                  ...obj.rotation,
                                  y: angle + Math.PI / 2,
                                },
                              });
                            }
                          }
                          e.target.x(0);
                          e.target.y(-height / 2 - 0.4);
                        }}
                      >
                        <KonvaLine
                          points={[0, 0, 0, 0.4]}
                          stroke="#8a5a36"
                          strokeWidth={1 / SCALE}
                        />
                        <Circle radius={0.12} fill="#8a5a36" />
                      </Group>
                    )}
                  </Group>
                );
              })}

              {/* Draw Walls */}
              {(floorPlanLayout.walls || []).map((wall) => {
                const sx = feetToMeters(wall.start.x);
                const sy = feetToMeters(wall.start.y);
                const ex = feetToMeters(wall.end.x);
                const ey = feetToMeters(wall.end.y);
                const wallLengthFt = Math.hypot(
                  wall.end.x - wall.start.x,
                  wall.end.y - wall.start.y,
                );

                const angleRad = Math.atan2(ey - sy, ex - sx);
                let angleDeg = angleRad * (180 / Math.PI);
                if (angleDeg > 90 || angleDeg < -90) angleDeg += 180;

                const mx = (sx + ex) / 2 - Math.sin(angleRad) * 0.5;
                const my = (sy + ey) / 2 + Math.cos(angleRad) * 0.5;
                const badgeW = 1.15;
                const badgeH = 0.45;

                const isWallDirectlySelected = selectedObjectId === wall.id;
                const selectedRoom = (floorPlanLayout.rooms || []).find(
                  (r) => r.id === selectedObjectId,
                );
                const isWallPartOfSelectedRoom =
                  selectedRoom?.wallIds?.includes(wall.id) || false;
                const isSelected =
                  isWallDirectlySelected || isWallPartOfSelectedRoom;

                const rawWallAngle = Math.atan2(ey - sy, ex - sx);
                const perpAngle = rawWallAngle + Math.PI / 2;
                const offsetDist = 0.6; // 0.6 meters offset
                const wallRotateGizmoX = mx + Math.cos(perpAngle) * offsetDist;
                const wallRotateGizmoY = my + Math.sin(perpAngle) * offsetDist;
                const wallScaleGizmoX = ex + Math.cos(rawWallAngle) * 0.35;
                const wallScaleGizmoY = ey + Math.sin(rawWallAngle) * 0.35;

                return (
                  <Group
                    key={wall.id}
                    name="wall-group"
                    onClick={() => setSelectedObject(wall.id)}
                    onMouseDown={(e) => handleStartWallMove(e, wall.id)}
                  >
                    <KonvaLine
                      name="wall-body"
                      points={getWallPolygon(wall, floorPlanLayout.walls || [])}
                      closed
                      fill={
                        wall.color ||
                        (wall.isLoadBearing ? "#1e293b" : "#475569")
                      }
                      stroke={
                        isWallDirectlySelected
                          ? "#8a5a36"
                          : isWallPartOfSelectedRoom
                            ? "rgba(37, 99, 235, 0.6)"
                            : "transparent"
                      }
                      strokeWidth={
                        isWallDirectlySelected
                          ? 3.5 / SCALE
                          : isWallPartOfSelectedRoom
                            ? 2.5 / SCALE
                            : 0
                      }
                      lineJoin="miter"
                    />

                    {/* Endpoints */}
                    {(isSelected || tool === "draw-wall") && (
                      <>
                        <Circle
                          x={sx}
                          y={sy}
                          radius={7 / SCALE}
                          fill="#ffffff"
                          stroke={isSelected ? "#8a5a36" : "#9d9386"}
                          strokeWidth={2 / SCALE}
                          draggable
                          onDragStart={() =>
                            useEditorStore.temporal.getState().pause()
                          }
                          onDragMove={(e) =>
                            handleWallEndpointDrag(
                              wall.id,
                              true,
                              e.target.x(),
                              e.target.y(),
                              false,
                              e.evt?.shiftKey,
                              e.evt?.altKey,
                            )
                          }
                          onDragEnd={(e) =>
                            handleWallEndpointDrag(
                              wall.id,
                              true,
                              e.target.x(),
                              e.target.y(),
                              true,
                              e.evt?.shiftKey,
                              e.evt?.altKey,
                            )
                          }
                        />
                        <Circle
                          x={ex}
                          y={ey}
                          radius={7 / SCALE}
                          fill="#ffffff"
                          stroke={isSelected ? "#8a5a36" : "#9d9386"}
                          strokeWidth={2 / SCALE}
                          draggable
                          onDragStart={() =>
                            useEditorStore.temporal.getState().pause()
                          }
                          onDragMove={(e) =>
                            handleWallEndpointDrag(
                              wall.id,
                              false,
                              e.target.x(),
                              e.target.y(),
                              false,
                              e.evt?.shiftKey,
                              e.evt?.altKey,
                            )
                          }
                          onDragEnd={(e) =>
                            handleWallEndpointDrag(
                              wall.id,
                              false,
                              e.target.x(),
                              e.target.y(),
                              true,
                              e.evt?.shiftKey,
                              e.evt?.altKey,
                            )
                          }
                        />
                      </>
                    )}
                    {/* Dimension Badge */}
                    {(isSelected || showMeasurements) && (
                      <>
                        <Group x={mx} y={my} rotation={angleDeg}>
                          <Rect
                            x={-badgeW / 2}
                            y={-badgeH / 2}
                            width={badgeW}
                            height={badgeH}
                            fill="#ffffff"
                            stroke="#9d9386"
                            strokeWidth={2 / SCALE}
                            cornerRadius={0.06}
                            onClick={(e) => {
                              e.cancelBubble = true;
                              const val = prompt(
                                `Enter new wall length (in feet):`,
                                wallLengthFt.toFixed(1),
                              );
                              if (val)
                                handleResizeWall2D(wall.id, parseFloat(val));
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
                            fill="#4d3a2a"
                            fontStyle="bold"
                          />
                        </Group>
                      </>
                    )}
                    {/* Wall Rotate Gizmo */}
                    {isWallDirectlySelected && tool === "select" && (
                      <Group
                        x={wallRotateGizmoX}
                        y={wallRotateGizmoY}
                        onMouseDown={(e) => handleStartWallRotate(e, wall.id)}
                      >
                        <KonvaLine
                          points={[
                            0,
                            0,
                            -Math.cos(perpAngle) * offsetDist,
                            -Math.sin(perpAngle) * offsetDist,
                          ]}
                          stroke="#8a5a36"
                          strokeWidth={1.5 / SCALE}
                        />
                        <Circle
                          radius={12 / SCALE}
                          fill="#8a5a36"
                          stroke="#fff"
                          strokeWidth={1.5 / SCALE}
                        />
                        <Text
                          text="↻"
                          x={-5 / SCALE}
                          y={-5 / SCALE}
                          fontSize={10 / SCALE}
                          fill="#fff"
                        />
                      </Group>
                    )}

                    {/* Wall Scale Gizmo */}
                    {isWallDirectlySelected && tool === "select" && (
                      <Group
                        x={wallScaleGizmoX}
                        y={wallScaleGizmoY}
                        onMouseDown={(e) => handleStartWallScale(e, wall.id)}
                      >
                        <KonvaLine
                          points={[
                            0,
                            0,
                            -Math.cos(rawWallAngle) * 0.35,
                            -Math.sin(rawWallAngle) * 0.35,
                          ]}
                          stroke="#8a5a36"
                          strokeWidth={1.5 / SCALE}
                          dash={[2 / SCALE, 2 / SCALE]}
                        />
                        <Circle
                          radius={12 / SCALE}
                          fill="#8a5a36"
                          stroke="#fff"
                          strokeWidth={1.5 / SCALE}
                        />
                        <Text
                          text="⤡"
                          x={-5 / SCALE}
                          y={-5 / SCALE}
                          fontSize={10 / SCALE}
                          fill="#fff"
                        />
                      </Group>
                    )}
                  </Group>
                );
              })}

              {/* ── Architectural 2D Doors (Draggable Along Wall + Multi-Type Symbols) ── */}
              {(floorPlanLayout.doors || []).map((door) => {
                const wall = (floorPlanLayout.walls || []).find(
                  (w) => w.id === door.wallId,
                );
                if (!wall) return null;
                const sx = feetToMeters(wall.start.x);
                const sy = feetToMeters(wall.start.y);
                const ex = feetToMeters(wall.end.x);
                const ey = feetToMeters(wall.end.y);
                const wallLengthFt = Math.hypot(
                  wall.end.x - wall.start.x,
                  wall.end.y - wall.start.y,
                );
                const angleRad = Math.atan2(ey - sy, ex - sx);
                const angleDeg = (angleRad * 180) / Math.PI;

                const doorWidthM = feetToMeters(door.width / 12);
                const wallThickM = feetToMeters(wall.thickness / 12);
                const cx = sx + door.position * (ex - sx);
                const cy = sy + door.position * (ey - sy);
                const isSelected = selectedObjectId === door.id;

                const doorType = door.doorType || "single";
                const swingSide = door.swingSide || "left";
                const swingDir = door.swingDirection || "inward";
                const dirSign = swingDir === "inward" ? 1 : -1;
                const distFromStartFt = (door.position * wallLengthFt).toFixed(
                  1,
                );

                return (
                  <Group
                    key={door.id}
                    x={cx}
                    y={cy}
                    rotation={angleDeg}
                    onClick={(e) => {
                      e.cancelBubble = true;
                      setSelectedObject(door.id);
                    }}
                    onMouseDown={(e) => {
                      if (tool !== "select") return;
                      e.cancelBubble = true;
                      setSelectedObject(door.id);
                      const stage = e.target.getStage();
                      if (!stage) return;
                      const pt = getStagePointerMeters(stage);
                      if (pt && floorPlanLayout) {
                        useEditorStore.temporal.getState().pause();
                        dragContextRef.current = {
                          type: "door-slide",
                          id: door.id,
                          startMeters: pt,
                          originalLayout: floorPlanLayout,
                        };
                      }
                    }}
                    onDblClick={(e) => {
                      e.cancelBubble = true;
                      const nextDir =
                        swingDir === "inward" ? "outward" : "inward";
                      const nextSide =
                        swingDir === "outward"
                          ? swingSide === "left"
                            ? "right"
                            : "left"
                          : swingSide;
                      updateDoor(door.id, {
                        swingDirection: nextDir,
                        swingSide: nextSide,
                      });
                      toast.success(
                        `Flipped door swing (${nextSide} / ${nextDir})`,
                      );
                    }}
                  >
                    {/* Wall opening cutout */}
                    <Rect
                      x={-doorWidthM / 2}
                      y={-wallThickM / 2 - 0.02}
                      width={doorWidthM}
                      height={wallThickM + 0.04}
                      fill="#FAF8F5"
                    />
                    {/* Jamb boundary lines */}
                    <KonvaLine
                      points={[
                        -doorWidthM / 2,
                        -wallThickM / 2,
                        -doorWidthM / 2,
                        wallThickM / 2,
                      ]}
                      stroke={isSelected ? "#8a5a36" : "#0f172a"}
                      strokeWidth={2.5 / SCALE}
                    />
                    <KonvaLine
                      points={[
                        doorWidthM / 2,
                        -wallThickM / 2,
                        doorWidthM / 2,
                        wallThickM / 2,
                      ]}
                      stroke={isSelected ? "#8a5a36" : "#0f172a"}
                      strokeWidth={2.5 / SCALE}
                    />

                    {/* Door Type Specific CAD Symbol */}
                    {doorType === "double" ? (
                      <>
                        <KonvaLine
                          points={[
                            -doorWidthM / 2,
                            0,
                            -doorWidthM / 2,
                            dirSign * (doorWidthM / 2),
                          ]}
                          stroke={isSelected ? "#8a5a36" : "#85705c"}
                          strokeWidth={2.5 / SCALE}
                        />
                        <KonvaLine
                          points={[
                            doorWidthM / 2,
                            0,
                            doorWidthM / 2,
                            dirSign * (doorWidthM / 2),
                          ]}
                          stroke={isSelected ? "#8a5a36" : "#85705c"}
                          strokeWidth={2.5 / SCALE}
                        />
                        <Arc
                          x={-doorWidthM / 2}
                          y={0}
                          innerRadius={0}
                          outerRadius={doorWidthM / 2}
                          angle={90}
                          rotation={dirSign > 0 ? 0 : -90}
                          stroke={isSelected ? "#8a5a36" : "#a18e7a"}
                          strokeWidth={1.5 / SCALE}
                          dash={[3 / SCALE, 2 / SCALE]}
                        />
                        <Arc
                          x={doorWidthM / 2}
                          y={0}
                          innerRadius={0}
                          outerRadius={doorWidthM / 2}
                          angle={90}
                          rotation={dirSign > 0 ? 90 : 180}
                          stroke={isSelected ? "#8a5a36" : "#a18e7a"}
                          strokeWidth={1.5 / SCALE}
                          dash={[3 / SCALE, 2 / SCALE]}
                        />
                      </>
                    ) : doorType === "sliding" || doorType === "pocket" ? (
                      <>
                        <KonvaLine
                          points={[-doorWidthM / 2, -0.025, 0.05, -0.025]}
                          stroke={isSelected ? "#8a5a36" : "#85705c"}
                          strokeWidth={2.5 / SCALE}
                        />
                        <KonvaLine
                          points={[-0.05, 0.025, doorWidthM / 2, 0.025]}
                          stroke={isSelected ? "#8a5a36" : "#a18e7a"}
                          strokeWidth={2.5 / SCALE}
                          dash={
                            doorType === "pocket" ? [3 / SCALE, 2 / SCALE] : []
                          }
                        />
                      </>
                    ) : doorType === "bifold" ? (
                      <KonvaLine
                        points={[
                          -doorWidthM / 2,
                          0,
                          -doorWidthM / 4,
                          dirSign * (doorWidthM * 0.35),
                          0,
                          0,
                          doorWidthM / 4,
                          dirSign * (doorWidthM * 0.35),
                          doorWidthM / 2,
                          0,
                        ]}
                        stroke={isSelected ? "#8a5a36" : "#85705c"}
                        strokeWidth={2.2 / SCALE}
                      />
                    ) : (
                      <>
                        <KonvaLine
                          points={
                            swingSide === "left"
                              ? [
                                  -doorWidthM / 2,
                                  0,
                                  -doorWidthM / 2,
                                  dirSign * doorWidthM,
                                ]
                              : [
                                  doorWidthM / 2,
                                  0,
                                  doorWidthM / 2,
                                  dirSign * doorWidthM,
                                ]
                          }
                          stroke={isSelected ? "#8a5a36" : "#85705c"}
                          strokeWidth={2.5 / SCALE}
                        />
                        <Arc
                          x={
                            swingSide === "left"
                              ? -doorWidthM / 2
                              : doorWidthM / 2
                          }
                          y={0}
                          innerRadius={0}
                          outerRadius={doorWidthM}
                          angle={90}
                          rotation={
                            swingSide === "left"
                              ? dirSign > 0
                                ? 0
                                : -90
                              : dirSign > 0
                                ? 90
                                : 180
                          }
                          stroke={isSelected ? "#8a5a36" : "#a18e7a"}
                          strokeWidth={1.5 / SCALE}
                          dash={[3 / SCALE, 2 / SCALE]}
                        />
                      </>
                    )}

                    {/* Live Position / Width Badge when selected */}
                    {isSelected && (
                      <Group x={0} y={-0.38}>
                        <Rect
                          x={-0.65}
                          y={-0.16}
                          width={1.3}
                          height={0.32}
                          fill="#1e293b"
                          cornerRadius={0.05}
                        />
                        <Text
                          text={`${door.width}" · @${distFromStartFt}ft`}
                          x={-0.65}
                          y={-0.09}
                          width={1.3}
                          align="center"
                          fontSize={8.5 / SCALE}
                          fontFamily="monospace"
                          fill="#f8fafc"
                          fontStyle="bold"
                        />
                      </Group>
                    )}
                  </Group>
                );
              })}

              {/* ── Architectural 2D Windows (Draggable Along Wall) ── */}
              {(floorPlanLayout.windows || []).map((win) => {
                const wall = (floorPlanLayout.walls || []).find(
                  (w) => w.id === win.wallId,
                );
                if (!wall) return null;
                const sx = feetToMeters(wall.start.x);
                const sy = feetToMeters(wall.start.y);
                const ex = feetToMeters(wall.end.x);
                const ey = feetToMeters(wall.end.y);
                const wallLengthFt = Math.hypot(
                  wall.end.x - wall.start.x,
                  wall.end.y - wall.start.y,
                );
                const angleRad = Math.atan2(ey - sy, ex - sx);
                const angleDeg = (angleRad * 180) / Math.PI;

                const winWidthM = feetToMeters(win.width / 12);
                const wallThickM = feetToMeters(wall.thickness / 12);
                const cx = sx + win.position * (ex - sx);
                const cy = sy + win.position * (ey - sy);
                const isSelected = selectedObjectId === win.id;
                const distFromStartFt = (win.position * wallLengthFt).toFixed(
                  1,
                );

                return (
                  <Group
                    key={win.id}
                    x={cx}
                    y={cy}
                    rotation={angleDeg}
                    onClick={(e) => {
                      e.cancelBubble = true;
                      setSelectedObject(win.id);
                    }}
                    onMouseDown={(e) => {
                      if (tool !== "select") return;
                      e.cancelBubble = true;
                      setSelectedObject(win.id);
                      const stage = e.target.getStage();
                      if (!stage) return;
                      const pt = getStagePointerMeters(stage);
                      if (pt && floorPlanLayout) {
                        useEditorStore.temporal.getState().pause();
                        dragContextRef.current = {
                          type: "window-slide",
                          id: win.id,
                          startMeters: pt,
                          originalLayout: floorPlanLayout,
                        };
                      }
                    }}
                  >
                    {/* Window opening cut */}
                    <Rect
                      x={-winWidthM / 2}
                      y={-wallThickM / 2 - 0.02}
                      width={winWidthM}
                      height={wallThickM + 0.04}
                      fill="#FAF8F5"
                    />
                    {/* Jamb lines */}
                    <KonvaLine
                      points={[
                        -winWidthM / 2,
                        -wallThickM / 2,
                        -winWidthM / 2,
                        wallThickM / 2,
                      ]}
                      stroke={isSelected ? "#8a5a36" : "#334155"}
                      strokeWidth={2 / SCALE}
                    />
                    <KonvaLine
                      points={[
                        winWidthM / 2,
                        -wallThickM / 2,
                        winWidthM / 2,
                        wallThickM / 2,
                      ]}
                      stroke={isSelected ? "#8a5a36" : "#334155"}
                      strokeWidth={2 / SCALE}
                    />
                    {/* Double-glazing glass lines */}
                    <KonvaLine
                      points={[-winWidthM / 2, -0.03, winWidthM / 2, -0.03]}
                      stroke={isSelected ? "#8a5a36" : "#94785b"}
                      strokeWidth={1.5 / SCALE}
                    />
                    <KonvaLine
                      points={[-winWidthM / 2, 0.03, winWidthM / 2, 0.03]}
                      stroke={isSelected ? "#8a5a36" : "#94785b"}
                      strokeWidth={1.5 / SCALE}
                    />
                    {/* Center Mullion for grid-2x2 / double-hung / casement */}
                    {(win.windowType === "grid-2x2" ||
                      win.windowType === "casement" ||
                      win.windowType === "double-hung") && (
                      <KonvaLine
                        points={[0, -wallThickM / 2, 0, wallThickM / 2]}
                        stroke={isSelected ? "#8a5a36" : "#85705c"}
                        strokeWidth={1.5 / SCALE}
                      />
                    )}
                    {isSelected && (
                      <Group x={0} y={-0.38}>
                        <Rect
                          x={-0.75}
                          y={-0.16}
                          width={1.5}
                          height={0.32}
                          fill="#0f172a"
                          cornerRadius={0.05}
                        />
                        <Text
                          text={`${win.width}"x${win.height}" · @${distFromStartFt}ft`}
                          x={-0.75}
                          y={-0.09}
                          width={1.5}
                          align="center"
                          fontSize={8.5 / SCALE}
                          fontFamily="monospace"
                          fill="#a18e7a"
                          fontStyle="bold"
                        />
                      </Group>
                    )}
                  </Group>
                );
              })}

              {/* ── Architectural 2D Staircases (Draggable, Rotatable & Multi-Type) ── */}
              {(staircases || []).map((stair) => {
                const widthM = feetToMeters(stair.width / 12);
                const riserDepthM = 0.28;
                const lengthM = stair.riserCount * riserDepthM;
                const angleDeg = (stair.rotation.y * 180) / Math.PI;
                const isSelected = selectedObjectId === stair.id;

                return (
                  <Group
                    key={stair.id}
                    x={stair.position.x}
                    y={stair.position.z}
                    rotation={angleDeg}
                    draggable={tool === "select"}
                    onClick={(e) => {
                      e.cancelBubble = true;
                      setSelectedObject(stair.id);
                    }}
                    onDragStart={() =>
                      useEditorStore.temporal.getState().pause()
                    }
                    onDragMove={(e) => {
                      updateStaircase(stair.id, {
                        position: {
                          ...stair.position,
                          x: Math.round(e.target.x() * 10) / 10,
                          z: Math.round(e.target.y() * 10) / 10,
                        },
                      });
                    }}
                    onDragEnd={(e) => {
                      useEditorStore.temporal.getState().resume();
                      updateStaircase(stair.id, {
                        position: {
                          ...stair.position,
                          x: Math.round(e.target.x() * 10) / 10,
                          z: Math.round(e.target.y() * 10) / 10,
                        },
                      });
                    }}
                  >
                    {stair.type === "spiral" ? (
                      <>
                        <Circle
                          radius={widthM}
                          fill="#FAF8F5"
                          stroke={isSelected ? "#8a5a36" : "#78716c"}
                          strokeWidth={2 / SCALE}
                        />
                        <Circle
                          radius={0.14}
                          fill="#78716c"
                          stroke={isSelected ? "#8a5a36" : "#44403c"}
                          strokeWidth={1.5 / SCALE}
                        />
                        {Array.from({ length: 12 }).map((_, idx) => {
                          const a = (idx / 12) * Math.PI * 2;
                          return (
                            <KonvaLine
                              key={idx}
                              points={[
                                0,
                                0,
                                Math.cos(a) * widthM,
                                Math.sin(a) * widthM,
                              ]}
                              stroke="#a8a29e"
                              strokeWidth={1 / SCALE}
                            />
                          );
                        })}
                      </>
                    ) : (
                      <>
                        {/* Stair boundary */}
                        <Rect
                          x={-widthM / 2}
                          y={-lengthM / 2}
                          width={widthM}
                          height={lengthM}
                          fill="#FAF8F5"
                          stroke={isSelected ? "#8a5a36" : "#78716c"}
                          strokeWidth={2 / SCALE}
                        />
                        {/* Treads */}
                        {Array.from({ length: stair.riserCount }).map(
                          (_, idx) => {
                            const ty = -lengthM / 2 + idx * riserDepthM;
                            return (
                              <KonvaLine
                                key={idx}
                                points={[-widthM / 2, ty, widthM / 2, ty]}
                                stroke="#a8a29e"
                                strokeWidth={1 / SCALE}
                              />
                            );
                          },
                        )}
                        {/* Ascent arrow & UP text */}
                        <KonvaLine
                          points={[0, lengthM / 2 - 0.2, 0, -lengthM / 2 + 0.3]}
                          stroke={isSelected ? "#8a5a36" : "#44403c"}
                          strokeWidth={1.5 / SCALE}
                        />
                        <KonvaLine
                          points={[
                            -0.1,
                            -lengthM / 2 + 0.5,
                            0,
                            -lengthM / 2 + 0.3,
                            0.1,
                            -lengthM / 2 + 0.5,
                          ]}
                          stroke={isSelected ? "#8a5a36" : "#44403c"}
                          strokeWidth={1.5 / SCALE}
                        />
                        <Text
                          text={`UP (${stair.type.toUpperCase()})`}
                          x={-widthM / 2}
                          y={lengthM / 2 - 0.35}
                          width={widthM}
                          align="center"
                          fontSize={9.5 / SCALE}
                          fontFamily="sans-serif"
                          fill="#44403c"
                          fontStyle="bold"
                        />
                      </>
                    )}

                    {/* Stair Rotation Gizmo when Selected */}
                    {isSelected && (
                      <Group
                        x={0}
                        y={
                          -(stair.type === "spiral" ? widthM : lengthM / 2) -
                          0.4
                        }
                        onClick={(e) => {
                          e.cancelBubble = true;
                          const nextRot =
                            ((stair.rotation.y || 0) + Math.PI / 2) %
                            (Math.PI * 2);
                          updateStaircase(stair.id, {
                            rotation: { ...stair.rotation, y: nextRot },
                          });
                          toast.success("Rotated staircase 90°");
                        }}
                      >
                        <Circle
                          radius={12 / SCALE}
                          fill="#8a5a36"
                          stroke="#fff"
                          strokeWidth={1.5 / SCALE}
                        />
                        <Text
                          text="↻"
                          x={-5 / SCALE}
                          y={-5 / SCALE}
                          fontSize={10 / SCALE}
                          fill="#fff"
                        />
                      </Group>
                    )}
                  </Group>
                );
              })}

              {/* Draw Dimension Lines */}
              {dimensionLines.map((dim) => {
                const isSelected = selectedObjectId === dim.id;
                return (
                  <Group key={dim.id} onClick={() => setSelectedObject(dim.id)}>
                    <KonvaLine
                      points={[dim.start.x, dim.start.z, dim.end.x, dim.end.z]}
                      stroke={isSelected ? "#8a5a36" : "#85705c"}
                      strokeWidth={(isSelected ? 3 : 2) / SCALE}
                      dash={[5 / SCALE, 5 / SCALE]}
                    />
                    <Text
                      text={dim.label}
                      x={(dim.start.x + dim.end.x) / 2}
                      y={(dim.start.z + dim.end.z) / 2 - 0.5}
                      fontSize={14 / SCALE}
                      fill={isSelected ? "#8a5a36" : "#85705c"}
                    />
                  </Group>
                );
              })}
            </Group>
          </Group>
        </Layer>
      </Stage>
    </div>
  );
}
