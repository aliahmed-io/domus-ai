import { z } from "zod";
import type {
  PuterProject,
  FloorPlanLayout,
  SceneObject,
  Material,
  BuildingStorey,
  Staircase,
  DimensionLine,
  EditorWorkspace,
} from "@/types/puter";

export const DOCUMENT_UNITS = {
  plan: "ft",
  openings: "in",
  scene: "m",
} as const;
const number = z.number().finite();
const point = z.object({ x: number, y: number }).passthrough();
const point3 = point.extend({ z: number });
const wall = z
  .object({
    id: z.string().min(1),
    start: point,
    end: point,
    thickness: number.positive(),
    height: number.positive(),
  })
  .passthrough();
const opening = z
  .object({
    id: z.string().min(1),
    wallId: z.string().min(1),
    position: number.min(0).max(1),
    width: number.positive(),
  })
  .passthrough();
const layout = z
  .object({
    blueprint: z
      .object({
        imageDataUrl: z
          .string()
          .startsWith("data:image/png;base64,")
          .max(2_000_000),
        widthPixels: number.positive(),
        heightPixels: number.positive(),
        pixelsPerFoot: number.positive(),
        opacity: number.min(0).max(1),
      })
      .optional(),
    id: z.string(),
    walls: z.array(wall),
    doors: z.array(opening),
    windows: z.array(opening),
    rooms: z.array(
      z
        .object({
          id: z.string(),
          label: z.string(),
          bounds: z
            .object({
              x: number,
              y: number,
              width: number.positive(),
              height: number.positive(),
            })
            .passthrough(),
          area: number.nonnegative(),
        })
        .passthrough(),
    ),
    parameters: z.object({ bedrooms: number.nonnegative(), bathrooms: number.nonnegative(), totalArea: number.nonnegative(), floors: number.positive(), style: z.enum(["open-plan", "traditional", "l-shape", "studio"]), features: z.array(z.string()) }).passthrough(),
    dimensions: z.object({
      width: number.positive(),
      height: number.positive(),
    }),
  })
  .passthrough()
  .superRefine((value, ctx) => {
    const ids = new Set(value.walls.map((item) => item.id));
    if (ids.size !== value.walls.length)
      ctx.addIssue({ code: "custom", message: "Wall IDs must be unique." });
    for (const item of [...value.doors, ...value.windows])
      if (!ids.has(item.wallId))
        ctx.addIssue({
          code: "custom",
          message: "An opening refers to a missing wall.",
        });
  });
const scene = z
  .object({
    id: z.string(),
    createdAt: z.string(),
    cameraPosition: point3,
    cameraTarget: point3,
    objects: z.array(
      z
        .object({
          id: z.string(),
          name: z.string(),
          type: z.string(),
          position: point3,
          rotation: point3,
          scale: point3,
        })
        .passthrough(),
    ),
    materials: z
      .record(
        z.string(),
        z
          .object({
            id: z.string(),
            name: z.string(),
            texture: z.object({}).passthrough(),
            roughness: number.min(0).max(1),
            metalness: number.min(0).max(1),
          })
          .passthrough(),
      )
      .optional(),
    storeys: z
      .array(
        z
          .object({
            id: z.string(),
            name: z.string(),
            elevation: number,
            height: number.positive(),
            slabThickness: number.nonnegative(),
            floorPlanLayout: layout,
          })
          .passthrough(),
      )
      .optional(),
  })
  .passthrough();
const projectSchema = z
  .object({
    schemaVersion: z.literal(1).optional(),
    units: z
      .object({
        plan: z.literal("ft"),
        openings: z.literal("in"),
        scene: z.literal("m"),
      })
      .optional(),
    id: z.string().min(1),
    title: z.string(),
    type: z.enum([
      "floor-plan",
      "bim-model",
      "ar-scan",
      "material-lab",
      "furniture",
      "comparison",
    ]),
    ownerId: z.string(),
    ownerUsername: z.string(),
    description: z.string(),
    isPublic: z.boolean(),
    tags: z.array(z.string()),
    createdAt: z.string(),
    updatedAt: z.string(),
    stats: z
      .object({ views: number, likes: number, forks: number })
      .passthrough(),
    floorPlanData: layout.optional(),
    sceneData: scene.optional(),
  })
  .passthrough();

/** Parse legacy records without silently accepting future versions or broken geometry. */
export function readProjectDocument(value: unknown): PuterProject | null {
  const result = projectSchema.safeParse(value);
  if (!result.success) return null;
  return {
    ...result.data,
    schemaVersion: 1,
    units: DOCUMENT_UNITS,
  } as PuterProject;
}

export interface EditorDocumentState {
  projectId: string | null;
  workspace: EditorWorkspace;
  floorPlanLayout: FloorPlanLayout | null;
  sceneObjects: SceneObject[];
  materials: Record<string, Material>;
  storeys: BuildingStorey[];
  activeStoreyId: string;
  staircases: Staircase[];
  dimensionLines: DimensionLine[];
}
export function captureProjectDocument(state: EditorDocumentState) {
  const storeys = state.storeys.map((storey) =>
    storey.id === state.activeStoreyId && state.floorPlanLayout
      ? { ...storey, floorPlanLayout: state.floorPlanLayout }
      : storey,
  );
  return {
    floorPlanData: state.floorPlanLayout ?? undefined,
    sceneData: {
      id: `scene-${state.projectId}`,
      objects: state.sceneObjects,
      materials: state.materials,
      cameraPosition: { x: 0, y: 5, z: 10 },
      cameraTarget: { x: 0, y: 0, z: 0 },
      createdAt: new Date(0).toISOString(),
      storeys,
      activeStoreyId: state.activeStoreyId,
      staircases: state.staircases,
      dimensionLines: state.dimensionLines,
    },
  };
}
