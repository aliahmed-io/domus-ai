import { chromium, expect } from "@playwright/test";
import fs from "node:fs/promises";
const browser = await chromium.launch({
  channel: "msedge",
  headless: true,
  args: ["--no-proxy-server"],
});
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
  });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.addInitScript(() => {
    window.__renderAudit = { projection: null, view: null, frames: 0 };
    for (const ctor of [
      window.WebGLRenderingContext,
      window.WebGL2RenderingContext,
    ]) {
      if (!ctor) continue;
      const proto = ctor.prototype,
        names = new WeakMap(),
        programs = new WeakMap();
      const get = proto.getUniformLocation,
        write = proto.uniformMatrix4fv;
      proto.getUniformLocation = function (program, name) {
        const location = get.call(this, program, name);
        if (location) {
          names.set(location, { name, program });
          if (!programs.has(program)) programs.set(program, new Set());
          programs.get(program).add(name);
        }
        return location;
      };
      proto.uniformMatrix4fv = function (location, transpose, data, ...rest) {
        const info = names.get(location),
          name = info?.name,
          standard = info && programs.get(info.program)?.has("roughness");
        if (standard && name === "projectionMatrix") {
          window.__renderAudit.projection = Array.from(data);
          window.__renderAudit.frames++;
        }
        if (standard && name === "viewMatrix")
          window.__renderAudit.view = Array.from(data);
        return write.call(this, location, transpose, data, ...rest);
      };
    }
  });
  await page.goto("http://127.0.0.1:3131/editor");
  await page
    .getByRole("button", { name: "Explore a furnished example" })
    .click();
  await page.waitForURL(/floor-plan/);
  await page.getByRole("button", { name: "3D View", exact: true }).click();
  await expect
    .poll(() => page.evaluate(() => window.__renderAudit.projection?.[15]))
    .toBe(0);
  await page.waitForTimeout(4000);
  await page.screenshot({
    path: "docs/portfolio-verification/3d-review-fresh.png",
  });
  const perspective = await page.evaluate(() => window.__renderAudit);
  await page
    .getByRole("button", { name: "View settings", exact: true })
    .click();
  await page.getByRole("button", { name: /Camera: Perspective/ }).click();
  await page.waitForTimeout(1500);
  const orthographic = await page.evaluate(() => window.__renderAudit);
  expect(orthographic.projection[15]).toBe(1);
  await page.getByRole("button", { name: "Walk through", exact: true }).click();
  await page.waitForTimeout(5000);
  const before = await page.evaluate(() => window.__renderAudit);
  await page.keyboard.down("w");
  await page.waitForTimeout(1000);
  await page.keyboard.up("w");
  const after = await page.evaluate(() => window.__renderAudit);
  expect(JSON.stringify(after.view)).not.toBe(JSON.stringify(before.view));
  const result = {
    perspectiveMatrixW: perspective.projection?.[15],
    orthographicMatrixW: orthographic.projection?.[15],
    orthographicUsesActualOrthographicProjection:
      orthographic.projection?.[15] === 1,
    walkViewChangesWhileHoldingW:
      JSON.stringify(after.view) !== JSON.stringify(before.view),
    uncaughtErrors: errors,
  };
  await fs.writeFile(
    "docs/portfolio-verification/3d-control-audit.json",
    JSON.stringify(result, null, 2),
  );
  console.log(result);
} finally {
  await browser.close();
}
