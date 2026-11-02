import { it, expect, vi } from "vitest";
import { requestModel } from "@/lib/model-client";
const response = (data: unknown, ok = true) =>
  Response.json(ok ? { ok: true, data } : { ok: false, error: "Job failed" }, {
    status: ok ? 200 : 422,
  });
it("waits through pending output and returns only the completed model", async () => {
  const fetcher = vi
    .fn()
    .mockResolvedValueOnce(
      response({
        status: "processing",
        pollUrl: "/api/generate-3d/job?ticket=test",
        output: "https://example.com/unfinished.glb",
      }),
    )
    .mockResolvedValueOnce(response({ status: "processing", output: null }))
    .mockResolvedValueOnce(
      response({
        status: "succeeded",
        output: "https://example.com/finished.glb",
      }),
    );
  const result = await requestModel(
    { prompt: "chair" },
    { fetcher, delay: async () => {} },
  );
  expect(result.output).toBe("https://example.com/finished.glb");
  expect(result.fallback).toBe(false);
  expect(fetcher).toHaveBeenCalledTimes(3);
});
it("labels an explicit catalog fallback and never polls it", async () => {
  const fetcher = vi
    .fn()
    .mockResolvedValue(
      response({
        status: "succeeded",
        fallback: true,
        output: "/models/chair.glb",
      }),
    );
  expect((await requestModel({ prompt: "chair" }, { fetcher })).fallback).toBe(
    true,
  );
  expect(fetcher).toHaveBeenCalledTimes(1);
});
it("rejects a failed job without substituting a chair", async () => {
  const fetcher = vi
    .fn()
    .mockResolvedValueOnce(response({ pollUrl: "/api/generate-3d/job" }))
    .mockResolvedValueOnce(response(null, false));
  await expect(requestModel({ prompt: "chair" }, { fetcher })).rejects.toThrow(
    "Job failed",
  );
});
it("times out without accepting an unfinished model", async () => {
  const fetcher = vi
    .fn()
    .mockImplementation(async () =>
      response({ status: "processing", pollUrl: "/api/generate-3d/job" }),
    );
  await expect(
    requestModel(
      { prompt: "chair" },
      { fetcher, attempts: 2, delay: async () => {} },
    ),
  ).rejects.toThrow("No sample was substituted");
});
