"use client";

import React, { useCallback } from "react";
import {
  PenTool,
  Square,
  Armchair,
  Ruler,
  Undo,
  Redo,
  DoorOpen,
  Grid2X2,
  Footprints,
} from "lucide-react";
import * as Popover from "@radix-ui/react-dialog";
import ViewSettings from "./ViewSettings";
import { useStore } from "zustand";
import { useEditorStore } from "@/store/useEditorStore";
import { useShallow } from "zustand/react/shallow";
import type { EditorTool } from "@/types/puter";
import { toast } from "sonner";
import ModeToggle from "./ModeToggle";

export default function Toolbar({
  onToggleProject,
  projectOpen,
}: {
  onToggleProject: () => void;
  projectOpen: boolean;
}) {
  const mode = useEditorStore((state) => state.mode);
  const catalogOpen = useEditorStore((state) => state.catalogOpen);
  const setCatalogOpen = useEditorStore((state) => state.setCatalogOpen);
  const {
    tool,
    setTool,
    selectedObjectId,
    setSelectedObject,
    deleteSelected,
    clearWorkspace,
  } = useEditorStore(
    useShallow((s) => ({
      tool: s.tool,
      setTool: s.setTool,
      selectedObjectId: s.selectedObjectId,
      setSelectedObject: s.setSelectedObject,
      deleteSelected: s.deleteSelected,
      clearWorkspace: s.clearWorkspace,
    })),
  );

  // Subscribe to temporal spatial layout state history actions
  const undo = useEditorStore((state) => state.undoDocument);
  const redo = useEditorStore((state) => state.redoDocument);
  const { pastStates, futureStates } = useStore(
    useEditorStore.temporal,
    (s) => s,
  );

  const handleDelete = useCallback(() => {
    if (!selectedObjectId) return;
    deleteSelected();
    toast.success("Deleted selected element.");
  }, [selectedObjectId, deleteSelected]);

  const handleClearAll = () => {
    if (
      confirm(
        "Are you sure you want to clear the entire workspace? You can undo with Ctrl+Z.",
      )
    ) {
      clearWorkspace();
      toast.success("Workspace cleared.");
    }
  };

  // Setup standard professional CAD keyboard layout shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (useEditorStore.getState().mode === "walk") return;
      const activeEl = document.activeElement;
      // Do not trigger shortcuts if typing inside inputs or textareas
      if (
        activeEl &&
        (activeEl.tagName === "INPUT" ||
          activeEl.tagName === "TEXTAREA" ||
          activeEl.tagName === "SELECT" ||
          (activeEl instanceof HTMLElement && activeEl.isContentEditable))
      ) {
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
      } else if (e.key.toLowerCase() === "o" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setTool("add-door");
        setSelectedObject(null);
      } else if (e.key.toLowerCase() === "i" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setTool("add-window");
        setSelectedObject(null);
      } else if (e.key.toLowerCase() === "s" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setTool("add-stair");
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
      {
        id: "draw-wall",
        icon: PenTool,
        label: "Draw Structural Wall",
        shortcut: "W",
      },
      {
        id: "add-room",
        icon: Square,
        label: "Add Room Boundary",
        shortcut: "F",
      },
      {
        id: "add-door",
        icon: DoorOpen,
        label: "Insert Door Opening",
        shortcut: "O",
      },
      {
        id: "add-window",
        icon: Grid2X2,
        label: "Insert Glazed Window",
        shortcut: "I",
      },
      {
        id: "add-stair",
        icon: Footprints,
        label: "Insert Staircase",
        shortcut: "S",
      },
    ],
    [
      {
        id: "place-furniture",
        icon: Armchair,
        label: "Insert Furniture Asset",
        shortcut: "A",
      },
      { id: "measure", icon: Ruler, label: "Measure Distance", shortcut: "D" },
    ],
  ];

  return (
    <header className="editor-command-bar" aria-label="Editor controls">
      <div className="editor-command-left">
        <button
          type="button"
          className="editor-add-button"
          aria-expanded={catalogOpen}
          onClick={() => setCatalogOpen(!catalogOpen)}
        >
          Add to plan
        </button>
        {mode === "2d" && (
          <button
            type="button"
            className="editor-text-button"
            aria-label="Draw Structural Wall"
            aria-pressed={tool === "draw-wall"}
            onClick={() => {
              setTool(tool === "draw-wall" ? "select" : "draw-wall");
              setSelectedObject(null);
            }}
          >
            Wall
          </button>
        )}
        <Popover.Root modal={false}>
          <Popover.Trigger asChild>
            <button type="button" className="editor-text-button">
              Tools
            </button>
          </Popover.Trigger>
          <Popover.Portal>
            <Popover.Content className="editor-tools-menu">
              <Popover.Title>Draw and edit</Popover.Title>
              <Popover.Description className="sr-only">
                Choose a drawing tool or an editing action.
              </Popover.Description>
              {toolGroups
                .flat()
                .filter((item) => item.id !== "draw-wall")
                .map((item) => (
                  <Popover.Close asChild key={item.id}>
                    <button
                      type="button"
                      aria-label={item.label}
                      onClick={() => {
                        setTool(item.id);
                        setSelectedObject(null);
                        if (item.id === "place-furniture") setCatalogOpen(true);
                        if (item.id !== "place-furniture")
                          useEditorStore.getState().setMode("2d");
                      }}
                    >
                      {item.label}
                      <kbd>{item.shortcut}</kbd>
                    </button>
                  </Popover.Close>
                ))}
              <Popover.Close asChild>
                <button
                  type="button"
                  onClick={() => {
                    useEditorStore.getState().setMode("2d");
                    useEditorStore.getState().requestPlanFit();
                  }}
                >
                  Fit plan to screen
                </button>
              </Popover.Close>
              <details className="editor-drawing-help">
                <summary>Keyboard shortcuts</summary>
                <p>
                  W: walls. F: rooms. O: doors. I: windows. D: measure. Escape:
                  finish drawing. Drag empty space to pan. Hold Alt while
                  dragging an endpoint to disconnect it.
                </p>
              </details>
              <button
                type="button"
                disabled={!selectedObjectId}
                onClick={handleDelete}
              >
                Delete selected
              </button>
              <button type="button" onClick={handleClearAll}>
                Clear plan
              </button>
            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>
      </div>
      <ModeToggle />
      <div className="editor-command-right">
        <button
          type="button"
          className="editor-icon-button"
          aria-label="Undo last change"
          onClick={() => undo()}
          disabled={!pastStates.length}
        >
          <Undo size={17} />
        </button>
        <button
          type="button"
          className="editor-icon-button"
          aria-label="Redo change"
          onClick={() => redo()}
          disabled={!futureStates.length}
        >
          <Redo size={17} />
        </button>
        <ViewSettings />
        <button
          type="button"
          className="editor-text-button"
          aria-label={
            projectOpen ? "Close project panel" : "Open project panel"
          }
          aria-expanded={projectOpen}
          onClick={onToggleProject}
        >
          Project
        </button>
      </div>
    </header>
  );
}
