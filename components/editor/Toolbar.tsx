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
} from "lucide-react";
import * as Tooltip from "@radix-ui/react-tooltip";
import { useEditorStore } from "@/store/useEditorStore";
import { useShallow } from "zustand/react/shallow";
import type { EditorTool } from "@/types/puter";

export default function Toolbar() {
  const { tool, setTool } = useEditorStore(
    useShallow((s) => ({ tool: s.tool, setTool: s.setTool }))
  );

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
      <aside className="absolute left-6 top-1/2 -translate-y-1/2 bg-white/95 backdrop-blur border border-hairline rounded-2xl p-2 flex flex-col gap-2.5 shadow-hero z-30">
        {toolGroups.map((group, groupIdx) => (
          <React.Fragment key={groupIdx}>
            {groupIdx > 0 && <div className="h-px bg-hairline mx-1.5" />}
            <div className="flex flex-col gap-1">
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
                        side="right"
                        sideOffset={12}
                        className="bg-charcoal text-white rounded-lg px-3 py-1.5 text-[11px] font-semibold flex items-center gap-2 shadow-modal border border-white/5 z-50 animate-in fade-in slide-in-from-left-1 duration-150"
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
      </aside>
    </Tooltip.Provider>
  );
}
