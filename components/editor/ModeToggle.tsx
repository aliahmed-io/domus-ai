"use client";
import { useEditorStore } from "@/store/useEditorStore";
export default function ModeToggle() {
  const mode = useEditorStore((s) => s.mode),
    setMode = useEditorStore((s) => s.setMode);
  return (
    <div className="editor-mode-toggle" aria-label="Plan view">
      <button
        type="button"
        aria-pressed={mode === "2d"}
        onClick={() => setMode("2d")}
      >
        2D Plan
      </button>
      <button
        type="button"
        aria-pressed={mode !== "2d"}
        onClick={() => setMode("3d")}
      >
        3D View
      </button>
    </div>
  );
}
