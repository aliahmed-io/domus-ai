// @vitest-environment node
import { it, expect, vi, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { generateText } from "ai";
import { POST as layoutPost } from "@/app/api/floor-plan/route";
import { POST as blueprintPost } from "@/app/api/bim-analysis/route";
import {
  createProceduralLayout,
  layoutRequestSchema,
} from "@/lib/layout-generation";
vi.mock("ai", () => ({ generateText: vi.fn(), Output: { object: vi.fn() } }));
vi.mock("@ai-sdk/openai", () => ({ openai: vi.fn() }));
afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});
const request = (body: unknown) =>
  new NextRequest("http://localhost/api/floor-plan", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
it("returns actual procedural alternatives without calling an AI service", async () => {
  vi.stubEnv("OPENAI_API_KEY", "");
  const response = await layoutPost(
      request({ beds: 3, baths: 2, area: 1200, extras: ["Home Office"] }),
    ),
    body = await response.json();
  expect(response.status).toBe(200);
  expect(body.source).toBe("procedural");
  expect(body.data).toHaveLength(3);
  expect(generateText).not.toHaveBeenCalled();
});
it("rejects malformed parameters and impossible layouts", async () => {
  expect((await layoutPost(request({ beds: "three" }))).status).toBe(400);
  vi.stubEnv("OPENAI_API_KEY", "");
  expect(
    (await layoutPost(request({ beds: 6, baths: 4, area: 200 }))).status,
  ).toBe(422);
});
it("rejects overlapping provider rooms instead of applying an invalid layout", async () => {
  vi.stubEnv("OPENAI_API_KEY", "test-only");
  const layout = createProceduralLayout(layoutRequestSchema.parse({}));
  layout.rooms[1]!.bounds = { ...layout.rooms[0]!.bounds };
  vi.mocked(generateText).mockResolvedValue({
    output: { rooms: layout.rooms },
  } as never);
  const response = await layoutPost(request({}));
  expect(response.status).toBe(422);
  expect((await response.json()).ok).toBe(false);
});
it("accepts a controlled valid provider layout and derives geometry", async () => {
  vi.stubEnv("OPENAI_API_KEY", "test-only");
  const layout = createProceduralLayout(layoutRequestSchema.parse({}));
  vi.mocked(generateText).mockResolvedValue({
    output: { rooms: layout.rooms },
  } as never);
  const response = await layoutPost(request({})),
    body = await response.json();
  expect(response.status).toBe(200);
  expect(body.source).toBe("ai");
  expect(body.data[0].walls.length).toBeGreaterThan(4);
});
it("refuses uncalibrated image analysis before contacting a provider", async () => {
  vi.stubEnv("OPENAI_API_KEY", "test-only");
  const form = new FormData();
  form.set(
    "file",
    new File(["not-an-image"], "file.png", { type: "image/png" }),
  );
  expect(
    (
      await blueprintPost(
        new NextRequest("http://localhost/api/bim-analysis", {
          method: "POST",
          body: form,
        }),
      )
    ).status,
  ).toBe(400);
  expect(generateText).not.toHaveBeenCalled();
});
it("explains unavailable AI and preserves the manual workflow", async () => {
  vi.stubEnv("OPENAI_API_KEY", "");
  const form = new FormData();
  form.set("file", new File(["test"], "file.png", { type: "image/png" }));
  for (const [key, value] of Object.entries({
    width: 400,
    height: 300,
    pixelsPerFoot: 10,
    wallHeight: 9,
  }))
    form.set(key, String(value));
  expect(
    (
      await blueprintPost(
        new NextRequest("http://localhost/api/bim-analysis", {
          method: "POST",
          body: form,
        }),
      )
    ).status,
  ).toBe(503);
  expect(generateText).not.toHaveBeenCalled();
});
