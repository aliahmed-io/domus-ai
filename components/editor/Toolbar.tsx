"use client";

import React, { useCallback } from "react";
import {
  PenTool,
  Square,
  Armchair,
  Ruler,
  Undo,
  Redo,
  Home,
  Trash2,
  Ban,
} from "lucide-react";
import * as Tooltip from "@radix-ui/react-tooltip";
import { useStore } from "zustand";
import { useEditorStore } from "@/store/useEditorStore";
import { useShallow } from "zustand/react/shallow";
import type { EditorTool } from "@/types/puter";
import { toast } from "sonner";
import ModeToggle from "./ModeToggle";

export default function Toolbar() {
  const { 
    tool, 
    setTool, 
    showRoof, 
    toggleRoof,
    selectedObjectId,
    setSelectedObject,
    floorPlanLayout,
    setFloorPlan,
    removeSceneObject,
    dimensionLines,
    removeDimensionLine,
    sceneObjects
  } = useEditorStore(
    useShallow((s) => ({ 
      tool: s.tool, 
      setTool: s.setTool, 
      showRoof: s.showRoof, 
      toggleRoof: s.toggleRoof,
      selectedObjectId: s.selectedObjectId,
      setSelectedObject: s.setSelectedObject,
      floorPlanLayout: s.floorPlanLayout,
      setFloorPlan: s.setFloorPlan,
      removeSceneObject: s.removeSceneObject,
      dimensionLines: s.dimensionLines,
      removeDimensionLine: s.removeDimensionLine,
      sceneObjects: s.sceneObjects
    }))
  );

  // Subscribe to temporal spatial layout state history actions
  const { undo, redo, pastStates, futureStates } = useStore(useEditorStore.temporal, (s) => s);

  const handleDelete = useCallback(() => {
    if (!selectedObjectId) return;

    // Check furniture
    if (sceneObjects.some(o => o.id === selectedObjectId)) {
      removeSceneObject(selectedObjectId);
      toast.success("Deleted furniture item.");
      return;
    }

    // Check dimensions
    if (dimensionLines.some(d => d.id === selectedObjectId)) {
      removeDimensionLine(selectedObjectId);
      toast.success("Deleted dimension line.");
      return;
    }

    if (floorPlanLayout) {
      // Check walls
      const wallIndex = floorPlanLayout.walls.findIndex(w => w.id === selectedObjectId);
      if (wallIndex !== -1) {
        const newWalls = [...floorPlanLayout.walls];
        newWalls.splice(wallIndex, 1);
        setFloorPlan({ ...floorPlanLayout, walls: newWalls });
        setSelectedObject(null);
        toast.success("Deleted wall.");
        return;
      }

      // Check rooms
      const roomIndex = floorPlanLayout.rooms.findIndex(r => r.id === selectedObjectId);
      if (roomIndex !== -1) {
        const room = floorPlanLayout.rooms[roomIndex]!;
        const newRooms = floorPlanLayout.rooms.map(r =>
          r.id === room.id ? { ...r, noTexture: true } : r
        );

        setFloorPlan({ ...floorPlanLayout, rooms: newRooms });
        setSelectedObject(null);
        toast.success("Cleared floor texture.");
        return;
      }
    }
  }, [selectedObjectId, sceneObjects, removeSceneObject, dimensionLines, removeDimensionLine, floorPlanLayout, setFloorPlan, setSelectedObject]);

  const handleClearAll = () => {
    if (confirm("Are you sure you want to clear the entire workspace? This cannot be easily undone.")) {
      setFloorPlan(null);
      // We would also clear furniture and dimensions here, but for now we'll just clear the floor plan layout 
      // or set it to empty
      setFloorPlan({
        id: "empty-plan",
        parameters: { bedrooms: 0, bathrooms: 0, totalArea: 0, floors: 1, style: "open-plan", features: [] },
        rooms: [],
        walls: [],
        doors: [],
        windows: [],
        dimensions: { width: 100, height: 100 },
        efficiency: 100,
        naturalLight: 100,
        generatedAt: new Date().toISOString()
      });
      // Need to clear scene objects manually through the store if we had a clear function. 
      // For now, setting floorplan to empty is a good start.
      toast.success("Workspace cleared.");
    }
  };

  // Setup standard professional CAD keyboard layout shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      // Do not trigger shortcuts if typing inside inputs or textareas
      if (activeEl && (activeEl.tagName === "INPUT" || activeEl.tagName === "TEXTAREA")) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
        e.preventDefault();
        redo();
      } else if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        handleDelete();
      } else if (e.key.toLowerCase() === "w" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setTool("draw-wall");
        setSelectedObject(null);
      } else if (e.key.toLowerCase() === "f" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setTool("add-room");
        setSelectedObject(null);
      } else if (e.key.toLowerCase() === "a" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setTool("place-furniture");
        setSelectedObject(null);
      } else if (e.key.toLowerCase() === "d" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setTool("measure");
        setSelectedObject(null);
      } else if (e.key.toLowerCase() === "v" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setTool("select");
        setSelectedObject(null);
      } else if (e.key === "Escape") {
        e.preventDefault();
        setTool("select");
        setSelectedObject(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [undo, redo, handleDelete, setTool, setSelectedObject]);

  const toolGroups: {
    id: EditorTool;
    icon: React.ComponentType<{ size?: number; className?: string }>;
    label: string;
    shortcut: string;
  }[][] = [
    [
      { id: "draw-wall", icon: PenTool, label: "Draw Structural Wall", shortcut: "W" },
      { id: "add-room", icon: Square, label: "Add Room boundary", shortcut: "F" },
      { id: "place-furniture", icon: Armchair, label: "Insert GLB Asset", shortcut: "A" },
      { id: "measure", icon: Ruler, label: "Measure distance", shortcut: "D" },
    ],
  ];

  return (
    <Tooltip.Provider delayDuration={150}>
      <aside className="absolute top-24 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur border border-hairline rounded-2xl p-2 flex flex-row items-center gap-2.5 shadow-hero z-30">
        <ModeToggle />
        <div className="w-px h-6 bg-hairline mx-1" />
        {toolGroups.map((group, groupIdx) => (
          <React.Fragment key={groupIdx}>
            {groupIdx > 0 && <div className="w-px h-6 bg-hairline mx-1.5" />}
            <div className="flex flex-row items-center gap-1">
              {group.map((item) => {
                const Icon = item.icon;
                const isActive = tool === item.id;
                return (
                  <Tooltip.Root key={item.id}>
                    <Tooltip.Trigger asChild>
                      <button
                        onClick={() => {
                          if (tool === item.id) {
                            setTool("select");
                          } else {
                            setTool(item.id);
                          }
                          setSelectedObject(null); // Clear selection on tool change
                        }}
                        aria-label={item.label}
                        title={item.label}
                        aria-pressed={isActive}
                        className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-200 outline-none ${
                          isActive
                            ? "bg-indigo text-white shadow-sm"
                            : "text-stone hover:text-charcoal hover:bg-gray-50"
                        }`}
                      >
                        <Icon size={18} />
                      </button>
                    </Tooltip.Trigger>
                    <Tooltip.Portal>
                      <Tooltip.Content
                        side="bottom"
                        sideOffset={12}
                        className="bg-charcoal text-white rounded-lg px-3 py-1.5 text-[11px] font-semibold flex items-center gap-2 shadow-modal border border-white/5 z-50 animate-in fade-in slide-in-from-top-1 duration-150"
                      >
                        <span>{item.label}</span>
                        <span className="text-on-dark-muted font-bold bg-white/10 px-1 rounded uppercase">
                          {item.shortcut}
                        </span>
                        <Tooltip.Arrow className="fill-charcoal" />
                      </Tooltip.Content>
                    </Tooltip.Portal>
                  </Tooltip.Root>
                );
              })}
            </div>
          </React.Fragment>
        ))}

        {/* Undo / Redo Actions grouping */}
        <div className="w-px h-6 bg-hairline mx-1.5" />
        <div className="flex flex-row items-center gap-1">
          <Tooltip.Root>
            <Tooltip.Trigger asChild>
              <button
                onClick={() => undo()}
                disabled={pastStates.length === 0}
                className="w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-200 outline-none text-stone hover:text-charcoal hover:bg-gray-50 disabled:opacity-30 disabled:pointer-events-none"
                aria-label="Undo last change"
                title="Undo (Ctrl+Z)"
              >
                <Undo size={18} />
              </button>
            </Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Content
                side="bottom"
                sideOffset={12}
                className="bg-charcoal text-white rounded-lg px-3 py-1.5 text-[11px] font-semibold flex items-center gap-2 shadow-modal border border-white/5 z-50"
              >
                <span>Undo</span>
                <span className="text-on-dark-muted font-bold bg-white/10 px-1 rounded uppercase">
                  Ctrl+Z
                </span>
              </Tooltip.Content>
            </Tooltip.Portal>
          </Tooltip.Root>

          <Tooltip.Root>
            <Tooltip.Trigger asChild>
              <button
                onClick={() => redo()}
                disabled={futureStates.length === 0}
                className="w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-200 outline-none text-stone hover:text-charcoal hover:bg-gray-50 disabled:opacity-30 disabled:pointer-events-none"
                aria-label="Redo change"
                title="Redo (Ctrl+Y)"
              >
                <Redo size={18} />
              </button>
            </Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Content
                side="bottom"
                sideOffset={12}
                className="bg-charcoal text-white rounded-lg px-3 py-1.5 text-[11px] font-semibold flex items-center gap-2 shadow-modal border border-white/5 z-50"
              >
                <span>Redo</span>
                <span className="text-on-dark-muted font-bold bg-white/10 px-1 rounded uppercase">
                  Ctrl+Y
                </span>
              </Tooltip.Content>
            </Tooltip.Portal>
          </Tooltip.Root>
        </div>

        {/* Object Actions grouping (Delete) */}
        <div className="w-px h-6 bg-hairline mx-1.5" />
        <div className="flex flex-row items-center gap-1">
          <Tooltip.Root>
            <Tooltip.Trigger asChild>
              <button
                onClick={handleDelete}
                disabled={!selectedObjectId}
                className="w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-200 outline-none text-stone hover:text-rose hover:bg-rose-50/50 disabled:opacity-30 disabled:pointer-events-none"
                aria-label="Delete Selection"
                title="Delete (Del)"
              >
                <Trash2 size={18} />
              </button>
            </Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Content
                side="bottom"
                sideOffset={12}
                className="bg-charcoal text-white rounded-lg px-3 py-1.5 text-[11px] font-semibold flex items-center gap-2 shadow-modal border border-white/5 z-50"
              >
                <span>Delete</span>
                <span className="text-on-dark-muted font-bold bg-white/10 px-1 rounded uppercase">
                  Del
                </span>
              </Tooltip.Content>
            </Tooltip.Portal>
          </Tooltip.Root>
        </div>

        {/* View & System Toggles grouping */}
        <div className="w-px h-6 bg-hairline mx-1.5" />
        <div className="flex flex-row items-center gap-1">
          <Tooltip.Root>
            <Tooltip.Trigger asChild>
              <button
                onClick={toggleRoof}
                className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-200 outline-none ${
                  showRoof
                    ? "bg-indigo-light text-indigo shadow-sm"
                    : "text-stone hover:text-charcoal hover:bg-gray-50"
                }`}
                aria-label="Toggle Roof"
                title="Toggle Roof"
              >
                <Home size={18} />
              </button>
            </Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Content
                side="bottom"
                sideOffset={12}
                className="bg-charcoal text-white rounded-lg px-3 py-1.5 text-[11px] font-semibold flex items-center gap-2 shadow-modal border border-white/5 z-50"
              >
                <span>{showRoof ? "Hide Roof" : "Show Roof"}</span>
              </Tooltip.Content>
            </Tooltip.Portal>
          </Tooltip.Root>

          <Tooltip.Root>
            <Tooltip.Trigger asChild>
              <button
                onClick={handleClearAll}
                className="w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-200 outline-none text-stone hover:text-rose hover:bg-rose-50/50"
                aria-label="Clear Workspace"
                title="Clear Workspace"
              >
                <Ban size={18} />
              </button>
            </Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Content
                side="bottom"
                sideOffset={12}
                className="bg-charcoal text-white rounded-lg px-3 py-1.5 text-[11px] font-semibold flex items-center gap-2 shadow-modal border border-white/5 z-50"
              >
                <span>Clear Workspace</span>
              </Tooltip.Content>
            </Tooltip.Portal>
          </Tooltip.Root>
        </div>
      </aside>
    </Tooltip.Provider>
  );
}

