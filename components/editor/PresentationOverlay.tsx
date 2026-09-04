"use client";

import React, { useEffect } from "react";
import { useEditorStore } from "@/store/useEditorStore";
import { useShallow } from "zustand/react/shallow";
import { Eye, Share2, X, Maximize2, Compass } from "lucide-react";
import { toast } from "sonner";

export default function PresentationOverlay() {
  const { isPresentationMode, setPresentationMode, mode, setMode } = useEditorStore(
    useShallow((s) => ({
      isPresentationMode: s.isPresentationMode,
      setPresentationMode: s.setPresentationMode,
      mode: s.mode,
      setMode: s.setMode,
    }))
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isPresentationMode) {
        setPresentationMode(false);
        toast.info("Exited client presentation mode.");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPresentationMode, setPresentationMode]);

  if (!isPresentationMode) return null;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Client presentation link copied to clipboard!");
    } catch {
      toast.info("Link: " + window.location.href);
    }
  };

  return (
    <div className="absolute inset-0 pointer-events-none z-50 flex flex-col justify-between p-6">
      {/* Top Floating Cinema HUD */}
      <div className="flex items-center justify-between pointer-events-auto">
        <div className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-dark-surface/90 border border-hairline-dark backdrop-blur-md shadow-hero text-xs text-white">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
          </span>
          <span className="font-bold tracking-wider uppercase text-[11px] text-zinc-200 flex items-center gap-1.5">
            <Eye size={13} className="text-indigo-400" />
            Client Showcase Mode
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {mode === "2d" && (
            <button
              onClick={() => setMode("3d")}
              className="px-3.5 py-2 rounded-full bg-dark-surface/90 border border-hairline-dark text-on-dark hover:text-white hover:bg-dark-surface-alt text-xs font-semibold backdrop-blur-md transition-all flex items-center gap-1.5 shadow-hero"
            >
              <Maximize2 size={13} />
              Switch to 3D View
            </button>
          )}

          <button
            onClick={handleCopyLink}
            className="px-3.5 py-2 rounded-full bg-dark-surface/90 border border-hairline-dark text-on-dark hover:text-white hover:bg-dark-surface-alt text-xs font-semibold backdrop-blur-md transition-all flex items-center gap-1.5 shadow-hero"
            title="Copy shareable link"
          >
            <Share2 size={13} className="text-indigo-400" />
            Share With Client
          </button>

          <button
            onClick={() => {
              setPresentationMode(false);
              toast.info("Exited presentation mode.");
            }}
            className="px-3.5 py-2 rounded-full bg-indigo hover:bg-indigo/90 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-hero"
            title="Exit showcase (Esc)"
          >
            <X size={14} />
            Exit (Esc)
          </button>
        </div>
      </div>

      {/* Bottom Subtle Digital Twin Watermark */}
      <div className="flex items-center justify-between pointer-events-auto">
        <div className="flex items-center gap-2 text-zinc-400 font-mono text-[10px] tracking-wider bg-dark-surface/80 px-3.5 py-1.5 rounded-full border border-hairline-dark/60 backdrop-blur-sm">
          <Compass size={11} className="text-amber-400" />
          <span>DOMUS SPATIAL ENGINE · CINEMATIC WALKTHROUGH</span>
        </div>
      </div>
    </div>
  );
}
