export const CONTENT_TYPES = Object.freeze({
  image: 'image',
  html: 'html',
});

/** @typedef {typeof CONTENT_TYPES[keyof typeof CONTENT_TYPES]} ContentType */

const IMAGE_EXTENSIONS = new Set([
  'apng',
  'avif',
  'bmp',
  'gif',
  'ico',
  'jpe',
  'jpeg',
  'jfif',
  'jpg',
  'png',
  'svg',
  'webp',
]);

/**
 * @param {string} path
 * @returns {string}
 */
export function getFileExtension(path) {
  const cleanPath = path.split(/[?#]/)[0];
  const fileName = cleanPath.split('/').pop() ?? '';
  const extension = fileName.includes('.') ? (fileName.split('.').pop() ?? '') : '';

  return extension.toLowerCase();
}

/**
 * @param {string} path
 * @returns {ContentType | null}
 */
export function detectContentType(path) {
  const extension = getFileExtension(path);

  if (IMAGE_EXTENSIONS.has(extension)) {
    return CONTENT_TYPES.image;
  }

  if (extension === 'html' || extension === 'htm') {
    return CONTENT_TYPES.html;
  }

  return null;
}

/**
 * @param {string} path
 * @returns {boolean}
 */
export function isSupportedContent(path) {
  return detectContentType(path) !== null;
}
