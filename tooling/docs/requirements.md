# Digital Signage Web Application Requirements

## Purpose

The application is a digital signage player designed to continuously display a rotating collection of advertisements and other content on a dedicated screen.

## Content Discovery

- The application must automatically discover available content.
- No manually maintained playlist or manifest should be required.
- Content type must be determined automatically from the available files.
- Adding or removing content must not require changes to the application code.
- Unsupported files must be ignored without interrupting playback.

## Supported Content

The application must support:

- JPEG images
- PNG images
- WebP images
- GIF images
- Other commonly supported browser image formats
- HTML documents/pages

The architecture should allow additional content types to be added later without major changes to the player.

## Carousel

- Content must be displayed sequentially.
- After the final item, playback must continue from the first item.
- Playback must continue indefinitely.
- Content transitions must happen automatically.
- A default display duration must exist.
- Display duration should be configurable.
- Transitions between content should be visually smooth.
- Loading the next item should not cause visible browser errors or flashes where reasonably avoidable.

## Images

- Images must maintain their original aspect ratio.
- Images must not be stretched or distorted.
- Images should use as much of the available display area as possible.
- Letterboxing must be handled consistently.

## HTML Content

- HTML content must be rendered as a webpage, not displayed as source code.
- HTML content must be isolated from the main player.
- Errors in HTML content must not crash or interfere with the carousel.
- When its display period ends, the carousel must be able to move away from the HTML content regardless of what that content is doing.

## Full-Screen Display

- The application must be suitable for full-screen/kiosk display.
- Content should use the complete available viewport.
- The interface must not require keyboard, mouse, or touch interaction during normal operation.
- Player controls, scrollbars, debugging information, and other unnecessary UI must not normally be visible.

## Reliability

- The application must be suitable for continuous unattended operation.
- A corrupt or unreadable content item must not stop playback.
- Failed content must be skipped automatically.
- An empty content collection must be handled gracefully.
- Unexpected content errors must not crash the complete application.
- The player must recover gracefully when possible and continue to the next item.

## Testing Requirements

Automated tests must cover the core behavior of the application.

Tests must include:

- Content discovery.
- File-type detection.
- Supported and unsupported file handling.
- Correct carousel ordering.
- Moving to the next item.
- Looping from the final item back to the first.
- Image rendering behavior.
- HTML rendering and isolation.
- Configurable display duration.
- Empty content collections.
- Corrupt or unreadable files.
- Failure of an individual content item.
- Ensuring a failed item does not stop the carousel.
- Aspect-ratio handling.
- Full-viewport display behavior.

Tests should be separated appropriately into:

- Unit tests for individual components and content-handling logic.
- Integration tests for interactions between the player and different content types.
- End-to-end tests that verify an actual carousel can continuously cycle through mixed image and HTML content.

A representative set of test content should be included specifically for automated testing.
