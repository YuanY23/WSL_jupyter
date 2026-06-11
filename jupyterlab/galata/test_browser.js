const { chromium } = require('@playwright/test');

(async () => {
  console.log('Launching browser...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  page.on('console', msg => {
    console.log(`[BROWSER CONSOLE] ${msg.type()}: ${msg.text()}`);
  });

  page.on('pageerror', err => {
    console.log(`[BROWSER ERROR] ${err.message}`);
  });

  console.log('Navigating to http://localhost:8888/lab ...');
  try {
    await page.goto('http://localhost:8888/lab', { waitUntil: 'load', timeout: 30000 });
    console.log('Page loaded. Waiting 10 seconds for rendering...');
    await page.waitForTimeout(10000);
    
    console.log('Taking screenshot...');
    await page.screenshot({ path: 'jupyterlab_screenshot.png', fullPage: true });
    console.log('Screenshot saved to jupyterlab_screenshot.png');
  } catch (e) {
    console.error('Error during browser run:', e);
  } finally {
    await browser.close();
  }
})();
