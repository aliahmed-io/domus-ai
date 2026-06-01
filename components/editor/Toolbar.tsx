"use client";

import React from "react";
import {
  MousePointer,
  Move,
  RotateCw,
  Maximize2,
  PenTool,
  Square,
  Armchair,
  Ruler,
  Undo,
  Redo,
  Home,
} from "lucide-react";
import * as Tooltip from "@radix-ui/react-tooltip";
import { useStore } from "zustand";
import { useEditorStore } from "@/store/useEditorStore";
import { useShallow } from "zustand/react/shallow";
import type { EditorTool } from "@/types/puter";

export default function Toolbar() {
  const { tool, setTool, showRoof, toggleRoof } = useEditorStore(
    useShallow((s) => ({ tool: s.tool, setTool: s.setTool, showRoof: s.showRoof, toggleRoof: s.toggleRoof }))
  );

  // Subscribe to temporal spatial layout state history actions
  const { undo, redo, pastStates, futureStates } = useStore(useEditorStore.temporal, (s) => s);

  // Setup standard professional CAD keyboard layout shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      // Do not trigger undo/redo if typing inside inputs or textareas
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
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [undo, redo]);

  const toolGroups: {
    id: EditorTool;
    icon: React.ComponentType<{ size?: number; className?: string }>;
    label: string;
    shortcut: string;
  }[][] = [
    [
      { id: "select", icon: MousePointer, label: "Select Object", shortcut: "V" },
      { id: "move", icon: Move, label: "Move Mesh", shortcut: "M" },
      { id: "rotate", icon: RotateCw, label: "Rotate Mesh", shortcut: "R" },
      { id: "scale", icon: Maximize2, label: "Scale Mesh", shortcut: "S" },
    ],
    [
      { id: "draw-wall", icon: PenTool, label: "Draw Structural Wall", shortcut: "W" },
      { id: "add-room", icon: Square, label: "Add Room boundary", shortcut: "F" },
      { id: "place-furniture", icon: Armchair, label: "Insert GLB Asset", shortcut: "A" },
      { id: "measure", icon: Ruler, label: "Measure distance", shortcut: "D" },
    ],
  ];

  return (
    <Tooltip.Provider delayDuration={150}>
      <aside className="absolute top-6 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur border border-hairline rounded-2xl p-2 flex flex-row items-center gap-2.5 shadow-hero z-30">
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
                        onClick={() => setTool(item.id)}
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

        {/* View Toggles grouping */}
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
        </div>
      </aside>
    </Tooltip.Provider>
  );
}
