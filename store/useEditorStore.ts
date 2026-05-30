'use client';

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type {
  EditorMode,
  EditorTool,
  FloorPlanLayout,
  SceneObject,
  Material,
  BomReport,
  ComplianceViolation,
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

  // ── Scene Data ────────────────────────────────────────────────────────────
  floorPlanLayout: FloorPlanLayout | null;
  sceneObjects: SceneObject[];
  materials: Record<string, Material>;

  // ── Analysis Results ──────────────────────────────────────────────────────
  bomReport: BomReport | null;
  violations: ComplianceViolation[];

  // ── Async ─────────────────────────────────────────────────────────────────
  isGenerating: boolean;

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
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useEditorStore = create<EditorState>()(
  immer((set) => ({
    // ── Initial State ────────────────────────────────────────────────────────
    mode: '3d',
    tool: 'select',
    selectedObjectId: null,
    cameraMode: 'perspective',
    showGrid: true,
    showMeasurements: false,

    floorPlanLayout: null,
    sceneObjects: [],
    materials: {},

    bomReport: null,
    violations: [],

    isGenerating: false,

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
  })),
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
