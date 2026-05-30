import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { format = "ifc" } = body;

    if (format === "pdf") {
      const pdfText = "DOMUS BIM EXPORT REPORT\nGenerated At: " + new Date().toISOString() + "\n";
      return new NextResponse(pdfText, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": "attachment; filename=domus_report.pdf",
        },
      });
    }

    return NextResponse.json({
      ok: true,
      message: `Export to ${format} processed client side.`,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Internal error." },
      { status: 500 }
    );
  }
}
