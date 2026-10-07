# ADA Display

Svelte + Vite digital signage player.

## Root layout

- `src/` - application source
- `content/` - images and HTML pages to show in the carousel
- `start.sh` - update, build, and start the kiosk on the display machine
- `tooling/` - npm dependencies, config, tests, and developer tooling

## Content

Add images or HTML pages to `content/`. JPEG (`.jpg`, `.jpeg`, `.jpe`, `.jfif`), PNG, APNG, GIF, WebP, BMP, SVG, ICO, and AVIF are played directly; `.tif`/`.tiff` files are automatically converted to JPEGs under `content/generated/tiff/` by `npm run build` or `npm run dev`. Keep the original TIFFs in `content/`; unchanged TIFFs reuse their generated JPEGs, and removed TIFFs have their generated JPEGs cleaned up. Animated GIFs, APNGs, and WebP files retain their animation. Direct formats depend on the kiosk browser's decoder (notably AVIF on older Firefox); camera formats such as HEIC/HEIF and editable formats such as PSD are not supported.

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

## Starting the display

On the display machine, point nginx at `/var/www/html`, then call `./start.sh` from any directory. You can pass another nginx output directory: `./start.sh /var/www/ada-display`. `DISPLAY_URL` overrides the kiosk URL (default `http://localhost`), and `KIOSK_BROWSER` selects a browser; otherwise Chromium is preferred, with Firefox as a fallback.

`start.sh` attempts a fast-forward update from `origin/main` without resetting or deleting local files. It installs npm dependencies only on the first run or when package files change. It builds if the revision changes, source content changes, the output is missing, or `REBUILD=1` is set; then it starts or refreshes the kiosk. If the network is unavailable or the repository cannot fast-forward, it uses the current local revision. A failed install or build stops the script before the kiosk is restarted. Webpage screenshots refresh when a build occurs; use `REBUILD=1` for an unconditional refresh.

For a five-minute cron schedule, use `*/5 * * * * /home/ada/Desktop/ADA-display/start.sh >> /home/ada/ada-display.log 2>&1` in the desktop user's crontab. Each invocation applies the display schedule, then checks for updates and keeps the kiosk running; unchanged runs do not reinstall or rebuild. Overlapping builds are skipped using `flock` (included with Raspberry Pi OS), but the schedule is still applied every five minutes. Run cron as the logged-in desktop user so the browser and `wlr-randr` can access its display session. `start.sh` fills in the usual Wayland/X11 session variables when cron does not provide them.

Optional `display.conf` (see the example in the project root) controls the output schedule using `wlr-randr`. Set `DISPLAY_OUTPUT` if your connector is not `HDMI-A-1`. The output directory must be dedicated to this app: Vite clears its contents during a build. For a build without kiosk launch or Git updates, use `npm run build` (output: `dist/`).
