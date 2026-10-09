import { spawnSync } from 'node:child_process';
import { chmod, copyFile, mkdir, mkdtemp, readFile, rm, utimes, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { afterEach, expect, it } from 'vitest';

const project = process.cwd();
let workspace;

afterEach(async () => {
  if (workspace) await rm(workspace, { recursive: true, force: true });
});

async function fakeCommand(bin, name, script) {
  const file = path.join(bin, name);
  await writeFile(file, `#!/bin/sh\n${script}\n`);
  await chmod(file, 0o755);
}

it('applies the display schedule even when a build is locked, without rebuilding unchanged content', async () => {
  workspace = await mkdtemp(path.join(os.tmpdir(), 'ada-start-'));
  const repo = path.join(workspace, 'repo');
  const bin = path.join(workspace, 'bin');
  const output = path.join(workspace, 'nginx');
  const log = path.join(workspace, 'commands.log');
  await mkdir(path.join(repo, 'content'), { recursive: true });
  await mkdir(path.join(repo, 'tooling'));
  await mkdir(bin);
  await copyFile(path.join(project, 'start.sh'), path.join(repo, 'start.sh'));
  await chmod(path.join(repo, 'start.sh'), 0o755);
  await writeFile(path.join(repo, 'content', 'slide.png'), 'image');
  await writeFile(path.join(repo, 'local-file'), 'keep');

  await fakeCommand(
    bin,
    'git',
    'echo "git $*" >> "$COMMAND_LOG"\ncase "$1" in rev-parse) echo same-commit;; esac',
  );
  await fakeCommand(
    bin,
    'npm',
    'echo "npm $*" >> "$COMMAND_LOG"\nif [ "$1" = ci ]; then mkdir -p node_modules/.bin; touch node_modules/.bin/vite; chmod +x node_modules/.bin/vite; fi\nwhile [ "$#" -gt 0 ]; do\n  if [ "$1" = --outDir ]; then shift; mkdir -p "$1"; echo built > "$1/index.html"; fi\n  shift\ndone',
  );
  await fakeCommand(
    bin,
    'flock',
    'echo "flock $*" >> "$COMMAND_LOG"\nif [ "$LOCKED" = 1 ]; then exit 1; fi',
  );
  await fakeCommand(bin, 'pgrep', 'exit 1');
  await fakeCommand(bin, 'pkill', 'exit 0');
  await fakeCommand(bin, 'chromium', 'echo "kiosk $*" >> "$COMMAND_LOG"');
  await fakeCommand(
    bin,
    'curl',
    'echo "probe $*" >> "$COMMAND_LOG"\nif [ "$PRIMARY_UP" = 1 ]; then exit 0; fi\nexit 22',
  );
  await fakeCommand(bin, 'date', 'if [ "$1" = +%a ]; then echo Wed; else echo 0900; fi');
  await fakeCommand(bin, 'wlr-randr', 'echo "display $*" >> "$COMMAND_LOG"');
  await writeFile(path.join(repo, 'display.conf'), 'DAYS=mon,tue\nSTART=08:00\nEND=22:00\n');

  const env = {
    ...process.env,
    PATH: `${bin}:${process.env.PATH}`,
    COMMAND_LOG: log,
    KIOSK_BROWSER: 'chromium',
  };
  const start = () => spawnSync(path.join(repo, 'start.sh'), [output], { cwd: workspace, env });
  const locked = () =>
    spawnSync(path.join(repo, 'start.sh'), [output], {
      cwd: workspace,
      env: { ...env, LOCKED: '1' },
    });
  const off = locked();
  expect(off.status, off.stderr.toString()).toBe(0);
  expect(await readFile(log, 'utf8')).toContain('display --output HDMI-A-1 --off');

  await writeFile(path.join(repo, 'display.conf'), 'DAYS=mon,tue,wed\nSTART=08:00\nEND=22:00\n');
  const on = locked();
  expect(on.status, on.stderr.toString()).toBe(0);
  const lockedCalls = await readFile(log, 'utf8');
  expect(lockedCalls).toContain('display --output HDMI-A-1 --on');
  expect(lockedCalls).not.toMatch(/git|npm/);

  const live = spawnSync(path.join(repo, 'start.sh'), [output], {
    cwd: workspace,
    env: { ...env, LOCKED: '1', PRIMARY_URL: 'https://example.test/live', PRIMARY_UP: '1' },
  });
  expect(live.status, live.stderr.toString()).toBe(0);
  expect(await readFile(path.join(repo, 'tooling', '.kiosk-target'), 'utf8')).toBe(
    'https://example.test/live\n',
  );

  const unavailable = spawnSync(path.join(repo, 'start.sh'), [output], {
    cwd: workspace,
    env: { ...env, LOCKED: '1', PRIMARY_URL: 'https://example.test/live', PRIMARY_UP: '0' },
  });
  expect(unavailable.status, unavailable.stderr.toString()).toBe(0);
  expect(await readFile(path.join(repo, 'tooling', '.kiosk-target'), 'utf8')).toBe(
    'http://localhost\n',
  );
  expect(await readFile(log, 'utf8')).not.toMatch(/git|npm/);

  const first = start();
  expect(first.status, first.stderr.toString()).toBe(0);
  expect(await readFile(path.join(output, 'index.html'), 'utf8')).toContain('built');
  expect(await readFile(path.join(repo, 'local-file'), 'utf8')).toBe('keep');

  const second = start();
  expect(second.status, second.stderr.toString()).toBe(0);
  let calls = await readFile(log, 'utf8');
  expect(calls.match(/npm ci/g)).toHaveLength(1);
  expect(calls.match(/npm run build/g)).toHaveLength(1);
  expect(calls.match(/flock -n 9/g)).toHaveLength(6);
  expect(calls).not.toMatch(/git (reset|clean)/);

  await utimes(
    path.join(repo, 'content', 'slide.png'),
    new Date('2030-01-01'),
    new Date('2030-01-01'),
  );
  const third = start();
  expect(third.status, third.stderr.toString()).toBe(0);
  calls = await readFile(log, 'utf8');
  expect(calls.match(/npm run build/g)).toHaveLength(2);
  expect(calls).toContain('display --output HDMI-A-1 --on');
});
