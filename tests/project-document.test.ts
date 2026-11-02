import { beforeEach, expect, it, vi } from "vitest";
import { createDemoProject } from "@/lib/demo-project";
import {
  captureProjectDocument,
  readProjectDocument,
} from "@/lib/project-document";
import { startProjectPersistence } from "@/lib/project-persistence";
import { useEditorStore } from "@/store/useEditorStore";
import { saveProject, loadProject } from "@/lib/puter";

beforeEach(() => {
  localStorage.clear();
  useEditorStore.getState().loadProjectData(null, [], "onboarding");
});
it("migrates legacy records with explicit units and refuses unsupported or corrupt documents", () => {
  const legacy = createDemoProject("legacy");
  expect(readProjectDocument(legacy)).toMatchObject({
    schemaVersion: 1,
    units: { plan: "ft", openings: "in", scene: "m" },
  });
  expect(readProjectDocument({ ...legacy, schemaVersion: 2 })).toBeNull();
  const broken = structuredClone(legacy);
  broken.floorPlanData!.doors[0]!.wallId = "missing";
  expect(readProjectDocument(broken)).toBeNull();
  broken.floorPlanData!.walls[0]!.end.x = Infinity;
  expect(readProjectDocument(broken)).toBeNull();
});
it("captures one current active-storey layout with materials and all other levels", () => {
  const project = createDemoProject("levels");
  useEditorStore
    .getState()
    .loadProjectData(
      project.floorPlanData!,
      project.sceneData!.objects,
      "manual",
      { projectId: project.id },
    );
  useEditorStore.getState().addStorey("Upper floor", true);
  const state = useEditorStore.getState();
  const snapshot = captureProjectDocument(state);
  expect(snapshot.sceneData.storeys).toHaveLength(2);
  expect(
    snapshot.sceneData.storeys.find(
      (level) => level.id === state.activeStoreyId,
    )?.floorPlanLayout,
  ).toBe(snapshot.floorPlanData);
});
it("uses one save path for changes from all tools, skips view changes, and retries failed writes", async () => {
  const project = createDemoProject("saving");
  await saveProject(project);
  useEditorStore
    .getState()
    .loadProjectData(
      project.floorPlanData!,
      project.sceneData!.objects,
      "manual",
      { projectId: project.id },
    );
  const save = vi.fn().mockReturnValueOnce(false).mockReturnValue(true);
  const stop = startProjectPersistence(useEditorStore, save);
  try {
    useEditorStore.getState().setMode("3d");
    useEditorStore.getState().setSelectedObject("south");
    expect(save).not.toHaveBeenCalled();
    useEditorStore.getState().updateWall("south", { color: "#81604c" });
    expect(save).toHaveBeenCalledTimes(1);
    useEditorStore.getState().setMode("walk");
    expect(save).toHaveBeenCalledTimes(2);
    useEditorStore.getState().setMode("2d");
    expect(save).toHaveBeenCalledTimes(2);
  } finally {
    stop();
  }
});
it("does not overwrite an unsupported document while loading or listing it", async () => {
  const record = { ...createDemoProject("future"), schemaVersion: 8 };
  const raw = JSON.stringify(record);
  localStorage.setItem("domus:local:v1:domus:project:future", raw);
  expect(await loadProject("future")).toBeNull();
  expect(localStorage.getItem("domus:local:v1:domus:project:future")).toBe(raw);
});
it("rebuilds quantity analysis after undo and redo without adding extra history", () => {
  const project = createDemoProject("history");
  useEditorStore
    .getState()
    .loadProjectData(
      project.floorPlanData!,
      project.sceneData!.objects,
      "manual",
    );
  const before = useEditorStore.getState().bomReport;
  useEditorStore.getState().updateWall("south", { height: 12 });
  const after = useEditorStore.getState().bomReport;
  expect(after).not.toEqual(before);
  useEditorStore.getState().undoDocument();
  expect({ ...useEditorStore.getState().bomReport, generatedAt: before?.generatedAt }).toEqual(before);
  useEditorStore.getState().redoDocument();
  expect({ ...useEditorStore.getState().bomReport, generatedAt: after?.generatedAt }).toEqual(after);
});
