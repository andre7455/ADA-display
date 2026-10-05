import { cleanup, fireEvent, render, screen } from '@testing-library/svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import SignagePlayer from '../../../src/components/SignagePlayer.svelte';
import { CONTENT_TYPES } from '../../../src/lib/contentTypes.js';

const imageItem = {
  id: 'image',
  title: 'Image advert',
  type: CONTENT_TYPES.image,
  path: '../content/image.png',
  url: '/image.png',
  durationMs: 1000,
};

const htmlItem = {
  id: 'html',
  title: 'HTML advert',
  type: CONTENT_TYPES.html,
  path: '../content/page.html',
  url: '/page.html',
  durationMs: 1000,
};

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('SignagePlayer integration', () => {
  it('renders images with aspect-ratio preserving behavior', () => {
    render(SignagePlayer, { items: [imageItem] });

    const image = screen.getByAltText('Image advert');

    expect(image).toHaveAttribute('src', '/image.png');
    expect(image).toHaveClass('object-contain');
    expect(image).toHaveClass('h-screen');
    expect(image).toHaveClass('w-screen');
  });

  it('renders HTML in an isolated iframe', () => {
    render(SignagePlayer, { items: [htmlItem] });

    const frame = screen.getByTitle('HTML advert');

    expect(frame).toHaveAttribute('src', '/page.html');
    expect(frame.getAttribute('sandbox')).toContain('allow-scripts');
  });

  it('uses the full viewport without visible controls', () => {
    render(SignagePlayer, { items: [imageItem] });

    const main = screen.getByRole('main');

    expect(main).toHaveClass('h-screen');
    expect(main).toHaveClass('w-screen');
    expect(main).toHaveClass('overflow-hidden');
  });

  it('shows slide dots and progress information', () => {
    render(SignagePlayer, { items: [imageItem, htmlItem] });

    expect(screen.getByLabelText('Slide 1 of 2')).toBeInTheDocument();
    expect(document.querySelectorAll('[aria-current="true"]')).toHaveLength(1);
  });

  it('handles empty content collections gracefully', () => {
    render(SignagePlayer, { items: [] });

    expect(screen.getByText('No playable content found')).toBeInTheDocument();
  });

  it('skips a failed item without stopping playback', async () => {
    render(SignagePlayer, { items: [imageItem, htmlItem] });

    await fireEvent.error(screen.getByAltText('Image advert'));

    expect(screen.getByTitle('HTML advert')).toBeInTheDocument();
  });
});
