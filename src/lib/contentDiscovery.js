import { detectContentType } from './contentTypes.js';

const DEFAULT_DURATION_MS = 10000;

/**
 * @typedef {object} ContentItem
 * @property {string} id
 * @property {string} title
 * @property {import('./contentTypes.js').ContentType} type
 * @property {string} path
 * @property {string} url
 * @property {number} durationMs
 * @property {boolean=} failed
 */

/**
 * @typedef {object} DiscoveryOptions
 * @property {number=} durationMs
 */

/**
 * @param {string} path
 * @returns {string}
 */
function nameFromPath(path) {
  return (path.split('/').pop() ?? path).replace(/\.[^.]+$/, '');
}

/**
 * @param {string} path
 * @returns {number | null}
 */
function durationFromPath(path) {
  const match = nameFromPath(path).match(/^(\d+)-/);

  return match ? Number(match[1]) * 1000 : null;
}

/**
 * @param {string} path
 * @returns {string}
 */
function generatedScreenshotPath(path) {
  return path.replace('/content/', '/content/generated/').replace(/\.(html?|url)$/i, '.png');
}

/**
 * @param {string} path
 * @param {string | undefined} rawContent
 * @param {Set<string>} generatedPaths
 * @returns {boolean}
 */
function shouldSkipSource(path, rawContent, generatedPaths) {
  return Boolean(
    generatedPaths.has(generatedScreenshotPath(path)) &&
    (path.endsWith('.url') || rawContent?.match(/<iframe\b[^>]*\bsrc=["']https?:\/\//i)),
  );
}

/**
 * @param {string} path
 * @param {string} url
 * @param {number} [durationMs]
 * @returns {ContentItem | null}
 */
export function createContentItem(path, url, durationMs = DEFAULT_DURATION_MS) {
  const type = detectContentType(path);

  if (!type) {
    return null;
  }

  return {
    id: path,
    title: nameFromPath(path),
    type,
    path,
    url,
    durationMs: durationFromPath(path) ?? durationMs,
  };
}

/**
 * @param {Record<string, string>} modules
 * @param {DiscoveryOptions} [options]
 * @param {Record<string, string>} [sourceModules]
 * @returns {ContentItem[]}
 */
export function contentModulesToItems(modules, options = {}, sourceModules = {}) {
  const durationMs = options.durationMs ?? DEFAULT_DURATION_MS;
  const generatedPaths = new Set(
    Object.keys(modules).filter((path) => path.includes('/generated/')),
  );

  return Object.entries(modules)
    .filter(([path]) => !shouldSkipSource(path, sourceModules[path], generatedPaths))
    .map(([path, url]) => createContentItem(path, url, durationMs))
    .filter((item) => item !== null)
    .sort((first, second) => first.path.localeCompare(second.path));
}

/**
 * @param {DiscoveryOptions} [options]
 * @returns {ContentItem[]}
 */
export function discoverContent(options = {}) {
  const modules = /** @type {Record<string, string>} */ (
    import.meta.glob('../../content/**/*', {
      eager: true,
      import: 'default',
      query: '?url',
    })
  );

  const sourceModules = /** @type {Record<string, string>} */ (
    import.meta.glob('../../content/**/*.{html,htm,url}', {
      eager: true,
      import: 'default',
      query: '?raw',
    })
  );

  return contentModulesToItems(modules, options, sourceModules);
}
