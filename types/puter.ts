/**
 * Domus domain types
 */

// ─── Puter User ───────────────────────────────────────────────────────────────

export interface PuterUser {
  uuid: string;
  username: string;
  email?: string;
  confirmed?: boolean;
}

// ─── Project ──────────────────────────────────────────────────────────────────

export type ProjectType =
  | "floor-plan"
  | "bim-model"
  | "ar-scan"
  | "material-lab"
  | "furniture"
  | "comparison";

export type ProjectVisibility = "private" | "public";

export interface ProjectThumbnail {
  url: string;
  width: number;
  height: number;
}

export interface ProjectStats {
  likes: number;
  views: number;
  forks: number;
}

export interface PuterProject {
  id: string;
  ownerId: string;
  ownerUsername: string;
  title: string;
  description: string;
  type: ProjectType;
  isPublic: boolean;
  thumbnail?: ProjectThumbnail;
  tags: string[];
  stats: ProjectStats;
  createdAt: string;
  updatedAt: string;
  // Spatial data
  floorPlanData?: FloorPlanLayout;
  sceneData?: SceneSnapshot;
}

// ─── Floor Plan ───────────────────────────────────────────────────────────────

export interface Room {
  id: string;
  type: RoomType;
  label: string;
  bounds: Rect2D;
  area: number; // sq ft
  color?: string;
  ceilingHeight?: number; // meters
}

export type RoomType =
  | "bedroom"
  | "bathroom"
  | "living"
  | "kitchen"
  | "dining"
  | "hallway"
  | "office"
  | "garage"
  | "storage"
  | "outdoor"
  | "utility";

export interface Wall {
  id: string;
  start: Vec2D;
  end: Vec2D;
  thickness: number; // inches
  height: number; // feet
  isLoadBearing: boolean;
}

export interface Door {
  id: string;
  wallId: string;
  position: number; // 0–1 along wall
  width: number; // inches
  isExterior: boolean;
}

export interface Window2D {
  id: string;
  wallId: string;
  position: number;
  width: number; // inches
  height: number; // inches
  sillHeight: number; // inches from floor
}

export interface FloorPlanParameters {
  bedrooms: number;
  bathrooms: number;
  totalArea: number; // sq ft
  floors: number;
  style: "open-plan" | "traditional" | "l-shape" | "studio";
  features: string[];
}

export interface FloorPlanLayout {
  id: string;
  parameters: FloorPlanParameters;
  rooms: Room[];
  walls: Wall[];
  doors: Door[];
  windows: Window2D[];
  dimensions: { width: number; height: number }; // feet
  efficiency: number; // 0–100
  naturalLight: number; // 0–100
  generatedAt: string;
}

// ─── BOM & Compliance ─────────────────────────────────────────────────────────

export interface BomItem {
  category: string;
  name: string;
  quantity: number;
  unit: string;
  estimatedCost?: number;
}

export interface ComplianceViolation {
  code: string;
  severity: "error" | "warning" | "info";
  message: string;
  elementId?: string;
  recommendation: string;
}

export interface BomReport {
  items: BomItem[];
  totalEstimatedCost?: number;
  currency: "USD";
  generatedAt: string;
}

// ─── Materials ────────────────────────────────────────────────────────────────

export interface PbrTexture {
  map?: string;
  normalMap?: string;
  roughnessMap?: string;
  metalnessMap?: string;
  aoMap?: string;
  displacementMap?: string;
}

export interface Material {
  id: string;
  name: string;
  prompt: string;
  texture: PbrTexture;
  roughness: number;
  metalness: number;
  generatedAt: string;
}

// ─── Scene ────────────────────────────────────────────────────────────────────

export interface SceneObject {
  id: string;
  type: "wall" | "floor" | "ceiling" | "furniture" | "window" | "door" | "light";
  name: string;
  position: Vec3D;
  rotation: Vec3D;
  scale: Vec3D;
  materialId?: string;
  gltfPath?: string;
}

export interface SceneSnapshot {
  id: string;
  objects: SceneObject[];
  cameraPosition: Vec3D;
  cameraTarget: Vec3D;
  createdAt: string;
}

// ─── Geometry Primitives ──────────────────────────────────────────────────────

export interface Vec2D {
  x: number;
  y: number;
}

export interface Vec3D {
  x: number;
  y: number;
  z: number;
}

export interface Rect2D {
  x: number;
  y: number;
  width: number;
  height: number;
}

// ─── API Responses ────────────────────────────────────────────────────────────

export interface ApiSuccess<T> {
  ok: true;
  data: T;
}

export interface ApiError {
  ok: false;
  error: string;
  code?: string;
}

export type ApiResult<T> = ApiSuccess<T> | ApiError;

// ─── Editor State ─────────────────────────────────────────────────────────────

export type EditorMode = "2d" | "3d" | "ar";
export type EditorWorkspace = "onboarding" | "manual" | "generative";
export type EditorTool =
  | "select"
  | "move"
  | "rotate"
  | "scale"
  | "draw-wall"
  | "add-room"
  | "add-window"
  | "add-door"
  | "place-furniture"
  | "measure"
  | "camera";

// ─── Dimension Line ───────────────────────────────────────────────────────────

export interface DimensionLine {
  id: string;
  start: Vec3D;
  end: Vec3D;
  label: string;
}

// ─── Staircase & Ramps ────────────────────────────────────────────────────────

export interface Staircase {
  id: string;
  startStoreyId: string;
  endStoreyId: string;
  width: number; // inches
  riserCount: number;
  riserHeight: number; // inches
  position: Vec3D;
  rotation: Vec3D;
  type: "straight" | "l-shape" | "spiral";
}

// ─── Building Storeys (Multi-floor) ──────────────────────────────────────────

export interface BuildingStorey {
  id: string;
  name: string;
  elevation: number; // feet
  floorPlanLayout: FloorPlanLayout;
}

// ─── MEP (Mechanical, Electrical, Plumbing) Layers ──────────────────────────

export interface MEPNode {
  id: string;
  type: "electrical" | "plumbing" | "hvac";
  system: "power" | "data" | "supply" | "drain" | "air";
  position: Vec3D; // in meters
  label: string;
}

export interface MEPEdge {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  type: "wire" | "pipe" | "duct";
  path: Vec3D[]; // 3D path routing in meters
}
