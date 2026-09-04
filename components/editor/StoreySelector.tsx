"use client";

import React, { useState } from "react";
import { useEditorStore } from "@/store/useEditorStore";
import { useShallow } from "zustand/react/shallow";
import { Layers, Plus, Copy, Trash2, Eye, EyeOff, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";

export default function StoreySelector() {
  const {
    storeys,
    activeStoreyId,
    setActiveStoreyId,
    addStorey,
    duplicateActiveStorey,
    removeStorey,
    toggleStoreyVisibility,
  } = useEditorStore(
    useShallow((s) => ({
      storeys: s.storeys,
      activeStoreyId: s.activeStoreyId,
      setActiveStoreyId: s.setActiveStoreyId,
      addStorey: s.addStorey,
      duplicateActiveStorey: s.duplicateActiveStorey,
      removeStorey: s.removeStorey,
      toggleStoreyVisibility: s.toggleStoreyVisibility,
    }))
  );

  const [expanded, setExpanded] = useState(false);

  // If no storeys are initialized yet, display default Level 1
  const displayStoreys = storeys && storeys.length > 0
    ? storeys
    : [{ id: "storey-1", name: "Level 1 - Ground", elevation: 0, isVisible: true }];

  // Find active storey
  const activeStorey = displayStoreys.find((s) => s.id === activeStoreyId) || displayStoreys[0];

  // Reverse so highest elevation is rendered at the top of the stack
  const sortedStoreys = [...displayStoreys].sort((a, b) => b.elevation - a.elevation);

  const handleAddFloor = (duplicate = false) => {
    if (duplicate) {
      duplicateActiveStorey();
      toast.success("Duplicated floor plan to new level.");
    } else {
      addStorey();
      toast.success("Added new blank level.");
    }
  };

  const handleRemoveFloor = (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation();
    if (displayStoreys.length <= 1) {
      toast.error("Cannot delete the only level.");
      return;
    }
    removeStorey(id);
    toast.success(`Removed ${name}.`);
  };

  const handleToggleVisibility = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    toggleStoreyVisibility(id);
  };

  return (
    <div className="relative pointer-events-auto">
      {/* ── Compact Header Button ── */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-white/95 dark:bg-[#1E1B18]/95 border border-[#E7E2DA] dark:border-[#38332E] backdrop-blur-xl shadow-[0_4px_20px_rgba(44,38,33,0.08)] hover:border-[#C2A585] transition-all outline-none select-none group"
      >
        <div className="w-6 h-6 rounded-lg bg-[#2C2621] text-[#FAF8F5] flex items-center justify-center text-xs font-bold shadow-sm">
          <Layers size={13} />
        </div>
        <div className="flex flex-col text-left">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#8C7662] font-semibold">
            Storey Stack
          </span>
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-[#2C2621] dark:text-[#FAF8F5]">
              {activeStorey?.name || "Level 1"}
            </span>
            <span className="text-[10px] font-mono text-[#8C7662]">
              +{activeStorey?.elevation.toFixed(0)}′
            </span>
          </div>
        </div>
        {expanded ? (
          <ChevronUp size={14} className="text-[#8C7662] ml-1" />
        ) : (
          <ChevronDown size={14} className="text-[#8C7662] ml-1" />
        )}
      </button>

      {/* ── Expanded Storey Drawer ── */}
      {expanded && (
        <div className="absolute top-full left-0 mt-2 w-72 bg-white/95 dark:bg-[#1E1B18]/95 border border-[#E7E2DA] dark:border-[#38332E] backdrop-blur-2xl rounded-2xl p-3 shadow-[0_12px_36px_rgba(44,38,33,0.14)] z-50 flex flex-col gap-2 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex items-center justify-between px-1 pb-1.5 border-b border-[#E7E2DA]/80 dark:border-[#38332E]/80">
            <span className="text-[11px] font-semibold tracking-wide uppercase font-mono text-[#8C7662]">
              Building Levels ({displayStoreys.length})
            </span>
            <span className="text-[10px] font-mono text-[#A8A29E]">Floor-to-Floor 10′</span>
          </div>

          {/* Storey Items List (Top floor on top) */}
          <div className="flex flex-col gap-1.5 max-h-60 overflow-y-auto pr-0.5">
            {sortedStoreys.map((storey) => {
              const isActive = storey.id === (activeStoreyId || displayStoreys[0]?.id);
              const isVisible = storey.isVisible !== false;

              return (
                <div
                  key={storey.id}
                  onClick={() => {
                    setActiveStoreyId(storey.id);
                  }}
                  className={`flex items-center justify-between p-2 rounded-xl cursor-pointer transition-all border text-xs ${
                    isActive
                      ? "bg-[#2C2621] text-[#FAF8F5] border-[#2C2621] shadow-sm"
                      : "bg-[#FAF8F5]/80 dark:bg-[#282420]/80 text-[#2C2621] dark:text-[#EAE7E2] border-[#E7E2DA] dark:border-[#38332E] hover:border-[#C2A585]"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`w-6 h-6 rounded-md flex items-center justify-center font-mono font-bold text-[11px] ${
                        isActive
                          ? "bg-[#C2A585] text-[#2C2621]"
                          : "bg-slate-200/80 dark:bg-stone-700/80 text-stone-700 dark:text-stone-200"
                      }`}
                    >
                      L{storey.elevation / 10 + 1}
                    </span>
                    <div className="flex flex-col">
                      <span className="font-semibold text-xs leading-tight">{storey.name}</span>
                      <span
                        className={`text-[10px] font-mono ${
                          isActive ? "text-[#C2A585]" : "text-[#8C7662]"
                        }`}
                      >
                        +{storey.elevation.toFixed(1)} ft elevation
                      </span>
                    </div>
                  </div>

                  {/* Actions (Toggle 3D Visibility, Delete) */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => handleToggleVisibility(e, storey.id)}
                      className={`p-1 rounded-md transition-colors ${
                        isActive
                          ? "hover:bg-white/20 text-[#FAF8F5]"
                          : "hover:bg-black/10 text-[#8C7662]"
                      }`}
                      title={isVisible ? "Hide in 3D" : "Show in 3D"}
                    >
                      {isVisible ? <Eye size={13} /> : <EyeOff size={13} className="opacity-50" />}
                    </button>

                    {displayStoreys.length > 1 && (
                      <button
                        onClick={(e) => handleRemoveFloor(e, storey.id, storey.name)}
                        className={`p-1 rounded-md transition-colors ${
                          isActive
                            ? "hover:bg-red-500/30 text-red-200"
                            : "hover:bg-red-500/10 text-red-500"
                        }`}
                        title="Delete Level"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom Action Buttons: Add Floor & Duplicate */}
          <div className="pt-2 border-t border-[#E7E2DA]/80 dark:border-[#38332E]/80 flex gap-2">
            <button
              onClick={() => handleAddFloor(false)}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-xl bg-[#C2A585]/15 hover:bg-[#C2A585]/25 border border-[#C2A585]/40 text-[#5A4A3A] dark:text-[#EAE7E2] font-semibold text-[11px] transition-all outline-none"
            >
              <Plus size={13} />
              <span>New Floor</span>
            </button>
            <button
              onClick={() => handleAddFloor(true)}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-xl bg-[#2C2621] hover:bg-[#3D352E] text-[#FAF8F5] font-semibold text-[11px] transition-all outline-none shadow-sm"
            >
              <Copy size={12} />
              <span>Duplicate</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

