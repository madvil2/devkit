import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { setTimeout as delay } from 'node:timers/promises';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const BOUNDED = path.resolve(here, '..', 'bounded.mjs');
const NODE = process.execPath;
const SAFETY_MS = 15000;
const TEST_TIMEOUT_MS = 30000;

const HOLDER = [
  "import net from 'node:net';",
  "if (process.argv[2] === 'stubborn') process.on('SIGTERM', () => {});",
  "net.createServer().listen(0, '127.0.0.1', () => console.log('pid', process.pid));",
  '',
].join('\n');

const withHolder = (fn) => async () => {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'bounded-test-'));
  const holder = path.join(dir, 'holder.mjs');
  writeFileSync(holder, HOLDER);
  try {
    await fn(holder);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
};

const WIN32 = 'data:text/javascript,Object.defineProperty(process,"platform",{value:"win32"})';

const start = (args, nodeArgs = []) => {
  const child = spawn(NODE, [...nodeArgs, BOUNDED, ...args], { stdio: ['ignore', 'pipe', 'pipe'] });
  let stdout = '';
  let stderr = '';
  child.stdout.on('data', (d) => {
    stdout += d;
  });
  child.stderr.on('data', (d) => {
    stderr += d;
  });
  const done = new Promise((resolve, reject) => {
    const safety = setTimeout(() => {
      child.kill('SIGKILL');
      reject(new Error(`bounded did not exit within ${SAFETY_MS} ms`));
    }, SAFETY_MS);
    child.on('close', (code, signal) => {
      clearTimeout(safety);
      resolve({ code, signal, stdout, stderr });
    });
  });
  return { child, done, output: () => stdout };
};

const pidsIn = (text) => [...text.matchAll(/pid (\d+)/g)].map((m) => Number(m[1]));

const alive = (pid) => {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
};

const waitDead = async (pid) => {
  for (let i = 0; i < 40 && alive(pid); i++) await delay(50);
  return !alive(pid);
};

const waitFor = async (check) => {
  for (let i = 0; i < 100 && !check(); i++) await delay(50);
  return check();
};

const cleanup = (pids) => {
  for (const pid of pids) {
    try {
      process.kill(pid, 'SIGKILL');
    } catch {}
  }
};

test('passes a normal exit code through', { timeout: TEST_TIMEOUT_MS }, async () => {
  const r = await start(['10', '--', NODE, '-e', 'process.exit(7)']).done;
  assert.equal(r.code, 7);
});

test('runs a shell string so a pipeline works and forwards output', {
  timeout: TEST_TIMEOUT_MS,
}, async () => {
  const r = await start(['10', 'echo bounded | tr a-z A-Z']).done;
  assert.equal(r.code, 0);
  assert.equal(r.stdout.trim(), 'BOUNDED');
});

test('rejects a missing or invalid limit with exit 125', { timeout: TEST_TIMEOUT_MS }, async () => {
  assert.equal((await start(['abc', '--', 'true']).done).code, 125);
  assert.equal((await start(['5']).done).code, 125);
  assert.equal((await start(['2147484', '--', 'true']).done).code, 125);
  assert.equal((await start(['2147483', '--', 'true']).done).code, 0);
});

test('refuses to run on Windows with exit 125', { timeout: TEST_TIMEOUT_MS }, async () => {
  const r = await start(['5', '--', 'true'], ['--import', WIN32]).done;
  assert.equal(r.code, 125);
  assert.match(r.stderr, /Windows is not supported/);
});

test(
  'kills npm-run-style grandchildren, including one that ignores SIGTERM, and exits 124',
  { timeout: TEST_TIMEOUT_MS },
  withHolder(async (holder) => {
    const inner = `"${NODE}" "${holder}" & "${NODE}" "${holder}" stubborn & wait`;
    const r = await start(['2', `sh -c '${inner}'`]).done;
    const pids = pidsIn(r.stdout);
    try {
      assert.equal(r.code, 124);
      assert.equal(pids.length, 2, r.stdout + r.stderr);
      for (const pid of pids) assert.ok(await waitDead(pid), `grandchild ${pid} survived`);
    } finally {
      cleanup(pids);
    }
  }),
);

test(
  'kills every process of a timed-out pipeline and exits 124',
  { timeout: TEST_TIMEOUT_MS },
  withHolder(async (holder) => {
    const r = await start(['2', `"${NODE}" "${holder}" | cat`]).done;
    const pids = pidsIn(r.stdout);
    try {
      assert.equal(r.code, 124);
      assert.equal(pids.length, 1, r.stdout + r.stderr);
      assert.ok(await waitDead(pids[0]), `pipeline member ${pids[0]} survived`);
    } finally {
      cleanup(pids);
    }
  }),
);

test(
  'kills the group when bounded itself gets SIGTERM',
  { timeout: TEST_TIMEOUT_MS },
  withHolder(async (holder) => {
    const run = start(['60', `sh -c '"${NODE}" "${holder}" & wait'`]);
    assert.ok(await waitFor(() => pidsIn(run.output()).length === 1), 'holder never started');
    run.child.kill('SIGTERM');
    const r = await run.done;
    const pids = pidsIn(r.stdout);
    try {
      assert.equal(r.code, 143);
      assert.ok(await waitDead(pids[0]), `grandchild ${pids[0]} survived`);
    } finally {
      cleanup(pids);
    }
  }),
);
