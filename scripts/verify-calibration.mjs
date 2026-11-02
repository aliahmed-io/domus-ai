import { chromium, expect } from '@playwright/test';
import fs from 'node:fs/promises';
const browser = await chromium.launch({channel:'msedge',headless:true,args:['--no-proxy-server']});
try {
 const page=await browser.newPage({viewport:{width:1440,height:1000}});
 const errors=[]; page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:3131/bim-lift');
 await page.getByRole('button',{name:'Try a sample blueprint'}).click();
 await expect(page.getByText('Scale ready.',{exact:false})).toBeVisible();
 await page.getByRole('button',{name:'Trace this image in the editor',exact:true}).click();
 await page.waitForURL(/floor-plan/);
 const read=()=>page.evaluate(()=>{const id=localStorage.getItem('domus:active-project');return id?JSON.parse(localStorage.getItem('domus:local:v1:domus:project:'+id)):null});
 await expect.poll(async()=>(await read())?.floorPlanData?.blueprint?.pixelsPerFoot).toBe(20);
 const before=await read();
 if(before.floorPlanData.walls.length!==0) throw Error('Manual tracing invented walls');
 await page.reload();
 await expect(page.getByRole('button',{name:'Draw Structural Wall',exact:true})).toBeVisible();
 await expect.poll(async()=>(await read())?.floorPlanData?.blueprint?.imageDataUrl).toMatch(/^data:image\/png;base64,/);
 await page.screenshot({path:'docs/portfolio-verification/calibrated-reference.png',fullPage:true});
 if(errors.length)throw Error(errors.join('\n'));
 await fs.writeFile('docs/portfolio-verification/calibration-results.json',JSON.stringify({checks:['Measured scale','Manual reference preserves empty geometry','Reference persists through reload'],uncaughtErrors:errors},null,2));
 console.log('PASS calibrated reference saves and reloads without invented geometry');
} finally {await browser.close()}
