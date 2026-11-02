#!/usr/bin/env node
// Sets up Claude Code from this clone: links agents, scripts, the Biome hook and skills into
// ~/.claude, imports global/CLAUDE.md, merges install/settings.json into ~/.claude/settings.json
// (your values win) and installs the plugins in install/plugins.json.
// Usage: node scripts/install.mjs [--dry-run] [--replace] [--optional] [--bypass-permissions]
// DEVKIT_CLAUDE overrides the claude binary used for plugin commands (default: claude).

import { spawnSync } from 'node:child_process';
import {
  chmodSync,
  copyFileSync,
  existsSync,
  lstatSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  readlinkSync,
  realpathSync,
  renameSync,
  statSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const USAGE = 'usage: node scripts/install.mjs [--dry-run] [--replace] [--optional] [--bypass-permissions]';

if (Number(process.versions.node.split('.')[0]) < 20) {
  console.error('install.mjs needs Node 20 or later');
  process.exit(1);
}
if (process.platform === 'win32') {
  console.error('install.mjs supports macOS or Linux only');
  process.exit(1);
}

const FLAGS = ['--dry-run', '--replace', '--optional', '--bypass-permissions'];
const args = process.argv.slice(2);
const unknown = args.filter((arg) => !FLAGS.includes(arg));
if (unknown.length) {
  console.error(`unknown option: ${unknown.join(' ')}\n${USAGE}`);
  process.exit(2);
}
const DRY = args.includes('--dry-run');
const REPLACE = args.includes('--replace');
const OPTIONAL = args.includes('--optional');
const BYPASS = args.includes('--bypass-permissions');

const ROOT = realpathSync(join(dirname(fileURLToPath(import.meta.url)), '..'));
const HOME = homedir();
const CLAUDE = join(HOME, '.claude');
const BIN = process.env.DEVKIT_CLAUDE || 'claude';

const homes = [HOME];
try {
  const real = realpathSync(HOME);
  if (real !== HOME) homes.push(real);
} catch {}
const short = (path) => {
  for (const prefix of homes) {
    if (path === prefix) return '~';
    if (path.startsWith(`${prefix}/`)) return `~${path.slice(prefix.length)}`;
  }
  return path;
};

const counts = { linked: 0, ok: 0, replaced: 0, conflicts: 0, added: 0, kept: 0, installed: 0, errors: 0 };
const say = (line) => console.log(line);
const error = (line) => {
  counts.errors += 1;
  console.error(`error: ${line}`);
};

const stamp = () => {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
};
let backupDir;
const backup = () => {
  if (backupDir) return backupDir;
  const base = join(CLAUDE, 'devkit-backups', stamp());
  let candidate = base;
  for (let n = 1; existsSync(candidate); n += 1) candidate = `${base}-${n}`;
  mkdirSync(candidate, { recursive: true });
  backupDir = candidate;
  return backupDir;
};

const lstat = (path) => {
  try {
    return lstatSync(path);
  } catch (err) {
    if (err.code === 'ENOENT') return undefined;
    throw err;
  }
};
const real = (path) => {
  try {
    return realpathSync(path);
  } catch {
    return undefined;
  }
};

const linkTargets = () => {
  const skills = readdirSync(join(ROOT, 'skills'), { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && existsSync(join(ROOT, 'skills', entry.name, 'SKILL.md')))
    .map((entry) => `skills/${entry.name}`);
  const agents = readdirSync(join(ROOT, 'agents'))
    .filter((name) => name.endsWith('.md'))
    .map((name) => `agents/${name}`);
  return [...agents, 'scripts/bounded.mjs', 'scripts/statusline.sh', 'hooks/biome-push-check.sh', ...skills];
};

const link = (rel) => {
  const source = join(ROOT, rel);
  const target = join(CLAUDE, rel);
  const stat = lstat(target);
  if (!stat) {
    if (!DRY) {
      mkdirSync(dirname(target), { recursive: true });
      symlinkSync(source, target);
    }
    counts.linked += 1;
    say(`${DRY ? 'would link' : 'linked'} ${short(target)}`);
    return;
  }
  if (stat.isSymbolicLink() && real(target) === real(source)) {
    counts.ok += 1;
    say(`ok ${short(target)}`);
    return;
  }
  const what = stat.isSymbolicLink()
    ? `points to ${short(resolve(dirname(target), readlinkSync(target)))}`
    : `real ${stat.isDirectory() ? 'directory' : 'file'}`;
  if (!REPLACE) {
    counts.conflicts += 1;
    say(`conflict ${short(target)} (${what})`);
    return;
  }
  if (!DRY) {
    const saved = join(backup(), rel);
    mkdirSync(dirname(saved), { recursive: true });
    renameSync(target, saved);
    symlinkSync(source, target);
  }
  counts.replaced += 1;
  say(`${DRY ? 'would replace' : 'replaced'} ${short(target)} (${what})`);
};

const importLine = () => {
  const file = join(CLAUDE, 'CLAUDE.md');
  const wanted = join(ROOT, 'global', 'CLAUDE.md');
  const line = `@${wanted}`;
  if (/\s/.test(ROOT)) console.warn('warning: the clone path contains whitespace; Claude Code may not follow the @import in ~/.claude/CLAUDE.md');
  if (!existsSync(file)) {
    if (!DRY) {
      mkdirSync(CLAUDE, { recursive: true });
      writeFileSync(file, `${line}\n`);
    }
    say(`${DRY ? 'would create' : 'created'} ${short(file)} with the devkit import`);
    return;
  }
  const text = readFileSync(file, 'utf8');
  const lines = text.split('\n');
  const imports = lines
    .map((entry, index) => ({ index, path: entry.trim().startsWith('@') ? entry.trim().slice(1).trim() : '' }))
    .filter(({ path }) => path.endsWith('/global/CLAUDE.md'));
  const expand = (path) => (path === '~' || path.startsWith('~/') ? join(HOME, path.slice(1)) : path);
  if (imports.some(({ path }) => (real(expand(path)) ?? expand(path)) === real(wanted))) {
    say(`ok ${short(file)}`);
    return;
  }
  if (imports.length && !REPLACE) {
    counts.conflicts += 1;
    say(`conflict ${short(file)} (imports another global/CLAUDE.md)`);
    return;
  }
  let next;
  if (imports.length) {
    lines[imports[0].index] = line;
    next = lines.join('\n');
  } else {
    next = `${text}${text === '' || text.endsWith('\n') ? '' : '\n'}${line}\n`;
  }
  if (!DRY) {
    copyFileSync(file, join(backup(), 'CLAUDE.md'));
    writeFileSync(file, next);
  }
  if (imports.length) {
    say(`${DRY ? 'would replace' : 'replaced'} the global/CLAUDE.md import in ${short(file)}`);
  } else {
    say(`${DRY ? 'would append' : 'appended'} the devkit import to ${short(file)}`);
  }
};

const isPlain = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const deepEqual = (a, b) => {
  if (a === b) return true;
  if (Array.isArray(a) && Array.isArray(b)) return a.length === b.length && a.every((item, index) => deepEqual(item, b[index]));
  if (isPlain(a) && isPlain(b)) {
    const keys = Object.keys(a);
    return keys.length === Object.keys(b).length && keys.every((key) => Object.hasOwn(b, key) && deepEqual(a[key], b[key]));
  }
  return false;
};
const overlay = (base, top) => {
  const out = structuredClone(base);
  for (const [key, value] of Object.entries(top)) {
    out[key] = isPlain(out[key]) && isPlain(value) ? overlay(out[key], value) : structuredClone(value);
  }
  return out;
};
const substitute = (value, dir) => {
  if (typeof value === 'string') return value.replaceAll('{{CLAUDE_DIR}}', dir);
  if (Array.isArray(value)) return value.map((item) => substitute(item, dir));
  if (isPlain(value)) return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, substitute(item, dir)]));
  return value;
};
const leftover = (value) =>
  typeof value === 'string' ? value.includes('{{') : Array.isArray(value) || isPlain(value) ? Object.values(value).some(leftover) : false;

const normalize = (command) => String(command ?? '').replace(/["']/g, '').replace(/\s+/g, ' ').trim();

const mergeHooks = (target, template, record) => {
  if (!Object.hasOwn(target, 'hooks')) target.hooks = {};
  if (!isPlain(target.hooks)) return record('kept', ['hooks']);
  for (const [event, groups] of Object.entries(template)) {
    if (!Object.hasOwn(target.hooks, event)) target.hooks[event] = [];
    const existing = target.hooks[event];
    if (!Array.isArray(existing)) {
      record('kept', ['hooks', event]);
      continue;
    }
    const commands = new Set(
      existing.flatMap((group) => (isPlain(group) && Array.isArray(group.hooks) ? group.hooks : [])).map((handler) => normalize(handler?.command)),
    );
    for (const group of groups) {
      const remaining = group.hooks.filter((handler) => !commands.has(normalize(handler.command)));
      if (!remaining.length) continue;
      existing.push({ ...structuredClone(group), hooks: structuredClone(remaining) });
      record('added', ['hooks', event]);
    }
  }
};

const mergeInto = (target, template, path, record) => {
  for (const [key, value] of Object.entries(template)) {
    const at = [...path, key];
    if (!path.length && key === 'hooks') mergeHooks(target, value, record);
    else if (!Object.hasOwn(target, key)) {
      target[key] = structuredClone(value);
      record('added', at);
    } else if (isPlain(target[key]) && isPlain(value)) mergeInto(target[key], value, at, record);
    else if (Array.isArray(target[key]) && Array.isArray(value)) {
      for (const item of value) {
        if (target[key].some((existing) => deepEqual(existing, item))) continue;
        target[key].push(structuredClone(item));
        record('added', at);
      }
    } else if (!deepEqual(target[key], value)) record('kept', at);
  }
};

const settings = () => {
  const read = (name) => JSON.parse(readFileSync(join(ROOT, 'install', name), 'utf8'));
  let template = read('settings.json');
  if (BYPASS) template = overlay(template, read('bypass-permissions.json'));
  template = substitute(template, CLAUDE);
  if (leftover(template)) return error('install/settings.json has a placeholder other than {{CLAUDE_DIR}}');

  const file = join(CLAUDE, 'settings.json');
  const existed = existsSync(file);
  let original = {};
  if (existed) {
    try {
      original = JSON.parse(readFileSync(file, 'utf8'));
    } catch {
      return error(`${short(file)} is not valid JSON; left it untouched`);
    }
    if (!isPlain(original)) return error(`${short(file)} is not a JSON object; left it untouched`);
  }

  const merged = structuredClone(original);
  mergeInto(merged, template, [], (kind, at) => {
    counts[kind] += 1;
    say(`settings.json: ${kind === 'added' && DRY ? 'would add' : kind} ${at.join('.')}`);
  });
  if (deepEqual(merged, original)) {
    say('settings.json: unchanged');
    return;
  }
  if (DRY) {
    say(`would write ${short(file)}`);
    return;
  }
  const destination = existed ? realpathSync(file) : file;
  if (existed) copyFileSync(file, join(backup(), 'settings.json'));
  const mode = existed ? statSync(destination).mode & 0o777 : 0o600;
  mkdirSync(dirname(destination), { recursive: true });
  const temp = join(dirname(destination), `.settings.json.devkit-${process.pid}.tmp`);
  writeFileSync(temp, `${JSON.stringify(merged, null, 2)}\n`, { mode });
  chmodSync(temp, mode);
  renameSync(temp, destination);
  say(`wrote ${short(file)}`);
};

const plugins = () => {
  const config = JSON.parse(readFileSync(join(ROOT, 'install', 'plugins.json'), 'utf8'));
  const wanted = [...config.plugins, ...(OPTIONAL ? config.optional : [])];
  const marketOf = (id) => id.split('@')[1];
  const nameOf = (id) => id.split('@')[0];

  const version = spawnSync(BIN, ['--version'], { encoding: 'utf8' });
  if (version.error?.code === 'ENOENT') {
    say('claude CLI not found; run these yourself:');
    for (const market of [...new Set(wanted.map(marketOf))]) say(`  claude plugin marketplace add ${config.marketplaces[market]}`);
    for (const id of wanted) say(`  claude plugin install ${id}`);
    return;
  }
  if (version.error || version.status !== 0) return error(`${BIN} --version failed`);

  const list = (...rest) => {
    const result = spawnSync(BIN, ['plugin', ...rest, '--json'], { encoding: 'utf8' });
    if (result.error || result.status !== 0) throw new Error(`claude plugin ${rest.join(' ')} --json failed`);
    return JSON.parse(result.stdout);
  };
  let markets;
  let installed;
  try {
    markets = new Set(list('marketplace', 'list').map((entry) => entry.name));
    installed = list('list').map((entry) => entry.id);
  } catch (err) {
    return error(err.message);
  }
  if (installed.includes('devkit@devkit')) {
    console.warn('warning: devkit@devkit is installed and loads the same skills again as devkit:*; run: claude plugin uninstall devkit@devkit');
  }
  const names = new Set(installed.map(nameOf));
  const run = (rest) => {
    say(`${DRY ? 'would run' : 'running'}: claude plugin ${rest.join(' ')}`);
    if (DRY) return true;
    const result = spawnSync(BIN, ['plugin', ...rest], { stdio: 'inherit', timeout: 600000 });
    if (result.error || result.status !== 0) {
      error(`claude plugin ${rest.join(' ')} failed`);
      return false;
    }
    return true;
  };
  for (const id of wanted) {
    if (names.has(nameOf(id))) {
      say(`ok plugin ${id}`);
      continue;
    }
    const market = marketOf(id);
    if (!markets.has(market)) {
      if (!run(['marketplace', 'add', config.marketplaces[market]])) continue;
      markets.add(market);
    }
    if (run(['install', id]) && !DRY) counts.installed += 1;
  }
};

for (const rel of linkTargets()) link(rel);
importLine();
settings();
plugins();
if (spawnSync('jq', ['--version']).error) console.warn('warning: jq is not on PATH; the status line and the Biome hook need it');

say('');
say(`${DRY ? 'dry run, nothing written. ' : ''}links: ${counts.linked} linked, ${counts.ok} ok, ${counts.replaced} replaced, ${counts.conflicts} conflicts`);
say(`settings: ${counts.added} added, ${counts.kept} kept`);
say(`plugins: ${counts.installed} installed`);
if (counts.conflicts) say('rerun with --replace; originals go to ~/.claude/devkit-backups/<timestamp>');
if (backupDir) say(`backups: ${short(backupDir)}`);
say('next: restart Claude Code; set GITHUB_PERSONAL_ACCESS_TOKEN for the github plugin; authorize linear via /mcp; see README for the optional iTerm and agterm status hooks');
process.exit(counts.conflicts || counts.errors ? 1 : 0);
