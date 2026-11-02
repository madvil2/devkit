import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import {
  chmodSync,
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  readlinkSync,
  realpathSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const REPO = realpathSync(path.resolve(here, '..', '..'));
const INSTALL = path.join(REPO, 'scripts', 'install.mjs');
const NODE = process.execPath;

const FAKE = [
  '#!/usr/bin/env node',
  "const fs = require('node:fs');",
  'const args = process.argv.slice(2);',
  "fs.appendFileSync(process.env.FAKE_LOG, JSON.stringify(args) + '\\n');",
  "const joined = args.join(' ');",
  "if (joined === 'plugin marketplace list --json') process.stdout.write(process.env.FAKE_MARKETPLACES || '[]');",
  "else if (joined === 'plugin list --json') process.stdout.write(process.env.FAKE_PLUGINS || '[]');",
  "else if (joined === '--version') process.stdout.write('2.1.316 (Claude Code)\\n');",
  '',
].join('\n');

const sandbox = (fn) => () => {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'devkit-install-test-'));
  const home = path.join(dir, 'home');
  mkdirSync(home);
  const fake = path.join(dir, 'claude');
  writeFileSync(fake, FAKE);
  chmodSync(fake, 0o755);
  const log = path.join(dir, 'fake.log');
  const box = {
    dir,
    home,
    claude: path.join(home, '.claude'),
    run(args = [], env = {}) {
      writeFileSync(log, '');
      const childEnv = { ...process.env, HOME: home, DEVKIT_CLAUDE: fake, FAKE_LOG: log, ...env };
      delete childEnv.CLAUDE_CONFIG_DIR;
      const result = spawnSync(NODE, [INSTALL, ...args], { env: childEnv, encoding: 'utf8', timeout: 60000 });
      const output = result.stdout + result.stderr;
      const calls = readFileSync(log, 'utf8')
        .split('\n')
        .filter(Boolean)
        .map((line) => JSON.parse(line).join(' '));
      assertPathsUnderHome(output, home);
      return { code: result.status, output, calls };
    },
  };
  try {
    fn(box);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
};

const assertPathsUnderHome = (output, home) => {
  const homes = [home, realpathSync(home)];
  for (const [, found] of output.matchAll(/(?:^|[\s(])(\/[^\s)]*\/[^\s)]*)/gm)) {
    assert.ok(
      homes.some((prefix) => found === prefix || found.startsWith(`${prefix}/`)),
      `output names a path outside the temp HOME: ${found}\n${output}`,
    );
  }
};

const snapshot = (root) => {
  const entries = [];
  const walk = (dir) => {
    for (const name of readdirSync(dir).sort()) {
      const full = path.join(dir, name);
      const rel = path.relative(root, full);
      const stat = lstatSync(full);
      if (stat.isSymbolicLink()) entries.push([rel, 'link', readlinkSync(full)]);
      else if (stat.isDirectory()) {
        entries.push([rel, 'dir']);
        walk(full);
      } else entries.push([rel, 'file', readFileSync(full, 'utf8')]);
    }
  };
  walk(root);
  return entries;
};

const expectedLinks = () => [
  ...readdirSync(path.join(REPO, 'agents'))
    .filter((name) => name.endsWith('.md'))
    .map((name) => `agents/${name}`),
  'scripts/bounded.mjs',
  'scripts/statusline.sh',
  'hooks/biome-push-check.sh',
  ...readdirSync(path.join(REPO, 'skills'))
    .filter((name) => existsSync(path.join(REPO, 'skills', name, 'SKILL.md')))
    .map((name) => `skills/${name}`),
];

const resolvedTemplate = (claudeDir) =>
  JSON.parse(readFileSync(path.join(REPO, 'install', 'settings.json'), 'utf8').replaceAll('{{CLAUDE_DIR}}', claudeDir));

const readJson = (file) => JSON.parse(readFileSync(file, 'utf8'));
const backups = (claude) => {
  const dir = path.join(claude, 'devkit-backups');
  return existsSync(dir) ? readdirSync(dir).map((name) => path.join(dir, name)) : [];
};
const IMPORT = `@${REPO}/global/CLAUDE.md`;
const ALL_INSTALLED = {
  FAKE_MARKETPLACES: JSON.stringify([{ name: 'claude-plugins-official', source: 'github', repo: 'anthropics/claude-plugins-official' }]),
  FAKE_PLUGINS: JSON.stringify([
    { id: 'github@claude-plugins-official', enabled: true },
    { id: 'linear@claude-plugins-official', enabled: true },
    { id: 'playwright@claude-plugins-official', enabled: true },
  ]),
};
const changes = (calls) => calls.filter((call) => call.startsWith('plugin marketplace add') || call.startsWith('plugin install'));

test('a fresh install links everything, writes the template settings and installs the core plugins', sandbox((box) => {
  const { code, output, calls } = box.run();
  assert.equal(code, 0, output);
  const links = expectedLinks();
  const skillCount = readdirSync(path.join(REPO, 'skills')).filter((name) => existsSync(path.join(REPO, 'skills', name, 'SKILL.md'))).length;
  assert.equal(links.filter((rel) => rel.startsWith('skills/')).length, skillCount);
  for (const rel of links) {
    assert.equal(readlinkSync(path.join(box.claude, rel)), path.join(REPO, rel), rel);
  }
  assert.equal(readdirSync(path.join(box.claude, 'skills')).length, skillCount);
  assert.equal(readFileSync(path.join(box.claude, 'CLAUDE.md'), 'utf8'), `${IMPORT}\n`);
  const settings = readJson(path.join(box.claude, 'settings.json'));
  assert.deepEqual(settings, resolvedTemplate(box.claude));
  assert.equal(settings.permissions, undefined);
  assert.deepEqual(changes(calls), [
    'plugin marketplace add anthropics/claude-plugins-official',
    'plugin install github@claude-plugins-official',
    'plugin install linear@claude-plugins-official',
    'plugin install playwright@claude-plugins-official',
  ]);
}));

test('a second run changes nothing', sandbox((box) => {
  assert.equal(box.run().code, 0);
  const before = snapshot(box.home);
  const { code, output, calls } = box.run([], ALL_INSTALLED);
  assert.equal(code, 0, output);
  assert.deepEqual(snapshot(box.home), before);
  assert.deepEqual(backups(box.claude), []);
  assert.deepEqual(changes(calls), []);
  assert.match(output, /settings\.json: unchanged/);
}));

test('a dry run writes nothing', sandbox((box) => {
  assert.deepEqual(snapshot(box.home), []);
  const { code, output, calls } = box.run(['--dry-run']);
  assert.equal(code, 0, output);
  assert.deepEqual(snapshot(box.home), []);
  assert.match(output, /would link/);
  assert.deepEqual(changes(calls), []);
}));

test('an unknown flag prints usage and exits 2', sandbox((box) => {
  const { code, output } = box.run(['--bogus']);
  assert.equal(code, 2);
  assert.match(output, /usage/i);
  assert.deepEqual(snapshot(box.home), []);
}));

test('merging into existing settings keeps the user values and adds the missing ones', sandbox((box) => {
  mkdirSync(box.claude);
  const seeded = {
    model: 'sonnet',
    attribution: { commit: 'x' },
    permissions: { allow: ['Bash(ls)'] },
    custom: 1,
    hooks: {
      PreToolUse: [{ matcher: 'Bash', hooks: [{ type: 'command', command: `bash ${box.claude}/hooks/biome-push-check.sh` }] }],
      Stop: [{ hooks: [{ type: 'command', command: 'other' }] }],
    },
  };
  const raw = `${JSON.stringify(seeded, null, 4)}\n`;
  writeFileSync(path.join(box.claude, 'settings.json'), raw);
  const { code, output } = box.run([], ALL_INSTALLED);
  assert.equal(code, 0, output);
  const settings = readJson(path.join(box.claude, 'settings.json'));
  assert.equal(settings.model, 'sonnet');
  assert.deepEqual(settings.attribution, { commit: 'x', pr: '', sessionUrl: false });
  assert.deepEqual(settings.permissions, seeded.permissions);
  assert.equal(settings.custom, 1);
  assert.deepEqual(settings.hooks.Stop, seeded.hooks.Stop);
  const biome = settings.hooks.PreToolUse.flatMap((group) => group.hooks).filter((handler) => handler.command.includes('biome-push-check.sh'));
  assert.equal(biome.length, 1);
  assert.deepEqual(settings.statusLine, resolvedTemplate(box.claude).statusLine);
  const [saved] = backups(box.claude);
  assert.equal(readFileSync(path.join(saved, 'settings.json'), 'utf8'), raw);
  assert.match(output, /kept model$/m);
  assert.match(output, /kept attribution\.commit$/m);
  assert.doesNotMatch(output, /sonnet/);
}));

test('invalid settings.json is left alone and the run fails', sandbox((box) => {
  mkdirSync(box.claude);
  const file = path.join(box.claude, 'settings.json');
  writeFileSync(file, '{not json');
  const { code, output } = box.run([], ALL_INSTALLED);
  assert.equal(code, 1, output);
  assert.equal(readFileSync(file, 'utf8'), '{not json');
  assert.equal(readlinkSync(path.join(box.claude, 'agents', 'fable.md')), path.join(REPO, 'agents', 'fable.md'));
}));

test('conflicting files are reported, and replaced into a backup only with --replace', sandbox((box) => {
  const fable = path.join(box.claude, 'agents', 'fable.md');
  const tdd = path.join(box.claude, 'skills', 'tdd');
  const elsewhere = path.join(box.home, 'elsewhere');
  mkdirSync(path.dirname(fable), { recursive: true });
  mkdirSync(path.dirname(tdd), { recursive: true });
  mkdirSync(elsewhere);
  writeFileSync(fable, 'mine');
  symlinkSync(elsewhere, tdd);

  const first = box.run([], ALL_INSTALLED);
  assert.equal(first.code, 1, first.output);
  assert.equal(readFileSync(fable, 'utf8'), 'mine');
  assert.equal(readlinkSync(tdd), elsewhere);
  assert.match(first.output, /conflict ~\/\.claude\/agents\/fable\.md \(real file\)/);
  assert.match(first.output, /conflict ~\/\.claude\/skills\/tdd \(points to ~\/elsewhere\)/);
  assert.match(first.output, /--replace/);

  const second = box.run(['--replace'], ALL_INSTALLED);
  assert.equal(second.code, 0, second.output);
  assert.equal(readlinkSync(fable), path.join(REPO, 'agents', 'fable.md'));
  assert.equal(readlinkSync(tdd), path.join(REPO, 'skills', 'tdd'));
  const [saved] = backups(box.claude);
  assert.equal(readFileSync(path.join(saved, 'agents', 'fable.md'), 'utf8'), 'mine');
  assert.equal(readlinkSync(path.join(saved, 'skills', 'tdd')), elsewhere);
}));

test('an existing CLAUDE.md keeps its content and gets the import once', sandbox((box) => {
  mkdirSync(box.claude);
  const file = path.join(box.claude, 'CLAUDE.md');
  writeFileSync(file, '# Mine\n\nkeep this');
  assert.equal(box.run([], ALL_INSTALLED).code, 0);
  assert.equal(box.run([], ALL_INSTALLED).code, 0);
  assert.equal(readFileSync(file, 'utf8'), `# Mine\n\nkeep this\n${IMPORT}\n`);
}));

test('an import of another devkit is a conflict until --replace rewrites it', sandbox((box) => {
  mkdirSync(box.claude);
  const file = path.join(box.claude, 'CLAUDE.md');
  const original = '# Mine\n@/elsewhere/global/CLAUDE.md\nmore\n';
  writeFileSync(file, original);
  const first = box.run([], ALL_INSTALLED);
  assert.equal(first.code, 1, first.output);
  assert.equal(readFileSync(file, 'utf8'), original);
  const second = box.run(['--replace'], ALL_INSTALLED);
  assert.equal(second.code, 0, second.output);
  assert.equal(readFileSync(file, 'utf8'), `# Mine\n${IMPORT}\nmore\n`);
  const [saved] = backups(box.claude);
  assert.equal(readFileSync(path.join(saved, 'CLAUDE.md'), 'utf8'), original);
}));

test('--bypass-permissions adds the three permission keys', sandbox((box) => {
  const { code, output } = box.run(['--bypass-permissions'], ALL_INSTALLED);
  assert.equal(code, 0, output);
  const settings = readJson(path.join(box.claude, 'settings.json'));
  assert.deepEqual(settings.permissions, { defaultMode: 'bypassPermissions' });
  assert.equal(settings.skipDangerousModePermissionPrompt, true);
  assert.equal(settings.skipAutoPermissionPrompt, true);
}));

test('a plugin installed from another marketplace counts as installed', sandbox((box) => {
  const { code, output, calls } = box.run([], {
    FAKE_MARKETPLACES: JSON.stringify([{ name: 'claude-plugins-official' }, { name: 'anthropic-plugin-directory' }]),
    FAKE_PLUGINS: JSON.stringify([{ id: 'github@anthropic-plugin-directory', enabled: true }]),
  });
  assert.equal(code, 0, output);
  assert.deepEqual(changes(calls), ['plugin install linear@claude-plugins-official', 'plugin install playwright@claude-plugins-official']);
}));

test('--optional adds the optional marketplaces and plugins', sandbox((box) => {
  const { code, output, calls } = box.run(['--optional'], ALL_INSTALLED);
  assert.equal(code, 0, output);
  assert.deepEqual(changes(calls), [
    'plugin marketplace add Millon15/cc-millz',
    'plugin install peer-chat@cc-millz',
    'plugin marketplace add madvil2/autopilot-jobsearch',
    'plugin install autopilot-jobsearch@autopilot-jobsearch',
  ]);
}));

test('without the claude CLI the plugin commands are printed instead', sandbox((box) => {
  const { code, output } = box.run([], { DEVKIT_CLAUDE: path.join(box.dir, 'nonexistent') });
  assert.equal(code, 0, output);
  assert.match(output, /claude plugin marketplace add anthropics\/claude-plugins-official/);
  assert.match(output, /claude plugin install github@claude-plugins-official/);
}));
