import { mkdtemp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import jpeg from 'jpeg-js';
import UTIF from 'utif';
import { afterEach, describe, expect, it } from 'vitest';
import { contentModulesToItems } from '../../../src/lib/contentDiscovery.js';
import { convertTiffs } from '../../convert-tiff.mjs';

let contentDir;

afterEach(async () => {
  if (contentDir) await rm(contentDir, { recursive: true, force: true });
});

describe('TIFF build conversion', () => {
  it('converts nested TIFFs to playable JPEGs and retains duration prefixes', async () => {
    contentDir = await mkdtemp(path.join(os.tmpdir(), 'ada-content-'));
    await mkdir(path.join(contentDir, 'nested'));
    const tiff = UTIF.encodeImage(new Uint8Array([255, 0, 0, 255]), 1, 1);
    await writeFile(path.join(contentDir, 'nested', '7-red.tiff'), Buffer.from(tiff));

    await convertTiffs(contentDir);

    const image = jpeg.decode(
      await readFile(path.join(contentDir, 'generated', 'tiff', 'nested', '7-red.tiff.jpg')),
    );
    expect([image.width, image.height]).toEqual([1, 1]);
    const [item] = contentModulesToItems({
      '../content/generated/tiff/nested/7-red.tiff.jpg': '/assets/red.jpg',
      '../content/nested/7-red.tiff': '/assets/red.tiff',
    });
    expect(item.durationMs).toBe(7000);
    expect(item.type).toBe('image');
  });

  it('clears stale conversions while preserving other generated content', async () => {
    contentDir = await mkdtemp(path.join(os.tmpdir(), 'ada-content-'));
    await mkdir(path.join(contentDir, 'generated', 'tiff'), { recursive: true });
    await writeFile(path.join(contentDir, 'generated', 'tiff', 'old.jpg'), 'stale');
    await writeFile(path.join(contentDir, 'generated', 'url.png'), 'screenshot');
    await writeFile(path.join(contentDir, 'broken.tif'), 'not a tiff');

    await convertTiffs(contentDir);

    await expect(readdir(path.join(contentDir, 'generated', 'tiff'))).rejects.toThrow();
    expect(await readFile(path.join(contentDir, 'generated', 'url.png'), 'utf8')).toBe(
      'screenshot',
    );
  });
});
