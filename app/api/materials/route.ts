import { PBR_PRESETS } from "@/lib/materials/pbr-preset-catalog";
export async function POST(request: Request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { ok: false, error: "Use a JSON object with a prompt." },
      { status: 400 },
    );
  }
  if (
    !body ||
    typeof body.prompt !== "string" ||
    !body.prompt.trim() ||
    body.prompt.length > 1000
  )
    return Response.json(
      { ok: false, error: "Describe a finish in 1 to 1000 characters." },
      { status: 400 },
    );
  const text = body.prompt.toLowerCase();
  const name = /walnut|dark wood/.test(text)
    ? "Walnut Trim"
    : /oak|wood/.test(text)
      ? "Oak Herringbone"
      : /forest|green/.test(text)
        ? "Forest Siding"
        : /slate|stone|black/.test(text)
          ? "Obsidian Slate"
          : /plaster|white|alabaster/.test(text)
            ? "Alabaster Drywall"
            : null;
  if (!name)
    return Response.json(
      {
        ok: false,
        error:
          "Try oak, walnut, forest green, slate, or white plaster. This tool matches built-in finishes.",
      },
      { status: 422 },
    );
  return Response.json({ ok: true, data: PBR_PRESETS[name] });
}
