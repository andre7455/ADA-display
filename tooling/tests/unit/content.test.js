import { describe, expect, it } from 'vitest';
import { getConfiguredDuration } from '../../../src/lib/config.js';
import { contentModulesToItems } from '../../../src/lib/contentDiscovery.js';
import {
  CONTENT_TYPES,
  detectContentType,
  isSupportedContent,
} from '../../../src/lib/contentTypes.js';

describe('content type detection', () => {
  it('detects supported image and HTML files', () => {
    expect(detectContentType('/content/ad.JPG')).toBe(CONTENT_TYPES.image);
    expect(detectContentType('/content/banner.png?url')).toBe(CONTENT_TYPES.image);
    expect(detectContentType('/content/loop.webp')).toBe(CONTENT_TYPES.image);
    expect(detectContentType('/content/animation.gif')).toBe(CONTENT_TYPES.image);
    expect(detectContentType('/content/vector.svg')).toBe(CONTENT_TYPES.image);
    expect(detectContentType('/content/page.html')).toBe(CONTENT_TYPES.html);
    expect(detectContentType('/content/page.htm')).toBe(CONTENT_TYPES.html);
  });

  it('ignores unsupported files, including PDFs', () => {
    expect(detectContentType('/content/readme.txt')).toBeNull();
    expect(detectContentType('/content/document.pdf')).toBeNull();
    expect(isSupportedContent('/content/document.pdf')).toBe(false);
  });
});

describe('content discovery', () => {
  it('creates an ordered playlist and ignores unsupported files', () => {
    const items = contentModulesToItems(
      {
        '../content/c-page.html': '/assets/c-page.html',
        '../content/a-image.png': '/assets/a-image.png',
        '../content/b-unsupported.txt': '/assets/b-unsupported.txt',
      },
      { durationMs: 2500 },
    );

    expect(items).toHaveLength(2);
    expect(items.map((item) => item.path)).toEqual([
      '../content/a-image.png',
      '../content/c-page.html',
    ]);
    expect(items.every((item) => item.durationMs === 2500)).toBe(true);
  });

  it('uses a leading filename number as the slide duration in seconds', () => {
    const [timedItem, defaultItem] = contentModulesToItems(
      {
        '../content/12-sale.jpg': '/assets/12-sale.jpg',
        '../content/default.jpg': '/assets/default.jpg',
      },
      { durationMs: 2500 },
    );

    expect(timedItem.durationMs).toBe(12000);
    expect(defaultItem.durationMs).toBe(2500);
  });

  it('uses generated screenshots instead of URL source files', () => {
    const items = contentModulesToItems(
      {
        '../content/5-event.url': '/assets/5-event.url',
        '../content/generated/5-event.png': '/assets/5-event.png',
      },
      {},
      {
        '../content/5-event.url': 'https://example.com/event',
      },
    );

    expect(items.map((item) => item.path)).toEqual(['../content/generated/5-event.png']);
    expect(items[0].durationMs).toBe(5000);
  });

  it('handles an empty content collection', () => {
    expect(contentModulesToItems({})).toEqual([]);
  });
});

describe('display duration configuration', () => {
  it('uses the default duration when none is configured', () => {
    expect(getConfiguredDuration('')).toBe(10000);
  });

  it('uses a configured duration with a safe minimum', () => {
    expect(getConfiguredDuration('?duration=4500')).toBe(4500);
    expect(getConfiguredDuration('?duration=10')).toBe(1000);
  });
});
