"use client";

import React from "react";
import { motion } from "framer-motion";
import { useEditorStore } from "@/store/useEditorStore";
import { useShallow } from "zustand/react/shallow";
import type { EditorMode } from "@/types/puter";

export default function ModeToggle() {
  const { mode, setMode } = useEditorStore(
    useShallow((s) => ({ mode: s.mode, setMode: s.setMode }))
  );

  const options: { id: EditorMode; label: string }[] = [
    { id: "2d", label: "2D Plan" },
    { id: "3d", label: "3D View" },
    { id: "ar", label: "WebXR AR" },
  ];

  return (
    <div className="bg-dark-surface/80 backdrop-blur-md border border-[#ffffff]/10 rounded-full p-1 flex gap-0.5 shadow-hero relative z-20">
      {options.map((opt) => {
        const isActive = mode === opt.id;
        return (
          <button
            key={opt.id}
            onClick={() => setMode(opt.id)}
            className={`relative px-4 py-1.5 rounded-full text-xs font-bold transition-colors select-none outline-none ${
              isActive ? "text-white" : "text-[#A1A1AA] hover:text-white"
            }`}
          >
            {isActive && (
              <motion.div
                layoutId="editor-mode-indicator"
                className="absolute inset-0 bg-indigo rounded-full -z-10 shadow-sm"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
            <span>{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
