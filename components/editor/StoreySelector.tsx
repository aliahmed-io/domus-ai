"use client";

import React from "react";
import { useEditorStore } from "@/store/useEditorStore";
import { useShallow } from "zustand/react/shallow";
import { Layers } from "lucide-react";

export default function StoreySelector() {
  const { storeys, activeStoreyId, setActiveStoreyId } = useEditorStore(
    useShallow((s) => ({
      storeys: s.storeys,
      activeStoreyId: s.activeStoreyId,
      setActiveStoreyId: s.setActiveStoreyId,
    }))
  );

  if (!storeys || storeys.length <= 1) return null;

  return (
    <div className="absolute left-[360px] top-1/2 -translate-y-1/2 flex flex-col gap-2 z-20 pointer-events-auto">
      <div className="bg-white/80 border border-white/40 backdrop-blur-2xl rounded-3xl p-3 shadow-[0_8px_32px_rgba(0,0,0,0.08)] flex flex-col gap-2 select-none w-14 items-center">
        <div className="text-gold mb-1">
          <Layers size={18} />
        </div>
        {storeys.map((storey, index) => {
          const isActive = storey.id === activeStoreyId;
          // Sort reverse so highest floor is on top
          const levelName = storey.name || `L${storeys.length - index}`;
          return (
            <button
              key={storey.id}
              onClick={() => setActiveStoreyId(storey.id)}
              className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs transition-all outline-none ${
                isActive
                  ? "bg-indigo text-white shadow-button"
                  : "bg-dark-surface-alt border border-hairline-dark text-stone hover:text-white hover:border-indigo"
              }`}
              title={levelName}
            >
              {levelName.substring(0, 2)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
