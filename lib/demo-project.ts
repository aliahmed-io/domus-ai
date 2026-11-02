import type { PuterProject } from "@/types/puter";

/** A deterministic, furnished plan for a portfolio walkthrough. Coordinates are feet; scene objects use metres. */
export function createDemoProject(id = crypto.randomUUID()): PuterProject {
  const now = new Date().toISOString();
  const project: PuterProject = {
    id,
    ownerId: "local-workshop",
    ownerUsername: "Designer",
    title: "The Sunday apartment",
    description:
      "A furnished example to explore walls, openings, materials, and exports.",
    type: "floor-plan",
    isPublic: false,
    tags: ["demo", "workspace-manual"],
    stats: { views: 0, likes: 0, forks: 0 },
    createdAt: now,
    updatedAt: now,
    floorPlanData: {
      id: `layout-${id}`,
      parameters: {
        bedrooms: 1,
        bathrooms: 1,
        totalArea: 432,
        floors: 1,
        style: "open-plan",
        features: [],
      },
      dimensions: { width: 24, height: 18 },
      efficiency: 85,
      naturalLight: 80,
      generatedAt: now,
      walls: [
        { id: "south", start: { x: 0, y: 0 }, end: { x: 15, y: 0 } },
        { id: "south-bed", start: { x: 15, y: 0 }, end: { x: 24, y: 0 } },
        { id: "east", start: { x: 24, y: 0 }, end: { x: 24, y: 11 } },
        { id: "east-bath", start: { x: 24, y: 11 }, end: { x: 24, y: 18 } },
        { id: "north", start: { x: 24, y: 18 }, end: { x: 15, y: 18 } },
        { id: "north-living", start: { x: 15, y: 18 }, end: { x: 0, y: 18 } },
        { id: "west", start: { x: 0, y: 18 }, end: { x: 0, y: 0 } },
        { id: "partition", start: { x: 15, y: 0 }, end: { x: 15, y: 11 } },
        {
          id: "partition-bath",
          start: { x: 15, y: 11 },
          end: { x: 15, y: 18 },
        },
        { id: "bath", start: { x: 15, y: 11 }, end: { x: 24, y: 11 } },
      ].map((wall) => ({
        ...wall,
        height: 9,
        thickness: 6,
        isLoadBearing: !["partition", "bath"].includes(wall.id),
        color: "#e3ded7",
      })),
      rooms: [
        {
          id: "living",
          type: "living",
          label: "Living & kitchen",
          bounds: { x: 0, y: 0, width: 15, height: 18 },
          area: 270,
        },
        {
          id: "bedroom",
          type: "bedroom",
          label: "Bedroom",
          bounds: { x: 15, y: 0, width: 9, height: 11 },
          area: 99,
        },
        {
          id: "bathroom",
          type: "bathroom",
          label: "Bathroom",
          bounds: { x: 15, y: 11, width: 9, height: 7 },
          area: 63,
        },
      ],
      doors: [
        {
          id: "entry",
          wallId: "west",
          position: 0.3,
          width: 36,
          isExterior: true,
        },
        {
          id: "bed-door",
          wallId: "partition",
          position: 0.35,
          width: 32,
          isExterior: false,
        },
        {
          id: "bath-door",
          wallId: "bath",
          position: 0.5,
          width: 32,
          isExterior: false,
        },
      ],
      windows: [
        {
          id: "living-window",
          wallId: "south",
          position: 0.3,
          width: 60,
          height: 48,
          sillHeight: 30,
        },
        {
          id: "bed-window",
          wallId: "east",
          position: 0.3,
          width: 48,
          height: 48,
          sillHeight: 30,
        },
      ],
    },
    sceneData: {
      id: `scene-${id}`,
      cameraPosition: { x: 9, y: 8, z: 10 },
      cameraTarget: { x: 3, y: 0, z: 3 },
      createdAt: now,
      materials: {},
      objects: [
        {
          id: "demo-sofa",
          name: "Living sofa",
          x: 1.5,
          z: 1.7,
          asset: "loungeSofa",
        },
        {
          id: "demo-table",
          name: "Coffee table",
          x: 2.5,
          z: 2.5,
          asset: "tableCoffee",
        },
        {
          id: "demo-bed",
          name: "Double bed",
          x: 5.8,
          z: 1.5,
          asset: "bedDouble",
        },
      ].map((item) => ({
        id: item.id,
        name: item.name,
        type: "furniture",
        storeyId: "storey-1",
        position: { x: item.x, y: 0, z: item.z },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
        gltfPath: `/models/kenney_furniture-kit/models/${item.asset}.glb`,
        attachmentType: "floor",
      })),
    },
  };
  // Centre the example on the editor origin so the whole room is visible on entry.
  for (const wall of project.floorPlanData!.walls) {
    wall.start.x -= 12;
    wall.end.x -= 12;
    wall.start.y -= 9;
    wall.end.y -= 9;
  }
  for (const room of project.floorPlanData!.rooms) {
    room.bounds.x -= 12;
    room.bounds.y -= 9;
  }
  for (const item of project.sceneData!.objects) {
    item.position.x -= 12 * 0.3048;
    item.position.z -= 9 * 0.3048;
  }
  return project;
}
