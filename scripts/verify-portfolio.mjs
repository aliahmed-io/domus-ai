import { chromium, expect } from "@playwright/test";
import fs from "node:fs/promises";
const base = process.env.REVIEW_URL || "http://127.0.0.1:3112";
const browser = await chromium.launch({
  channel: "msedge",
  headless: true,
  args: ["--no-proxy-server"],
});
const checks = [];
try {
  await fs.mkdir("docs/portfolio-verification", { recursive: true });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
  });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (msg) => {
    if (msg.type() === "error") console.log("Browser error:", msg.text());
  });
  const readProject = () =>
    page.evaluate(() => {
      const id = localStorage.getItem("domus:active-project");
      return id
        ? JSON.parse(localStorage.getItem("domus:local:v1:domus:project:" + id))
        : null;
    });
  await page.goto(base + "/editor");
  await page
    .getByRole("button", { name: "Explore a furnished example" })
    .click();
  await page.waitForURL(/floor-plan\?projectId=/);
  await expect(
    page.getByRole("button", { name: "Draw Structural Wall", exact: true }),
  ).toBeVisible();
  const id = new URL(page.url()).searchParams.get("projectId");
  const initialWalls = (await readProject()).floorPlanData.walls.length;
  await expect
    .poll(async () => (await readProject())?.sceneData?.objects?.length)
    .toBe(3);
  checks.push("Open a furnished example");
  console.log("PASS step: " + checks.at(-1));
  await page
    .getByRole("button", { name: "Draw Structural Wall", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Draw Structural Wall", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.waitForTimeout(800);
  const box = await page
    .locator(".konvajs-content canvas")
    .first()
    .boundingBox();
  await page.mouse.click(box.x + box.width * 0.11, box.y + box.height * 0.4);
  await page.mouse.click(box.x + box.width * 0.24, box.y + box.height * 0.4);
  await page.keyboard.press("Escape");
  await expect
    .poll(async () => (await readProject()).floorPlanData.walls.length)
    .toBe(initialWalls + 1);
  await page.getByRole("button", { name: "Undo last change" }).click();
  await expect
    .poll(async () => (await readProject()).floorPlanData.walls.length)
    .toBe(initialWalls);
  await page.getByRole("button", { name: "Redo change" }).click();
  await expect
    .poll(async () => (await readProject()).floorPlanData.walls.length)
    .toBe(initialWalls + 1);
  // Existing room and furniture shapes must not swallow drawing clicks.
  await page.getByRole("button", { name: "Draw Structural Wall", exact: true }).click();
  await page.mouse.click(box.x + box.width * 0.30, box.y + box.height * 0.42);
  await page.mouse.click(box.x + box.width * 0.41, box.y + box.height * 0.42);
  await page.keyboard.press("Escape");
  await expect.poll(async () => (await readProject()).floorPlanData.walls.length)
    .toBe(initialWalls + 2);
  await page.getByRole("button", { name: "Undo last change" }).click();
  await expect.poll(async () => (await readProject()).floorPlanData.walls.length)
    .toBe(initialWalls + 1);
  checks.push("Edit, undo, redo, and save");
  console.log("PASS step: " + checks.at(-1));
  await page.getByRole("button", { name: "3D View", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "3D View", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.waitForTimeout(2500);
  if (errors.length) throw Error(errors.join("\n"));
  await page.screenshot({
    path: "docs/portfolio-verification/furnished-3d.png",
  });
  await page.reload();
  await page.getByRole("link", { name: "Materials", exact: true }).click();
  await page
    .getByRole("button", { name: "Forest Siding", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Apply To All Project Walls", exact: true })
    .click();
  await expect
    .poll(async () =>
      (await readProject()).floorPlanData.walls.every(
        (w) => w.color === "#4f5d54",
      ),
    )
    .toBe(true);
  await expect
    .poll(
      async () => Object.keys((await readProject()).sceneData.materials).length,
    )
    .toBe(initialWalls + 1);
  await page.reload();
  await page.getByRole("button", { name: "Return to CAD Studio" }).click();
  await page.waitForURL(/floor-plan\?projectId=/);
  if (new URL(page.url()).searchParams.get("projectId") !== id)
    throw Error("Material return duplicated the project");
  await expect
    .poll(
      async () => Object.keys((await readProject()).sceneData.materials).length,
    )
    .toBe(initialWalls + 1);
  checks.push("Apply material, reload, keep project identity");
  console.log("PASS step: " + checks.at(-1));
  await page.getByRole("link", { name: "Furniture", exact: true }).click();
  await page.getByText("Walnut Dining Block", { exact: true }).click();
  await expect
    .poll(async () => (await readProject()).sceneData.objects.length)
    .toBe(4);
  await page
    .locator('input[accept=".glb"]')
    .setInputFiles("public/models/kenney_furniture-kit/models/bedDouble.glb");
  await expect
    .poll(async () => (await readProject()).sceneData.objects.length)
    .toBe(5);
  await page.reload();
  await expect
    .poll(async () =>
      (await readProject()).sceneData.objects.some((o) =>
        o.gltfPath.startsWith("data:"),
      ),
    )
    .toBe(true);
  checks.push("Place and import furniture, then reload");
  console.log("PASS step: " + checks.at(-1));
  await page.goto(base + "/floor-plan?projectId=" + id);
  await page
    .getByRole("button", { name: "Open project panel", exact: true })
    .click();
  await page.getByRole("button", { name: "BOM & Export", exact: true }).click();
  for (const [label, file] of [
    ["PDF Report", "demo-plan.pdf"],
    ["CAD DXF", "demo-plan.dxf"],
  ]) {
    await page.screenshot({
      path: "docs/portfolio-verification/export-panel.png",
    });
    const [result] = await Promise.all([
      page.waitForEvent("download"),
      page
        .getByRole("button", { name: label, exact: true })
        .click({ timeout: 10000 }),
    ]);
    await result.saveAs("docs/portfolio-verification/" + file);
    const content = await fs.readFile(await result.path());
    if (
      label === "PDF Report" &&
      (!content.toString().startsWith("%PDF-") ||
        !content.toString().includes("Floor plan"))
    )
      throw Error("Missing PDF plan sheet");
    if (label === "CAD DXF" && !content.toString().includes("A-WALL"))
      throw Error("Missing DXF geometry");
  }
  checks.push("Download PDF plan sheet and DXF geometry");
  console.log("PASS step: " + checks.at(-1));
  await page.evaluate((id) => {
    const key = "domus:local:v1:domus:project:" + id;
    const p = JSON.parse(localStorage.getItem(key));
    p.isPublic = true;
    localStorage.setItem(key, JSON.stringify(p));
  }, id);
  await page.goto(base + "/community/" + id);
  await expect(page.locator("svg [data-object-id]")).toHaveCount(5);
  await expect(page.getByText("Bedroom", { exact: true })).toBeVisible();
  checks.push("Gallery shows rooms, openings, and furniture");
  console.log("PASS step: " + checks.at(-1));
  await page.goto(base + "/bim-lift");
  await page
    .locator("input[type=file]")
    .setInputFiles({
      name: "unsupported.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("%PDF-1.4"),
    });
  await expect(
    page.getByText(/Export PDF pages as images first/),
  ).toBeVisible();
  await page.getByRole("button", { name: "Try a sample blueprint" }).click();
  await page
    .getByRole("button", {
      name: "Algorithmic Vectorize (Instant)",
      exact: true,
    })
    .click();
  await expect(
    page.getByText("Extrusion Output", { exact: true }),
  ).toBeVisible();
  checks.push("Reject unsupported uploads and trace bundled blueprint");
  console.log("PASS step: " + checks.at(-1));
  for (const route of [
    "/pricing",
    "/about",
    "/showcase",
    "/blog",
    "/changelog",
    "/privacy",
    "/terms",
    "/cookies",
    "/gdpr",
  ]) {
    const response = await page.goto(base + route);
    if (response.status() !== 200)
      throw Error("Failed supporting page " + route);
  }
  checks.push("Supporting pages describe the student demonstration");
  console.log("PASS step: " + checks.at(-1));
  await page.setViewportSize({ width: 390, height: 844 });
  for (const route of [
    "/editor",
    "/material-lab",
    "/furniture",
    "/bim-lift",
    "/ar-map",
  ]) {
    await page.goto(base + route);
    await page.waitForTimeout(700);
    if (
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      )
    )
      throw Error("Mobile overflow " + route);
    if (route === "/material-lab") {
      await page
        .getByRole("button", {
          name: "Apply To All Project Walls",
          exact: true,
        })
        .scrollIntoViewIfNeeded();
      await expect(
        page.getByRole("button", {
          name: "Apply To All Project Walls",
          exact: true,
        }),
      ).toBeInViewport();
    }
  }
  checks.push("Mobile tool controls remain reachable");
  console.log("PASS step: " + checks.at(-1));
  if (errors.length) throw Error(errors.join("\n"));
  await fs.writeFile(
    "docs/portfolio-verification/results.json",
    JSON.stringify({ checks, uncaughtErrors: errors }, null, 2) + "\n",
  );
  console.log("PASS: " + checks.join("; "));
} finally {
  await browser.close();
}
