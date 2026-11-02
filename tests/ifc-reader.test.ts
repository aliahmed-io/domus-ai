// @vitest-environment node
import { expect, it } from "vitest";
import {
  IfcAPI,
  IFCWALL,
  IFCBUILDINGSTOREY,
  IFCRELVOIDSELEMENT,
  IFCRELFILLSELEMENT,
} from "web-ifc";
import { generateFloorPlanIFC } from "@/lib/export/floor-plan-ifc";
import { createDemoProject } from "@/lib/demo-project";

it("opens the exported sample in an independent IFC reader and builds its wall geometry", async () => {
  const project = createDemoProject("reader-test");
  const api = new IfcAPI();
  await api.Init();
  const model = api.OpenModel(
    new TextEncoder().encode(generateFloorPlanIFC(project.floorPlanData!)),
  );
  try {
    expect(api.GetLineIDsWithType(model, IFCWALL).size()).toBe(
      project.floorPlanData!.walls.length,
    );
    expect(api.GetLineIDsWithType(model, IFCBUILDINGSTOREY).size()).toBe(1);
    const openings =
      project.floorPlanData!.doors.length +
      project.floorPlanData!.windows.length;
    expect(api.GetLineIDsWithType(model, IFCRELVOIDSELEMENT).size()).toBe(
      openings,
    );
    expect(api.GetLineIDsWithType(model, IFCRELFILLSELEMENT).size()).toBe(
      openings,
    );
    let meshes = 0;
    api.StreamAllMeshesWithTypes(model, [IFCWALL], (mesh) => {
      if (mesh.geometries.size() > 0) meshes++;
    });
    expect(meshes).toBe(project.floorPlanData!.walls.length);
  } finally {
    api.CloseModel(model);
    api.Dispose();
  }
}, 30000);
