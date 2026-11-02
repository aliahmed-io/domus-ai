import { beforeEach, expect, it } from "vitest";
import { jsPDF } from "jspdf";
import { createDemoProject } from "@/lib/demo-project";
import { useEditorStore } from "@/store/useEditorStore";
import { saveProject, loadProject, saveProjectSnapshot } from "@/lib/puter";
import { PBR_PRESETS } from "@/lib/materials/pbr-preset-catalog";
import { appendPlanPage } from "@/lib/export/plan-page";
import { vectorizeBlueprintImage } from "@/lib/blueprint-vectorizer";
import { detectAllRooms } from "@/lib/room-detection";
import { generateFloorPlanDXF } from "@/lib/export/floor-plan-dxf";

beforeEach(() => {
  localStorage.clear();
  useEditorStore.getState().loadProjectData(null, [], "onboarding");
});

it("can edit the furnished sample, undo, redo, and save its finish with its project", async () => {
  const project = createDemoProject("demo");
  await saveProject(project);
  useEditorStore
    .getState()
    .loadProjectData(
      project.floorPlanData!,
      project.sceneData!.objects,
      "manual",
      { projectId: project.id },
    );
  useEditorStore.getState().updateWall("south", { color: "#4f5d54" });
  expect(useEditorStore.getState().floorPlanLayout!.walls[0]!.color).toBe(
    "#4f5d54",
  );
  // View and selection changes must not consume geometry undo steps.
  useEditorStore.getState().setTool("select");
  useEditorStore.getState().setSelectedObject("south");
  useEditorStore.getState().setMode("3d");
  useEditorStore.temporal.getState().undo();
  expect(useEditorStore.getState().floorPlanLayout!.walls[0]!.color).toBe(
    "#e3ded7",
  );
  useEditorStore.temporal.getState().redo();
  expect(useEditorStore.getState().floorPlanLayout!.walls[0]!.color).toBe(
    "#4f5d54",
  );
  const finish = PBR_PRESETS["Forest Siding"]!;
  useEditorStore.getState().setMaterial("south", finish);
  const state = useEditorStore.getState();
  expect(
    saveProjectSnapshot(
      project.id,
      {
        floorPlanData: state.floorPlanLayout!,
        sceneData: { ...project.sceneData!, materials: state.materials },
      },
      "manual",
    ),
  ).toBe(true);
  const restored = await loadProject(project.id);
  useEditorStore
    .getState()
    .loadProjectData(
      restored!.floorPlanData!,
      restored!.sceneData!.objects,
      "manual",
      { materials: restored!.sceneData!.materials, projectId: restored!.id },
    );
  expect(useEditorStore.getState().materials.south).toEqual(finish);
  useEditorStore.getState().loadProjectData(null, [], "onboarding");
  expect(useEditorStore.getState().materials).toEqual({});
  expect(useEditorStore.getState().sceneObjects).toEqual([]);
  expect(useEditorStore.temporal.getState().pastStates).toEqual([]);
});

it("exports a real labelled plan sheet and wall geometry from the example", () => {
  const layout = createDemoProject("export").floorPlanData!;
  const doc = new jsPDF();
  appendPlanPage(doc, layout);
  expect(doc.getNumberOfPages()).toBe(2);
  const pdf = doc.output();
  expect(pdf).toMatch(/^%PDF-/);
  expect(pdf).toContain("Floor plan");
  expect(pdf).toContain("Bedroom");
  // Read DXF group-code pairs independently of the exporter.
  const lines = generateFloorPlanDXF(layout).trim().split(/\r?\n/);
  const pairs: [number, string][] = [];
  for (let i = 0; i < lines.length - 1; i += 2)
    pairs.push([Number(lines[i]!.trim()), lines[i + 1]!.trim()]);
  expect(pairs.some(([code, value]) => code === 0 && value === "LINE")).toBe(
    true,
  );
  expect(pairs.some(([code, value]) => code === 8 && value === "A-WALL")).toBe(
    true,
  );
  expect(
    pairs.some(([code, value]) => code === 10 && Number(value) === 12),
  ).toBe(true);
});

it("traces a clean image using the explicitly supplied image width scale", async () => {
  const width = 640,
    height = 480;
  const data = new Uint8ClampedArray(width * height * 4).fill(255);
  function line(x1: number, y1: number, x2: number, y2: number) {
    for (let y = y1; y <= y2; y++)
      for (let x = x1; x <= x2; x++) {
        const i = (y * width + x) * 4;
        data[i] = data[i + 1] = data[i + 2] = 0;
      }
  }
  line(76, 66, 564, 74);
  line(76, 386, 564, 394);
  line(76, 66, 84, 394);
  line(556, 66, 564, 394);
  const result = await vectorizeBlueprintImage(
    { width, height, data } as ImageData,
    { calibrationFeet: 32, calibrationPixels: 640 },
  );
  expect(result.wallCount).toBeGreaterThanOrEqual(4);
  const xs = result.layout.walls.flatMap((wall) => [wall.start.x, wall.end.x]);
  // Raster strokes and scan spacing introduce roughly half a foot of edge uncertainty.
  expect(Math.abs(Math.max(...xs) - Math.min(...xs) - 24.4)).toBeLessThan(0.6);
});

it("keeps existing room names when tracing the example wall network", () => {
  const layout = createDemoProject("rooms").floorPlanData!;
  const rooms = detectAllRooms(layout.walls, layout.rooms);
  expect(rooms.map((room) => room.label)).toContain("Bedroom");
  expect(rooms.map((room) => room.label)).toContain("Living & kitchen");
});

it("rejects blank blueprint images instead of inventing geometry", async () => {
  const data = new Uint8ClampedArray(200 * 200 * 4).fill(255);
  await expect(
    vectorizeBlueprintImage({ width: 200, height: 200, data } as ImageData, { calibrationFeet: 20, calibrationPixels: 140 }),
  ).rejects.toThrow("No clear wall network");
});

it("requires a measured scale instead of guessing a building size", async () => {
  const data = new Uint8ClampedArray(200 * 200 * 4).fill(255);
  await expect(vectorizeBlueprintImage({ width: 200, height: 200, data } as ImageData))
    .rejects.toThrow("Set two calibration points");
});
