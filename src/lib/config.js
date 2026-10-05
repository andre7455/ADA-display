const FALLBACK_DURATION_MS = 10000;
const MIN_DURATION_MS = 1000;

/**
 * @param {string} [search]
 * @returns {number}
 */
export function getConfiguredDuration(search = globalThis.location?.search ?? '') {
  const params = new URLSearchParams(search);

  if (!params.has('duration')) {
    return FALLBACK_DURATION_MS;
  }

  const duration = Number(params.get('duration'));

  if (!Number.isFinite(duration)) {
    return FALLBACK_DURATION_MS;
  }

  return Math.max(duration, MIN_DURATION_MS);
}

/**
 * @param {string} [search]
 * @returns {boolean}
 */
export function getDebugMode(search = globalThis.location?.search ?? '') {
  const params = new URLSearchParams(search);
  const debug = params.get('debug');

  return debug === 'true' || debug === '1';
}
