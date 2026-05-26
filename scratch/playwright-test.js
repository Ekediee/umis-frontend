const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('console', msg => console.log('PAGE_CONSOLE', msg.type(), msg.text()));
  page.on('pageerror', err => console.log('PAGE_ERROR', err.message));
  page.on('requestfailed', req => console.log('REQUEST_FAILED', req.url(), req.failure && req.failure().errorText));
  page.on('request', req => {
    try {
      if (req.url().includes('/api/chat')) {
        console.log('REQUEST', req.method(), req.url(), req.postData());
      }
    } catch (e) {}
  });
  page.on('response', resp => {
    const url = resp.url();
    if (url.includes('/api/chat') || url.includes('/api/check-ai')) {
      console.log('RESPONSE', resp.status(), url);
    }
  });

  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded', timeout: 60000 });
  console.log('Loaded page');

  const clicked = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const fab = buttons.find(b => {
      const style = window.getComputedStyle(b);
      if (style.position !== 'fixed') return false;
      const rect = b.getBoundingClientRect();
      return rect.width >= 40 && rect.height >= 40 && rect.bottom < window.innerHeight;
    });
    if (fab) { fab.click(); return true; }
    return false;
  });
  console.log('FAB clicked:', clicked);

  try {
    await page.waitForSelector('input[placeholder="Ask a question..."]', { timeout: 15000 });
    console.log('Input visible');
  } catch (e) {
    console.log('Input not visible');
  }

  try {
    // Focus and type into the input to ensure React receives events
    await page.focus('input[placeholder="Ask a question..."]');
    await page.type('input[placeholder="Ask a question..."]', 'Hello from headless test', { delay: 20 });
    // Click the submit button inside the form
    const clickedSubmit = await page.evaluate(() => {
      const input = document.querySelector('input[placeholder="Ask a question..."]');
      const form = input?.closest('form');
      const btn = form?.querySelector('button[type="submit"]');
      if (btn) { btn.click(); return true; }
      return false;
    });
    console.log('Clicked submit inside form:', clickedSubmit);
    console.log('Submitted message');
  } catch (e) {
    console.log('Could not submit message:', e.message);
  }

  try {
    // Wait for an assistant message to appear
    await page.waitForTimeout(5000);
    const messages = await page.$$eval('div.flex-1.overflow-y-auto p, div.flex-1.overflow-y-auto div', nodes => nodes.map(n => n.textContent.trim()).filter(Boolean).slice(-10));
    console.log('Messages snapshot:', messages);
  } catch (e) {
    console.log('Error capturing messages:', e.message);
  }

  await browser.close();
})();
