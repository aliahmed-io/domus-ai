import type {
  FloorPlanLayout,
  BuildingStorey,
  Wall,
  Door,
  Window2D,
} from "@/types/puter";
// Preserve geometric precision in exported model coordinates.
const feetToMeters = (feet: number) => feet * 0.3048;

/** IFC4 export. Regression fixtures are read and meshed with web-ifc; universal CAD compatibility is not assumed. */
export function generateFloorPlanIFC(
  layout: FloorPlanLayout,
  storeys?: BuildingStorey[],
): string {
  let entityId = 1;
  const nextId = () => entityId++;

  let step = `ISO-10303-21;
HEADER;
FILE_DESCRIPTION(('Domus AI Spatial CAD - OpenBIM IFC4 Commercial Export'),'2;1');
FILE_NAME('Domus_BIM_Project.ifc','${new Date().toISOString()}',('Domus AI Team'),('Advanced Architectural Computing'),'Domus Spatial Studio','Domus IFC4 Engine','');
FILE_SCHEMA(('IFC4'));
ENDSEC;
DATA;
`;

  // ── 1. Core Metadata & Ownership ──
  const idPerson = nextId();
  step += `#${idPerson}=IFCPERSON($,'Architect',$,$,$,$,$,$);\n`;
  const idOrg = nextId();
  step += `#${idOrg}=IFCORGANIZATION($,'Domus AI Spatial Architecture',$,$,$);\n`;
  const idPersonOrg = nextId();
  step += `#${idPersonOrg}=IFCPERSONANDORGANIZATION(#${idPerson},#${idOrg},$);\n`;
  const idApp = nextId();
  step += `#${idApp}=IFCAPPLICATION(#${idOrg},'2.0','Domus AI Spatial Studio','DomusCAD');\n`;
  const idOwnerHist = nextId();
  step += `#${idOwnerHist}=IFCOWNERHISTORY(#${idPersonOrg},#${idApp},$,.ADDED.,$,$,$,1780000000);\n`;

  // ── 2. Units Definition (SI Metres & Square Metres) ──
  const idDimExp = nextId();
  step += `#${idDimExp}=IFCDIMENSIONALEXPONENTS(0,0,0,0,0,0,0);\n`;
  const idSiLength = nextId();
  step += `#${idSiLength}=IFCSIUNIT(*,.LENGTHUNIT.,$,.METRE.);\n`;
  const idSiArea = nextId();
  step += `#${idSiArea}=IFCSIUNIT(*,.AREAUNIT.,$,.SQUARE_METRE.);\n`;
  const idSiVol = nextId();
  step += `#${idSiVol}=IFCSIUNIT(*,.VOLUMEUNIT.,$,.CUBIC_METRE.);\n`;
  const idUnitAssign = nextId();
  step += `#${idUnitAssign}=IFCUNITASSIGNMENT((#${idSiLength},#${idSiArea},#${idSiVol}));\n`;

  // ── 3. Geometric Representation Context ──
  const idWorldPoint = nextId();
  step += `#${idWorldPoint}=IFCCARTESIANPOINT((0.,0.,0.));\n`;
  const idAxisZ = nextId();
  step += `#${idAxisZ}=IFCDIRECTION((0.,0.,1.));\n`;
  const idAxisX = nextId();
  step += `#${idAxisX}=IFCDIRECTION((1.,0.,0.));\n`;
  const idWorldCoord = nextId();
  step += `#${idWorldCoord}=IFCAXIS2PLACEMENT3D(#${idWorldPoint},#${idAxisZ},#${idAxisX});\n`;
  const idModelContext = nextId();
  step += `#${idModelContext}=IFCGEOMETRICREPRESENTATIONCONTEXT($,'Model',3,1.E-05,#${idWorldCoord},$);\n`;

  // ── 4. Spatial Hierarchy: Project -> Site -> Building ──
  const idProject = nextId();
  step += `#${idProject}=IFCPROJECT('${generateIfcGuid()}',#${idOwnerHist},'Domus Spatial Project',$,$,$,$,(#${idModelContext}),#${idUnitAssign});\n`;

  const idSitePlacement = nextId();
  step += `#${idSitePlacement}=IFCLOCALPLACEMENT($,#${idWorldCoord});\n`;
  const idSite = nextId();
  step += `#${idSite}=IFCSITE('${generateIfcGuid()}',#${idOwnerHist},'Site-1','Domus Development Site',$,#${idSitePlacement},$,$,.ELEMENT.,$,$,$,$,$);\n`;

  const idBldgPlacement = nextId();
  step += `#${idBldgPlacement}=IFCLOCALPLACEMENT(#${idSitePlacement},#${idWorldCoord});\n`;
  const idBuilding = nextId();
  step += `#${idBuilding}=IFCBUILDING('${generateIfcGuid()}',#${idOwnerHist},'Domus Main Residence',$,$,#${idBldgPlacement},$,$,.ELEMENT.,$,$,$);\n`;

  // Link Project -> Site, and Site -> Building
  const idRelAggProject = nextId();
  step += `#${idRelAggProject}=IFCRELAGGREGATES('${generateIfcGuid()}',#${idOwnerHist},'ProjectToSite',$,#${idProject},(#${idSite}));\n`;
  const idRelAggSite = nextId();
  step += `#${idRelAggSite}=IFCRELAGGREGATES('${generateIfcGuid()}',#${idOwnerHist},'SiteToBuilding',$,#${idSite},(#${idBuilding}));\n`;

  // ── 5. Process Storeys (Multi-Storey Stack) ──
  interface StoreyExportTarget {
    id: string;
    name: string;
    elevationFt: number;
    walls: Wall[];
    doors: Door[];
    windows: Window2D[];
  }

  const exportStoreys: StoreyExportTarget[] = [];

  if (storeys && storeys.length > 0) {
    storeys.forEach((s) => {
      const sLayout = s.floorPlanLayout;
      exportStoreys.push({
        id: s.id,
        name: s.name,
        elevationFt: s.elevation,
        walls: sLayout?.walls ?? [],
        doors: sLayout?.doors ?? [],
        windows: sLayout?.windows ?? [],
      });
    });
  } else {
    // Single-storey default
    exportStoreys.push({
      id: "storey-default",
      name: "Level 1 - Ground",
      elevationFt: 0,
      walls: layout.walls,
      doors: layout.doors,
      windows: layout.windows,
    });
  }

  const storeyEntityIds: number[] = [];

  exportStoreys.forEach((storey, sIdx) => {
    const elevMeters = feetToMeters(storey.elevationFt);
    const idStoreyPoint = nextId();
    step += `#${idStoreyPoint}=IFCCARTESIANPOINT((0.,0.,${elevMeters.toFixed(4)}));\n`;
    const idStoreyCoord = nextId();
    step += `#${idStoreyCoord}=IFCAXIS2PLACEMENT3D(#${idStoreyPoint},#${idAxisZ},#${idAxisX});\n`;
    const idStoreyPlacement = nextId();
    step += `#${idStoreyPlacement}=IFCLOCALPLACEMENT(#${idBldgPlacement},#${idStoreyCoord});\n`;
    const idStorey = nextId();
    step += `#${idStorey}=IFCBUILDINGSTOREY('${generateIfcGuid()}',#${idOwnerHist},'${storey.name.replaceAll("'", "''")}',$,$,#${idStoreyPlacement},$,$,.ELEMENT.,${elevMeters.toFixed(4)});\n`;
    storeyEntityIds.push(idStorey);

    const containedElementIds: number[] = [];
    const exportedWalls = new Map<
      string,
      { element: number; placement: number; source: Wall }
    >();
    const createOpening = (
      wallId: string,
      position: number,
      width: number,
      height: number,
      sill: number,
    ) => {
      const parent = exportedWalls.get(wallId);
      if (!parent) return null;
      const length = feetToMeters(
        Math.hypot(
          parent.source.end.x - parent.source.start.x,
          parent.source.end.y - parent.source.start.y,
        ),
      );
      const point = nextId(),
        axis = nextId(),
        placement = nextId();
      step += `#${point}=IFCCARTESIANPOINT((${(position * length - width / 2).toFixed(4)},0.,${sill.toFixed(4)}));\n`;
      step += `#${axis}=IFCAXIS2PLACEMENT3D(#${point},#${idAxisZ},#${idAxisX});\n`;
      step += `#${placement}=IFCLOCALPLACEMENT(#${parent.placement},#${axis});\n`;
      const profilePoint = nextId(),
        profileAxis = nextId(),
        profile = nextId();
      step += `#${profilePoint}=IFCCARTESIANPOINT((${(width / 2).toFixed(4)},0.));\n`;
      step += `#${profileAxis}=IFCAXIS2PLACEMENT2D(#${profilePoint},$);\n`;
      step += `#${profile}=IFCRECTANGLEPROFILEDEF(.AREA.,$,#${profileAxis},${width.toFixed(4)},${(parent.source.thickness * 0.0254 + 0.02).toFixed(4)});\n`;
      const solid = nextId(),
        shape = nextId(),
        definition = nextId(),
        opening = nextId();
      step += `#${solid}=IFCEXTRUDEDAREASOLID(#${profile},#${idWorldCoord},#${idAxisZ},${height.toFixed(4)});\n`;
      step += `#${shape}=IFCSHAPEREPRESENTATION(#${idModelContext},'Body','SweptSolid',(#${solid}));\n`;
      step += `#${definition}=IFCPRODUCTDEFINITIONSHAPE($,$,(#${shape}));\n`;
      step += `#${opening}=IFCOPENINGELEMENT('${generateIfcGuid()}',#${idOwnerHist},'Opening-${opening}',$,$,#${placement},#${definition},$,.OPENING.);\n`;
      step += `#${nextId()}=IFCRELVOIDSELEMENT('${generateIfcGuid()}',#${idOwnerHist},$,$,#${parent.element},#${opening});\n`;
      return opening;
    };

    // ── Export Walls with Real 3D Extruded Geometry (IfcExtrudedAreaSolid) ──
    storey.walls.forEach((wall, wIdx) => {
      const startX = feetToMeters(wall.start.x);
      const startY = feetToMeters(wall.start.y);
      const endX = feetToMeters(wall.end.x);
      const endY = feetToMeters(wall.end.y);

      const dx = endX - startX;
      const dy = endY - startY;
      const lenMeters = Math.hypot(dx, dy);
      if (lenMeters < 0.05) return; // Skip degenerate walls

      const angleRad = Math.atan2(dy, dx);
      const dirX = Math.cos(angleRad);
      const dirY = Math.sin(angleRad);

      const thicknessM = (wall.thickness / 12) * 0.3048;
      const heightM = wall.height * 0.3048;

      // Wall Origin Placement
      const idWallPos = nextId();
      step += `#${idWallPos}=IFCCARTESIANPOINT((${startX.toFixed(4)},${startY.toFixed(4)},0.));\n`;
      const idWallDir = nextId();
      step += `#${idWallDir}=IFCDIRECTION((${dirX.toFixed(4)},${dirY.toFixed(4)},0.));\n`;
      const idWallPlacement3D = nextId();
      step += `#${idWallPlacement3D}=IFCAXIS2PLACEMENT3D(#${idWallPos},#${idAxisZ},#${idWallDir});\n`;
      const idWallLocalPlacement = nextId();
      step += `#${idWallLocalPlacement}=IFCLOCALPLACEMENT(#${idStoreyPlacement},#${idWallPlacement3D});\n`;

      // Profile: Rectangle centered on length axis
      const idProfilePos = nextId();
      step += `#${idProfilePos}=IFCCARTESIANPOINT((${(lenMeters / 2).toFixed(4)},0.));\n`;
      const idProfileDir = nextId();
      step += `#${idProfileDir}=IFCDIRECTION((1.,0.));\n`;
      const idProfileAxis = nextId();
      step += `#${idProfileAxis}=IFCAXIS2PLACEMENT2D(#${idProfilePos},#${idProfileDir});\n`;
      const idProfile = nextId();
      step += `#${idProfile}=IFCRECTANGLEPROFILEDEF(.AREA.,'WallProfile-${wIdx}',#${idProfileAxis},${lenMeters.toFixed(4)},${thicknessM.toFixed(4)});\n`;

      // Extrusion: Extruded area along Z axis
      const idExtrudePlacement = nextId();
      step += `#${idExtrudePlacement}=IFCAXIS2PLACEMENT3D(#${idWorldPoint},#${idAxisZ},#${idAxisX});\n`;
      const idExtrusion = nextId();
      step += `#${idExtrusion}=IFCEXTRUDEDAREASOLID(#${idProfile},#${idExtrudePlacement},#${idAxisZ},${heightM.toFixed(4)});\n`;

      // Shape Representation
      const idShapeRep = nextId();
      step += `#${idShapeRep}=IFCSHAPEREPRESENTATION(#${idModelContext},'Body','SweptSolid',(#${idExtrusion}));\n`;
      const idProdDefShape = nextId();
      step += `#${idProdDefShape}=IFCPRODUCTDEFINITIONSHAPE($,$,(#${idShapeRep}));\n`;

      // IFC Wall Entity
      const idWall = nextId();
      const wallTag = wall.isLoadBearing ? "LoadBearing" : "Partition";
      step += `#${idWall}=IFCWALL('${generateIfcGuid()}',#${idOwnerHist},'Wall-L${sIdx + 1}-${wIdx + 1}','${wallTag}',$,#${idWallLocalPlacement},#${idProdDefShape},$,.SOLIDWALL.);\n`;

      exportedWalls.set(wall.id, {
        element: idWall,
        placement: idWallLocalPlacement,
        source: wall,
      });
      containedElementIds.push(idWall);
    });

    // ── Export Storey Floor Slab (IFCSLAB) ──
    if (storey.walls.length > 0) {
      let slabMinX = Infinity,
        slabMaxX = -Infinity,
        slabMinY = Infinity,
        slabMaxY = -Infinity;
      storey.walls.forEach((w) => {
        const sx = feetToMeters(w.start.x);
        const sy = feetToMeters(w.start.y);
        const ex = feetToMeters(w.end.x);
        const ey = feetToMeters(w.end.y);
        slabMinX = Math.min(slabMinX, sx, ex);
        slabMaxX = Math.max(slabMaxX, sx, ex);
        slabMinY = Math.min(slabMinY, sy, ey);
        slabMaxY = Math.max(slabMaxY, sy, ey);
      });
      const slabW = slabMaxX - slabMinX + 0.3;
      const slabD = slabMaxY - slabMinY + 0.3;
      const slabCx = (slabMinX + slabMaxX) / 2;
      const slabCy = (slabMinY + slabMaxY) / 2;
      const slabThickM = 0.25;

      const idSlabPos = nextId();
      step += `#${idSlabPos}=IFCCARTESIANPOINT((${slabCx.toFixed(4)},${slabCy.toFixed(4)},${(-slabThickM).toFixed(4)}));\n`;
      const idSlabPlacement3D = nextId();
      step += `#${idSlabPlacement3D}=IFCAXIS2PLACEMENT3D(#${idSlabPos},#${idAxisZ},#${idAxisX});\n`;
      const idSlabLocalPlacement = nextId();
      step += `#${idSlabLocalPlacement}=IFCLOCALPLACEMENT(#${idStoreyPlacement},#${idSlabPlacement3D});\n`;

      const idSlabProfilePos = nextId();
      step += `#${idSlabProfilePos}=IFCCARTESIANPOINT((0.,0.));\n`;
      const idSlabProfileDir = nextId();
      step += `#${idSlabProfileDir}=IFCDIRECTION((1.,0.));\n`;
      const idSlabProfileAxis = nextId();
      step += `#${idSlabProfileAxis}=IFCAXIS2PLACEMENT2D(#${idSlabProfilePos},#${idSlabProfileDir});\n`;
      const idSlabProfile = nextId();
      step += `#${idSlabProfile}=IFCRECTANGLEPROFILEDEF(.AREA.,'SlabProfile-L${sIdx + 1}',#${idSlabProfileAxis},${slabW.toFixed(4)},${slabD.toFixed(4)});\n`;

      const idSlabExtrude = nextId();
      step += `#${idSlabExtrude}=IFCEXTRUDEDAREASOLID(#${idSlabProfile},#${idWorldCoord},#${idAxisZ},${slabThickM.toFixed(4)});\n`;
      const idSlabRep = nextId();
      step += `#${idSlabRep}=IFCSHAPEREPRESENTATION(#${idModelContext},'Body','SweptSolid',(#${idSlabExtrude}));\n`;
      const idSlabProdShape = nextId();
      step += `#${idSlabProdShape}=IFCPRODUCTDEFINITIONSHAPE($,$,(#${idSlabRep}));\n`;

      const idSlab = nextId();
      step += `#${idSlab}=IFCSLAB('${generateIfcGuid()}',#${idOwnerHist},'FloorSlab-L${sIdx + 1}','StructuralSlab',$,#${idSlabLocalPlacement},#${idSlabProdShape},$,.FLOOR.);\n`;
      containedElementIds.push(idSlab);
    }

    // ── Export Doors with Exact Wall Placement & Direction ──
    storey.doors.forEach((door, dIdx) => {
      const widthM = (door.width / 12) * 0.3048;
      const heightM = (door.height ? door.height / 12 : 6.8) * 0.3048;

      const parentWall =
        storey.walls.find((w) => w.id === door.wallId) || storey.walls[0];
      let doorX = 0;
      let doorY = 0;
      let dirX = 1;
      let dirY = 0;

      if (parentWall) {
        const sx = feetToMeters(parentWall.start.x);
        const sy = feetToMeters(parentWall.start.y);
        const ex = feetToMeters(parentWall.end.x);
        const ey = feetToMeters(parentWall.end.y);
        const dx = ex - sx;
        const dy = ey - sy;
        const angleRad = Math.atan2(dy, dx);
        dirX = Math.cos(angleRad);
        dirY = Math.sin(angleRad);
        doorX = sx + door.position * dx;
        doorY = sy + door.position * dy;
      }

      const idDoorPoint = nextId();
      step += `#${idDoorPoint}=IFCCARTESIANPOINT((${doorX.toFixed(4)},${doorY.toFixed(4)},0.));\n`;
      const idDoorDir = nextId();
      step += `#${idDoorDir}=IFCDIRECTION((${dirX.toFixed(4)},${dirY.toFixed(4)},0.));\n`;
      const idDoorPlacement3D = nextId();
      step += `#${idDoorPlacement3D}=IFCAXIS2PLACEMENT3D(#${idDoorPoint},#${idAxisZ},#${idDoorDir});\n`;
      const idDoorLocalPlacement = nextId();
      step += `#${idDoorLocalPlacement}=IFCLOCALPLACEMENT(#${idStoreyPlacement},#${idDoorPlacement3D});\n`;

      const idDoor = nextId();
      step += `#${idDoor}=IFCDOOR('${generateIfcGuid()}',#${idOwnerHist},'Door-L${sIdx + 1}-${dIdx + 1}','${door.doorType ?? "single"}',$,#${idDoorLocalPlacement},$,$,${heightM.toFixed(3)},${widthM.toFixed(3)},.DOOR.,.NOTDEFINED.,$);\n`;
      const opening = createOpening(
        door.wallId,
        door.position,
        widthM,
        heightM,
        0,
      );
      if (opening)
        step += `#${nextId()}=IFCRELFILLSELEMENT('${generateIfcGuid()}',#${idOwnerHist},$,$,#${opening},#${idDoor});\n`;
      containedElementIds.push(idDoor);
    });

    // ── Export Windows with Exact Wall Placement & Sill Height ──
    storey.windows.forEach((win, wIdx) => {
      const widthM = (win.width / 12) * 0.3048;
      const heightM = (win.height / 12) * 0.3048;
      const sillMeters = feetToMeters((win.sillHeight ?? 36) / 12);

      const parentWall =
        storey.walls.find((w) => w.id === win.wallId) || storey.walls[0];
      let winX = 0;
      let winY = 0;
      let dirX = 1;
      let dirY = 0;

      if (parentWall) {
        const sx = feetToMeters(parentWall.start.x);
        const sy = feetToMeters(parentWall.start.y);
        const ex = feetToMeters(parentWall.end.x);
        const ey = feetToMeters(parentWall.end.y);
        const dx = ex - sx;
        const dy = ey - sy;
        const angleRad = Math.atan2(dy, dx);
        dirX = Math.cos(angleRad);
        dirY = Math.sin(angleRad);
        winX = sx + win.position * dx;
        winY = sy + win.position * dy;
      }

      const idWinPoint = nextId();
      step += `#${idWinPoint}=IFCCARTESIANPOINT((${winX.toFixed(4)},${winY.toFixed(4)},${sillMeters.toFixed(4)}));\n`;
      const idWinDir = nextId();
      step += `#${idWinDir}=IFCDIRECTION((${dirX.toFixed(4)},${dirY.toFixed(4)},0.));\n`;
      const idWinPlacement3D = nextId();
      step += `#${idWinPlacement3D}=IFCAXIS2PLACEMENT3D(#${idWinPoint},#${idAxisZ},#${idWinDir});\n`;
      const idWinLocalPlacement = nextId();
      step += `#${idWinLocalPlacement}=IFCLOCALPLACEMENT(#${idStoreyPlacement},#${idWinPlacement3D});\n`;

      const idWindow = nextId();
      step += `#${idWindow}=IFCWINDOW('${generateIfcGuid()}',#${idOwnerHist},'Window-L${sIdx + 1}-${wIdx + 1}','${win.windowType ?? "picture"}',$,#${idWinLocalPlacement},$,$,${heightM.toFixed(3)},${widthM.toFixed(3)},.WINDOW.,.NOTDEFINED.,$);\n`;
      const opening = createOpening(
        win.wallId,
        win.position,
        widthM,
        heightM,
        sillMeters,
      );
      if (opening)
        step += `#${nextId()}=IFCRELFILLSELEMENT('${generateIfcGuid()}',#${idOwnerHist},$,$,#${opening},#${idWindow});\n`;
      containedElementIds.push(idWindow);
    });

    // Connect entities to this storey
    if (containedElementIds.length > 0) {
      const idRelContained = nextId();
      const elementsRef = containedElementIds.map((id) => `#${id}`).join(",");
      step += `#${idRelContained}=IFCRELCONTAINEDINSPATIALSTRUCTURE('${generateIfcGuid()}',#${idOwnerHist},'StoreyContainment','Contained Elements',#${idStorey},(${elementsRef}));\n`;
    }
  });

  // Link Building -> All Storeys
  if (storeyEntityIds.length > 0) {
    const idRelAggBuilding = nextId();
    const storeysRef = storeyEntityIds.map((id) => `#${id}`).join(",");
    step += `#${idRelAggBuilding}=IFCRELAGGREGATES('${generateIfcGuid()}',#${idOwnerHist},'BuildingToStoreys',$,#${idBuilding},(${storeysRef}));\n`;
  }

  step += `ENDSEC;
END-ISO-10303-21;
`;

  return step;
}

/**
 * Generates an IFC-compliant 22-character unique identifier using the standard IFC base64 character set.
 */
function generateIfcGuid(): string {
  const chars =
    "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz_$";
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  let value = 0n;
  for (const byte of bytes) value = (value << 8n) | BigInt(byte);
  let result = "";
  for (let i = 0; i < 22; i++) {
    result = chars[Number(value & 63n)]! + result;
    value >>= 6n;
  }
  return result;
}
