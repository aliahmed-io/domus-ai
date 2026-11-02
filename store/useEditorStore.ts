"use client";

import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { temporal } from "zundo";
import { detectAllRooms } from "@/lib/room-detection";
import { computeLiveBomAndCompliance } from "@/lib/bom-calculator";
import type {
  EditorMode,
  EditorWorkspace,
  EditorTool,
  FloorPlanLayout,
  Wall,
  Door,
  Window2D,
  Room,
  SceneObject,
  Material,
  BomReport,
  ComplianceViolation,
  DimensionLine,
  BuildingStorey,
  Staircase,
  MEPNode,
  MEPEdge,
} from "@/types/puter";

// ─── State Shape ──────────────────────────────────────────────────────────────

interface LoadProjectExtra {
  projectId?: string | undefined;
  materials?: Record<string, Material> | undefined;
  storeys?: BuildingStorey[] | undefined;
  activeStoreyId?: string | undefined;
  staircases?: Staircase[] | undefined;
  dimensionLines?: DimensionLine[] | undefined;
}

interface EditorState {
  projectId: string | null;
  setProjectId(id: string | null): void;
  // ── View & Interaction ────────────────────────────────────────────────────
  workspace: EditorWorkspace;
  mode: EditorMode;
  tool: EditorTool;
  selectedObjectId: string | null;
  cameraMode: "perspective" | "orthographic";
  showGrid: boolean;
  fitPlanRequest: number;
  requestPlanFit(): void;
  showSceneGrid: boolean;
  toggleSceneGrid(): void;
  catalogOpen: boolean;
  setCatalogOpen(open: boolean): void;
  viewSettingsOpen: boolean;
  setViewSettingsOpen(open: boolean): void;
  cutawayWalls: boolean;
  setCutawayWalls(value: boolean): void;
  sceneLighting: "studio" | "sun";
  setSceneLighting(value: "studio" | "sun"): void;
  showMeasurements: boolean;
  xrScale: number; // 1 for immersive, 0.05 for dollhouse

  // ── Scene Data ────────────────────────────────────────────────────────────
  floorPlanLayout: FloorPlanLayout | null;
  layoutCandidates: FloorPlanLayout[];
  setLayoutCandidates(layouts: FloorPlanLayout[]): void;
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
  roofType: "flat" | "gable" | "hip";
  sectionCutHeight: number | null;
  favoriteModelIds: string[];
  userGeneratedAssets: {
    id: string;
    name: string;
    modelUrl: string;
    color: string;
    thumbnailUrl?: string;
  }[];

  // ── Presentation Mode ──
  isPresentationMode: boolean;
  togglePresentationMode(): void;
  setPresentationMode(val: boolean): void;

  // ── Konva Stage Viewport State ──
  stageScale: number;
  stageX: number;
  stageY: number;

  // ── Actions ───────────────────────────────────────────────────────────────
  undoDocument(): void;
  redoDocument(): void;
  setMode(mode: EditorMode): void;
  setTool(tool: EditorTool): void;
  setSelectedObject(id: string | null): void;
  setFloorPlan(layout: FloorPlanLayout | null): void;
  updateWall(id: string, updates: Partial<Wall>): void;
  updateDoor(id: string, updates: Partial<Door>): void;
  updateWindow(id: string, updates: Partial<Window2D>): void;
  updateRoom(id: string, updates: Partial<Room>): void;
  addSceneObject(obj: SceneObject): void;
  updateSceneObject(id: string, updates: Partial<SceneObject>): void;
  removeSceneObject(id: string): void;
  setMaterial(id: string, material: Material): void;
  setBomReport: (report: BomReport | null) => void;
  setViolations: (violations: ComplianceViolation[]) => void;
  setWorkspace: (ws: EditorWorkspace) => void;
  setGenerating(isGenerating: boolean): void;
  loadProjectData(
    layout: FloorPlanLayout | null,
    sceneObjects: SceneObject[],
    workspace: EditorWorkspace,
    extra?: LoadProjectExtra,
  ): void;
  clearWorkspace(): void;
  toggleGrid(): void;
  toggleMeasurements(): void;
  toggleCameraMode(): void;
  toggleXrScale(): void;
  toggleRoof(): void;
  setRoofType(type: "flat" | "gable" | "hip"): void;
  setSectionCutHeight(height: number | null): void;
  setStageViewport(scale: number, x: number, y: number): void;

  addDimensionLine(line: DimensionLine): void;
  removeDimensionLine(id: string): void;
  setStoreys(storeys: BuildingStorey[]): void;
  setActiveStoreyId(id: string): void;
  addStorey(name?: string, copyFromActive?: boolean): void;
  duplicateActiveStorey(): void;
  removeStorey(id: string): void;
  toggleStoreyVisibility(id: string): void;
  addMepNode(node: MEPNode): void;
  updateMepNode(id: string, updates: Partial<MEPNode>): void;
  addMepEdge(edge: MEPEdge): void;
  removeMepEdge(id: string): void;
  addStaircase(stair: Staircase): void;
  updateStaircase(id: string, updates: Partial<Staircase>): void;
  removeStaircase(id: string): void;
  setSunTime(timeStr: string): void;
  toggleFavoriteModel(id: string): void;
  addUserGeneratedAsset(asset: {
    id: string;
    name: string;
    modelUrl: string;
    color: string;
    thumbnailUrl?: string;
  }): void;
  deleteSelected(): void;
}

function syncActiveStoreyAndBom(state: EditorState) {
  if (state.floorPlanLayout) {
    if (state.activeStoreyId && state.storeys.length > 0) {
      const activeStorey = state.storeys.find(
        (s) => s.id === state.activeStoreyId,
      );
      if (activeStorey) {
        activeStorey.floorPlanLayout = state.floorPlanLayout;
      }
    } else if (state.storeys.length === 0) {
      const initialStorey: BuildingStorey = {
        id: "storey-1",
        name: "Level 1 - Ground",
        elevation: 0,
        height: 10,
        slabThickness: 0.8,
        floorPlanLayout: state.floorPlanLayout,
        isVisible: true,
      };
      state.storeys = [initialStorey];
      state.activeStoreyId = initialStorey.id;
    }
  }
  const analysis = computeLiveBomAndCompliance(
    state.floorPlanLayout,
    state.storeys,
    state.sceneObjects,
    state.staircases,
  );
  state.bomReport = analysis.bomReport;
  state.violations = analysis.violations;
}

// ─── Store ────────────────────────────────────────────────────────────────────

type HistorySnapshot = Pick<
  EditorState,
  | "floorPlanLayout"
  | "storeys"
  | "activeStoreyId"
  | "sceneObjects"
  | "materials"
  | "staircases"
  | "dimensionLines"
>;

export const useEditorStore = create<EditorState>()(
  temporal(
    immer((set, get) => ({
      // ── Initial State ────────────────────────────────────────────────────────
      projectId: null,
      setProjectId(id) {
        set((state) => {
          state.projectId = id;
        });
      },
      workspace: "onboarding",
      mode: "2d",
      tool: "select",
      selectedObjectId: null,
      cameraMode: "perspective",
      showGrid: true,
      fitPlanRequest: 0,
      requestPlanFit() { set(state=>{state.fitPlanRequest+=1;}); },
      showSceneGrid: false,
      toggleSceneGrid() { set(state=>{state.showSceneGrid=!state.showSceneGrid;}); },
      catalogOpen: false,
      setCatalogOpen(open) { set(state=>{state.catalogOpen=open;}); },
      viewSettingsOpen: false,
      setViewSettingsOpen(open) { set(state=>{state.viewSettingsOpen=open;}); },
      cutawayWalls: true,
      setCutawayWalls(value) { set(state=>{state.cutawayWalls=value;}); },
      sceneLighting: "studio",
      setSceneLighting(value) { set(state=>{state.sceneLighting=value;}); },
      showMeasurements: false,
      xrScale: 1,
      showRoof: false,
      roofType: "hip",
      sectionCutHeight: null,

      floorPlanLayout: null,
      layoutCandidates: [],
      setLayoutCandidates(layouts) { set(state => { state.layoutCandidates = layouts; }); },
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
      favoriteModelIds: [],
      userGeneratedAssets: [],
      isPresentationMode: false,

      // ── Konva Stage Viewport Initial State ──
      stageScale: 1,
      stageX: 0,
      stageY: 0,

      // ── Actions ──────────────────────────────────────────────────────────────

      setMode(mode) {
        set((state) => {
          state.mode = mode;
          state.tool = "select";
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

      undoDocument() {
        useEditorStore.temporal.getState().undo();
        useEditorStore.temporal.getState().pause();
        set(state => { syncActiveStoreyAndBom(state); });
        useEditorStore.temporal.getState().resume();
      },
      redoDocument() {
        useEditorStore.temporal.getState().redo();
        useEditorStore.temporal.getState().pause();
        set(state => { syncActiveStoreyAndBom(state); });
        useEditorStore.temporal.getState().resume();
      },
      setFloorPlan(layout) {
        set((state) => {
          if (layout && JSON.stringify(state.floorPlanLayout?.walls.map(wall => [wall.id, wall.start, wall.end])) !== JSON.stringify(layout.walls.map(wall => [wall.id, wall.start, wall.end]))) {
            layout = { ...layout, rooms: layout.walls.length ? detectAllRooms(layout.walls, layout.rooms) : layout.rooms };
          }
          state.floorPlanLayout = layout;
          if (!layout) {
            state.storeys = [];
            state.activeStoreyId = "";
            state.bomReport = null;
            state.violations = [];
            return;
          }
          syncActiveStoreyAndBom(state);
        });
      },

      updateWall(id, updates) {
        set((state) => {
          if (!state.floorPlanLayout) return;
          const wall = state.floorPlanLayout.walls.find((w) => w.id === id);
          if (!wall) return;
          Object.assign(wall, updates);
          if (updates.start || updates.end) {
            state.floorPlanLayout.rooms = detectAllRooms(
              state.floorPlanLayout.walls,
              state.floorPlanLayout.rooms,
            );
          }
          syncActiveStoreyAndBom(state);
        });
      },

      updateDoor(id, updates) {
        set((state) => {
          if (!state.floorPlanLayout) return;
          const door = state.floorPlanLayout.doors.find((d) => d.id === id);
          if (!door) return;
          Object.assign(door, updates);
          syncActiveStoreyAndBom(state);
        });
      },

      updateWindow(id, updates) {
        set((state) => {
          if (!state.floorPlanLayout) return;
          const win = state.floorPlanLayout.windows.find((w) => w.id === id);
          if (!win) return;
          Object.assign(win, updates);
          syncActiveStoreyAndBom(state);
        });
      },

      updateRoom(id, updates) {
        set((state) => {
          if (!state.floorPlanLayout) return;
          const room = state.floorPlanLayout.rooms.find((r) => r.id === id);
          if (!room) return;
          Object.assign(room, updates);
          syncActiveStoreyAndBom(state);
        });
      },

      addSceneObject(obj) {
        set((state) => {
          const exists = state.sceneObjects.some((o) => o.id === obj.id);
          if (!exists) {
            const withStorey: SceneObject = {
              ...obj,
              storeyId: obj.storeyId || state.activeStoreyId || "storey-1",
            };
            state.sceneObjects.push(withStorey);
            syncActiveStoreyAndBom(state);
          }
        });
      },

      updateSceneObject(id, updates) {
        set((state) => {
          const index = state.sceneObjects.findIndex((o) => o.id === id);
          if (index !== -1) {
            Object.assign(state.sceneObjects[index] as SceneObject, updates);
            syncActiveStoreyAndBom(state);
          }
        });
      },

      removeSceneObject(id) {
        set((state) => {
          state.sceneObjects = state.sceneObjects.filter((o) => o.id !== id);
          if (state.selectedObjectId === id) {
            state.selectedObjectId = null;
          }
          syncActiveStoreyAndBom(state);
        });
      },

      deleteSelected() {
        set((state) => {
          const id = state.selectedObjectId;
          if (!id) return;

          // 1. Scene objects (furniture / lights)
          const initialSceneLen = state.sceneObjects.length;
          state.sceneObjects = state.sceneObjects.filter((o) => o.id !== id);
          if (state.sceneObjects.length < initialSceneLen) {
            state.selectedObjectId = null;
            syncActiveStoreyAndBom(state);
            return;
          }

          // 2. Dimension lines
          const initialDimLen = state.dimensionLines.length;
          state.dimensionLines = state.dimensionLines.filter(
            (d) => d.id !== id,
          );
          if (state.dimensionLines.length < initialDimLen) {
            state.selectedObjectId = null;
            return;
          }

          // 3. Staircases
          const initialStairLen = state.staircases.length;
          state.staircases = state.staircases.filter((s) => s.id !== id);
          if (state.staircases.length < initialStairLen) {
            state.selectedObjectId = null;
            syncActiveStoreyAndBom(state);
            return;
          }

          // 4. Floor plan elements (walls, doors, windows, rooms)
          if (state.floorPlanLayout) {
            const initialWallsLen = state.floorPlanLayout.walls.length;
            state.floorPlanLayout.walls = state.floorPlanLayout.walls.filter(
              (w) => w.id !== id,
            );
            if (state.floorPlanLayout.walls.length < initialWallsLen) {
              // Remove any doors and windows hosted on the deleted wall
              state.floorPlanLayout.doors = state.floorPlanLayout.doors.filter(
                (d) => d.wallId !== id,
              );
              state.floorPlanLayout.windows =
                state.floorPlanLayout.windows.filter((w) => w.wallId !== id);
              state.floorPlanLayout.rooms = detectAllRooms(
                state.floorPlanLayout.walls,
                state.floorPlanLayout.rooms,
              );
              state.selectedObjectId = null;
              syncActiveStoreyAndBom(state);
              return;
            }

            const initialDoorsLen = state.floorPlanLayout.doors.length;
            state.floorPlanLayout.doors = state.floorPlanLayout.doors.filter(
              (d) => d.id !== id,
            );
            if (state.floorPlanLayout.doors.length < initialDoorsLen) {
              state.selectedObjectId = null;
              syncActiveStoreyAndBom(state);
              return;
            }

            const initialWinLen = state.floorPlanLayout.windows.length;
            state.floorPlanLayout.windows =
              state.floorPlanLayout.windows.filter((w) => w.id !== id);
            if (state.floorPlanLayout.windows.length < initialWinLen) {
              state.selectedObjectId = null;
              syncActiveStoreyAndBom(state);
              return;
            }

            const initialRoomLen = state.floorPlanLayout.rooms.length;
            state.floorPlanLayout.rooms = state.floorPlanLayout.rooms.filter(
              (r) => r.id !== id,
            );
            if (state.floorPlanLayout.rooms.length < initialRoomLen) {
              state.selectedObjectId = null;
              syncActiveStoreyAndBom(state);
              return;
            }
          }

          state.selectedObjectId = null;
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

      setWorkspace(ws) {
        set((state) => {
          state.workspace = ws;
        });
      },

      toggleFavoriteModel(id) {
        set((state) => {
          const idx = state.favoriteModelIds.indexOf(id);
          if (idx === -1) {
            state.favoriteModelIds.push(id);
          } else {
            state.favoriteModelIds.splice(idx, 1);
          }
        });
      },

      addUserGeneratedAsset(asset) {
        set((state) => {
          const exists = state.userGeneratedAssets.some(
            (a) => a.id === asset.id,
          );
          if (!exists) {
            state.userGeneratedAssets.push(asset);
          }
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
            state.cameraMode === "perspective" ? "orthographic" : "perspective";
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

      setRoofType(type) {
        set((state) => {
          state.roofType = type;
        });
      },

      setSectionCutHeight(height) {
        set((state) => {
          state.sectionCutHeight = height;
        });
      },

      addDimensionLine(line) {
        set((state) => {
          state.dimensionLines.push(line);
        });
      },

      removeDimensionLine(id) {
        set((state) => {
          state.dimensionLines = state.dimensionLines.filter(
            (l) => l.id !== id,
          );
        });
      },

      setStoreys(storeys) {
        set((state) => {
          state.storeys = storeys;
          if (storeys.length > 0 && !state.activeStoreyId) {
            state.activeStoreyId = storeys[0]?.id || "";
          }
          syncActiveStoreyAndBom(state);
        });
      },

      setActiveStoreyId(id) {
        set((state) => {
          if (state.activeStoreyId && state.floorPlanLayout) {
            const currentStorey = state.storeys.find(
              (s) => s.id === state.activeStoreyId,
            );
            if (currentStorey) {
              currentStorey.floorPlanLayout = state.floorPlanLayout;
            }
          }
          state.activeStoreyId = id;
          const targetStorey = state.storeys.find((s) => s.id === id);
          if (targetStorey) {
            state.floorPlanLayout = targetStorey.floorPlanLayout;
          }
          state.selectedObjectId = null;
        });
      },

      addStorey(name, copyFromActive = false) {
        set((state) => {
          if (state.activeStoreyId && state.floorPlanLayout) {
            const currentStorey = state.storeys.find(
              (s) => s.id === state.activeStoreyId,
            );
            if (currentStorey) {
              currentStorey.floorPlanLayout = state.floorPlanLayout;
            }
          }
          const nextElevation =
            state.storeys.length > 0
              ? Math.max(...state.storeys.map((s) => s.elevation)) + 10
              : 10;
          const levelNum = state.storeys.length + 1;
          const newStoreyId = `storey-${Date.now().toString(36)}-${levelNum}`;
          const newLayout: FloorPlanLayout =
            copyFromActive && state.floorPlanLayout
              ? JSON.parse(JSON.stringify(state.floorPlanLayout))
              : {
                  id: `fp-${Date.now().toString(36)}`,
                  parameters: state.floorPlanLayout?.parameters || {
                    bedrooms: 1,
                    bathrooms: 1,
                    totalArea: 500,
                    floors: 1,
                    style: "open-plan",
                    features: [],
                  },
                  rooms: [],
                  walls: [],
                  doors: [],
                  windows: [],
                  dimensions: state.floorPlanLayout?.dimensions || {
                    width: 40,
                    height: 30,
                  },
                  efficiency: 100,
                  naturalLight: 100,
                  generatedAt: new Date().toISOString(),
                };
          const newStorey: BuildingStorey = {
            id: newStoreyId,
            name: name || `Level ${levelNum}`,
            elevation: nextElevation,
            height: 10,
            slabThickness: 0.8,
            floorPlanLayout: newLayout,
            isVisible: true,
          };
          state.storeys.push(newStorey);
          state.activeStoreyId = newStoreyId;
          state.floorPlanLayout = newLayout;
          syncActiveStoreyAndBom(state);
        });
      },

      duplicateActiveStorey() {
        const active = get().storeys.find((s) => s.id === get().activeStoreyId);
        get().addStorey(`${active?.name || "Level"} Copy`, true);
      },

      removeStorey(id) {
        set((state) => {
          if (state.storeys.length <= 1) return;
          state.storeys = state.storeys.filter((s) => s.id !== id);
          if (state.activeStoreyId === id) {
            state.activeStoreyId = state.storeys[0]?.id || "";
            state.floorPlanLayout = state.storeys[0]?.floorPlanLayout || null;
          }
          syncActiveStoreyAndBom(state);
        });
      },

      toggleStoreyVisibility(id) {
        set((state) => {
          const s = state.storeys.find((storey) => storey.id === id);
          if (s) {
            s.isVisible = s.isVisible === false ? true : false;
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
          syncActiveStoreyAndBom(state);
        });
      },

      updateStaircase(id, updates) {
        set((state) => {
          const stair = state.staircases.find((s) => s.id === id);
          if (stair) {
            Object.assign(stair, updates);
            syncActiveStoreyAndBom(state);
          }
        });
      },

      removeStaircase(id) {
        set((state) => {
          state.staircases = state.staircases.filter((s) => s.id !== id);
          if (state.selectedObjectId === id) {
            state.selectedObjectId = null;
          }
          syncActiveStoreyAndBom(state);
        });
      },

      setSunTime(timeStr) {
        set((state) => {
          state.sunTime = timeStr;
          const [hStr, mStr] = timeStr.split(":");
          const hours =
            parseInt(hStr || "12", 10) + parseInt(mStr || "0", 10) / 60;

          const angle = ((hours - 6) * Math.PI) / 12;
          const altitude = 60 * Math.sin(angle);
          const azimuth = (hours / 24) * 360;

          state.sunAltitude = Math.round(altitude);
          state.sunAzimuth = Math.round(azimuth);
        });
      },

      loadProjectData(layout, sceneObjects, workspace, extra) {
        set((state) => {
          state.projectId = extra?.projectId ?? null;
          state.layoutCandidates = [];
          state.materials = extra?.materials ?? {};
          state.selectedObjectId = null;
          state.staircases = extra?.staircases ?? [];
          state.dimensionLines = extra?.dimensionLines ?? [];
          state.floorPlanLayout = layout;
          state.sceneObjects = sceneObjects || [];
          state.workspace = workspace;
          if (extra?.storeys && extra.storeys.length > 0) {
            state.storeys = extra.storeys;
            state.activeStoreyId =
              extra.activeStoreyId || extra.storeys[0]?.id || "storey-1";
          } else if (layout) {
            state.storeys = [
              {
                id: "storey-1",
                name: "Level 1 - Ground",
                elevation: 0,
                height: 10,
                slabThickness: 0.8,
                floorPlanLayout: layout,
                isVisible: true,
              },
            ];
            state.activeStoreyId = "storey-1";
          } else {
            state.storeys = [];
            state.activeStoreyId = "";
          }
          if (extra?.staircases) {
            state.staircases = extra.staircases;
          }
          if (extra?.dimensionLines) {
            state.dimensionLines = extra.dimensionLines;
          }
          syncActiveStoreyAndBom(state);
        });
        useEditorStore.temporal.getState().clear();
      },

      clearWorkspace() {
        set((state) => {
          const emptyLayout: FloorPlanLayout = {
            id: `empty-plan-${Date.now()}`,
            parameters: {
              bedrooms: 0,
              bathrooms: 0,
              totalArea: 0,
              floors: 1,
              style: "open-plan",
              features: [],
            },
            rooms: [],
            walls: [],
            doors: [],
            windows: [],
            dimensions: { width: 100, height: 100 },
            efficiency: 100,
            naturalLight: 100,
            generatedAt: new Date().toISOString(),
          };
          state.floorPlanLayout = emptyLayout;
          state.storeys = [
            {
              id: "storey-1",
              name: "Level 1 - Ground",
              elevation: 0,
              height: 10,
              slabThickness: 0.8,
              floorPlanLayout: emptyLayout,
              isVisible: true,
            },
          ];
          state.activeStoreyId = "storey-1";
          state.sceneObjects = [];
          state.staircases = [];
          state.dimensionLines = [];
          state.mepNodes = [];
          state.mepEdges = [];
          state.selectedObjectId = null;
          state.bomReport = null;
          state.violations = [];
        });
      },

      setStageViewport(scale, x, y) {
        set((state) => {
          state.stageScale = scale;
          state.stageX = x;
          state.stageY = y;
        });
      },

      togglePresentationMode() {
        set((state) => {
          state.isPresentationMode = !state.isPresentationMode;
        });
      },

      setPresentationMode(val) {
        set((state) => {
          state.isPresentationMode = val;
        });
      },
    })),
    {
      limit: 100,
      equality: (past: HistorySnapshot, current: HistorySnapshot) =>
        past.floorPlanLayout === current.floorPlanLayout &&
        past.storeys === current.storeys &&
        past.activeStoreyId === current.activeStoreyId &&
        past.sceneObjects === current.sceneObjects &&
        past.materials === current.materials &&
        past.staircases === current.staircases &&
        past.dimensionLines === current.dimensionLines,
      partialize: (state) => ({
        floorPlanLayout: state.floorPlanLayout,
        storeys: state.storeys,
        activeStoreyId: state.activeStoreyId,
        sceneObjects: state.sceneObjects,
        materials: state.materials,
        staircases: state.staircases,
        dimensionLines: state.dimensionLines,
      }),
    },
  ),
);

// ─── Atomic Selectors ─────────────────────────────────────────────────────────

export const useEditorMode = () => useEditorStore((s) => s.mode);
export const useEditorTool = () => useEditorStore((s) => s.tool);
export const useSelectedObjectId = () =>
  useEditorStore((s) => s.selectedObjectId);
export const useCameraMode = () => useEditorStore((s) => s.cameraMode);
export const useShowGrid = () => useEditorStore((s) => s.showGrid);
export const useShowMeasurements = () =>
  useEditorStore((s) => s.showMeasurements);
export const useFloorPlanLayout = () =>
  useEditorStore((s) => s.floorPlanLayout);
export const useSceneObjects = () => useEditorStore((s) => s.sceneObjects);
export const useMaterials = () => useEditorStore((s) => s.materials);
export const useBomReport = () => useEditorStore((s) => s.bomReport);
export const useViolations = () => useEditorStore((s) => s.violations);
export const useIsGenerating = () => useEditorStore((s) => s.isGenerating);
