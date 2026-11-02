import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jsPDF } from "jspdf";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { format = "ifc" } = body;

    if (format === "pdf") {
      const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });

      // Background decorative border
      doc.setDrawColor(44, 38, 33);
      doc.setLineWidth(0.8);
      doc.rect(10, 10, 277, 190);

      // Inner title block banner
      doc.setFillColor(250, 248, 245);
      doc.rect(12, 12, 273, 26, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.setTextColor(44, 38, 33);
      doc.text("DOMUS SPATIAL CAD — ARCHITECTURAL DRAWING SET", 16, 24);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(90, 74, 58);
      doc.text(
        `Generated: ${new Date().toLocaleDateString()} | Preliminary design export. Building-code compliance not verified.`,
        16,
        32,
      );

      // Section: Architectural Schedule
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(44, 38, 33);
      doc.text("1. BUILDING SPECIFICATION & SCHEDULE SUMMARY", 16, 50);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      doc.setTextColor(60, 50, 40);
      const projectId = body.layout?.id ?? "DOMUS-PROJ-01";
      const totalStoreys = body.storeys?.length ?? 1;
      const wallCount = body.layout?.walls?.length ?? 0;
      const doorCount = body.layout?.doors?.length ?? 0;
      const winCount = body.layout?.windows?.length ?? 0;

      doc.text(`Project Identifier: ${projectId}`, 16, 60);
      doc.text(`Multi-Storey Stack: ${totalStoreys} Level(s)`, 16, 68);
      doc.text(`Total Structural Walls: ${wallCount} Assemblies`, 16, 76);
      doc.text(
        `Fenestration Units: ${doorCount} Doors / ${winCount} Windows`,
        16,
        84,
      );
      doc.text(
        `Wall Framing Standard: 2x6 DF 16" O.C. (Interior) / 9" Exterior CMU`,
        16,
        92,
      );
      doc.text(
        `Glazing Specification: Double-pane Insulated Low-E (SHGC 0.28, U-factor 0.29)`,
        16,
        100,
      );

      // Stamp & Verification Box
      doc.setDrawColor(200, 195, 185);
      doc.rect(175, 48, 105, 58);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(44, 38, 33);
      doc.text("PRELIMINARY DESIGN NOTES", 180, 56);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(110, 100, 90);
      doc.text("Compiled by Domus AI Commercial CAD Engine.", 180, 66);
      doc.text("Clearance checks need professional review.", 180, 74);
      doc.text(
        "All dimensions to be verified in field prior to construction.",
        180,
        82,
      );
      doc.text("Domus AI Spatial Architecture © 2026.", 180, 96);

      const pdfArrayBuffer = doc.output("arraybuffer");

      return new NextResponse(pdfArrayBuffer, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition":
            "attachment; filename=Domus_Architectural_Set.pdf",
        },
      });
    }

    return NextResponse.json({
      ok: true,
      message: `Export to ${format} processed client side.`,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "Internal error.",
      },
      { status: 500 },
    );
  }
}
