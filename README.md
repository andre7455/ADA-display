# ADA Display

Svelte + Vite digital signage player.

## Root layout

- `src/` - application source
- `content/` - images and HTML pages to show in the carousel
- `build-to.sh` - production build script for a chosen output directory
- `tooling/` - npm dependencies, config, tests, and developer tooling

## Content

Add images or HTML pages to `content/`. JPEG (`.jpg`, `.jpeg`, `.jpe`, `.jfif`), PNG, APNG, GIF, WebP, BMP, SVG, ICO, and AVIF are played directly; `.tif`/`.tiff` files are automatically converted to JPEGs under `content/generated/tiff/` by `npm run build` or `npm run dev`. Keep the original TIFFs in `content/`; generated images are replaced on each run. Animated GIFs, APNGs, and WebP files retain their animation. Direct formats depend on the kiosk browser's decoder (notably AVIF on older Firefox); camera formats such as HEIC/HEIF and editable formats such as PSD are not supported.

To control a single slide's duration, prefix its filename with seconds and a dash. For example, `7-sale.tiff` stays on screen for 7 seconds after conversion. Files without this prefix use the default/configured duration.

## URL slides

To show a webpage as a non-interactive slide, add a `.url` file to `content/` containing the page URL.

Example: `content/10-showdown.url`

```txt
https://sv-ada.nl/events/the-showdown
```

During `npm run build`, URL files are automatically screenshotted into `content/generated/`, and the carousel displays those screenshots. The filename duration prefix still applies, so `10-showdown.url` is displayed for 10 seconds.

The build uses a system-installed Chromium when available. On Raspberry Pi OS, install it once with `sudo apt update && sudo apt install chromium` (older releases may call the package `chromium-browser`). If Chromium is elsewhere, set `CHROMIUM_PATH` to its executable. On other systems, the build downloads Playwright Chromium when neither browser is installed. The build machine also needs network access to each URL.

Install the project dependencies, including development dependencies, before building: `npm ci --include=dev`. Serving the already-built `dist/` directory with nginx does not require Node or Chromium.

## Development scripts

- `npm run dev` - start the Vite development server
- `npm run build` - build the production app to `dist/`
- `npm run preview` - preview the production build
- `npm run format` - format project files with Prettier
- `npm run lint` - check formatting and lint with ESLint
- `npm run check` - run `svelte-check`
- `npm run capture -- <url> [output-file]` - manually capture a webpage screenshot into `content/`
- `npm run test` - run automated tests

## nginx build

Build directly to the directory nginx serves:

```sh
./build-to.sh /var/www/ada-display
```

Then point nginx `root` at that output directory.
