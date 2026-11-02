// Read-only browser review against a running production server.
const { chromium } = require('@playwright/test');
const fs = require('node:fs');

(async () => {
  fs.mkdirSync('docs/screenshots', { recursive: true });
  const browser = await chromium.launch({ headless: true, channel: process.env.REVIEW_BROWSER || 'msedge', args: ['--no-proxy-server'] });
  const results = [];
  for (const mobile of [false, true]) {
    const page = await browser.newPage({ viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 1000 } });
    for (const route of mobile ? ['/', '/editor', '/floor-plan', '/settings'] : ['/', '/editor', '/floor-plan', '/dashboard', '/settings', '/community', '/contact', '/bim-lift', '/material-lab', '/furniture', '/ar-map', '/review-missing-page']) {
      const errors = [];
      const onError = error => errors.push(error.message);
      page.on('pageerror', onError);
      const response = await page.goto((process.env.REVIEW_URL || 'http://127.0.0.1:3107') + route);
      await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
      await page.waitForTimeout(1500);
      const info = await page.evaluate(() => ({ title: document.title, heading: document.querySelector('h1,h2')?.textContent?.trim(), overflow: document.documentElement.scrollWidth > innerWidth, text: document.body.innerText.slice(-800) }));
      results.push({ route, mobile, status: response.status(), errors, ...info });
      if (!mobile && ['/', '/editor', '/floor-plan'].includes(route)) await page.screenshot({ path: `docs/screenshots/${route === '/' ? 'home' : route.slice(1)}.png`, fullPage: false });
      if (mobile && route === '/floor-plan') await page.screenshot({ path: 'docs/screenshots/floor-plan-mobile.png' });
      page.off('pageerror', onError);
    }
    await page.close();
  }
  await browser.close();
  fs.writeFileSync('docs/browser-review.json', JSON.stringify(results, null, 2) + '\n');
  console.log(JSON.stringify(results, null, 2));
})().catch(error => { console.error(error); process.exitCode = 1; });
