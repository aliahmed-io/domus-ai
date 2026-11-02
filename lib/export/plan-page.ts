import type { jsPDF } from "jspdf";
import type { FloorPlanLayout } from "@/types/puter";

/** A real plan sheet alongside the estimate, with dimensions kept proportional. */
export function appendPlanPage(doc: jsPDF, layout: FloorPlanLayout) {
  doc.addPage();
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("Floor plan", 20, 25);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(
    "Dimensions in feet. Preliminary design, not a construction drawing.",
    20,
    34,
  );
  const points = layout.walls.flatMap((wall) => [wall.start, wall.end]);
  if (!points.length) {
    doc.text("No walls in this plan yet.", 20, 55);
    return;
  }
  const x = Math.min(...points.map((point) => point.x)),
    y = Math.min(...points.map((point) => point.y));
  const width = Math.max(...points.map((point) => point.x)) - x,
    height = Math.max(...points.map((point) => point.y)) - y;
  const scale = Math.min(165 / Math.max(width, 1), 190 / Math.max(height, 1));
  const px = (value: number) => 22 + (value - x) * scale;
  const py = (value: number) => 55 + (value - y) * scale;
  doc.setDrawColor(49, 87, 213);
  for (const wall of layout.walls) {
    doc.setLineWidth(Math.max(0.4, (wall.thickness / 12) * scale));
    doc.line(
      px(wall.start.x),
      py(wall.start.y),
      px(wall.end.x),
      py(wall.end.y),
    );
  }
  doc.setFontSize(8);
  doc.setTextColor(32, 43, 56);
  for (const room of layout.rooms)
    doc.text(
      room.label,
      px(room.bounds.x + room.bounds.width / 2),
      py(room.bounds.y + room.bounds.height / 2),
      {
        align: "center",
        maxWidth: Math.max(room.bounds.width * scale - 4, 10),
      },
    );
  for (const opening of [...layout.doors, ...layout.windows]) {
    const wall = layout.walls.find((item) => item.id === opening.wallId);
    if (!wall) continue;
    const length = Math.hypot(
      wall.end.x - wall.start.x,
      wall.end.y - wall.start.y,
    );
    if (!length) continue;
    const half = opening.width / 24 / length;
    const start = Math.max(0, opening.position - half),
      end = Math.min(1, opening.position + half);
    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(Math.max(0.6, (wall.thickness / 12) * scale + 0.2));
    doc.line(
      px(wall.start.x + (wall.end.x - wall.start.x) * start),
      py(wall.start.y + (wall.end.y - wall.start.y) * start),
      px(wall.start.x + (wall.end.x - wall.start.x) * end),
      py(wall.start.y + (wall.end.y - wall.start.y) * end),
    );
    doc.setDrawColor(49, 87, 213);
    doc.setLineWidth(0.3);
  }
  doc.setTextColor(70, 80, 95);
  doc.text(
    `${width.toFixed(1)} ft x ${height.toFixed(1)} ft`,
    22,
    Math.min(55 + height * scale + 14, 265),
  );
}
