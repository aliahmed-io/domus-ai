import { beforeEach, expect, it } from "vitest";
import { useEditorStore } from "@/store/useEditorStore";
import { createDemoProject } from "@/lib/demo-project";
import { belongsToFloor, stairsToNextFloor, stairOpening } from "@/lib/building-levels";
import { captureProjectDocument, readProjectDocument } from "@/lib/project-document";

beforeEach(() => {
  const project = createDemoProject("floors");
  useEditorStore.getState().loadProjectData(project.floorPlanData!, project.sceneData!.objects, "manual", { projectId: project.id });
});
it("copies independent geometry, switches floors, and keeps furniture on its assigned level after reload", () => {
  const ground = useEditorStore.getState().activeStoreyId;
  const original = useEditorStore.getState().floorPlanLayout!;
  useEditorStore.getState().duplicateActiveStorey();
  const upper = useEditorStore.getState().activeStoreyId;
  const copy = useEditorStore.getState().floorPlanLayout!;
  expect(copy.id).not.toBe(original.id);
  expect(copy.walls.map(w => w.id).some(id => original.walls.some(w => w.id === id))).toBe(false);
  expect(copy.doors.every(d => copy.walls.some(w => w.id === d.wallId))).toBe(true);
  expect(useEditorStore.getState().sceneObjects.every(o => belongsToFloor(o, ground))).toBe(true);
  const chair = { ...useEditorStore.getState().sceneObjects[0]!, id: "upper-chair", storeyId: upper };
  useEditorStore.getState().addSceneObject(chair);
  useEditorStore.getState().updateWall(copy.walls[0]!.id, { color: "#123456" });
  useEditorStore.getState().setActiveStoreyId(ground);
  expect(useEditorStore.getState().floorPlanLayout!.walls[0]!.color).not.toBe("#123456");
  const data = captureProjectDocument(useEditorStore.getState());
  expect(readProjectDocument({ ...createDemoProject("floors"), ...data })).not.toBeNull();
  useEditorStore.getState().loadProjectData(data.floorPlanData!, data.sceneData.objects, "manual", data.sceneData);
  useEditorStore.getState().setActiveStoreyId(upper);
  expect(useEditorStore.getState().floorPlanLayout!.walls[0]!.color).toBe("#123456");
  expect(useEditorStore.getState().sceneObjects.filter(o => belongsToFloor(o, upper))).toHaveLength(1);
});
it("connects stairs to the actual next floor with a matching total rise, and removes dependants when a floor is deleted", () => {
  const ground = useEditorStore.getState().activeStoreyId;
  expect(stairsToNextFloor(useEditorStore.getState().storeys, ground, 1, 1)).toBeNull();
  useEditorStore.getState().duplicateActiveStorey();
  const upper = useEditorStore.getState().activeStoreyId;
  const stair = stairsToNextFloor(useEditorStore.getState().storeys, ground, 1, 1)!;
  expect(stair.endStoreyId).toBe(upper);
  expect(stair.riserCount * stair.riserHeight).toBeCloseTo(120);
  useEditorStore.getState().addStaircase(stair);
  useEditorStore.getState().addSceneObject({ ...useEditorStore.getState().sceneObjects[0]!, id: "upper-chair", storeyId: upper });
  useEditorStore.getState().removeStorey(upper);
  expect(useEditorStore.getState().staircases).toHaveLength(0);
  expect(useEditorStore.getState().sceneObjects.some(o => o.id === "upper-chair")).toBe(false);
  useEditorStore.getState().undoDocument();
  expect(useEditorStore.getState().storeys).toHaveLength(2);
  expect(useEditorStore.getState().staircases).toHaveLength(1);
  expect(useEditorStore.getState().sceneObjects.some(o => o.id === "upper-chair")).toBe(true);
});
it("places a new floor above the existing floor height rather than assuming ten feet", () => {
  const levels = structuredClone(useEditorStore.getState().storeys);
  levels[0]!.height = 12;
  useEditorStore.getState().setStoreys(levels);
  useEditorStore.getState().addStorey();
  expect(useEditorStore.getState().storeys[1]!.elevation).toBe(12);
});

it("activates drawing tools from a 3D view without resetting them to selection", () => {
  useEditorStore.getState().setMode("3d");
  useEditorStore.getState().setTool("add-stair");
  expect(useEditorStore.getState().mode).toBe("2d");
  expect(useEditorStore.getState().tool).toBe("add-stair");
});

it("centers the slab opening over the stair run and rotates the offset with the stair", () => {
  useEditorStore.getState().duplicateActiveStorey();
  const stair = stairsToNextFloor(useEditorStore.getState().storeys, "storey-1", 2, 5)!;
  const opening = stairOpening(stair);
  expect(opening.x).toBe(2);
  expect(opening.z).toBeCloseTo(5 - (stair.riserCount - 1) * 0.28 / 2);
  stair.rotation.y = Math.PI / 2;
  const rotated = stairOpening(stair);
  expect(rotated.z).toBeCloseTo(5);
  expect(rotated.x).toBeLessThan(2);
  expect(rotated.depth).toBe(opening.depth);
});
