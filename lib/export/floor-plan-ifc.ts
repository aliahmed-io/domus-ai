import type { FloorPlanLayout } from "@/types/puter";

/**
 * Compiles a structured IFC-STEP (ISO-10303-21) physical file string representing
 * the walls, doors, windows, and spatial hierarchy of the Domus floor plan layout.
 */
export function generateFloorPlanIFC(layout: FloorPlanLayout): string {
  let step = `ISO-10303-21;
HEADER;
FILE_DESCRIPTION(('Domus AI Generated BIM Model - Commercial Parity Export'),'2;1');
FILE_NAME('domus_model.ifc','2026-05-30T11:29:19',('Domus AI Team'),('Advanced Agentic Coding Group'),'Antigravity','Domus BIM Engine','');
FILE_SCHEMA(('IFC4'));
ENDSEC;
DATA;
`;

  // 1. Spatial Structure and Metadata Boilerplate
  step += `#1=IFCPERSON($,'Antigravity',$,$,$,$,$,$);\n`;
  step += `#2=IFCORGANIZATION($,'Domus AI',$,$,$);\n`;
  step += `#3=IFCPERSONANDORGANIZATION(#1,#2,$);\n`;
  step += `#4=IFCAPPLICATION(#2,'1.0','Domus AI Editor','Domus');\n`;
  step += `#5=IFCOWNERHISTORY(#3,#4,$,.ADDED.,$,$,$,1780000000);\n`;
  step += `#6=IFCPROJECT('3a81B2c7d9e0f1a2b3c4d5',#5,'Domus Project',$,$,$,$,$,$);\n`;
  step += `#7=IFCSITE('0s1A2B3C4D5E6F7G8H9I0J',#5,'Domus Site',$,$,$,$,$,.ELEMENT.,$,$,$,$,$);\n`;
  step += `#8=IFCBUILDING('1s1A2B3C4D5E6F7G8H9I0J',#5,'Domus Main Building',$,$,$,$,$,.ELEMENT.,$,$,$);\n`;
  step += `#9=IFCBUILDINGSTOREY('2s1A2B3C4D5E6F7G8H9I0J',#5,'Level 1',$,$,$,$,$,.ELEMENT.,0.0);\n`;

  let entityId = 10;
  
  const elementIds: number[] = [];

  // 2. Export walls
  layout.walls.forEach((wall, idx) => {
    const wallId = entityId++;
    elementIds.push(wallId);
    
    // Geometry values
    const dx = wall.end.x - wall.start.x;
    const dy = wall.end.y - wall.start.y;
    const length = Math.hypot(dx, dy);
    
    step += `#${wallId}=IFCWALL('${generateIfcGuid()}',#5,'Wall-${idx}','Thickness: ${wall.thickness}in, Height: ${wall.height}ft',$,$,$,$,$);\n`;
  });

  // 3. Export doors
  layout.doors.forEach((door, idx) => {
    const doorId = entityId++;
    elementIds.push(doorId);
    step += `#${doorId}=IFCDOOR('${generateIfcGuid()}',#5,'Door-${idx}','Width: ${door.width}in',$,$,$,$,$,${(door.width / 12).toFixed(2)},$);\n`;
  });

  // 4. Export windows
  layout.windows.forEach((win, idx) => {
    const winId = entityId++;
    elementIds.push(winId);
    step += `#${winId}=IFCWINDOW('${generateIfcGuid()}',#5,'Window-${idx}','Width: ${win.width}in, Height: ${win.height}in',$,$,$,$,$,${(win.width / 12).toFixed(2)},${(win.height / 12).toFixed(2)},$);\n`;
  });

  // 5. Connect project hierarchy relationships
  if (elementIds.length > 0) {
    const relId = entityId++;
    const elementsStr = elementIds.map(id => `#${id}`).join(',');
    step += `#${relId}=IFCRELCONTAINEDINSPATIALSTRUCTURE('${generateIfcGuid()}',#5,'SpatialRelation','Contained BIM Entities',#9,(${elementsStr}));\n`;
  }

  step += `ENDSEC;
END-ISO-10303-21;
`;

  return step;
}

/**
 * Generates an IFC-compliant unique identifier (22 characters).
 */
function generateIfcGuid(): string {
  const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz_$";
  let str = "";
  for (let i = 0; i < 22; i++) {
    str += chars[Math.floor(Math.random() * chars.length)];
  }
  return str;
}
