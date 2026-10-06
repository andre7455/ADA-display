import { describe, expect, it } from 'vitest';
import { findSystemChromium } from '../../system-chromium.mjs';

describe('system Chromium discovery', () => {
  it('chooses the first executable path', async () => {
    expect(await findSystemChromium(['/nonexistent/browser', process.execPath])).toBe(
      process.execPath,
    );
  });

  it('reports when no executable is available', async () => {
    expect(await findSystemChromium(['/nonexistent/browser'])).toBeNull();
  });
});
