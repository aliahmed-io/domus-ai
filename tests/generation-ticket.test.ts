// @vitest-environment node
import { expect, it } from "vitest";
import {
  createGenerationTicket,
  verifyGenerationTicket,
  getModelOutput,
} from "@/lib/server/generation-ticket";
it("limits job access to a signed prediction ID and expiry", async () => {
  const ticket = await createGenerationTicket(
    "job-a",
    "test-only-secret",
    1000,
  );
  expect(
    await verifyGenerationTicket("job-a", ticket, "test-only-secret", 1001),
  ).toBe(true);
  expect(
    await verifyGenerationTicket("job-b", ticket, "test-only-secret", 1001),
  ).toBe(false);
  expect(
    await verifyGenerationTicket("job-a", ticket, "different-secret", 1001),
  ).toBe(false);
  expect(
    await verifyGenerationTicket("job-a", ticket, "test-only-secret", 2000000),
  ).toBe(false);
});
it("selects model files while rejecting other hosts, schemes and file types", () => {
  expect(
    getModelOutput({
      preview: "https://replicate.delivery/x.png",
      model: "https://replicate.delivery/x.glb",
    }),
  ).toBe("https://replicate.delivery/x.glb");
  expect(getModelOutput("https://example.com/x.glb")).toBeNull();
  expect(getModelOutput("javascript:alert(1)")).toBeNull();
});
