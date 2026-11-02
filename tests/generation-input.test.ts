// @vitest-environment node
import { afterEach, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "@/app/api/generate-3d/route";
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
it("rejects malformed input without making a provider request", async () => {
  const fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
  const response = await POST(
    new NextRequest("http://localhost/api/generate-3d", {
      method: "POST",
      body: JSON.stringify({ image: "https://example.com/photo.png" }),
    }),
  );
  expect(response.status).toBe(400);
  expect(fetchMock).not.toHaveBeenCalled();
});
it("labels keyless output as a catalog sample", async () => {
  vi.stubEnv("REPLICATE_API_KEY", "");
  const response = await POST(
    new NextRequest("http://localhost/api/generate-3d", {
      method: "POST",
      body: JSON.stringify({ prompt: "chair" }),
    }),
  );
  expect(response.status).toBe(200);
  expect((await response.json()).data.fallback).toBe(true);
  expect(response.headers.get("X-RateLimit-Remaining")).not.toBeNull();
});

it("lets the portfolio catalog run repeatedly without a paid generation quota", async () => {
  vi.stubEnv("REPLICATE_API_KEY", "");
  for (let i = 0; i < 6; i++) {
    const response = await POST(
      new NextRequest("http://localhost/api/generate-3d", {
        method: "POST",
        body: JSON.stringify({ prompt: "table" }),
      }),
    );
    expect(response.status).toBe(200);
    expect((await response.json()).data.fallback).toBe(true);
  }
});

it("keeps explicit catalog searches local even when a paid provider is configured", async () => {
  vi.stubEnv("REPLICATE_API_KEY", "test-only");
  vi.stubEnv("ENABLE_PAID_GENERATION", "true");
  const provider = vi.fn();
  vi.stubGlobal("fetch", provider);
  for (let i = 0; i < 6; i++) {
    const response = await POST(
      new NextRequest("http://localhost/api/generate-3d", {
        method: "POST",
        body: JSON.stringify({ prompt: "chair", catalogOnly: true }),
      }),
    );
    expect(response.status).toBe(200);
    expect((await response.json()).data.fallback).toBe(true);
  }
  expect(provider).not.toHaveBeenCalled();
});

it("refuses an unconfigured live model version before a provider call", async () => {
  vi.stubEnv("REPLICATE_API_KEY", "test-only");
  vi.stubEnv("ENABLE_PAID_GENERATION", "true");
  vi.stubEnv("REPLICATE_TRELLIS_VERSION", "");
  const provider = vi.fn();
  vi.stubGlobal("fetch", provider);
  const response = await POST(
    new NextRequest("http://localhost/api/generate-3d", {
      method: "POST",
      body: JSON.stringify({ image: "data:image/png;base64,aGVsbG8=" }),
    }),
  );
  expect(response.status).toBe(503);
  expect(provider).not.toHaveBeenCalled();
});
it("uses the documented images input and configured version for a real job contract", async () => {
  vi.stubEnv("REPLICATE_API_KEY", "test-only");
  vi.stubEnv("ENABLE_PAID_GENERATION", "true");
  vi.stubEnv("REPLICATE_TRELLIS_VERSION", "a".repeat(64));
  const provider = vi
    .fn()
    .mockResolvedValue(
      Response.json({
        id: "contract-job",
        status: "starting",
        urls: { get: "https://api.replicate.com/v1/predictions/contract-job" },
      }),
    );
  vi.stubGlobal("fetch", provider);
  const response = await POST(
    new NextRequest("http://localhost/api/generate-3d", {
      method: "POST",
      body: JSON.stringify({ image: "data:image/png;base64,aGVsbG8=" }),
    }),
  );
  expect(response.status).toBe(200);
  const body = JSON.parse(provider.mock.calls[0]![1].body);
  expect(body.input.images).toEqual(["data:image/png;base64,aGVsbG8="]);
  expect(body.version).toBe("a".repeat(64));
  expect((await response.json()).data.pollUrl).toContain("ticket=");
});
