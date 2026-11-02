import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(here, '..', '..');
const RENDER = path.join(REPO, 'skills', 'new-project', 'references', 'render.mjs');

const render = (deploy) => {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'devkit-render-test-'));
  const answers = path.join(dir, 'answers.json');
  writeFileSync(
    answers,
    JSON.stringify({
      type: 'marketing',
      name: `render-${deploy}`,
      deploy,
      locales: ['en'],
      defaultLocale: 'en',
      addons: [],
      port: 3977,
      rulebookRevision: '2026-11-02',
      versions: { biome: '2.6.4', nodeMajor: '24' },
    }),
  );
  const target = path.join(dir, deploy);
  const result = spawnSync(process.execPath, [RENDER, '--answers', answers, '--target', target], {
    encoding: 'utf8',
    timeout: 60000,
  });
  assert.equal(result.status, 0, result.stdout + result.stderr);
  return {
    dir,
    has: (rel) => existsSync(path.join(target, rel)),
    read: (rel) => readFileSync(path.join(target, rel), 'utf8'),
  };
};

test('marketing with static deploy renders the export set without server files', () => {
  const project = render('static');
  try {
    for (const rel of [
      'src/proxy.ts',
      'src/instrumentation.ts',
      'src/app/api',
      'src/shared/api/server.ts',
      'src/shared/api/bff.server.ts',
      'src/shared/auth',
      'src/shared/lib/safe-redirect',
    ]) {
      assert.equal(project.has(rel), false, `${rel} should be absent`);
    }
    for (const rel of ['nginx.conf', 'scripts/serve-export.mjs', 'tests/e2e/headers.spec.ts']) {
      assert.equal(project.has(rel), true, `${rel} should be present`);
    }
    const config = project.read('next.config.ts');
    assert.match(config, /output: 'export'/);
    assert.match(config, /unoptimized: true/);
    assert.doesNotMatch(config, /headers/);
    assert.match(JSON.parse(project.read('package.json')).scripts.start, /serve-export\.mjs/);
    assert.doesNotMatch(project.read('.env.example'), /API_UPSTREAM_URL/);
  } finally {
    rmSync(project.dir, { recursive: true, force: true });
  }
});

test('marketing with a server deploy keeps the standalone set', () => {
  const project = render('dokku');
  try {
    assert.equal(project.has('src/proxy.ts'), true);
    assert.match(project.read('next.config.ts'), /output: 'standalone'/);
    assert.equal(project.has('nginx.conf'), false);
  } finally {
    rmSync(project.dir, { recursive: true, force: true });
  }
});
