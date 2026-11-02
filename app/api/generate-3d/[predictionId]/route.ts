import {
  verifyGenerationTicket,
  getModelOutput,
} from "@/lib/server/generation-ticket";
export const runtime = "edge";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ predictionId: string }> },
) {
  const { predictionId } = await params;
  const secret = process.env.REPLICATE_API_KEY;
  const ticket = new URL(request.url).searchParams.get("ticket") ?? "";
  if (
    !secret ||
    !/^[a-zA-Z0-9_-]{1,128}$/.test(predictionId) ||
    !(await verifyGenerationTicket(predictionId, ticket, secret))
  ) {
    return Response.json(
      { ok: false, error: "This generation link is invalid or has expired." },
      { status: 403 },
    );
  }
  try {
    const response = await fetch(
      `https://api.replicate.com/v1/predictions/${encodeURIComponent(predictionId)}`,
      {
        headers: { Authorization: `Bearer ${secret}` },
        signal: AbortSignal.timeout(15000),
        cache: "no-store",
      },
    );
    if (!response.ok)
      return Response.json(
        {
          ok: false,
          error: "Could not check generation progress. Try again shortly.",
        },
        { status: 502 },
      );
    const prediction = await response.json();
    const status = prediction.status;
    if (status === "failed" || status === "canceled")
      return Response.json(
        { ok: false, error: `Generation ${status}. No model was added.` },
        { status: 422 },
      );
    const output =
      status === "succeeded" ? getModelOutput(prediction.output) : null;
    if (status === "succeeded" && !output)
      return Response.json(
        {
          ok: false,
          error: "The provider finished without a supported GLB or GLTF model.",
        },
        { status: 422 },
      );
    if (!["starting", "processing", "succeeded"].includes(status))
      return Response.json(
        {
          ok: false,
          error: "The provider returned an unknown generation state.",
        },
        { status: 502 },
      );
    return Response.json(
      { ok: true, data: { status, output } },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return Response.json(
      { ok: false, error: "Generation progress is temporarily unavailable." },
      { status: 502 },
    );
  }
}
