// @vitest-environment node
import { afterEach, expect, it, vi } from "vitest";
import { GET } from "@/app/api/generate-3d/[predictionId]/route";
import { createGenerationTicket } from "@/lib/server/generation-ticket";
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
async function poll(status: string, output: unknown = null) {
  vi.stubEnv("REPLICATE_API_KEY", "test-only-secret");
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(Response.json({ status, output })),
  );
  const ticket = await createGenerationTicket("test-job", "test-only-secret");
  return GET(
    new Request(`http://localhost/api/generate-3d/test-job?ticket=${ticket}`),
    { params: Promise.resolve({ predictionId: "test-job" }) },
  );
}
it("keeps processing jobs pending without inserting a fallback", async () => {
  expect(await (await poll("processing")).json()).toEqual({
    ok: true,
    data: { status: "processing", output: null },
  });
});
it("returns only the finished model file", async () => {
  expect(
    await (
      await poll("succeeded", {
        model_file: "https://replicate.delivery/test.glb",
      })
    ).json(),
  ).toEqual({
    ok: true,
    data: {
      status: "succeeded",
      output: "https://replicate.delivery/test.glb",
    },
  });
});
it.each(["failed", "canceled"])(
  "reports %s jobs without substituting a model",
  async (status) => {
    expect((await poll(status)).status).toBe(422);
  },
);
it("rejects an unsigned request before contacting the provider", async () => {
  vi.stubEnv("REPLICATE_API_KEY", "test-only-secret");
  const fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
  const response = await GET(
    new Request("http://localhost/api/generate-3d/test-job"),
    { params: Promise.resolve({ predictionId: "test-job" }) },
  );
  expect(response.status).toBe(403);
  expect(fetchMock).not.toHaveBeenCalled();
});
