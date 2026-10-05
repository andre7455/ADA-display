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
 * @returns {ContentItem[]}
 */
export function contentModulesToItems(modules, options = {}) {
  const durationMs = options.durationMs ?? DEFAULT_DURATION_MS;

  return Object.entries(modules)
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

  return contentModulesToItems(modules, options);
}
