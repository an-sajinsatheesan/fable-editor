import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname } from 'node:path';

const distDir = resolve(process.cwd(), 'examples/angular/dist/angular-test/browser');
const port = 4321;

const mime = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.ico': 'image/x-icon',
  '.svg': 'image/svg+xml',
  '.map': 'application/json'
};

const server = createServer(async (req, res) => {
  let url = req.url === '/' ? '/index.html' : req.url;
  const pathPart = url.split('?')[0].slice(1);
  if (!pathPart) {
    res.writeHead(404);
    res.end('Not found');
    return;
  }
  const safe = pathPart.replace(/\.+/g, '.');
  const filePath = resolve(distDir, safe);
  console.log('[server req]', req.url, '->', filePath);
  try {
    const data = await readFile(filePath);
    res.writeHead(200, { 'Content-Type': mime[extname(filePath)] || 'application/octet-stream' });
    res.end(data);
  } catch (e) {
    console.log('[server 404]', req.url);
    res.writeHead(404);
    res.end('Not found');
  }
});

await new Promise((resolve) => server.listen(port, resolve));
console.log(`Serving Angular example at http://localhost:${port}`);

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

await page.goto(`http://localhost:${port}`, { waitUntil: 'networkidle' });

// Wait for the editor to render
await page.waitForSelector('fable-editor .tox', { timeout: 10000 }).catch(() => null);
await page.waitForTimeout(1000);

const editorExists = await page.locator('fable-editor .tox').count();
const content = await page.locator('fable-editor').innerHTML().catch(() => 'EMPTY');

console.log('\n--- Result ---');
console.log('Editor .tox count:', editorExists);
console.log('fable-editor innerHTML (first 500 chars):', content.slice(0, 500));

const hasRealError = logs.some((l) =>
  (l.includes('ERROR') || l.includes('error')) && !l.includes('favicon')
);

if (hasRealError) {
  console.error('\n❌ Console errors detected');
  process.exitCode = 1;
} else if (editorExists === 0) {
  console.error('\n❌ Editor not rendered');
  process.exitCode = 1;
} else {
  console.log('\n✅ Angular example rendered successfully');
}

await browser.close();
server.close();
