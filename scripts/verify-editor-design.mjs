import { chromium, expect } from "@playwright/test";
const browser = await chromium.launch({
  channel: "msedge",
  headless: true,
  args: ["--no-proxy-server"],
});
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
  });
  page.setDefaultTimeout(60000);
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("http://127.0.0.1:3131/editor");
  await page
    .getByRole("button", { name: "Explore a furnished example" })
    .click();
  await page.waitForURL(/floor-plan/);
  await page.getByRole("button", { name: "3D View", exact: true }).click();
  await page.waitForTimeout(3500);
  await expect(
    page.getByRole("button", { name: "View settings", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Start VR session", exact: true }),
  ).toHaveCount(0);
  await page.screenshot({ path: "docs/screenshots/editor-3d.png" });
  await page.getByRole("button", { name: "Add to plan", exact: true }).click();
  await expect(
    page.getByRole("complementary", { name: "Catalog", exact: true }),
  ).toBeVisible();
  await page
    .locator(".editor-catalog-panel img")
    .evaluateAll((imgs) =>
      Promise.all(
        imgs
          .filter((img) => img.getBoundingClientRect().top < innerHeight)
          .map((img) => img.decode()),
      ),
    );
  await page.screenshot({ path: "docs/screenshots/editor-catalog.png" });
  await page
    .getByRole("button", { name: "Close catalog", exact: true })
    .click();
  await page
    .getByRole("button", { name: "View settings", exact: true })
    .click();
  await expect(
    page.getByRole("checkbox", { name: "Lower walls in 3D" }),
  ).toBeChecked();
  await page.getByRole("checkbox", { name: "Lower walls in 3D" }).uncheck();
  await page.keyboard.press("Escape");
  await page.waitForTimeout(700);
  await page.screenshot({ path: "docs/screenshots/editor-full-walls.png" });
  await page
    .getByRole("button", { name: "View settings", exact: true })
    .click();
  await page.getByRole("checkbox", { name: "Lower walls in 3D" }).check();
  await page
    .getByRole("combobox", { name: "Lighting", exact: true })
    .selectOption("sun");
  await expect(page.getByLabel("Time of day")).toBeVisible();
  await page
    .getByRole("combobox", { name: "Lighting", exact: true })
    .selectOption("studio");
  await expect(page.getByLabel("Time of day")).toHaveCount(0);
  await page.screenshot({ path: "docs/screenshots/editor-view-settings.png" });
  await page.keyboard.press("Escape");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(1500);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({ path: "docs/screenshots/editor-3d-mobile.png" });
  await page
    .getByRole("button", { name: "View settings", exact: true })
    .click();
  await expect(
    page.getByRole("checkbox", { name: "Lower walls in 3D" }),
  ).toBeVisible();
  await page.screenshot({
    path: "docs/screenshots/editor-settings-mobile.png",
  });

 await page.keyboard.press("Escape");
 await page.getByRole("button",{name:"2D Plan",exact:true}).click();
 await page.waitForTimeout(600);
 await page.screenshot({path:"docs/screenshots/floor-plan-mobile.png"});
 await page.setViewportSize({width:1440,height:1000});
 await page.waitForTimeout(600);
 const ink = await page.locator(".konvajs-content canvas").first().evaluate(canvas=>{
 const context=canvas.getContext("2d"),{data}=context.getImageData(0,0,canvas.width,canvas.height);let minX=canvas.width,maxX=0,minY=canvas.height,maxY=0;
 for(let y=0;y<canvas.height;y++)for(let x=0;x<canvas.width;x++){const i=(y*canvas.width+x)*4;if(data[i+3]>200&&Math.min(data[i],data[i+1],data[i+2])<230){minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y)}}
 return {centerX:(minX+maxX)/2,centerY:(minY+maxY)/2,width:canvas.width,height:canvas.height,inkWidth:maxX-minX};
 });
 expect(Math.abs(ink.centerX-ink.width/2)).toBeLessThan(50);
 expect(Math.abs(ink.centerY-ink.height/2)).toBeLessThan(50);
 expect(ink.inkWidth).toBeLessThan(ink.width*.95);
 console.log("PASS 2D drawing remains centered after phone-to-desktop resize",ink);
 await page.screenshot({path:"docs/screenshots/floor-plan.png"});
 const mobile=await browser.newPage({viewport:{width:390,height:844}});
 mobile.setDefaultTimeout(60000);
 mobile.on("pageerror",e=>errors.push(e.message));
 await mobile.goto("http://127.0.0.1:3131/floor-plan?new=1");
 await mobile.getByRole("button",{name:/Help me with a layout/}).click();
 await mobile.getByRole("button",{name:"Layout requirements",exact:true}).click();
 const created=mobile.waitForResponse(r=>r.url().endsWith("/api/floor-plan")&&r.request().method()==="POST");
 await mobile.getByRole("button",{name:"Create starting layout",exact:true}).click();
 expect((await created).status()).toBe(200);
 await mobile.getByRole("dialog").getByRole("button",{name:"Close",exact:true}).click();
 await mobile.getByRole("button",{name:"3D View",exact:true}).click();
 await mobile.waitForTimeout(1200);
 expect(await mobile.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await mobile.screenshot({path:"docs/screenshots/generated-layout-mobile.png"});
 console.log("PASS mobile requirements create a saved layout through the shared generator");
  if (errors.length) throw Error(errors.join("\n"));
  console.log(
    "PASS unified editor, catalog, view settings, real wall heights, lighting options, and mobile layout",
  );
} finally {
  await browser.close();
}
