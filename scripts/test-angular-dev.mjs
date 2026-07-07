import { chromium } from 'playwright';

const url = process.argv[2] || 'http://localhost:4200';

const browser = await chromium.launch();
const page = await browser.newPage();
const logs = [];
page.on('console', (msg) => {
  const text = `[${msg.type()}] ${msg.text()}`;
  logs.push(text);
  console.log(text);
});
page.on('pageerror', (err) => {
  const text = `[PAGE ERROR] ${err.message}`;
  logs.push(text);
  console.error(text);
});

await page.goto(url, { waitUntil: 'networkidle' });
await page.waitForSelector('fable-editor .tox', { timeout: 10000 }).catch(() => null);
await page.waitForTimeout(1000);

const editorExists = await page.locator('fable-editor .tox').count();
const content = await page.locator('fable-editor').innerHTML().catch(() => 'EMPTY');
console.log('\n--- Result ---');
console.log('Editor .tox count:', editorExists);
console.log('fable-editor innerHTML:', content.slice(0, 500));

const hasRealError = logs.some((l) =>
  (l.includes('ERROR') || l.includes('error') || l.includes('PAGE ERROR')) && !l.includes('favicon')
);
process.exitCode = (hasRealError || editorExists === 0) ? 1 : 0;
await browser.close();
