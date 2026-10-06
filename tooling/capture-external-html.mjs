import { spawn } from 'node:child_process';
import { mkdir, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

process.env.PLAYWRIGHT_BROWSERS_PATH ||= path.resolve('tooling/.playwright-browsers');

const contentDir = path.resolve('content');
const generatedDir = path.join(contentDir, 'generated');

async function findSourceFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);

    if (entry.isDirectory() && entry.name !== 'generated') {
      files.push(...(await findSourceFiles(entryPath)));
    }

    if (entry.isFile() && /\.(html?|url)$/i.test(entry.name)) {
      files.push(entryPath);
    }
  }

  return files;
}

function externalIframeUrl(html) {
  return html.match(/<iframe\b[^>]*\bsrc=["'](https?:\/\/[^"']+)["']/i)?.[1] ?? null;
}

function plainUrl(text) {
  return text
    .split('\n')
    .map((line) => line.trim())
    .find((line) => line.startsWith('http://') || line.startsWith('https://'));
}

function pageUrl(filePath, content) {
  return filePath.endsWith('.url') ? plainUrl(content) : externalIframeUrl(content);
}

function screenshotName(filePath) {
  return `${path.basename(filePath, path.extname(filePath))}.png`;
}

async function installChromium() {
  const command = process.platform === 'win32' ? 'npx.cmd' : 'npx';

  await new Promise((resolve, reject) => {
    const child = spawn(command, ['playwright', 'install', 'chromium'], {
      env: process.env,
      stdio: 'inherit',
    });

    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Playwright Chromium install failed with exit code ${code}`));
      }
    });
  });
}

async function launchBrowser() {
  const { chromium } = await import('playwright');

  try {
    return await chromium.launch();
  } catch (error) {
    if (error instanceof Error && error.message.includes("Executable doesn't exist")) {
      console.log('Playwright Chromium is missing; installing it locally...');
      await installChromium();
      return chromium.launch();
    }

    throw error;
  }
}

const sourceFiles = await findSourceFiles(contentDir);
const pages = [];

for (const filePath of sourceFiles) {
  const content = await readFile(filePath, 'utf8');
  const url = pageUrl(filePath, content);

  if (url) {
    pages.push({ filePath, url });
  }
}

if (pages.length === 0) {
  process.exit(0);
}

await mkdir(generatedDir, { recursive: true });

const browser = await launchBrowser();

try {
  for (const { filePath, url } of pages) {
    const page = await browser.newPage({
      viewport: { width: 1920, height: 1080 },
      deviceScaleFactor: 1,
    });

    const outputPath = path.join(generatedDir, screenshotName(filePath));

    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await page.waitForTimeout(5000);
      await page.screenshot({ path: outputPath, fullPage: false });
      console.log(`Captured ${url} -> ${path.relative(process.cwd(), outputPath)}`);
    } finally {
      await page.close();
    }
  }
} finally {
  await browser.close();
}
