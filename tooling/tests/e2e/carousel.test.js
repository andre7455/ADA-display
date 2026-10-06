import { cleanup, render, screen } from '@testing-library/svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import SignagePlayer from '../../../src/components/SignagePlayer.svelte';
import { CONTENT_TYPES } from '../../../src/lib/contentTypes.js';

const items = [
  {
    id: 'first-image',
    title: 'First image',
    type: CONTENT_TYPES.image,
    path: '../content/01-first.png',
    url: '/01-first.png',
    durationMs: 1000,
  },
  {
    id: 'html-page',
    title: 'HTML page',
    type: CONTENT_TYPES.html,
    path: '../content/02-page.html',
    url: '/02-page.html',
    durationMs: 1000,
  },
  {
    id: 'second-image',
    title: 'Second image',
    type: CONTENT_TYPES.image,
    path: '../content/03-second.webp',
    url: '/03-second.webp',
    durationMs: 1000,
  },
];

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('carousel e2e behavior', () => {
  it('keeps cycling when there is only one slide', async () => {
    vi.useFakeTimers();
    render(SignagePlayer, { items: [items[0]] });

    expect(vi.getTimerCount()).toBe(1);
    await vi.advanceTimersByTimeAsync(1000);
    expect(vi.getTimerCount()).toBe(1);
    expect(screen.getByAltText('First image')).toBeInTheDocument();
  });

  it('cycles continuously through mixed image and HTML content', async () => {
    vi.useFakeTimers();

    render(SignagePlayer, { items });

    expect(screen.getByAltText('First image')).toBeInTheDocument();

    await vi.advanceTimersByTimeAsync(1000);
    expect(screen.getByTitle('HTML page')).toBeInTheDocument();

    await vi.advanceTimersByTimeAsync(1000);
    expect(screen.getByAltText('Second image')).toBeInTheDocument();

    await vi.advanceTimersByTimeAsync(1000);
    expect(screen.getByAltText('First image')).toBeInTheDocument();
  });
});
