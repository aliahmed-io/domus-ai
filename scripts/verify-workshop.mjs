import { chromium, expect } from "@playwright/test";

(async () => {
  const browser = await chromium.launch({
    channel: "msedge",
    headless: true,
    args: ["--no-proxy-server"],
  });
  try {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 1000 },
    });
    const page = await context.newPage();
    const errors = [],
      external = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("request", (r) => {
      if (/puter|signaling|webrtc/i.test(r.url())) external.push(r.url());
    });
    await page.goto("http://127.0.0.1:3110/");
    await expect(
      page.getByRole("heading", { name: "Make room for your ideas." }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Soft linen" }).click();
    await expect(
      page.getByRole("button", { name: "Soft linen" }),
    ).toHaveAttribute("aria-pressed", "true");
    await expect(
      page.getByAltText("Soft linen interior inspiration"),
    ).toBeVisible();
    await page.getByRole("button", { name: "Natural oak" }).click();
    await page.screenshot({
      path: "docs/screenshots/home.png",
      fullPage: true,
    });
    await page
      .getByRole("link", { name: "Open the workshop", exact: true })
      .click();
    await expect(
      page.getByRole("heading", { name: "What will you make room for?" }),
    ).toBeVisible();
    await page.screenshot({
      path: "docs/screenshots/editor.png",
      fullPage: true,
    });
    await page.getByRole("link", { name: "Start a new plan" }).click();
    await expect(
      page.getByRole("button", { name: /Start from scratch/ }),
    ).toBeVisible();
    await page.screenshot({
      path: "docs/screenshots/floor-plan.png",
      fullPage: true,
    });
    const firstUrl = page.url();
    await page.getByRole("button", { name: /Start from scratch/ }).click();
    await page.waitForTimeout(2200);

    await page.keyboard.press("w");
    const canvas = page.locator(".konvajs-content canvas").first();
    if (await canvas.count()) {
      const b = await canvas.boundingBox();
      await page.mouse.click(b.x + b.width * 0.35, b.y + b.height * 0.55);
      await page.mouse.move(b.x + b.width * 0.55, b.y + b.height * 0.55);
      await page.mouse.click(b.x + b.width * 0.55, b.y + b.height * 0.55);
      await page.keyboard.press("Escape");
      await page.waitForTimeout(2000);
    }
    const saved = await page.evaluate(() =>
      Object.keys(localStorage)
        .filter((k) => k.startsWith("domus:local:v1:domus:project:"))
        .map((k) => JSON.parse(localStorage.getItem(k))),
    );
    if (!saved.some((p) => p.floorPlanData?.walls?.length === 1))
      throw Error("Drawn wall was not saved");
    await page.screenshot({
      path: "docs/screenshots/drawing-workspace.png",
      fullPage: true,
    });
    await page.reload();
    await expect(
      page.getByRole("button", { name: /Start from scratch/ }),
    ).toHaveCount(0);
    await page.goto("http://127.0.0.1:3110/dashboard");
    await expect(page.getByText("Saved in this browser")).toBeVisible();
    await expect(
      page.getByText("Manual Floor Plan", { exact: true }),
    ).toBeVisible();
    await page.goto("http://127.0.0.1:3110/editor");
    await page.getByRole("link", { name: "Start a new plan" }).click();
    await expect(
      page.getByRole("button", { name: /Start from scratch/ }),
    ).toBeVisible();
    if (page.url() === firstUrl)
      throw Error("New plan reused the existing project");
    // Preferences survive a real reload.
    await page.goto("http://127.0.0.1:3110/settings");
    await expect(page.getByLabel("What should we call you?")).toBeEnabled();
    await page.getByLabel("What should we call you?").fill("Review Designer");
    await page.getByRole("button", { name: "Save profile" }).click();
    await page.reload();
    await expect(page.getByLabel("What should we call you?")).toHaveValue(
      "Review Designer",
    );
    // Gallery preview uses the saved wall, and copying creates a new record.
    const originalId = saved[0].id;
    await page.evaluate((id) => {
      const key = "domus:local:v1:domus:project:" + id;
      const project = JSON.parse(localStorage.getItem(key));
      project.isPublic = true;
      localStorage.setItem(key, JSON.stringify(project));
    }, originalId);
    await page.goto("http://127.0.0.1:3110/community");
    await page.getByRole("link", { name: /Manual Floor Plan/ }).click();
    await expect(
      page.getByRole("img", { name: /Saved floor plan/ }).locator("line"),
    ).toHaveCount(1);
    await page.getByRole("button", { name: "Make a copy and edit" }).click();
    await page.waitForURL(/floor-plan\?projectId=/);
    const copiedId = new URL(page.url()).searchParams.get("projectId");
    if (copiedId === originalId) throw Error("Copy reused original ID");
    // Honest contact action produces a local file, not a sent-message state.
    await page.goto("http://127.0.0.1:3110/contact");
    await page.getByLabel("Your name").fill("Review");
    await page.getByLabel("Email address").fill("review@example.com");
    await page.getByLabel("Your message").fill("A local test draft.");
    const draft = page.waitForEvent("download");
    await page.getByRole("button", { name: "Save message draft" }).click();
    if ((await draft).suggestedFilename() !== "domus-message-draft.txt")
      throw Error("Draft filename incorrect");
    await expect(
      page.getByRole("status").filter({ hasText: "Nothing has been sent" }),
    ).toBeVisible();
    const missing = await page.goto(
      "http://127.0.0.1:3110/review-missing-page",
    );
    if (missing.status() !== 404)
      throw Error("Unknown route did not return 404");
    const mobile = await context.newPage();
    await mobile.setViewportSize({ width: 390, height: 844 });
    for (const route of ["/", "/editor", "/floor-plan?new=1", "/login"]) {
      await mobile.goto("http://127.0.0.1:3110" + route);
      await mobile.waitForTimeout(700);
      if (
        await mobile.evaluate(
          () => document.documentElement.scrollWidth > innerWidth,
        )
      )
        throw Error("Mobile overflow: " + route);
      await mobile.screenshot({
        path:
          "docs/screenshots/" +
          (route === "/"
            ? "home-mobile"
            : route === "/editor"
              ? "workshop-mobile"
              : route === "/login"
                ? "entry-mobile"
                : "floor-plan-mobile") +
          ".png",
        fullPage: true,
      });
    }
    await mobile.goto("http://127.0.0.1:3110/");
    await mobile
      .getByRole("button", { name: "Open menu", exact: true })
      .click();
    await expect(
      mobile.getByRole("link", { name: "Start creating" }),
    ).toBeVisible();
    await mobile.getByRole("link", { name: "Start creating" }).click();
    await expect(
      mobile.getByRole("heading", { name: "What will you make room for?" }),
    ).toBeVisible();
    if (external.length)
      throw Error(
        "Unexpected account or collaboration requests: " + external.join(","),
      );
    if (errors.length) throw Error("Page errors: " + errors.join(","));
    console.log(
      "PASS: landing palette, workshop entry, local project creation, drawn wall persisted, reload, dashboard listing, separate new project, profile persistence, gallery geometry, separate project copy, draft download, real 404, four mobile routes, mobile navigation, no account/collaboration requests, no page errors.",
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
