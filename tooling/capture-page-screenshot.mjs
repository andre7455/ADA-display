import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

const [, , url, outputName = '10-page.png'] = process.argv;

if (!url) {
  console.error('Usage: npm run capture -- <url> [output-file]');
  console.error('Example: npm run capture -- https://example.com 10-example.png');
  process.exit(1);
}

const outputPath = path.resolve('content', outputName);
await mkdir(path.dirname(outputPath), { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 1920, height: 1080 },
  deviceScaleFactor: 1,
});

try {
  await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
  await page.screenshot({ path: outputPath, fullPage: false });
  console.log(`Saved screenshot to ${path.relative(process.cwd(), outputPath)}`);
} finally {
  await browser.close();
}
