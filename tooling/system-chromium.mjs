import { constants } from 'node:fs';
import { access } from 'node:fs/promises';

export async function findSystemChromium(
  candidates = [
    process.env.CHROMIUM_PATH,
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/usr/lib/chromium/chromium',
    '/snap/bin/chromium',
    '/usr/bin/google-chrome',
  ],
) {
  for (const candidate of candidates) {
    if (!candidate) continue;

    try {
      await access(candidate, constants.X_OK);
      return candidate;
    } catch {
      // Try the next available browser path.
    }
  }

  return null;
}
