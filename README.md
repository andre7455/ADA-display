# ADA Display

Svelte + Vite digital signage player.

## Root layout

- `src/` - application source
- `content/` - images and HTML pages to show in the carousel
- `build-to.sh` - production build script for a chosen output directory
- `tooling/` - npm dependencies, config, tests, and developer tooling

## Content

Add images or HTML pages to `content/`. Supported files are discovered automatically at build/dev time; unsupported files are ignored.

To control a single slide's duration, prefix its filename with seconds and a dash. For example, `7-sale.jpg` stays on screen for 7 seconds. Files without this prefix use the default/configured duration.

## Development scripts

- `npm run dev` - start the Vite development server
- `npm run build` - build the production app to `dist/`
- `npm run preview` - preview the production build
- `npm run format` - format project files with Prettier
- `npm run lint` - check formatting and lint with ESLint
- `npm run check` - run `svelte-check`
- `npm run test` - run automated tests

## nginx build

Build directly to the directory nginx serves:

```sh
./build-to.sh /var/www/ada-display
```

Then point nginx `root` at that output directory.
