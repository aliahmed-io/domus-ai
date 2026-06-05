"use client";

import React, { useState, useEffect, useRef } from "react";
import { Stage, Layer, Rect, Text, Group, Line as KonvaLine, Circle, Path } from "react-konva";
import Konva from "konva";
import { useEditorStore } from "@/store/useEditorStore";
import { useShallow } from "zustand/react/shallow";
import { feetToMeters, metersToFeet } from "@/lib/utils";
import { getWallPolygon } from '@/lib/geometry';
import { toast } from "sonner";
import type { Room, Wall, SceneObject } from "@/types/puter";
import { snapCloseWallEndpoints, snapToWallEndpoints } from "@/lib/snap";

export default function BlueprintCanvas2D() {
  const { 
    floorPlanLayout, 
    setFloorPlan, 
    dimensionLines, 
    sceneObjects, 
    updateSceneObject, 
    tool, 
    setTool, 
    addSceneObject, 
    addDimensionLine,
    selectedObjectId,
    setSelectedObject,
    setStageViewport
  } = useEditorStore(
    useShallow((s) => ({
      floorPlanLayout: s.floorPlanLayout,
      setFloorPlan: s.setFloorPlan,
      dimensionLines: s.dimensionLines,
      sceneObjects: s.sceneObjects,
      updateSceneObject: s.updateSceneObject,
      tool: s.tool,
      setTool: s.setTool,
      addSceneObject: s.addSceneObject,
      addDimensionLine: s.addDimensionLine,
      selectedObjectId: s.selectedObjectId,
      setSelectedObject: s.setSelectedObject,
      setStageViewport: s.setStageViewport
    }))
  );

  const [stageSize, setStageSize] = useState({ width: 800, height: 600 });
  const [mounted, setMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const masterGroupRef = useRef<any>(null);

  useEffect(() => {
    const unsub = useEditorStore.subscribe((state, prevState) => {
      if (state.stageX !== prevState.stageX || state.stageY !== prevState.stageY || state.stageScale !== prevState.stageScale) {
        if (masterGroupRef.current) {
          masterGroupRef.current.position({ x: state.stageX, y: state.stageY });
          masterGroupRef.current.scale({ x: state.stageScale, y: state.stageScale });
        }
      }
    });
    return unsub;
  }, []);

  const [floorPattern, setFloorPattern] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    // Generate a beautiful, subtle hardwood plank pattern for room floors
    const canvas = document.createElement("canvas");
    canvas.width = 120;
    canvas.height = 120;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.fillStyle = "#F8F6F0";
      ctx.fillRect(0, 0, 120, 120);
      
      ctx.strokeStyle = "#EAE4D8";
      ctx.lineWidth = 1;
      ctx.beginPath();
      // Horizontal planks
      for (let y = 20; y < 120; y += 20) {
        ctx.moveTo(0, y);
        ctx.lineTo(120, y);
      }
      // Vertical staggered joints
      ctx.moveTo(40, 0); ctx.lineTo(40, 20);
      ctx.moveTo(100, 20); ctx.lineTo(100, 40);
      ctx.moveTo(20, 40); ctx.lineTo(20, 60);
      ctx.moveTo(80, 60); ctx.lineTo(80, 80);
      ctx.moveTo(50, 80); ctx.lineTo(50, 100);
      ctx.moveTo(110, 100); ctx.lineTo(110, 120);
      ctx.stroke();
    }
    const img = new window.Image();
    img.src = canvas.toDataURL();
    img.onload = () => setFloorPattern(img);
  }, []);

  // Local states for interactive drawing/measuring tools
  const [drawingWallStart, setDrawingWallStart] = useState<{ x: number; y: number } | null>(null);
  const [drawingMousePos, setDrawingMousePos] = useState<{ x: number; y: number } | null>(null);
  const [measureStart, setMeasureStart] = useState<{ x: number; y: number } | null>(null);

  // Viewport scale & position states come from useEditorStore


  const dragContextRef = useRef<{
    type: "room-move" | "wall-move" | "room-rotate" | "room-scale" | "wall-rotate" | "wall-scale";
    id: string;
    startMeters: { x: number; y: number };
    originalLayout: typeof floorPlanLayout;
  } | null>(null);

  const hasDraggedRef = useRef(false);

  const isInitialized = useRef(false);
  const currentMousePosMetersRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const copiedObjectRef = useRef<{
    type: "furniture" | "wall" | "room";
    data: any;
  } | null>(null);


  // Keyboard Copy / Paste shortcuts (Ctrl+C / Ctrl+V)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      if (activeEl && (activeEl.tagName === "INPUT" || activeEl.tagName === "TEXTAREA")) {
        return;
      }

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

      if (cmdOrCtrl && e.key.toLowerCase() === "c") {
        // Copy selected object
        const layout = useEditorStore.getState().floorPlanLayout;
        const currentSelectedId = useEditorStore.getState().selectedObjectId;
        if (!currentSelectedId) return;

        // 1. Check if selected is furniture
        const furniture = sceneObjects.find((obj) => obj.id === currentSelectedId);
        if (furniture) {
          copiedObjectRef.current = {
            type: "furniture",
            data: { ...furniture }
          };
          toast.success(`Copied furniture: ${furniture.name}`);
          return;
        }

        // 2. Check if selected is wall
        if (layout) {
          const wall = (layout.walls || []).find((w) => w.id === currentSelectedId);
          if (wall) {
            copiedObjectRef.current = {
              type: "wall",
              data: { ...wall }
            };
            toast.success("Copied wall.");
            return;
          }

          // 3. Check if selected is room
          const room = (layout.rooms || []).find((r) => r.id === currentSelectedId);
          if (room) {
            const roomWalls = (layout.walls || []).filter((w) => room.wallIds?.includes(w.id));
            copiedObjectRef.current = {
              type: "room",
              data: {
                room: { ...room },
                walls: roomWalls.map((w) => ({ ...w }))
              }
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
        const targetPtFeet = { x: metersToFeet(targetPt.x), y: metersToFeet(targetPt.y) };

        if (copiedObjectRef.current.type === "furniture") {
          const original = copiedObjectRef.current.data as SceneObject;
          const newObj: SceneObject = {
            ...original,
            id: `furnish-copy-${Date.now()}`,
            position: { x: targetPt.x, y: original.position.y, z: targetPt.y }
          };
          addSceneObject(newObj);
          setSelectedObject(newObj.id);
          toast.success(`Pasted furniture: ${newObj.name}`);
        } else if (copiedObjectRef.current.type === "wall" && layout) {
          const original = copiedObjectRef.current.data as Wall;
          const dx = original.end.x - original.start.x;
          const dy = original.end.y - original.start.y;
          const startPt = e.shiftKey ? targetPtFeet : { x: Math.round(targetPtFeet.x * 2) / 2, y: Math.round(targetPtFeet.y * 2) / 2 };
          const endPt = { x: startPt.x + dx, y: startPt.y + dy };
          
          const newWall: Wall = {
            ...original,
            id: `wall-copy-${Date.now()}`,
            start: startPt,
            end: endPt
          };

          const newWalls = [...(layout.walls || []), newWall];
          const snappedWalls = snapCloseWallEndpoints(newWalls);
          const newRooms = detectAllRooms(snappedWalls);
          setFloorPlan({
            ...layout,
            walls: snappedWalls,
            rooms: newRooms
          });
          setSelectedObject(newWall.id);
          toast.success("Pasted wall.");
        } else if (copiedObjectRef.current.type === "room" && layout) {
          const { room, walls } = copiedObjectRef.current.data as { room: Room, walls: Wall[] };
          
          if (walls.length > 0) {
            const allPoints = walls.flatMap(w => [w.start, w.end]);
            const cx = allPoints.reduce((sum, p) => sum + p.x, 0) / allPoints.length;
            const cy = allPoints.reduce((sum, p) => sum + p.y, 0) / allPoints.length;

            const dx = targetPtFeet.x - cx;
            const dy = targetPtFeet.y - cy;

            const wallIdMap = new Map<string, string>();
            const newWalls = [...(layout.walls || [])];
            const pastedWalls: Wall[] = [];

            walls.forEach((w) => {
              const newId = `wall-copy-${Math.random().toString(36).substr(2, 9)}`;
              wallIdMap.set(w.id, newId);
              const nw = {
                ...w,
                id: newId,
                start: { x: w.start.x + dx, y: w.start.y + dy },
                end: { x: w.end.x + dx, y: w.end.y + dy }
              };
              newWalls.push(nw);
              pastedWalls.push(nw);
            });

            const newRoomId = `room-copy-${Date.now()}`;
            const newRoom: Room = {
              ...room,
              id: newRoomId,
              bounds: {
                x: room.bounds.x + dx,
                y: room.bounds.y + dy,
                width: room.bounds.width,
                height: room.bounds.height
              },
              wallIds: room.wallIds?.map(id => wallIdMap.get(id) || id) || []
            };

            const snappedWalls = snapCloseWallEndpoints(newWalls);
            const updatedRooms = [...(layout.rooms || []), newRoom];
            setFloorPlan({
              ...layout,
              walls: snappedWalls,
              rooms: updatedRooms
            });
            setSelectedObject(newRoomId);
            toast.success(`Pasted room: ${newRoom.label}`);
          } else {
            const dx = targetPtFeet.x - (room.bounds.x + room.bounds.width / 2);
            const dy = targetPtFeet.y - (room.bounds.y + room.bounds.height / 2);
            const newRoomId = `room-copy-${Date.now()}`;
            const newRoom: Room = {
              ...room,
              id: newRoomId,
              bounds: {
                x: room.bounds.x + dx,
                y: room.bounds.y + dy,
                width: room.bounds.width,
                height: room.bounds.height
              }
            };
            const updatedRooms = [...(layout.rooms || []), newRoom];
            setFloorPlan({
              ...layout,
              rooms: updatedRooms
            });
            setSelectedObject(newRoomId);
            toast.success(`Pasted room: ${newRoom.label}`);
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [sceneObjects, addSceneObject, setFloorPlan, setSelectedObject]);

  useEffect(() => {
    const handle = requestAnimationFrame(() => {
      setMounted(true);
    });
    
    if (!containerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setStageSize({ width, height });
        if (width > 0 && height > 0 && !isInitialized.current) {
          setStageViewport(useEditorStore.getState().stageScale, width / 2, height / 2);
          isInitialized.current = true;
        }
      }
    });

    observer.observe(containerRef.current);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(handle);
    };
  }, [mounted]);

  useEffect(() => {
    if (tool !== "draw-wall" && tool !== "add-room") {
      setDrawingWallStart(null);
      setDrawingMousePos(null);
    }
    if (tool !== "measure") {
      setMeasureStart(null);
    }
  }, [tool]);

  if (!mounted || !floorPlanLayout) return null;

  // 1 meter = 50 pixels default base scaling
  const SCALE = 50; 

  const calculatePolygonAreaFt = (points: { x: number; y: number }[]) => {
    let area = 0;
    const numPoints = points.length;
    for (let i = 0; i < numPoints; i++) {
      const p1 = points[i];
      const p2 = points[(i + 1) % numPoints];
      if (!p1 || !p2) continue;
      area += (p1.x * p2.y) - (p2.x * p1.y); // Signed area (shoelace)
    }
    return area / 2;
  };

  // Robust Planar Graph Face Detection to automatically find all closed rooms
  const detectAllRooms = (walls: Wall[], existingRooms: Room[] = floorPlanLayout?.rooms || []): Room[] => {
    // 1. Unify vertices (snap within 0.1ft)
    const vertices: {x:number, y:number}[] = [];
    const getVertexIdx = (pt: {x:number, y:number}) => {
      let idx = vertices.findIndex(v => Math.hypot(v.x - pt.x, v.y - pt.y) < 0.5);
      if (idx === -1) {
        idx = vertices.length;
        vertices.push({ ...pt });
      }
      return idx;
    };

    const edges: { from: number, to: number, wallId: string, angle: number }[] = [];
    walls.forEach(w => {
      const u = getVertexIdx(w.start);
      const v = getVertexIdx(w.end);
      if (u !== v) {
        const dx = vertices[v]!.x - vertices[u]!.x;
        const dy = vertices[v]!.y - vertices[u]!.y;
        edges.push({ from: u, to: v, wallId: w.id, angle: Math.atan2(dy, dx) });
        edges.push({ from: v, to: u, wallId: w.id, angle: Math.atan2(-dy, -dx) });
      }
    });

    // 2. Sort outgoing edges by angle
    const adj = new Map<number, typeof edges>();
    edges.forEach(e => {
      if (!adj.has(e.from)) adj.set(e.from, []);
      adj.get(e.from)!.push(e);
    });
    adj.forEach(outEdges => {
      outEdges.sort((a, b) => a.angle - b.angle);
    });

    // 3. Traverse faces
    const visited = new Set<string>();
    const rooms: Room[] = [];
    
    edges.forEach(startEdge => {
      const edgeKey = `${startEdge.from}->${startEdge.to}`;
      if (visited.has(edgeKey)) return;
      
      const faceEdges: typeof edges = [];
      let curr = startEdge;
      let valid = true;
      
      while (true) {
        faceEdges.push(curr);
        visited.add(`${curr.from}->${curr.to}`);
        
        const outEdges = adj.get(curr.to) || [];
        // Find the reverse of curr edge
        const revAngle = Math.atan2(vertices[curr.from]!.y - vertices[curr.to]!.y, vertices[curr.from]!.x - vertices[curr.to]!.x);
        // We want the edge immediately clockwise from the reverse edge
        // Sort angles relative to revAngle
        let nextEdge = outEdges[0];
        let minDiff = Infinity;
        for (const e of outEdges) {
          let diff = e.angle - revAngle;
          while (diff <= 0) diff += Math.PI * 2;
          if (diff < minDiff) {
            minDiff = diff;
            nextEdge = e;
          }
        }
        
        if (!nextEdge) { valid = false; break; }
        curr = nextEdge;
        
        if (curr.from === startEdge.from && curr.to === startEdge.to) break;
        if (faceEdges.length > edges.length) { valid = false; break; } // infinite loop safeguard
      }
      
      if (valid && faceEdges.length >= 3) {
        // Collect points
        const points = faceEdges.map(e => vertices[e.from]!);
        const area = calculatePolygonAreaFt(points);
        // Positive area means it's an interior face (assuming counter-clockwise SVG coord system)
        if (area > 0) {
          const wallIds = [...new Set(faceEdges.map(e => e.wallId))];
          const sortedIds = [...wallIds].sort();
          const stableId = `room-${sortedIds.join('-')}`;
          const xs = points.map(p => p.x);
          const ys = points.map(p => p.y);
          
          // Match against existing rooms by stable id to preserve properties
          const existingRoom = existingRooms.find(r => r.id === stableId);

          rooms.push({
            id: stableId,
            type: existingRoom?.type || "living",
            label: existingRoom?.label || "Room",
            bounds: { x: Math.min(...xs), y: Math.min(...ys), width: Math.max(...xs) - Math.min(...xs), height: Math.max(...ys) - Math.min(...ys) },
            area: area,
            wallIds: wallIds,
            efficiency: 100,
            ceilingHeight: existingRoom?.ceilingHeight,
            color: existingRoom?.color,
            noTexture: existingRoom?.noTexture || false
          } as any);
        }
      }
    });

    return rooms;
  };

  const getRoomPolygonPoints = (room: Room) => {
    if (room.wallIds && room.wallIds.length > 0) {
      const roomWalls = floorPlanLayout.walls.filter((w) => room.wallIds!.includes(w.id));
      if (roomWalls.length > 0) {
        const points: { x: number; y: number }[] = [];
        const unvisited = [...roomWalls];
        
        let currentWall = unvisited.shift()!;
        points.push({ ...currentWall.start });
        let currentPoint = currentWall.end;
        points.push({ ...currentPoint });

        while (unvisited.length > 0) {
          const nextWallIdx = unvisited.findIndex(w => 
            (Math.abs(w.start.x - currentPoint.x) < 0.1 && Math.abs(w.start.y - currentPoint.y) < 0.1) ||
            (Math.abs(w.end.x - currentPoint.x) < 0.1 && Math.abs(w.end.y - currentPoint.y) < 0.1)
          );

          if (nextWallIdx !== -1) {
            const nextWall = unvisited.splice(nextWallIdx, 1)[0]!;
            if (Math.abs(nextWall.start.x - currentPoint.x) < 0.1 && Math.abs(nextWall.start.y - currentPoint.y) < 0.1) {
              currentPoint = nextWall.end;
            } else {
              currentPoint = nextWall.start;
            }
            if (unvisited.length > 0 || (points[0] && Math.hypot(currentPoint.x - points[0].x, currentPoint.y - points[0].y) > 0.1)) {
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
      { x: rx, y: ry + rh }
    ];
  };

  const handleWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    const stage = e.target.getStage();
    if (!stage) return;

    const { stageX, stageY, stageScale: oldScale } = useEditorStore.getState();
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const mousePointTo = {
      x: (pointer.x - stageX) / oldScale,
      y: (pointer.y - stageY) / oldScale,
    };
    
    const scaleBy = 1.15;
    const newScale = e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy;
    const limitedScale = Math.max(0.15, Math.min(8, newScale)); 

    setStageViewport(
      limitedScale,
      pointer.x - mousePointTo.x * limitedScale,
      pointer.y - mousePointTo.y * limitedScale
    );
  };

  const handleFurnitureRotate = (objId: string, deltaAngle: number) => {
    const obj = sceneObjects.find(o => o.id === objId);
    if (!obj) return;
    updateSceneObject(objId, {
      rotation: { ...obj.rotation, y: obj.rotation.y + deltaAngle }
    });
  };

  const handleResizeWall2D = (wallId: string, newLengthFt: number) => {
    if (isNaN(newLengthFt) || newLengthFt <= 0.5) return;
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
    const newRooms = detectAllRooms(snappedWalls);
    setFloorPlan({ ...layout, walls: snappedWalls, rooms: newRooms });
  };

  const handleWallEndpointDrag = (
    wallId: string,
    isStart: boolean,
    newXMeters: number,
    newYMeters: number,
    isDragEnd: boolean,
    shiftKey?: boolean,
    altKey?: boolean
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
    const draggedWall = floorPlanLayout.walls.find(w => w.id === wallId);
    if (!draggedWall) return;

    const originalPos = isStart ? draggedWall.start : draggedWall.end;

    const connectedPoints: { wallId: string; isStart: boolean }[] = [];
    if (!altKey) {
      (floorPlanLayout.walls || []).forEach((w) => {
        if (w.id === wallId) return;
        if (Math.hypot(w.start.x - originalPos.x, w.start.y - originalPos.y) < 0.05) {
          connectedPoints.push({ wallId: w.id, isStart: true });
        }
        if (Math.hypot(w.end.x - originalPos.x, w.end.y - originalPos.y) < 0.05) {
          connectedPoints.push({ wallId: w.id, isStart: false });
        }
      });
    }

    // 3. Update walls in layout
    const updatedWalls = floorPlanLayout.walls.map((w) => {
      let nextWall = { ...w };
      let modified = false;

      if (w.id === wallId) {
        if (isStart) {
          nextWall.start = { x: newXFt, y: newYFt };
        } else {
          nextWall.end = { x: newXFt, y: newYFt };
        }
        modified = true;
      }

      if (!altKey && connectedPoints.length > 0) {
        const matchStart = connectedPoints.find(cp => cp.wallId === w.id && cp.isStart);
        if (matchStart) {
          nextWall.start = { x: newXFt, y: newYFt };
          modified = true;
        }
        const matchEnd = connectedPoints.find(cp => cp.wallId === w.id && !cp.isStart);
        if (matchEnd) {
          nextWall.end = { x: newXFt, y: newYFt };
          modified = true;
        }
      }

      return nextWall;
    });

    if (isDragEnd) {
      const wallsChanged = JSON.stringify(floorPlanLayout.walls.map(w => ({ id: w.id, start: w.start, end: w.end }))) !== 
                           JSON.stringify(updatedWalls.map(w => ({ id: w.id, start: w.start, end: w.end })));
      if (wallsChanged) {
        const snappedWalls = snapCloseWallEndpoints(updatedWalls);
        const newRooms = detectAllRooms(snappedWalls);
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
    shiftKey?: boolean
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
      const posChanged = Math.abs(obj.position.x - x) > 0.001 || Math.abs(obj.position.z - z) > 0.001;
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

  const handleStageClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (e.evt.button === 1 || e.evt.button === 2) return; // Middle or Right click

    const stage = e.target.getStage();
    if (!stage) return;
    const ptMeters = getStagePointerMeters(stage);
    if (!ptMeters) return;
    const ptFeet = { x: metersToFeet(ptMeters.x), y: metersToFeet(ptMeters.y) };

    const isCreationMode = ["draw-wall", "add-room", "place-furniture", "measure"].includes(tool);
    
    // Select Object Logic
    if (tool === "select") {
      // Find what was clicked. We can use e.target.id() if we set it, or just rely on react-konva events.
      if (e.target === stage || e.target.name() === "master-group" || e.target.name() === "grid-bg") {
        setSelectedObject(null);
      }
      return; // Handled by onClick of individual items
    }

    const layout = useEditorStore.getState().floorPlanLayout;
    if (!layout) return;

    if (tool === "draw-wall") {
      // Snap to nearby wall endpoint first, otherwise snap to 0.5ft grid
      let snapPt = { x: Math.round(ptFeet.x * 2) / 2, y: Math.round(ptFeet.y * 2) / 2 };
      if (!e.evt.shiftKey) {
        const snappedEp = snapToWallEndpoints(ptFeet, layout.walls, 0.8);
        if (snappedEp.x !== ptFeet.x || snappedEp.y !== ptFeet.y) {
          snapPt = snappedEp;
        }
      }
      
      if (!drawingWallStart) {
        setDrawingWallStart(snapPt);
        setDrawingMousePos(snapPt);
      } else {
        const newWall = {
          id: `wall-${Date.now()}`,
          start: drawingWallStart,
          end: e.evt.shiftKey ? ptFeet : snapPt, // If shift, free draw, otherwise snap
          thickness: 6,
          height: 10,
          isLoadBearing: false,
        };

        const allWalls = [...layout.walls, newWall];
        const snappedWalls = snapCloseWallEndpoints(allWalls);
        const newRooms = detectAllRooms(snappedWalls);

        setFloorPlan({
          ...layout,
          walls: snappedWalls,
          rooms: newRooms
        });

        // Set next wall start to the snapped end point of the placed wall
        const snappedNewWall = snappedWalls.find(w => w.id === newWall.id);
        const nextStart = snappedNewWall ? snappedNewWall.end : newWall.end;
        setDrawingWallStart(nextStart);
        setDrawingMousePos(nextStart);
      }
    } else if (tool === "place-furniture") {
      // Spawn a default 3-seater sofa if clicked on canvas
      const newObj = {
        id: `furnish-sofa-${Date.now()}`,
        type: "furniture" as const,
        name: "Sofa 3-Seater",
        position: { x: ptMeters.x, y: 0.1, z: ptMeters.y },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
        materialId: "color-#1f2937"
      };
      addSceneObject(newObj);
      setTool("select");
      toast.success("Placed default sofa.");
    } else if (tool === "measure") {
      if (!measureStart) {
        setMeasureStart(ptMeters);
        setDrawingMousePos(ptFeet);
      } else {
        const distMeters = Math.hypot(ptMeters.x - measureStart.x, ptMeters.y - measureStart.y);
        const distFeet = metersToFeet(distMeters);
        addDimensionLine({
          id: `dim-${Date.now()}`,
          start: { x: measureStart.x, y: 0, z: measureStart.y },
          end: { x: ptMeters.x, y: 0, z: ptMeters.y },
          label: `${distFeet.toFixed(1)} ft`,
        });
        setMeasureStart(null);
        setDrawingMousePos(null);
      }
    }
  };

  const handleStageMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
    const stage = e.target.getStage();
    if (!stage) return;
    const ptMeters = getStagePointerMeters(stage);

    if (!ptMeters) return;

    currentMousePosMetersRef.current = ptMeters;

    // Pan with middle mouse, right mouse, or camera tool
    if (e.evt.buttons === 4 || e.evt.buttons === 2 || tool === "camera") {
      const state = useEditorStore.getState();
      setStageViewport(
        state.stageScale,
        state.stageX + e.evt.movementX,
        state.stageY + e.evt.movementY
      );
      return;
    }

    if (dragContextRef.current) {
      const { type, id, startMeters, originalLayout } = dragContextRef.current;
      if (!originalLayout) return;
      hasDraggedRef.current = true;
      const dxFt = metersToFeet(ptMeters.x - startMeters.x);
      const dyFt = metersToFeet(ptMeters.y - startMeters.y);

      let updatedWalls = [...(originalLayout.walls || [])];

      if (type === "room-move") {
        const room = originalLayout.rooms.find(r => r.id === id);
        if (room && room.wallIds) {
          updatedWalls = updatedWalls.map(w => {
            if (room.wallIds!.includes(w.id)) {
              return { ...w, start: { x: w.start.x + dxFt, y: w.start.y + dyFt }, end: { x: w.end.x + dxFt, y: w.end.y + dyFt } };
            }
            return w;
          });
        }
      } else if (type === "wall-move") {
        const wall = originalLayout.walls.find(w => w.id === id);
        if (wall) {
          const isAttached = (p1: {x:number, y:number}, p2: {x:number, y:number}) => Math.hypot(p1.x - p2.x, p1.y - p2.y) < 0.1;
          updatedWalls = updatedWalls.map(w => {
            if (w.id === id) return { ...w, start: { x: w.start.x + dxFt, y: w.start.y + dyFt }, end: { x: w.end.x + dxFt, y: w.end.y + dyFt } };
            let newStart = w.start; let newEnd = w.end;
            if (isAttached(w.start, wall.start) || isAttached(w.start, wall.end)) newStart = { x: w.start.x + dxFt, y: w.start.y + dyFt };
            if (isAttached(w.end, wall.start) || isAttached(w.end, wall.end)) newEnd = { x: w.end.x + dxFt, y: w.end.y + dyFt };
            return { ...w, start: newStart, end: newEnd };
          });
        }
      } else if (type === "room-rotate") {
        const room = originalLayout.rooms.find(r => r.id === id);
        if (room && room.wallIds) {
          const cx = room.bounds.x + room.bounds.width / 2;
          const cy = room.bounds.y + room.bounds.height / 2;
          const startAngle = Math.atan2(metersToFeet(startMeters.y) - cy, metersToFeet(startMeters.x) - cx);
          const currAngle = Math.atan2(metersToFeet(ptMeters.y) - cy, metersToFeet(ptMeters.x) - cx);
          const angleDelta = currAngle - startAngle;
          
          updatedWalls = updatedWalls.map(w => {
            if (room.wallIds!.includes(w.id)) {
               const rot = (p: {x:number, y:number}) => {
                 const dx = p.x - cx; const dy = p.y - cy;
                 return { x: cx + dx * Math.cos(angleDelta) - dy * Math.sin(angleDelta), y: cy + dx * Math.sin(angleDelta) + dy * Math.cos(angleDelta) };
               }
               return { ...w, start: rot(w.start), end: rot(w.end) };
            }
            return w;
          });
        }
      } else if (type === "room-scale") {
        const room = originalLayout.rooms.find(r => r.id === id);
        if (room && room.wallIds) {
          const cx = room.bounds.x + room.bounds.width / 2;
          const cy = room.bounds.y + room.bounds.height / 2;
          const startDist = Math.hypot(metersToFeet(startMeters.x) - cx, metersToFeet(startMeters.y) - cy);
          const currDist = Math.hypot(metersToFeet(ptMeters.x) - cx, metersToFeet(ptMeters.y) - cy);
          const factor = startDist > 0 ? currDist / startDist : 1;
          
          updatedWalls = updatedWalls.map(w => {
            if (room.wallIds!.includes(w.id)) {
               const scl = (p: {x:number, y:number}) => ({ x: cx + (p.x - cx) * factor, y: cy + (p.y - cy) * factor });
               return { ...w, start: scl(w.start), end: scl(w.end) };
            }
            return w;
          });
        }
      } else if (type === "wall-rotate") {
        const wall = originalLayout.walls.find(w => w.id === id);
        if (wall) {
          const cx = (wall.start.x + wall.end.x) / 2;
          const cy = (wall.start.y + wall.end.y) / 2;
          const startAngle = Math.atan2(metersToFeet(startMeters.y) - cy, metersToFeet(startMeters.x) - cx);
          const currAngle = Math.atan2(metersToFeet(ptMeters.y) - cy, metersToFeet(ptMeters.x) - cx);
          const angleDelta = currAngle - startAngle;
          
          updatedWalls = updatedWalls.map(w => {
            if (w.id === id) {
               const rot = (p: {x:number, y:number}) => {
                 const dx = p.x - cx; const dy = p.y - cy;
                 return { x: cx + dx * Math.cos(angleDelta) - dy * Math.sin(angleDelta), y: cy + dx * Math.sin(angleDelta) + dy * Math.cos(angleDelta) };
               }
               return { ...w, start: rot(w.start), end: rot(w.end) };
            }
            return w;
          });
        }
      } else if (type === "wall-scale") {
        const wall = originalLayout.walls.find(w => w.id === id);
        if (wall) {
          const cx = (wall.start.x + wall.end.x) / 2;
          const cy = (wall.start.y + wall.end.y) / 2;
          const startDist = Math.hypot(metersToFeet(startMeters.x) - cx, metersToFeet(startMeters.y) - cy);
          const currDist = Math.hypot(metersToFeet(ptMeters.x) - cx, metersToFeet(ptMeters.y) - cy);
          const factor = startDist > 0 ? currDist / startDist : 1;
          
          updatedWalls = updatedWalls.map(w => {
            if (w.id === id) {
               const scl = (p: {x:number, y:number}) => ({ x: cx + (p.x - cx) * factor, y: cy + (p.y - cy) * factor });
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
    
    if (!drawingWallStart && !measureStart) return;
    // Snapping for live preview
    const ptFeet = { x: metersToFeet(ptMeters.x), y: metersToFeet(ptMeters.y) };
    let snapPt = { x: Math.round(ptFeet.x * 2) / 2, y: Math.round(ptFeet.y * 2) / 2 };
    
    if (!e.evt.shiftKey && tool === "draw-wall") {
      const layout = useEditorStore.getState().floorPlanLayout;
      if (layout) {
        const snappedEp = snapToWallEndpoints(ptFeet, layout.walls, 0.8);
        if (snappedEp.x !== ptFeet.x || snappedEp.y !== ptFeet.y) {
          snapPt = snappedEp;
        }
      }
    }

    if (tool === "draw-wall" || tool === "add-room") {
      setDrawingMousePos(e.evt.shiftKey ? ptFeet : snapPt);
    } else if (tool === "measure") {
      setDrawingMousePos(ptFeet);
    }
  };



  return (
    <div ref={containerRef} id="blueprint-container" className="w-full h-full bg-transparent overflow-hidden relative">
      <Stage
        width={stageSize.width}
        height={stageSize.height}
        onWheel={handleWheel}
        onClick={handleStageClick}
        onMouseMove={handleStageMouseMove}
        onMouseDown={(e) => {
          const isMiddleOrRight = e.evt.button === 1 || e.evt.button === 2;
          
          if (isMiddleOrRight) {
            document.body.style.cursor = 'grabbing';
            return;
          }

          const stage = e.target.getStage();
          if (!stage) return;
          const ptMeters = getStagePointerMeters(stage);
          if (!ptMeters) return;
          const snapPt = { x: Math.round(metersToFeet(ptMeters.x) * 2) / 2, y: Math.round(metersToFeet(ptMeters.y) * 2) / 2 };

          if (tool === "add-room") {
            setDrawingWallStart(snapPt);
            setDrawingMousePos(snapPt);
            return;
          }

          const isEmptySpace = e.target === stage || e.target.name() === "grid-bg" || e.target.name() === "master-group";
          const isLeftClickOnEmpty = e.evt.button === 0 && isEmptySpace && tool === "select";

          if (isLeftClickOnEmpty) {
            document.body.style.cursor = 'grabbing';
          }
        }}
        onMouseUp={(e) => {
          if (dragContextRef.current) {
            const layout = useEditorStore.getState().floorPlanLayout;
            if (layout && hasDraggedRef.current) {
              const snappedWalls = snapCloseWallEndpoints(layout.walls);
              const newRooms = detectAllRooms(snappedWalls);
              useEditorStore.temporal.getState().resume();
              setFloorPlan({ ...layout, walls: snappedWalls, rooms: newRooms });
            } else {
              useEditorStore.temporal.getState().resume();
            }
            dragContextRef.current = null;
            hasDraggedRef.current = false;
            document.body.style.cursor = 'default';
            return;
          }

          document.body.style.cursor = 'default';

          if (tool === "add-room" && drawingWallStart && drawingMousePos) {
            const minX = Math.min(drawingWallStart.x, drawingMousePos.x);
            const maxX = Math.max(drawingWallStart.x, drawingMousePos.x);
            const minY = Math.min(drawingWallStart.y, drawingMousePos.y);
            const maxY = Math.max(drawingWallStart.y, drawingMousePos.y);

            if (maxX - minX >= 2 && maxY - minY >= 2) { // Minimum 2x2 room
              const walls: Wall[] = [
                { id: `wall-ar1-${Date.now()}`, start: { x: minX, y: minY }, end: { x: maxX, y: minY }, thickness: 6, height: 10, isLoadBearing: false },
                { id: `wall-ar2-${Date.now()}`, start: { x: maxX, y: minY }, end: { x: maxX, y: maxY }, thickness: 6, height: 10, isLoadBearing: false },
                { id: `wall-ar3-${Date.now()}`, start: { x: maxX, y: maxY }, end: { x: minX, y: maxY }, thickness: 6, height: 10, isLoadBearing: false },
                { id: `wall-ar4-${Date.now()}`, start: { x: minX, y: maxY }, end: { x: minX, y: minY }, thickness: 6, height: 10, isLoadBearing: false }
              ];
              const layout = useEditorStore.getState().floorPlanLayout;
              if (layout) {
                const allWalls = [...layout.walls, ...walls];
                const snappedWalls = snapCloseWallEndpoints(allWalls);
                const newRooms = detectAllRooms(snappedWalls);
                setFloorPlan({
                  ...layout,
                  walls: snappedWalls,
                  rooms: newRooms
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
        onContextMenu={(e) => e.evt.preventDefault()}
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
            ref={masterGroupRef}
            x={useEditorStore.getState().stageX}
            y={useEditorStore.getState().stageY}
            scaleX={useEditorStore.getState().stageScale}
            scaleY={useEditorStore.getState().stageScale}
          >
            {/* Grid — 1 ft spacing in world feet, drawn in meter world-space */}
            <Group>
              {(() => {
                const grid = [];
                // Draw every 1 foot. Convert to meters for world coords.
                const range = 60;                  // ±60 feet visible
                const rangeM = feetToMeters(range);
                for (let ft = -range; ft <= range; ft++) {
                  const pos = feetToMeters(ft);
                  const isMajor = ft % 5 === 0;   // every 5 ft is a heavier line
                  const isAxis  = ft === 0;
                  const stroke  = isAxis
                    ? "rgba(91, 106, 240, 0.5)"
                    : isMajor
                      ? "rgba(91, 106, 240, 0.18)"
                      : "rgba(100, 116, 139, 0.1)";
                  const sw = isAxis ? 1.5 / SCALE : isMajor ? 1.0 / SCALE : 0.6 / SCALE;
                  const dash: number[] = isAxis ? [] : isMajor ? [] : [3 / SCALE, 3 / SCALE];
                  grid.push(
                    <KonvaLine
                      key={`v-${ft}`}
                      points={[pos, -rangeM, pos, rangeM]}
                      stroke={stroke}
                      strokeWidth={sw}
                      dash={dash}
                    />
                  );
                  grid.push(
                    <KonvaLine
                      key={`h-${ft}`}
                      points={[-rangeM, pos, rangeM, pos]}
                      stroke={stroke}
                      strokeWidth={sw}
                      dash={dash}
                    />
                  );
                }
                return grid;
              })()}
            </Group>

            {/* Elements */}
            <Group scaleX={SCALE} scaleY={SCALE}>
              
              {/* Preview Lines for Wall Drawing */}
              {drawingWallStart && drawingMousePos && tool === "draw-wall" && (() => {
                const sx = feetToMeters(drawingWallStart.x);
                const sy = feetToMeters(drawingWallStart.y);
                const ex = feetToMeters(drawingMousePos.x);
                const ey = feetToMeters(drawingMousePos.y);
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
                      stroke="#5B6AF0"
                      strokeWidth={4 / SCALE}
                      dash={[5 / SCALE, 5 / SCALE]}
                    />
                    {lenFeet > 0.5 && (
                      <Group x={mx} y={my} rotation={angleDeg}>
                        <Rect
                          x={-badgeW / 2} y={-badgeH / 2} width={badgeW} height={badgeH}
                          fill="#ffffff" stroke="#5B6AF0" strokeWidth={2 / SCALE} cornerRadius={0.06}
                        />
                        <Text
                          text={`${lenFeet.toFixed(1)} ft`}
                          x={-badgeW / 2} y={-0.12} width={badgeW} align="center"
                          fontSize={11 / SCALE} fontFamily="monospace" fill="#5B6AF0" fontStyle="bold"
                        />
                      </Group>
                    )}
                  </Group>
                );
              })()}

              {/* Preview Rect for Add Room */}
              {drawingWallStart && drawingMousePos && tool === "add-room" && (
                <Rect
                  x={feetToMeters(Math.min(drawingWallStart.x, drawingMousePos.x))}
                  y={feetToMeters(Math.min(drawingWallStart.y, drawingMousePos.y))}
                  width={feetToMeters(Math.abs(drawingWallStart.x - drawingMousePos.x))}
                  height={feetToMeters(Math.abs(drawingWallStart.y - drawingMousePos.y))}
                  fill="rgba(91, 106, 240, 0.15)"
                  stroke="#5B6AF0"
                  strokeWidth={2 / SCALE}
                  dash={[5 / SCALE, 5 / SCALE]}
                />
              )}

              {/* Preview Line for Measurement */}
              {measureStart && drawingMousePos && tool === "measure" && (() => {
                const sx = measureStart.x;
                const sy = measureStart.y;
                const ex = feetToMeters(drawingMousePos.x);
                const ey = feetToMeters(drawingMousePos.y);
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
                      stroke="#FFD700"
                      strokeWidth={3 / SCALE}
                      dash={[5 / SCALE, 5 / SCALE]}
                    />
                    {lenFeet > 0.1 && (
                      <Group x={mx} y={my} rotation={angleDeg}>
                        <Rect
                          x={-badgeW / 2} y={-badgeH / 2} width={badgeW} height={badgeH}
                          fill="#ffffff" stroke="#FFD700" strokeWidth={2 / SCALE} cornerRadius={0.06}
                        />
                        <Text
                          text={`${lenFeet.toFixed(1)} ft`}
                          x={-badgeW / 2} y={-0.12} width={badgeW} align="center"
                          fontSize={11 / SCALE} fontFamily="monospace" fill="#eab308" fontStyle="bold"
                        />
                      </Group>
                    )}
                  </Group>
                );
              })()}

              {/* Draw Rooms */}
              {(floorPlanLayout.rooms || []).map((room) => {
                const polygonPoints = getRoomPolygonPoints(room);
                const flatPoints = polygonPoints.flatMap((p) => [feetToMeters(p.x), feetToMeters(p.y)]);
                const cx = polygonPoints.reduce((sum, p) => sum + p.x, 0) / polygonPoints.length;
                const cy = polygonPoints.reduce((sum, p) => sum + p.y, 0) / polygonPoints.length;
                const cxM = feetToMeters(cx);
                const cyM = feetToMeters(cy);
                const preciseAreaFt = calculatePolygonAreaFt(polygonPoints);
                const isSelected = selectedObjectId === room.id;

                return (
                  <Group
                    key={room.id}
                    onClick={(e) => {
                      e.cancelBubble = true;
                      setSelectedObject(room.id);
                    }}
                    onMouseDown={(e) => {
                      if (tool === "select") {
                        const stage = e.target.getStage();
                        const pt = getStagePointerMeters(stage!);
                        if (pt) {
                          const layout = useEditorStore.getState().floorPlanLayout;
                          if (layout) {
                            useEditorStore.temporal.getState().pause();
                            dragContextRef.current = { type: "room-move", id: room.id, startMeters: pt, originalLayout: layout };
                          }
                          e.cancelBubble = true;
                        }
                      }
                    }}
                  >
                    {/* Selection and Border Layer */}
                    <KonvaLine
                      points={flatPoints}
                      fill={isSelected ? "rgba(91, 106, 240, 0.1)" : "rgba(91, 106, 240, 0.02)"}
                      stroke={isSelected ? "#3b82f6" : "#5B6AF0"}
                      strokeWidth={isSelected ? 3.5 / SCALE : 1.5 / SCALE}
                      closed
                    />
                    <Text
                      text={`${room.label}\n${preciseAreaFt.toFixed(0)} sqft`}
                      x={cxM - 1} 
                      y={cyM - 0.4}
                      width={2}
                      align="center"
                      fontSize={13 / SCALE}
                      fill={isSelected ? "#1d4ed8" : "#1e293b"}
                      fontStyle="bold"
                      fontFamily="sans-serif"
                    />

                    {/* Room Rotate Gizmo */}
                    {isSelected && tool === "select" && (() => {
                      const topY = cyM - feetToMeters(room.bounds.height / 2);
                      const rx = cxM;
                      const ry = topY - 0.6;
                      return (
                        <Group
                          x={rx} y={ry}
                          onMouseDown={(e) => {
                            const stage = e.target.getStage();
                            const pt = getStagePointerMeters(stage!);
                            if (pt) {
                              const layout = useEditorStore.getState().floorPlanLayout;
                              if (layout) {
                                useEditorStore.temporal.getState().pause();
                                dragContextRef.current = { type: "room-rotate", id: room.id, startMeters: pt, originalLayout: layout };
                              }
                              e.cancelBubble = true;
                            }
                          }}
                        >
                          {/* Stem line from room top to rotate handle */}
                          <KonvaLine
                            points={[0, 0, 0, 0.6]}
                            stroke="#8b5cf6"
                            strokeWidth={1.5 / SCALE}
                          />
                          <Circle radius={14/SCALE} fill="#8b5cf6" stroke="#fff" strokeWidth={2/SCALE} />
                          <Text text="↻" x={-6/SCALE} y={-6/SCALE} fontSize={12/SCALE} fill="#fff" />
                        </Group>
                      );
                    })()}

                    {/* Room Scale Gizmo */}
                    {isSelected && tool === "select" && (
                      <Group
                        x={cxM + feetToMeters(room.bounds.width/2)} y={cyM + feetToMeters(room.bounds.height/2)}
                        onMouseDown={(e) => {
                          const stage = e.target.getStage();
                          const pt = getStagePointerMeters(stage!);
                          if (pt) {
                            const layout = useEditorStore.getState().floorPlanLayout;
                            if (layout) {
                              useEditorStore.temporal.getState().pause();
                              dragContextRef.current = { type: "room-scale", id: room.id, startMeters: pt, originalLayout: layout };
                            }
                            e.cancelBubble = true;
                          }
                        }}
                      >
                        <Circle radius={12/SCALE} fill="#3b82f6" stroke="#fff" strokeWidth={2/SCALE} />
                        <Text text="⤡" x={-5/SCALE} y={-5/SCALE} fontSize={11/SCALE} fill="#fff" />
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

                if (name.includes("sofa")) { width = 2.0; height = 0.8; } 
                else if (name.includes("bed")) { width = 1.6; height = 2.0; }
                else if (name.includes("round")) { width = 1.2; height = 1.2; isCircle = true; }
                else if (name.includes("table") || name.includes("desk")) { width = 1.6; height = 0.8; }
                else if (name.includes("sideboard") || name.includes("bookcase")) { width = 1.2; height = 0.5; }
                else if (name.includes("plant") || name.includes("vase")) { width = 0.4; height = 0.4; isCircle = true; }

                return (
                  <Group
                    key={obj.id}
                    x={obj.position.x}
                    y={obj.position.z}
                    rotation={(obj.rotation.y || 0) * 180 / Math.PI}
                    draggable={tool === "select"}
                    onClick={(e) => {
                      e.cancelBubble = true;
                      setSelectedObject(obj.id);
                    }}
                    onDragStart={() => useEditorStore.temporal.getState().pause()}
                    onDragMove={(e) => {
                      if (e.target.name() === 'furniture-group') {
                        handleFurnitureDrag(obj.id, e.target.x(), e.target.y(), false, e.evt?.shiftKey);
                      }
                    }}
                    onDragEnd={(e) => {
                      if (e.target.name() === 'furniture-group') {
                        handleFurnitureDrag(obj.id, e.target.x(), e.target.y(), true, e.evt?.shiftKey);
                      }
                    }}
                    name="furniture-group"
                  >
                    {isCircle ? (
                      <Circle
                        radius={width / 2}
                        fill="rgba(255, 255, 255, 0.01)"
                        stroke={isSelected ? "#2563eb" : "#5B6AF0"}
                        strokeWidth={isSelected ? 2 / SCALE : 1 / SCALE}
                      />
                    ) : (
                      <Rect
                        x={-width / 2}
                        y={-height / 2}
                        width={width}
                        height={height}
                        fill="rgba(255, 255, 255, 0.01)"
                        stroke={isSelected ? "#2563eb" : "#5B6AF0"}
                        strokeWidth={isSelected ? 2 / SCALE : 1 / SCALE}
                        cornerRadius={0.06}
                      />
                    )}
                    
                    {/* SVG Top-down stylization fallback */}
                    {!obj.thumbnailUrl && !isCircle && name.includes("chair") && (
                      <Path
                        x={-width/4} y={-height/4}
                        data="M0 0 H 0.4 V 0.4 H 0 Z"
                        stroke="#5B6AF0" strokeWidth={1/SCALE}
                      />
                    )}
                    
                    <Text
                      text={obj.name}
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
                        onDragStart={() => useEditorStore.temporal.getState().pause()}
                        onDragMove={(e) => {
                          // Simple rot dragging logic based on pointer
                          const stage = e.target.getStage();
                          if (stage) {
                             const pt = getStagePointerMeters(stage);
                             if (pt) {
                               const angle = Math.atan2(pt.y - obj.position.z, pt.x - obj.position.x);
                               updateSceneObject(obj.id, { rotation: { ...obj.rotation, y: angle + Math.PI/2 }});
                             }
                          }
                          e.target.x(0); e.target.y(-height/2 - 0.4);
                        }}
                        onDragEnd={(e) => {
                          useEditorStore.temporal.getState().resume();
                          const stage = e.target.getStage();
                          if (stage) {
                             const pt = getStagePointerMeters(stage);
                             if (pt) {
                               const angle = Math.atan2(pt.y - obj.position.z, pt.x - obj.position.x);
                               updateSceneObject(obj.id, { rotation: { ...obj.rotation, y: angle + Math.PI/2 }});
                             }
                          }
                          e.target.x(0); e.target.y(-height/2 - 0.4);
                        }}
                      >
                        <KonvaLine points={[0, 0, 0, 0.4]} stroke="#2563eb" strokeWidth={1/SCALE} />
                        <Circle radius={0.12} fill="#2563eb" />
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
                const thickness = feetToMeters(wall.thickness / 12);
                const wallLengthFt = Math.hypot(wall.end.x - wall.start.x, wall.end.y - wall.start.y);
                
                const angleRad = Math.atan2(ey - sy, ex - sx);
                let angleDeg = angleRad * (180 / Math.PI);
                if (angleDeg > 90 || angleDeg < -90) angleDeg += 180;

                const mx = (sx + ex) / 2 - Math.sin(angleRad) * 0.5;
                const my = (sy + ey) / 2 + Math.cos(angleRad) * 0.5;
                const badgeW = 1.15;
                const badgeH = 0.45;

                const isWallDirectlySelected = selectedObjectId === wall.id;
                const selectedRoom = (floorPlanLayout.rooms || []).find(r => r.id === selectedObjectId);
                const isWallPartOfSelectedRoom = selectedRoom?.wallIds?.includes(wall.id) || false;
                const isSelected = isWallDirectlySelected || isWallPartOfSelectedRoom;

                return (
                  <Group 
                    key={wall.id}
                    name="wall-group"
                    onClick={() => setSelectedObject(wall.id)}
                    onMouseDown={(e) => {
                      if (tool === "select") {
                        const stage = e.target.getStage();
                        const pt = getStagePointerMeters(stage!);
                        const targetName = e.target.name();
                        if (pt && (targetName === "wall-body" || targetName === "wall-group")) {
                          const layout = useEditorStore.getState().floorPlanLayout;
                          if (layout) {
                            useEditorStore.temporal.getState().pause();
                            dragContextRef.current = { type: "wall-move", id: wall.id, startMeters: pt, originalLayout: layout };
                          }
                          e.cancelBubble = true;
                        }
                      }
                    }}
                  >
                    <KonvaLine
                      name="wall-body"
                      points={getWallPolygon(wall, (floorPlanLayout.walls || []))}
                      closed
                      fill={wall.isLoadBearing ? "#1e293b" : "#475569"}
                      stroke={isWallDirectlySelected ? "#2563eb" : isWallPartOfSelectedRoom ? "rgba(37, 99, 235, 0.6)" : "transparent"}
                      strokeWidth={isWallDirectlySelected ? 3.5/SCALE : isWallPartOfSelectedRoom ? 2.5/SCALE : 0}
                      lineJoin="miter"
                    />


                    {/* Endpoints */}
                    <Circle
                      x={sx} y={sy} radius={7 / SCALE}
                      fill="#ffffff" stroke={isSelected ? "#2563eb" : "#5B6AF0"} strokeWidth={2 / SCALE}
                      draggable
                      onDragStart={() => useEditorStore.temporal.getState().pause()}
                      onDragMove={(e) => handleWallEndpointDrag(wall.id, true, e.target.x(), e.target.y(), false, e.evt?.shiftKey, e.evt?.altKey)}
                      onDragEnd={(e) => handleWallEndpointDrag(wall.id, true, e.target.x(), e.target.y(), true, e.evt?.shiftKey, e.evt?.altKey)}
                    />
                    <Circle
                      x={ex} y={ey} radius={7 / SCALE}
                      fill="#ffffff" stroke={isSelected ? "#2563eb" : "#5B6AF0"} strokeWidth={2 / SCALE}
                      draggable
                      onDragStart={() => useEditorStore.temporal.getState().pause()}
                      onDragMove={(e) => handleWallEndpointDrag(wall.id, false, e.target.x(), e.target.y(), false, e.evt?.shiftKey, e.evt?.altKey)}
                      onDragEnd={(e) => handleWallEndpointDrag(wall.id, false, e.target.x(), e.target.y(), true, e.evt?.shiftKey, e.evt?.altKey)}
                    />

                    {/* Dimension Badge */}
                    <Group x={mx} y={my} rotation={angleDeg}>
                      <Rect
                        x={-badgeW / 2} y={-badgeH / 2} width={badgeW} height={badgeH}
                        fill="#ffffff" stroke="#5B6AF0" strokeWidth={2 / SCALE} cornerRadius={0.06}
                        onClick={(e) => {
                          e.cancelBubble = true;
                          const val = prompt(`Enter new wall length (in feet):`, wallLengthFt.toFixed(1));
                          if (val) handleResizeWall2D(wall.id, parseFloat(val));
                        }}
                      />
                      <Text
                        text={`${wallLengthFt.toFixed(1)} ft`}
                        x={-badgeW / 2} y={-0.12} width={badgeW} align="center"
                        fontSize={11 / SCALE} fontFamily="monospace" fill="#1e1b4b" fontStyle="bold"
                      />
                    </Group>

                    {/* Wall Rotate Gizmo */}
                    {isWallDirectlySelected && tool === "select" && (() => {
                      const wallAngle = Math.atan2(ey - sy, ex - sx);
                      const perpAngle = wallAngle + Math.PI / 2;
                      const offsetDist = 0.6; // 0.6 meters offset
                      const rx = mx + Math.cos(perpAngle) * offsetDist;
                      const ry = my + Math.sin(perpAngle) * offsetDist;
                      return (
                        <Group
                          x={rx} y={ry}
                          onMouseDown={(e) => {
                            const stage = e.target.getStage();
                            const pt = getStagePointerMeters(stage!);
                             if (pt) {
                              const layout = useEditorStore.getState().floorPlanLayout;
                              if (layout) {
                                useEditorStore.temporal.getState().pause();
                                dragContextRef.current = { type: "wall-rotate", id: wall.id, startMeters: pt, originalLayout: layout };
                              }
                              e.cancelBubble = true;
                            }
                          }}
                        >
                          <KonvaLine
                            points={[0, 0, -Math.cos(perpAngle) * offsetDist, -Math.sin(perpAngle) * offsetDist]}
                            stroke="#8b5cf6"
                            strokeWidth={1.5 / SCALE}
                          />
                          <Circle radius={12/SCALE} fill="#8b5cf6" stroke="#fff" strokeWidth={1.5/SCALE} />
                          <Text text="↻" x={-5/SCALE} y={-5/SCALE} fontSize={10/SCALE} fill="#fff" />
                        </Group>
                      );
                    })()}

                    {/* Wall Scale Gizmo */}
                    {isWallDirectlySelected && tool === "select" && (() => {
                      const wallAngle = Math.atan2(ey - sy, ex - sx);
                      const sx_h = ex + Math.cos(wallAngle) * 0.35;
                      const sy_h = ey + Math.sin(wallAngle) * 0.35;
                      return (
                        <Group
                          x={sx_h} y={sy_h}
                          onMouseDown={(e) => {
                            const stage = e.target.getStage();
                            const pt = getStagePointerMeters(stage!);
                             if (pt) {
                              const layout = useEditorStore.getState().floorPlanLayout;
                              if (layout) {
                                useEditorStore.temporal.getState().pause();
                                dragContextRef.current = { type: "wall-scale", id: wall.id, startMeters: pt, originalLayout: layout };
                              }
                              e.cancelBubble = true;
                            }
                          }}
                        >
                          <KonvaLine
                            points={[0, 0, -Math.cos(wallAngle) * 0.35, -Math.sin(wallAngle) * 0.35]}
                            stroke="#3b82f6"
                            strokeWidth={1.5 / SCALE}
                            dash={[2 / SCALE, 2 / SCALE]}
                          />
                          <Circle radius={12/SCALE} fill="#3b82f6" stroke="#fff" strokeWidth={1.5/SCALE} />
                          <Text text="⤡" x={-5/SCALE} y={-5/SCALE} fontSize={10/SCALE} fill="#fff" />
                        </Group>
                      );
                    })()}

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
                      stroke={isSelected ? "#3b82f6" : "#FFD700"}
                      strokeWidth={(isSelected ? 3 : 2) / SCALE}
                      dash={[5 / SCALE, 5 / SCALE]}
                    />
                    <Text
                      text={dim.label}
                      x={(dim.start.x + dim.end.x) / 2}
                      y={(dim.start.z + dim.end.z) / 2 - 0.5}
                      fontSize={14 / SCALE}
                      fill={isSelected ? "#3b82f6" : "#FFD700"}
                    />
                  </Group>
                );
              })}

            </Group>
          </Group>
        </Layer>
      </Stage>
      
      <div className="absolute bottom-6 left-6 text-slate-700 font-mono text-[10px] tracking-wider pointer-events-none select-none bg-white/95 px-4.5 py-2.5 rounded-xl border border-slate-200/80 backdrop-blur-md shadow-[0_4px_20px_rgba(0,0,0,0.06)] flex flex-col gap-1 z-10">
        <span className="font-bold text-slate-800 uppercase tracking-widest block border-b border-slate-100 pb-1 mb-1">
          Planner 5D CAD Editor controls:
        </span>
        <span>• DRAG endpoints to stretch walls (auto-connects when close).</span>
        <span>• Hold ALT while dragging endpoint to DISCONNECT it from corners.</span>
        <span>• CLICK & DRAG empty space to pan, or use MIDDLE MOUSE.</span>
        <span>• SELECT walls/furniture, press DELETE to remove.</span>
        <span>• SHIFT-CLICK to draw perfectly straight walls.</span>
      </div>
    </div>
  );
}
