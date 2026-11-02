"use client";

import React, { useState } from "react";
import {
  Info,
  Layers,
  Palette,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  AlertTriangle,
  Move,
  Package,
  Trash2,
  RotateCw,
} from "lucide-react";
import { useEditorStore } from "@/store/useEditorStore";
import { useShallow } from "zustand/react/shallow";
import { PBR_PRESETS } from "@/lib/materials/pbr-preset-catalog";
import { toast } from "sonner";
import type {
  Material,
  ApiResult,
  RoomType,
  Door,
  Window2D,
  FloorMaterialType,
  Staircase,
} from "@/types/puter";

const SWATCHES = [
  { color: "#e3ded7", name: "Alabaster Drywall" },
  { color: "#8a7e72", name: "Walnut Trim" },
  { color: "#4f5d54", name: "Forest Siding" },
  { color: "#d9ab55", name: "Oak Herringbone" },
  { color: "#222222", name: "Obsidian Slate" },
];

const FLOOR_MATERIAL_OPTIONS: {
  value: FloorMaterialType;
  label: string;
  color: string;
}[] = [
  { value: "hardwood", label: "Oak Hardwood", color: "#C89D66" },
  { value: "tile", label: "Porcelain Tile", color: "#CBD5E1" },
  { value: "marble", label: "Carrara Marble", color: "#F1F5F9" },
  { value: "carpet", label: "Plush Carpet", color: "#D6D3D1" },
  { value: "concrete", label: "Polished Concrete", color: "#94A3B8" },
  { value: "terrazzo", label: "Venetian Terrazzo", color: "#E2D9D0" },
];

export default function PropertiesPanel() {
  const {
    selectedObjectId,
    sceneObjects,
    staircases,
    updateSceneObject,
    updateWall,
    updateDoor,
    updateWindow,
    updateRoom,
    updateStaircase,
    deleteSelected,
    bomReport,
    violations,
    floorPlanLayout,
    setMaterial,
  } = useEditorStore(
    useShallow((s) => ({
      selectedObjectId: s.selectedObjectId,
      sceneObjects: s.sceneObjects,
      staircases: s.staircases,
      updateSceneObject: s.updateSceneObject,
      updateWall: s.updateWall,
      updateDoor: s.updateDoor,
      updateWindow: s.updateWindow,
      updateRoom: s.updateRoom,
      updateStaircase: s.updateStaircase,
      deleteSelected: s.deleteSelected,
      bomReport: s.bomReport,
      violations: s.violations,
      floorPlanLayout: s.floorPlanLayout,
      setMaterial: s.setMaterial,
    })),
  );
  const [prompt, setPrompt] = useState("");
  const [isGeneratingMat, setIsGeneratingMat] = useState(false);
  const [activeMaterial, setActiveMaterial] = useState("Alabaster Drywall");

  // Collapsible panel sections
  const [showTransform, setShowTransform] = useState(true);
  const [showMaterial, setShowMaterial] = useState(true);
  const [showBOM, setShowBOM] = useState(true);
  const [showCompliance, setShowCompliance] = useState(true);

  const selectedSceneObj = sceneObjects.find((o) => o.id === selectedObjectId);
  const selectedWall = floorPlanLayout?.walls.find(
    (w) => w.id === selectedObjectId,
  );
  const selectedRoom = floorPlanLayout?.rooms.find(
    (r) => r.id === selectedObjectId,
  );
  const selectedDoor = floorPlanLayout?.doors.find(
    (d) => d.id === selectedObjectId,
  );
  const selectedWindow = floorPlanLayout?.windows.find(
    (w) => w.id === selectedObjectId,
  );
  const selectedStaircase = staircases.find((st) => st.id === selectedObjectId);

  const selectedType:
    | "furniture"
    | "wall"
    | "room"
    | "door"
    | "window"
    | "staircase"
    | null = selectedSceneObj
    ? "furniture"
    : selectedWall
      ? "wall"
      : selectedRoom
        ? "room"
        : selectedDoor
          ? "door"
          : selectedWindow
            ? "window"
            : selectedStaircase
              ? "staircase"
              : null;

  // Generative PBR texture creation via Replicate / Polyhaven APIs
  const handleGenerateMaterial = async () => {
    if (!prompt.trim() || !selectedObjectId) return;
    setIsGeneratingMat(true);
    toast.loading("Generating PBR texture via TRELLIS API...", {
      id: "gen-mat",
    });
    try {
      const response = await fetch("/api/materials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const result = (await response.json()) as ApiResult<Material>;
      if (!result.ok) {
        toast.error(result.error || "Failed to generate material.", {
          id: "gen-mat",
        });
      } else {
        const generatedMat = result.data;
        setMaterial(selectedObjectId, generatedMat);
        setActiveMaterial(generatedMat.name);

        if (selectedType === "wall") {
          updateWall(selectedObjectId, { materialId: generatedMat.id });
        } else if (selectedType === "furniture") {
          updateSceneObject(selectedObjectId, { materialId: generatedMat.id });
        }

        setPrompt("");
        toast.success(
          `Generated and applied PBR material: "${generatedMat.name}"`,
          { id: "gen-mat" },
        );
      }
    } catch (err) {
      console.error(err);
      toast.error("Error connecting to the generative material service.", {
        id: "gen-mat",
      });
    } finally {
      setIsGeneratingMat(false);
    }
  };

  return (
    <aside className="w-80 h-full bg-white border-l border-hairline flex flex-col shrink-0 overflow-y-auto select-none shadow-card z-20">
      {/* Property Header */}
      <div className="p-5 border-b border-hairline flex items-center justify-between">
        <h2 className="font-jakarta text-heading-xs font-700 text-charcoal flex items-center gap-2">
          <Info size={16} className="text-indigo" />
          <span>Properties</span>
        </h2>
        {selectedType && (
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-indigo-light text-indigo text-[10px] font-bold uppercase rounded-lg border border-indigo/10">
              {selectedType}
            </span>
            <button
              onClick={() => {
                deleteSelected();
                toast.success(`Deleted ${selectedType}`);
              }}
              className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors outline-none cursor-pointer"
              title="Delete Selected Element (Del)"
            >
              <Trash2 size={13} />
            </button>
          </div>
        )}
      </div>

      {/* Main panel body */}
      {!selectedType ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-stone">
          <Layers size={28} className="text-muted animate-pulse mb-3" />
          <h4 className="font-jakarta text-xs font-bold text-charcoal">
            No element selected
          </h4>
          <p className="font-body text-[11px] text-stone mt-1 max-w-[200px] leading-relaxed">
            Click on a wall, door, window, room, staircase, or 3D furniture item
            in the canvas to inspect and edit its parameters.
          </p>
        </div>
      ) : (
        <div className="flex flex-col">
          {/* ── 1. CONTEXTUAL ELEMENT PARAMETERS ─────────────────────────── */}
          <div className="border-b border-hairline">
            <button
              onClick={() => setShowTransform(!showTransform)}
              className="w-full flex items-center justify-between p-4 text-xs font-bold text-charcoal uppercase tracking-wider hover:bg-gray-50 transition-colors outline-none"
            >
              <span className="flex items-center gap-2">
                <Move size={14} className="text-stone" />
                <span>
                  {selectedType === "wall"
                    ? "Wall Parameters"
                    : selectedType === "door"
                      ? "Door Schedule & Swing"
                      : selectedType === "window"
                        ? "Window Glazing & Sill"
                        : selectedType === "room"
                          ? "Room Zone & Finish"
                          : selectedType === "staircase"
                            ? "Staircase Geometry"
                            : "Furniture Transform"}
                </span>
              </span>
              {showTransform ? (
                <ChevronUp size={14} />
              ) : (
                <ChevronDown size={14} />
              )}
            </button>

            {showTransform && selectedRoom && (
              <div className="px-5 pb-5 space-y-4">
                <div>
                  <label
                    htmlFor="inspector-field-0"
                    className="font-body text-[10px] font-bold text-stone uppercase tracking-wider block mb-1.5"
                  >
                    Room Label
                  </label>
                  <input
                    id="inspector-field-0"
                    type="text"
                    value={selectedRoom.label}
                    onChange={(e) =>
                      updateRoom(selectedRoom.id, { label: e.target.value })
                    }
                    className="px-3 py-1.5 w-full bg-alabaster border border-hairline rounded-lg text-charcoal font-medium text-xs outline-none focus:bg-white focus:border-indigo"
                  />
                </div>

                <div>
                  <label
                    htmlFor="inspector-field-1"
                    className="font-body text-[10px] font-bold text-stone uppercase tracking-wider block mb-1.5"
                  >
                    Room Type
                  </label>
                  <select
                    id="inspector-field-1"
                    value={selectedRoom.type}
                    onChange={(e) =>
                      updateRoom(selectedRoom.id, {
                        type: e.target.value as RoomType,
                      })
                    }
                    className="px-3 py-1.5 w-full bg-alabaster border border-hairline rounded-lg text-charcoal font-medium text-xs outline-none focus:bg-white focus:border-indigo"
                  >
                    <option value="living">Living Room</option>
                    <option value="bedroom">Bedroom</option>
                    <option value="bathroom">Bathroom</option>
                    <option value="kitchen">Kitchen</option>
                    <option value="dining">Dining Room</option>
                    <option value="hallway">Hallway</option>
                    <option value="office">Office</option>
                    <option value="garage">Garage</option>
                    <option value="storage">Storage</option>
                    <option value="unassigned">Unassigned</option>
                    <option value="utility">Utility</option>
                    <option value="outdoor">Outdoor Space</option>
                  </select>
                </div>

                <div>
                  <p className="font-body text-[10px] font-bold text-stone uppercase tracking-wider block mb-1.5">
                    Floor Finish Material
                  </p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {FLOOR_MATERIAL_OPTIONS.map((opt) => {
                      const isActive =
                        (selectedRoom.floorMaterial || "hardwood") ===
                        opt.value;
                      return (
                        <button
                          key={opt.value}
                          onClick={() =>
                            updateRoom(selectedRoom.id, {
                              floorMaterial: opt.value,
                            })
                          }
                          className={`px-2.5 py-1.5 rounded-lg border text-[10px] font-bold flex items-center gap-2 transition-all cursor-pointer ${
                            isActive
                              ? "border-indigo bg-indigo-light text-indigo"
                              : "border-hairline bg-alabaster text-charcoal hover:bg-gray-100"
                          }`}
                        >
                          <span
                            className="w-3 h-3 rounded-full border border-black/15 shrink-0"
                            style={{ backgroundColor: opt.color }}
                          />
                          <span className="truncate">{opt.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="inspector-field-2"
                    className="font-body text-[10px] font-bold text-stone uppercase tracking-wider block mb-1.5"
                  >
                    Ceiling Height (feet)
                  </label>
                  <input
                    id="inspector-field-2"
                    type="number"
                    step={0.5}
                    min={7}
                    max={24}
                    value={selectedRoom.ceilingHeight || 9}
                    onChange={(e) => {
                      if (
                        !Number.isFinite(e.currentTarget.valueAsNumber) ||
                        e.currentTarget.validity.rangeUnderflow ||
                        e.currentTarget.validity.rangeOverflow
                      )
                        return;
                      const h = parseFloat(e.target.value);
                      if (!isNaN(h) && h > 0) {
                        updateRoom(selectedRoom.id, { ceilingHeight: h });
                      }
                    }}
                    className="px-3 py-1.5 w-full bg-alabaster border border-hairline rounded-lg text-charcoal font-mono text-xs outline-none focus:bg-white focus:border-indigo"
                  />
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-hairline">
                  <span className="font-body text-[10px] font-bold text-stone uppercase tracking-wider">
                    Calculated Area
                  </span>
                  <span className="font-mono text-xs font-bold text-indigo">
                    {(selectedRoom.area || 0).toFixed(1)} sq ft
                  </span>
                </div>
              </div>
            )}

            {showTransform && selectedWall && (
              <div className="px-5 pb-5 space-y-4">
                <div>
                  <label
                    htmlFor="inspector-field-3"
                    className="font-body text-[10px] font-bold text-stone uppercase tracking-wider block mb-1.5"
                  >
                    Wall Length (feet)
                  </label>
                  <input
                    id="inspector-field-3"
                    type="number"
                    step={0.5}
                    value={Number(
                      Math.hypot(
                        selectedWall.end.x - selectedWall.start.x,
                        selectedWall.end.y - selectedWall.start.y,
                      ).toFixed(1),
                    )}
                    onChange={(e) => {
                      if (
                        !Number.isFinite(e.currentTarget.valueAsNumber) ||
                        e.currentTarget.validity.rangeUnderflow ||
                        e.currentTarget.validity.rangeOverflow
                      )
                        return;
                      const newLen = parseFloat(e.target.value);
                      if (!isNaN(newLen) && newLen > 0.5) {
                        const dx = selectedWall.end.x - selectedWall.start.x;
                        const dy = selectedWall.end.y - selectedWall.start.y;
                        const currentLen = Math.hypot(dx, dy);
                        if (currentLen > 0) {
                          const unitX = dx / currentLen;
                          const unitY = dy / currentLen;
                          updateWall(selectedWall.id, {
                            end: {
                              x: selectedWall.start.x + unitX * newLen,
                              y: selectedWall.start.y + unitY * newLen,
                            },
                          });
                        }
                      }
                    }}
                    className="px-3 py-1.5 w-full bg-alabaster border border-hairline rounded-lg text-charcoal font-mono text-xs outline-none focus:bg-white focus:border-indigo"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label
                      htmlFor="inspector-field-4"
                      className="font-body text-[10px] font-bold text-stone uppercase tracking-wider block mb-1.5"
                    >
                      Thickness (in)
                    </label>
                    <input
                      id="inspector-field-4"
                      type="number"
                      step={0.5}
                      min={2}
                      max={24}
                      value={selectedWall.thickness}
                      onChange={(e) => {
                        if (
                          !Number.isFinite(e.currentTarget.valueAsNumber) ||
                          e.currentTarget.validity.rangeUnderflow ||
                          e.currentTarget.validity.rangeOverflow
                        )
                          return;
                        const thickness = parseFloat(e.target.value);
                        if (!isNaN(thickness) && thickness >= 2) {
                          updateWall(selectedWall.id, { thickness });
                        }
                      }}
                      className="px-3 py-1.5 w-full bg-alabaster border border-hairline rounded-lg text-charcoal font-mono text-xs outline-none focus:bg-white focus:border-indigo"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="inspector-field-5"
                      className="font-body text-[10px] font-bold text-stone uppercase tracking-wider block mb-1.5"
                    >
                      Height (ft)
                    </label>
                    <input
                      id="inspector-field-5"
                      type="number"
                      step={0.5}
                      min={6}
                      max={24}
                      value={selectedWall.height}
                      onChange={(e) => {
                        if (
                          !Number.isFinite(e.currentTarget.valueAsNumber) ||
                          e.currentTarget.validity.rangeUnderflow ||
                          e.currentTarget.validity.rangeOverflow
                        )
                          return;
                        const height = parseFloat(e.target.value);
                        if (!isNaN(height) && height >= 4) {
                          updateWall(selectedWall.id, { height });
                        }
                      }}
                      className="px-3 py-1.5 w-full bg-alabaster border border-hairline rounded-lg text-charcoal font-mono text-xs outline-none focus:bg-white focus:border-indigo"
                    />
                  </div>
                </div>

                <div>
                  <p className="font-body text-[10px] font-bold text-stone uppercase tracking-wider block mb-1.5">
                    Wall Paint Color
                  </p>
                  <div className="flex items-center gap-2">
                    {[
                      "#FAF8F5",
                      "#E2DFD7",
                      "#CBD5E1",
                      "#94A3B8",
                      "#726555",
                      "#2C2621",
                    ].map((hex) => (
                      <button
                        key={hex}
                        onClick={() =>
                          updateWall(selectedWall.id, { color: hex })
                        }
                        className={`w-6 h-6 rounded-full border transition-all cursor-pointer ${
                          selectedWall.color === hex
                            ? "ring-2 ring-indigo ring-offset-1 scale-110"
                            : "border-hairline"
                        }`}
                        style={{ backgroundColor: hex }}
                        title={hex}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between py-1">
                  <span className="font-body text-[10px] font-bold text-stone uppercase tracking-wider">
                    Load Bearing Wall
                  </span>
                  <input
                    aria-label="Load Bearing Wall"
                    type="checkbox"
                    checked={selectedWall.isLoadBearing}
                    onChange={(e) =>
                      updateWall(selectedWall.id, {
                        isLoadBearing: e.target.checked,
                      })
                    }
                    className="w-4 h-4 text-indigo focus:ring-indigo border-hairline rounded accent-indigo"
                  />
                </div>
              </div>
            )}

            {showTransform && selectedDoor && (
              <div className="px-5 pb-5 space-y-4">
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label
                      htmlFor="inspector-field-6"
                      className="font-body text-[10px] font-bold text-stone uppercase tracking-wider block mb-1.5"
                    >
                      Width (in)
                    </label>
                    <input
                      id="inspector-field-6"
                      type="number"
                      step={2}
                      min={24}
                      max={96}
                      value={selectedDoor.width}
                      onChange={(e) => {
                        if (
                          !Number.isFinite(e.currentTarget.valueAsNumber) ||
                          e.currentTarget.validity.rangeUnderflow ||
                          e.currentTarget.validity.rangeOverflow
                        )
                          return;
                        const width = parseFloat(e.target.value);
                        if (!isNaN(width) && width >= 20) {
                          updateDoor(selectedDoor.id, { width });
                        }
                      }}
                      className="px-3 py-1.5 w-full bg-alabaster border border-hairline rounded-lg text-charcoal font-mono text-xs outline-none focus:bg-white focus:border-indigo"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="inspector-field-7"
                      className="font-body text-[10px] font-bold text-stone uppercase tracking-wider block mb-1.5"
                    >
                      Height (in)
                    </label>
                    <input
                      id="inspector-field-7"
                      type="number"
                      step={2}
                      min={72}
                      max={108}
                      value={selectedDoor.height || 80}
                      onChange={(e) => {
                        if (
                          !Number.isFinite(e.currentTarget.valueAsNumber) ||
                          e.currentTarget.validity.rangeUnderflow ||
                          e.currentTarget.validity.rangeOverflow
                        )
                          return;
                        const height = parseFloat(e.target.value);
                        if (!isNaN(height) && height >= 60) {
                          updateDoor(selectedDoor.id, { height });
                        }
                      }}
                      className="px-3 py-1.5 w-full bg-alabaster border border-hairline rounded-lg text-charcoal font-mono text-xs outline-none focus:bg-white focus:border-indigo"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="inspector-field-8"
                    className="font-body text-[10px] font-bold text-stone uppercase tracking-wider block mb-1.5"
                  >
                    Door Style
                  </label>
                  <select
                    id="inspector-field-8"
                    value={selectedDoor.doorType || "single"}
                    onChange={(e) =>
                      updateDoor(selectedDoor.id, {
                        doorType: e.target.value as NonNullable<
                          Door["doorType"]
                        >,
                      })
                    }
                    className="px-3 py-1.5 w-full bg-alabaster border border-hairline rounded-lg text-charcoal font-medium text-xs outline-none focus:bg-white focus:border-indigo"
                  >
                    <option value="single">Single Swing Leaf</option>
                    <option value="double">French Double Door</option>
                    <option value="sliding">Sliding Patio / Bypass</option>
                    <option value="pocket">Recessed Pocket Door</option>
                    <option value="bifold">Bi-Fold Closet Door</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label
                      htmlFor="inspector-field-9"
                      className="font-body text-[10px] font-bold text-stone uppercase tracking-wider block mb-1.5"
                    >
                      Hinge Side
                    </label>
                    <select
                      id="inspector-field-9"
                      value={selectedDoor.swingSide || "left"}
                      onChange={(e) =>
                        updateDoor(selectedDoor.id, {
                          swingSide: e.target.value as "left" | "right",
                        })
                      }
                      className="px-3 py-1.5 w-full bg-alabaster border border-hairline rounded-lg text-charcoal font-medium text-xs outline-none focus:bg-white focus:border-indigo"
                    >
                      <option value="left">Left Hinge</option>
                      <option value="right">Right Hinge</option>
                    </select>
                  </div>
                  <div>
                    <label
                      htmlFor="inspector-field-10"
                      className="font-body text-[10px] font-bold text-stone uppercase tracking-wider block mb-1.5"
                    >
                      Swing Direction
                    </label>
                    <select
                      id="inspector-field-10"
                      value={selectedDoor.swingDirection || "inward"}
                      onChange={(e) =>
                        updateDoor(selectedDoor.id, {
                          swingDirection: e.target.value as
                            | "inward"
                            | "outward",
                        })
                      }
                      className="px-3 py-1.5 w-full bg-alabaster border border-hairline rounded-lg text-charcoal font-medium text-xs outline-none focus:bg-white focus:border-indigo"
                    >
                      <option value="inward">Inward</option>
                      <option value="outward">Outward</option>
                    </select>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[10px] font-bold text-stone uppercase tracking-wider mb-1">
                    <span>Wall Position</span>
                    <span className="font-mono text-charcoal">
                      {Math.round(selectedDoor.position * 100)}%
                    </span>
                  </div>
                  <input
                    aria-label="Wall Position  %"
                    type="range"
                    min={0.1}
                    max={0.9}
                    step={0.02}
                    value={selectedDoor.position}
                    onChange={(e) =>
                      updateDoor(selectedDoor.id, {
                        position: parseFloat(e.target.value),
                      })
                    }
                    className="w-full accent-indigo"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[10px] font-bold text-stone uppercase tracking-wider mb-1">
                    <span>3D Swing Open Angle</span>
                    <span className="font-mono text-charcoal">
                      {Math.round((selectedDoor.openAngle ?? 0.5) * 90)}&deg;
                    </span>
                  </div>
                  <input
                    aria-label="3D Swing Open Angle  &deg;"
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={selectedDoor.openAngle ?? 0.5}
                    onChange={(e) =>
                      updateDoor(selectedDoor.id, {
                        openAngle: parseFloat(e.target.value),
                      })
                    }
                    className="w-full accent-indigo"
                  />
                </div>

                <div className="flex items-center justify-between py-1">
                  <span className="font-body text-[10px] font-bold text-stone uppercase tracking-wider">
                    Exterior Weatherproof Door
                  </span>
                  <input
                    aria-label="Exterior Weatherproof Door"
                    type="checkbox"
                    checked={selectedDoor.isExterior}
                    onChange={(e) =>
                      updateDoor(selectedDoor.id, {
                        isExterior: e.target.checked,
                      })
                    }
                    className="w-4 h-4 text-indigo focus:ring-indigo border-hairline rounded accent-indigo"
                  />
                </div>
              </div>
            )}

            {showTransform && selectedWindow && (
              <div className="px-5 pb-5 space-y-4">
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label
                      htmlFor="inspector-field-11"
                      className="font-body text-[9px] font-bold text-stone uppercase tracking-wider block mb-1"
                    >
                      Width (in)
                    </label>
                    <input
                      id="inspector-field-11"
                      type="number"
                      step={2}
                      min={18}
                      max={120}
                      value={selectedWindow.width}
                      onChange={(e) => {
                        if (
                          !Number.isFinite(e.currentTarget.valueAsNumber) ||
                          e.currentTarget.validity.rangeUnderflow ||
                          e.currentTarget.validity.rangeOverflow
                        )
                          return;
                        const width = parseFloat(e.target.value);
                        if (!isNaN(width) && width >= 12) {
                          updateWindow(selectedWindow.id, { width });
                        }
                      }}
                      className="px-2.5 py-1.5 w-full bg-alabaster border border-hairline rounded-lg text-charcoal font-mono text-xs outline-none focus:bg-white focus:border-indigo"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="inspector-field-12"
                      className="font-body text-[9px] font-bold text-stone uppercase tracking-wider block mb-1"
                    >
                      Height (in)
                    </label>
                    <input
                      id="inspector-field-12"
                      type="number"
                      step={2}
                      min={18}
                      max={96}
                      value={selectedWindow.height}
                      onChange={(e) => {
                        if (
                          !Number.isFinite(e.currentTarget.valueAsNumber) ||
                          e.currentTarget.validity.rangeUnderflow ||
                          e.currentTarget.validity.rangeOverflow
                        )
                          return;
                        const height = parseFloat(e.target.value);
                        if (!isNaN(height) && height >= 12) {
                          updateWindow(selectedWindow.id, { height });
                        }
                      }}
                      className="px-2.5 py-1.5 w-full bg-alabaster border border-hairline rounded-lg text-charcoal font-mono text-xs outline-none focus:bg-white focus:border-indigo"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="inspector-field-13"
                      className="font-body text-[9px] font-bold text-stone uppercase tracking-wider block mb-1"
                    >
                      Sill (in)
                    </label>
                    <input
                      id="inspector-field-13"
                      type="number"
                      step={2}
                      min={0}
                      max={72}
                      value={selectedWindow.sillHeight}
                      onChange={(e) => {
                        if (
                          !Number.isFinite(e.currentTarget.valueAsNumber) ||
                          e.currentTarget.validity.rangeUnderflow ||
                          e.currentTarget.validity.rangeOverflow
                        )
                          return;
                        const sillHeight = parseFloat(e.target.value);
                        if (!isNaN(sillHeight) && sillHeight >= 0) {
                          updateWindow(selectedWindow.id, { sillHeight });
                        }
                      }}
                      className="px-2.5 py-1.5 w-full bg-alabaster border border-hairline rounded-lg text-charcoal font-mono text-xs outline-none focus:bg-white focus:border-indigo"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="inspector-field-14"
                    className="font-body text-[10px] font-bold text-stone uppercase tracking-wider block mb-1.5"
                  >
                    Glazing Configuration
                  </label>
                  <select
                    id="inspector-field-14"
                    value={selectedWindow.windowType || "grid-2x2"}
                    onChange={(e) =>
                      updateWindow(selectedWindow.id, {
                        windowType: e.target.value as NonNullable<
                          Window2D["windowType"]
                        >,
                      })
                    }
                    className="px-3 py-1.5 w-full bg-alabaster border border-hairline rounded-lg text-charcoal font-medium text-xs outline-none focus:bg-white focus:border-indigo"
                  >
                    <option value="grid-2x2">
                      Architectural 2x2 Muntin Grid
                    </option>
                    <option value="double-hung">Double-Hung Sash</option>
                    <option value="casement">Twin Casement</option>
                    <option value="picture">Fixed Picture Window</option>
                    <option value="sliding">Horizontal Glider</option>
                  </select>
                </div>

                <div>
                  <div className="flex justify-between text-[10px] font-bold text-stone uppercase tracking-wider mb-1">
                    <span>Wall Position</span>
                    <span className="font-mono text-charcoal">
                      {Math.round(selectedWindow.position * 100)}%
                    </span>
                  </div>
                  <input
                    aria-label="Wall Position  %"
                    type="range"
                    min={0.1}
                    max={0.9}
                    step={0.02}
                    value={selectedWindow.position}
                    onChange={(e) =>
                      updateWindow(selectedWindow.id, {
                        position: parseFloat(e.target.value),
                      })
                    }
                    className="w-full accent-indigo"
                  />
                </div>
              </div>
            )}

            {showTransform && selectedStaircase && (
              <div className="px-5 pb-5 space-y-4">
                <div>
                  <label
                    htmlFor="inspector-field-15"
                    className="font-body text-[10px] font-bold text-stone uppercase tracking-wider block mb-1.5"
                  >
                    Staircase Configuration
                  </label>
                  <select
                    id="inspector-field-15"
                    value={selectedStaircase.type}
                    onChange={(e) =>
                      updateStaircase(selectedStaircase.id, {
                        type: e.target.value as Staircase["type"],
                      })
                    }
                    className="px-3 py-1.5 w-full bg-alabaster border border-hairline rounded-lg text-charcoal font-medium text-xs outline-none focus:bg-white focus:border-indigo"
                  >
                    <option value="straight">Straight Run</option>
                    <option value="l-shape">L-Shaped Quarter-Turn</option>
                    <option value="u-shape">U-Shaped Switchback</option>
                    <option value="spiral">Helical Spiral</option>
                  </select>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label
                      htmlFor="inspector-field-16"
                      className="font-body text-[9px] font-bold text-stone uppercase tracking-wider block mb-1"
                    >
                      Width (in)
                    </label>
                    <input
                      id="inspector-field-16"
                      type="number"
                      step={2}
                      min={30}
                      max={72}
                      value={selectedStaircase.width}
                      onChange={(e) => {
                        if (
                          !Number.isFinite(e.currentTarget.valueAsNumber) ||
                          e.currentTarget.validity.rangeUnderflow ||
                          e.currentTarget.validity.rangeOverflow
                        )
                          return;
                        const width = parseFloat(e.target.value);
                        if (!isNaN(width) && width >= 24) {
                          updateStaircase(selectedStaircase.id, { width });
                        }
                      }}
                      className="px-2.5 py-1.5 w-full bg-alabaster border border-hairline rounded-lg text-charcoal font-mono text-xs outline-none focus:bg-white focus:border-indigo"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="inspector-field-17"
                      className="font-body text-[9px] font-bold text-stone uppercase tracking-wider block mb-1"
                    >
                      Risers
                    </label>
                    <input
                      id="inspector-field-17"
                      type="number"
                      step={1}
                      min={4}
                      max={28}
                      value={selectedStaircase.riserCount}
                      onChange={(e) => {
                        if (
                          !Number.isFinite(e.currentTarget.valueAsNumber) ||
                          e.currentTarget.validity.rangeUnderflow ||
                          e.currentTarget.validity.rangeOverflow
                        )
                          return;
                        const riserCount = parseInt(e.target.value, 10);
                        if (!isNaN(riserCount) && riserCount >= 4) {
                          updateStaircase(selectedStaircase.id, { riserCount });
                        }
                      }}
                      className="px-2.5 py-1.5 w-full bg-alabaster border border-hairline rounded-lg text-charcoal font-mono text-xs outline-none focus:bg-white focus:border-indigo"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="inspector-field-18"
                      className="font-body text-[9px] font-bold text-stone uppercase tracking-wider block mb-1"
                    >
                      Rise (in)
                    </label>
                    <input
                      id="inspector-field-18"
                      type="number"
                      step={0.25}
                      min={5}
                      max={9}
                      value={selectedStaircase.riserHeight}
                      onChange={(e) => {
                        if (
                          !Number.isFinite(e.currentTarget.valueAsNumber) ||
                          e.currentTarget.validity.rangeUnderflow ||
                          e.currentTarget.validity.rangeOverflow
                        )
                          return;
                        const riserHeight = parseFloat(e.target.value);
                        if (!isNaN(riserHeight) && riserHeight >= 4) {
                          updateStaircase(selectedStaircase.id, {
                            riserHeight,
                          });
                        }
                      }}
                      className="px-2.5 py-1.5 w-full bg-alabaster border border-hairline rounded-lg text-charcoal font-mono text-xs outline-none focus:bg-white focus:border-indigo"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="font-body text-[10px] font-bold text-stone uppercase tracking-wider">
                    Orientation:{" "}
                    {Math.round((selectedStaircase.rotation.y * 180) / Math.PI)}
                    &deg;
                  </span>
                  <button
                    onClick={() =>
                      updateStaircase(selectedStaircase.id, {
                        rotation: {
                          ...selectedStaircase.rotation,
                          y: selectedStaircase.rotation.y + Math.PI / 2,
                        },
                      })
                    }
                    className="px-2.5 py-1 bg-alabaster hover:bg-gray-100 border border-hairline rounded-lg text-[10px] font-bold text-charcoal flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCw size={11} />
                    <span>Rotate 90&deg;</span>
                  </button>
                </div>
              </div>
            )}

            {showTransform && selectedSceneObj && (
              <div className="px-5 pb-5 space-y-4">
                <div>
                  <label
                    htmlFor="inspector-field-19"
                    className="font-body text-[10px] font-bold text-stone uppercase tracking-wider block mb-1.5"
                  >
                    Asset Name
                  </label>
                  <input
                    id="inspector-field-19"
                    type="text"
                    value={selectedSceneObj.name}
                    onChange={(e) =>
                      updateSceneObject(selectedSceneObj.id, {
                        name: e.target.value,
                      })
                    }
                    className="px-3 py-1.5 w-full bg-alabaster border border-hairline rounded-lg text-charcoal font-medium text-xs outline-none focus:bg-white focus:border-indigo"
                  />
                </div>

                <div>
                  <label
                    htmlFor="inspector-field-20"
                    className="font-body text-[10px] font-bold text-stone uppercase tracking-wider block mb-1.5"
                  >
                    Mounting Plane
                  </label>
                  <select
                    id="inspector-field-20"
                    value={selectedSceneObj.attachmentType || "floor"}
                    onChange={(e) =>
                      updateSceneObject(selectedSceneObj.id, {
                        attachmentType: e.target.value as
                          | "floor"
                          | "wall"
                          | "ceiling"
                          | "surface",
                      })
                    }
                    className="px-3 py-1.5 w-full bg-alabaster border border-hairline rounded-lg text-charcoal font-medium text-xs outline-none focus:bg-white focus:border-indigo"
                  >
                    <option value="floor">Floor Standing</option>
                    <option value="surface">Table / Countertop Surface</option>
                    <option value="wall">Wall Mounted</option>
                    <option value="ceiling">Ceiling Suspended</option>
                  </select>
                </div>

                <div>
                  <p className="font-body text-[10px] font-bold text-stone uppercase tracking-wider block mb-1.5">
                    Position (x, y, z meters)
                  </p>
                  <div className="grid grid-cols-3 gap-2 font-mono text-xs">
                    {(["x", "y", "z"] as const).map((axis) => (
                      <div key={axis} className="relative">
                        <span className="absolute left-2.5 top-2 text-[10px] font-bold text-stone capitalize">
                          {axis}
                        </span>
                        <input
                          aria-label={`Position ${axis} (meters)`}
                          type="number"
                          step={0.1}
                          value={Number(
                            selectedSceneObj.position[axis].toFixed(2),
                          )}
                          onChange={(e) => {
                            if (
                              !Number.isFinite(e.currentTarget.valueAsNumber) ||
                              e.currentTarget.validity.rangeUnderflow ||
                              e.currentTarget.validity.rangeOverflow
                            )
                              return;
                            updateSceneObject(selectedSceneObj.id, {
                              position: {
                                ...selectedSceneObj.position,
                                [axis]: Number(e.target.value),
                              },
                            });
                          }}
                          className="pl-6 pr-2 py-1.5 w-full bg-alabaster border border-hairline rounded-lg text-charcoal outline-none focus:bg-white focus:border-indigo"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-body text-[10px] font-bold text-stone uppercase tracking-wider block">
                      Heading Rotation
                    </p>
                    <span className="font-mono text-xs font-bold text-charcoal">
                      {Math.round(
                        (selectedSceneObj.rotation.y * 180) / Math.PI,
                      )}
                      &deg;
                    </span>
                  </div>
                  <button
                    onClick={() =>
                      updateSceneObject(selectedSceneObj.id, {
                        rotation: {
                          ...selectedSceneObj.rotation,
                          y: selectedSceneObj.rotation.y + Math.PI / 2,
                        },
                      })
                    }
                    className="px-3 py-1.5 bg-alabaster hover:bg-gray-100 border border-hairline rounded-lg text-[10px] font-bold text-charcoal flex items-center gap-1.5 cursor-pointer"
                  >
                    <RotateCw size={12} />
                    <span>Rotate 90&deg;</span>
                  </button>
                </div>

                <div>
                  <div className="flex justify-between text-[10px] font-bold text-stone uppercase tracking-wider mb-1">
                    <span>Uniform Scale</span>
                    <span className="font-mono text-charcoal">
                      {selectedSceneObj.scale.x.toFixed(2)}x
                    </span>
                  </div>
                  <input
                    aria-label="Uniform Scale  x"
                    type="range"
                    min={0.5}
                    max={2.5}
                    step={0.05}
                    value={selectedSceneObj.scale.x}
                    onChange={(e) => {
                      const s = parseFloat(e.target.value);
                      updateSceneObject(selectedSceneObj.id, {
                        scale: { x: s, y: s, z: s },
                      });
                    }}
                    className="w-full accent-indigo"
                  />
                </div>
              </div>
            )}
          </div>

          {/* ── 2. MATERIAL LAB ────────────────────────────────────────────── */}
          {(selectedType === "wall" || selectedType === "furniture") && (
            <div className="border-b border-hairline">
              <button
                onClick={() => setShowMaterial(!showMaterial)}
                className="w-full flex items-center justify-between p-4 text-xs font-bold text-charcoal uppercase tracking-wider hover:bg-gray-50 transition-colors outline-none"
              >
                <span className="flex items-center gap-2">
                  <Palette size={14} className="text-stone" />
                  <span>Material Reskin</span>
                </span>
                {showMaterial ? (
                  <ChevronUp size={14} />
                ) : (
                  <ChevronDown size={14} />
                )}
              </button>

              {showMaterial && (
                <div className="px-5 pb-5 flex flex-col gap-4">
                  {/* Active Swatches */}
                  <div>
                    <p className="font-body text-[10px] font-bold text-stone uppercase tracking-wider block mb-2">
                      Preset PBR Shaders
                    </p>
                    <div className="flex items-center gap-2.5">
                      {SWATCHES.map((sw) => (
                        <button
                          key={sw.name}
                          onClick={() => {
                            setActiveMaterial(sw.name);
                            const presetMat = PBR_PRESETS[sw.name];
                            if (presetMat && selectedObjectId) {
                              setMaterial(selectedObjectId, presetMat);
                              if (selectedType === "wall") {
                                updateWall(selectedObjectId, {
                                  materialId: presetMat.id,
                                });
                              } else if (selectedType === "furniture") {
                                updateSceneObject(selectedObjectId, {
                                  materialId: presetMat.id,
                                });
                              }
                              toast.success(
                                `Applied ${sw.name} PBR material preset!`,
                              );
                            }
                          }}
                          className={`w-7 h-7 rounded-full border shadow-sm transition-all outline-none ${
                            activeMaterial === sw.name
                              ? "ring-2 ring-indigo ring-offset-2 scale-110"
                              : "border-hairline"
                          }`}
                          style={{ backgroundColor: sw.color }}
                          title={sw.name}
                        />
                      ))}
                    </div>
                    <span className="text-[10px] font-medium text-stone block mt-2.5">
                      Active Layer:{" "}
                      <strong className="text-charcoal">
                        {activeMaterial}
                      </strong>
                    </span>
                  </div>

                  {/* Generative Text prompt */}
                  <div className="flex flex-col gap-2">
                    <label
                      htmlFor="inspector-field-21"
                      className="font-body text-[10px] font-bold text-stone uppercase tracking-wider block"
                    >
                      Find a material preset
                    </label>
                    <textarea
                      id="inspector-field-21"
                      rows={2}
                      placeholder="e.g. brushed brass tile, low roughness..."
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      className="px-3 py-2 bg-alabaster border border-hairline rounded-lg text-xs font-medium text-charcoal focus:bg-white focus:border-indigo focus:ring-2 focus:ring-indigo/20 outline-none resize-none"
                    />
                    <button
                      onClick={handleGenerateMaterial}
                      disabled={isGeneratingMat || !prompt.trim()}
                      className="w-full h-9 btn-primary bg-indigo hover:bg-indigoDark text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 shadow-sm transition-colors disabled:opacity-50"
                    >
                      {isGeneratingMat ? (
                        <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      ) : (
                        <>
                          <Palette size={12} />
                          <span>Apply material</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── 3. BILL OF MATERIALS (BOM) ─────────────────────────────────── */}
          <div className="border-b border-hairline">
            <button
              onClick={() => setShowBOM(!showBOM)}
              className="w-full flex items-center justify-between p-4 text-xs font-bold text-charcoal uppercase tracking-wider hover:bg-gray-50 transition-colors outline-none"
            >
              <span className="flex items-center gap-2">
                <Package size={14} className="text-stone" />
                <span>Materials Bill (BOM)</span>
              </span>
              {showBOM ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {showBOM && (
              <div className="px-5 pb-5 space-y-2.5">
                {bomReport && bomReport.items.length > 0 ? (
                  <>
                    <div className="space-y-2 max-h-48 overflow-y-auto border border-hairline rounded-xl p-2.5 bg-alabaster">
                      {bomReport.items.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex justify-between items-center text-[10px] font-body text-charcoal border-b border-hairline/40 pb-1.5 last:border-0 last:pb-0"
                        >
                          <div className="flex flex-col gap-0.5">
                            <span className="font-bold">{item.name}</span>
                            <span className="text-stone">{item.category}</span>
                          </div>
                          <div className="text-right font-mono">
                            <span className="font-bold text-charcoal block">
                              {item.quantity} {item.unit}
                            </span>
                            {item.estimatedCost !== undefined && (
                              <span className="text-[9px] text-indigo font-bold">
                                ${item.estimatedCost.toLocaleString()}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    {bomReport.totalEstimatedCost !== undefined && (
                      <div className="flex justify-between items-center px-2 pt-1 font-mono text-[10px]">
                        <span className="font-bold text-stone uppercase">
                          Total Est. Cost
                        </span>
                        <span className="font-bold text-indigo">
                          ${bomReport.totalEstimatedCost.toLocaleString()}
                        </span>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="bg-alabaster rounded-xl p-4 border border-hairline text-center text-stone">
                    <p className="font-body text-[10px] leading-relaxed">
                      No global materials recorded. Draw walls or run a layout
                      generator to compile live BOM quantities.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── 4. CODE COMPLIANCE ─────────────────────────────────────────── */}
          <div>
            <button
              onClick={() => setShowCompliance(!showCompliance)}
              className="w-full flex items-center justify-between p-4 text-xs font-bold text-charcoal uppercase tracking-wider hover:bg-gray-50 transition-colors outline-none"
            >
              <span className="flex items-center gap-2">
                <CheckCircle size={14} className="text-stone" />
                <span>IBC Code Check</span>
              </span>
              {showCompliance ? (
                <ChevronUp size={14} />
              ) : (
                <ChevronDown size={14} />
              )}
            </button>

            {showCompliance && (
              <div className="px-5 pb-5">
                {violations && violations.length > 0 ? (
                  <div className="space-y-2">
                    {violations.map((v, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-errorLight border border-error/10 text-error rounded-xl flex items-start gap-2 text-[10px] leading-relaxed font-body"
                      >
                        <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                        <div>
                          <strong className="font-bold block uppercase tracking-wider text-[9px] mb-0.5">
                            {v.code} ({v.severity})
                          </strong>
                          <p className="font-medium">{v.message}</p>
                          <p className="text-stone font-bold mt-1 text-[9px]">
                            FIX: {v.recommendation}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-successLight border border-success/10 text-success rounded-xl p-3.5 flex items-center gap-2.5">
                    <CheckCircle size={16} className="shrink-0" />
                    <span className="font-body text-[10px] font-bold uppercase tracking-wider">
                      IBC Compliance: ALL CLEAR
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </aside>
  );
}
