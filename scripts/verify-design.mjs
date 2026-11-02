import {chromium,expect} from '@playwright/test';
const browser=await chromium.launch({channel:'msedge',headless:true,args:['--no-proxy-server']});
try {
 const page=await browser.newPage({viewport:{width:1440,height:1000}});
 for(const [route,name] of [['/','home'],['/editor','editor']]){
 await page.goto('http://127.0.0.1:3131'+route); await page.waitForLoadState('networkidle'); await page.locator('.board-photo img').evaluateAll(imgs=>Promise.all(imgs.map(img=>img.decode()))); if(route==='/'){const button=page.getByRole('link',{name:'Open the workshop',exact:true});const box=await button.boundingBox();expect(box.height).toBeGreaterThanOrEqual(44);expect(box.width).toBeGreaterThan(150)} await page.screenshot({path:'docs/screenshots/'+name+'-clay.png',fullPage:true});
 }
 await page.setViewportSize({width:390,height:844});
 for(const [route,name] of [['/','home-mobile'],['/editor','workshop-mobile']]){
 await page.goto('http://127.0.0.1:3131'+route); await page.waitForLoadState('networkidle'); await page.locator('.board-photo img').evaluateAll(imgs=>Promise.all(imgs.map(img=>img.decode())));
 if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw Error('Overflow '+route);
 if(route==='/'){const button=page.getByRole('link',{name:'Open the workshop',exact:true});const box=await button.boundingBox();expect(box.height).toBeGreaterThanOrEqual(44);expect(box.width).toBeGreaterThan(150)} await page.screenshot({path:'docs/screenshots/'+name+'-clay.png',fullPage:true});
 }
 console.log('PASS landing and workshop fit desktop and mobile');
}finally{await browser.close()}
