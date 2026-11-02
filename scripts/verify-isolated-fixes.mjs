import { chromium, expect } from "@playwright/test";
import fs from "node:fs/promises";
const browser = await chromium.launch({
  channel: "msedge",
  headless: true,
  args: [
    "--no-proxy-server",
    "--use-fake-device-for-media-stream",
    "--use-fake-ui-for-media-stream",
  ],
});
try {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    permissions: ["camera"],
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("http://127.0.0.1:3110/floor-plan?new=1");
  await page.getByRole("button", { name: /Start from scratch/ }).click();
  await expect(
    page.getByRole("button", { name: "Draw Structural Wall", exact: true }),
  ).toBeVisible();
  await page.keyboard.press("w");
  const box = await page
    .locator(".konvajs-content canvas")
    .first()
    .boundingBox();
  await page.mouse.click(box.x + box.width * 0.35, box.y + box.height * 0.55);
  await page.mouse.click(box.x + box.width * 0.55, box.y + box.height * 0.55);
  await page.keyboard.press("Escape");
  await page
    .getByRole("button", { name: "Open project panel", exact: true })
    .click();
  await page.getByRole("button", { name: "BOM & Export", exact: true }).click();
  await page.getByRole("button", { name: /Procurement Cost Sheet/ }).click();
  await page
    .getByRole("button", { name: "Plan materials", exact: true })
    .click();
  await expect(
    page.getByText("Material planning list", { exact: true }),
  ).toBeVisible();
  const download = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Download planning list (CSV)", exact: true })
    .click();
  const csv = await download;
  const content = await fs.readFile(await csv.path(), "utf8");
  if (
    !content.startsWith('"Category","Item Name","Sample Vendor","Sample SKU"')
  )
    throw Error("CSV header mismatch");
  await expect(
    page.getByText("Planning list downloaded", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText(/No order was placed/)).toBeVisible();
  await page.goto("http://127.0.0.1:3110/ar-map");
  const response = await page.request.get("http://127.0.0.1:3110/ar-map");
  if (!response.headers()["permissions-policy"].includes("camera=(self)"))
    throw Error("Camera policy still blocked");
  await page
    .getByRole("button", { name: "Grant Camera Access", exact: true })
    .click();
  await expect(page.locator("video")).toBeVisible();
  await page.waitForFunction(
    () => document.querySelector("video")?.readyState >= 2,
  );
  const stream = await page
    .locator("video")
    .evaluateHandle((video) => video.srcObject);
  await page.getByRole("link", { name: "Materials", exact: true }).click();
  await expect
    .poll(() =>
      stream.evaluate((value) =>
        value.getTracks().every((track) => track.readyState === "ended"),
      ),
    )
    .toBe(true);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("http://127.0.0.1:3110/floor-plan?new=1");
  await page.getByRole("button", { name: /Start from scratch/ }).click();
  await expect(
    page.getByRole("button", { name: "Open project panel", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Open project panel", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "BOM & Export", exact: true }),
  ).toBeVisible();
  await page.screenshot({ path: "docs/screenshots/mobile-project-panel.png" });
  if (errors.length) throw Error(errors.join("\n"));
  console.log(
    "PASS: real CSV planning download, honest order status, same-origin camera policy, fake camera preview, stream cleanup, mobile project panel, no page errors.",
  );
} finally {
  await browser.close();
}
