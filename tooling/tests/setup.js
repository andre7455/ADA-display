import '@testing-library/jest-dom/vitest';

Element.prototype.animate ??= () => ({
  cancel: () => {},
  commitStyles: () => {},
  finished: Promise.resolve(),
  onfinish: null,
  pause: () => {},
  play: () => {},
});
