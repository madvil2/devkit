#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { constants } from 'node:os';

const GRACE_MS = 3000;
const TIMEOUT_EXIT = 124;
const USAGE_EXIT = 125;
const MAX_SECONDS = 2147483;
const USAGE =
  'usage: node bounded.mjs <seconds> -- <command> [args...]\n       node bounded.mjs <seconds> "<shell command>"\n<seconds> is above 0 and at most 2147483';
const SIGNALS = new Map(Object.entries(constants.signals));
const FORWARDED = ['SIGTERM', 'SIGINT', 'SIGHUP'];

const parse = (argv) => {
  const seconds = Number(argv[0]);
  if (!argv[0] || !Number.isFinite(seconds) || seconds <= 0 || seconds > MAX_SECONDS) return null;
  if (argv[1] === '--' && argv.length > 2) return { seconds, file: argv[2], args: argv.slice(3) };
  if (argv.length === 2 && argv[1] !== '--' && argv[1])
    return { seconds, file: 'sh', args: ['-c', argv[1]] };
  return null;
};

const signalExit = (signal) => 128 + (SIGNALS.get(signal) || 0);

const main = () => {
  if (process.platform === 'win32') {
    console.error('bounded: Windows is not supported; it needs POSIX process groups');
    process.exit(USAGE_EXIT);
  }
  const opts = parse(process.argv.slice(2));
  if (!opts) {
    console.error(USAGE);
    process.exit(USAGE_EXIT);
  }
  const child = spawn(opts.file, opts.args, {
    detached: true,
    stdio: ['ignore', 'inherit', 'inherit'],
  });
  let stopping = false;
  let stopCode = null;
  let childDone = false;
  let killTimer = null;

  const signalGroup = (signal) => {
    if (!child.pid) return false;
    try {
      process.kill(-child.pid, signal);
      return true;
    } catch {
      return false;
    }
  };

  const stop = (code) => {
    if (stopping) return;
    stopping = true;
    stopCode = code;
    signalGroup('SIGTERM');
    killTimer = setTimeout(() => {
      signalGroup('SIGKILL');
      process.exit(stopCode);
    }, GRACE_MS);
    if (childDone && !signalGroup(0)) process.exit(stopCode);
  };

  const timer = setTimeout(() => stop(TIMEOUT_EXIT), opts.seconds * 1000);
  for (const s of FORWARDED) process.on(s, () => stop(signalExit(s)));

  child.on('error', (e) => {
    clearTimeout(timer);
    console.error(`bounded: ${e.message}`);
    process.exit('code' in e && e.code === 'ENOENT' ? 127 : 126);
  });

  child.on('exit', (code, signal) => {
    childDone = true;
    if (stopping) {
      if (!signalGroup(0)) {
        clearTimeout(killTimer);
        process.exit(stopCode);
      }
      return;
    }
    clearTimeout(timer);
    process.exit(code ?? signalExit(signal));
  });
};

main();
