'use client';

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { temporal } from 'zundo';
import type {
  EditorMode,
  EditorTool,
  FloorPlanLayout,
  SceneObject,
  Material,
  BomReport,
  ComplianceViolation,
  DimensionLine,
  BuildingStorey,
  Staircase,
  MEPNode,
  MEPEdge,
} from '@/types/puter';

// ─── State Shape ──────────────────────────────────────────────────────────────

interface EditorState {
  // ── View & Interaction ────────────────────────────────────────────────────
  mode: EditorMode;
  tool: EditorTool;
  selectedObjectId: string | null;
  cameraMode: 'perspective' | 'orthographic';
  showGrid: boolean;
  showMeasurements: boolean;
  xrScale: number; // 1 for immersive, 0.05 for dollhouse

  // ── Scene Data ────────────────────────────────────────────────────────────
  floorPlanLayout: FloorPlanLayout | null;
  sceneObjects: SceneObject[];
  materials: Record<string, Material>;

  // ── Analysis Results ──────────────────────────────────────────────────────
  bomReport: BomReport | null;
  violations: ComplianceViolation[];

  // ── Async ─────────────────────────────────────────────────────────────────
  isGenerating: boolean;

  // ── P2-P4 Advanced Spatial State ──────────────────────────────────────────
  dimensionLines: DimensionLine[];
  storeys: BuildingStorey[];
  activeStoreyId: string;
  mepNodes: MEPNode[];
  mepEdges: MEPEdge[];
  staircases: Staircase[];
  sunAltitude: number;
  sunAzimuth: number;
  sunTime: string;
  showRoof: boolean;

  // ── Actions ───────────────────────────────────────────────────────────────
  setMode(mode: EditorMode): void;
  setTool(tool: EditorTool): void;
  setSelectedObject(id: string | null): void;
  setFloorPlan(layout: FloorPlanLayout | null): void;
  addSceneObject(obj: SceneObject): void;
  updateSceneObject(id: string, updates: Partial<SceneObject>): void;
  removeSceneObject(id: string): void;
  setMaterial(id: string, material: Material): void;
  setBomReport(report: BomReport | null): void;
  setViolations(violations: ComplianceViolation[]): void;
  setGenerating(isGenerating: boolean): void;
  toggleGrid(): void;
  toggleMeasurements(): void;
  toggleCameraMode(): void;
  toggleXrScale(): void;
  toggleRoof(): void;

  addDimensionLine(line: DimensionLine): void;
  removeDimensionLine(id: string): void;
  setStoreys(storeys: BuildingStorey[]): void;
  setActiveStoreyId(id: string): void;
  addMepNode(node: MEPNode): void;
  updateMepNode(id: string, updates: Partial<MEPNode>): void;
  addMepEdge(edge: MEPEdge): void;
  removeMepEdge(id: string): void;
  addStaircase(stair: Staircase): void;
  removeStaircase(id: string): void;
  setSunTime(timeStr: string): void;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useEditorStore = create<EditorState>()(
  temporal(
    immer((set) => ({
    // ── Initial State ────────────────────────────────────────────────────────
    mode: '3d',
    tool: 'select',
    selectedObjectId: null,
    cameraMode: 'perspective',
    showGrid: true,
    showMeasurements: false,
    xrScale: 1,
    showRoof: false,

    floorPlanLayout: null,
    sceneObjects: [],
    materials: {},

    bomReport: null,
    violations: [],

    isGenerating: false,

    dimensionLines: [],
    storeys: [],
    activeStoreyId: "",
    mepNodes: [],
    mepEdges: [],
    staircases: [],
    sunAltitude: 45,
    sunAzimuth: 180,
    sunTime: "12:00",

    // ── Actions ──────────────────────────────────────────────────────────────

    setMode(mode) {
      set((state) => {
        state.mode = mode;
        // Reset tool to 'select' when switching modes to avoid invalid states
        state.tool = 'select';
        state.selectedObjectId = null;
      });
    },

    setTool(tool) {
      set((state) => {
        state.tool = tool;
      });
    },

    setSelectedObject(id) {
      set((state) => {
        state.selectedObjectId = id;
      });
    },

    setFloorPlan(layout) {
      set((state) => {
        state.floorPlanLayout = layout;
      });
    },

    addSceneObject(obj) {
      set((state) => {
        const exists = state.sceneObjects.some((o) => o.id === obj.id);
        if (!exists) {
          state.sceneObjects.push(obj);
        }
      });
    },

    updateSceneObject(id, updates) {
      set((state) => {
        const index = state.sceneObjects.findIndex((o) => o.id === id);
        if (index !== -1) {
          Object.assign(state.sceneObjects[index] as SceneObject, updates);
        }
      });
    },

    removeSceneObject(id) {
      set((state) => {
        state.sceneObjects = state.sceneObjects.filter((o) => o.id !== id);
        if (state.selectedObjectId === id) {
          state.selectedObjectId = null;
        }
      });
    },

    setMaterial(id, material) {
      set((state) => {
        state.materials[id] = material;
      });
    },

    setBomReport(report) {
      set((state) => {
        state.bomReport = report;
      });
    },

    setViolations(violations) {
      set((state) => {
        state.violations = violations;
      });
    },

    setGenerating(isGenerating) {
      set((state) => {
        state.isGenerating = isGenerating;
      });
    },

    toggleGrid() {
      set((state) => {
        state.showGrid = !state.showGrid;
      });
    },

    toggleMeasurements() {
      set((state) => {
        state.showMeasurements = !state.showMeasurements;
      });
    },

    toggleCameraMode() {
      set((state) => {
        state.cameraMode =
          state.cameraMode === 'perspective' ? 'orthographic' : 'perspective';
      });
    },

    toggleXrScale() {
      set((state) => {
        state.xrScale = state.xrScale === 1 ? 0.05 : 1;
      });
    },

    toggleRoof() {
      set((state) => {
        state.showRoof = !state.showRoof;
      });
    },

    addDimensionLine(line) {
      set((state) => {
        state.dimensionLines.push(line);
      });
    },

    removeDimensionLine(id) {
      set((state) => {
        state.dimensionLines = state.dimensionLines.filter((l) => l.id !== id);
      });
    },

    setStoreys(storeys) {
      set((state) => {
        state.storeys = storeys;
        if (storeys.length > 0 && !state.activeStoreyId) {
          state.activeStoreyId = storeys[0]?.id || "";
        }
      });
    },

    setActiveStoreyId(id) {
      set((state) => {
        state.activeStoreyId = id;
        const storey = state.storeys.find((s) => s.id === id);
        if (storey) {
          state.floorPlanLayout = storey.floorPlanLayout;
        }
      });
    },

    addMepNode(node) {
      set((state) => {
        state.mepNodes.push(node);
      });
    },

    updateMepNode(id, updates) {
      set((state) => {
        const index = state.mepNodes.findIndex((n) => n.id === id);
        if (index !== -1) {
          Object.assign(state.mepNodes[index] as MEPNode, updates);
        }
      });
    },

    addMepEdge(edge) {
      set((state) => {
        state.mepEdges.push(edge);
      });
    },

    removeMepEdge(id) {
      set((state) => {
        state.mepEdges = state.mepEdges.filter((e) => e.id !== id);
      });
    },

    addStaircase(stair) {
      set((state) => {
        state.staircases.push(stair);
      });
    },

    removeStaircase(id) {
      set((state) => {
        state.staircases = state.staircases.filter((s) => s.id !== id);
      });
    },

    setSunTime(timeStr) {
      set((state) => {
        state.sunTime = timeStr;
        const [hStr, mStr] = timeStr.split(':');
        const hours = parseInt(hStr || '12', 10) + parseInt(mStr || '0', 10) / 60;
        
        const angle = (hours - 6) * Math.PI / 12;
        const altitude = 60 * Math.sin(angle);
        const azimuth = (hours / 24) * 360;
        
        state.sunAltitude = Math.round(altitude);
        state.sunAzimuth = Math.round(azimuth);
      });
    },
    })),
    {
      limit: 100,
      partialize: (state) => ({
        floorPlanLayout: state.floorPlanLayout,
        sceneObjects: state.sceneObjects,
        materials: state.materials,
      }),
    }
  )
);

// ─── Atomic Selectors ─────────────────────────────────────────────────────────

export const useEditorMode = () => useEditorStore((s) => s.mode);
export const useEditorTool = () => useEditorStore((s) => s.tool);
export const useSelectedObjectId = () => useEditorStore((s) => s.selectedObjectId);
export const useCameraMode = () => useEditorStore((s) => s.cameraMode);
export const useShowGrid = () => useEditorStore((s) => s.showGrid);
export const useShowMeasurements = () => useEditorStore((s) => s.showMeasurements);
export const useFloorPlanLayout = () => useEditorStore((s) => s.floorPlanLayout);
export const useSceneObjects = () => useEditorStore((s) => s.sceneObjects);
export const useMaterials = () => useEditorStore((s) => s.materials);
export const useBomReport = () => useEditorStore((s) => s.bomReport);
export const useViolations = () => useEditorStore((s) => s.violations);
export const useIsGenerating = () => useEditorStore((s) => s.isGenerating);
