import { execFileSync } from 'node:child_process'
import { copyFileSync, cpSync, existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const MANIFEST = join(ROOT, 'pocock-skills.json')
const SKILLS = join(ROOT, 'skills')
const NAME = /^[a-z0-9-]+$/

const manifest = JSON.parse(readFileSync(MANIFEST, 'utf8'))
const git = (cwd, ...args) => execFileSync('git', args, { cwd, encoding: 'utf8' }).trim()

for (const name of manifest.skills) {
  if (!NAME.test(name)) throw new Error(`bad skill name: ${name}`)
  if (existsSync(join(SKILLS, name)) && !(name in manifest.hashes)) {
    throw new Error(`skills/${name} exists and is not vendored; refusing to overwrite it`)
  }
}

const tmp = mkdtempSync(join(tmpdir(), 'pocock-skills-'))
try {
  git(tmp, 'clone', '--quiet', '--depth', '1', '--branch', manifest.ref, '--filter=blob:none', '--sparse', manifest.source, 'upstream')
  const upstream = join(tmp, 'upstream')
  git(upstream, 'sparse-checkout', 'set', '--no-cone', '/LICENSE', ...manifest.skills.map((name) => `skills/*/${name}/`))
  const commit = git(upstream, 'rev-parse', 'HEAD')

  const groups = readdirSync(join(upstream, 'skills'), { withFileTypes: true }).filter((entry) => entry.isDirectory())
  const changed = []
  const hashes = {}
  for (const name of manifest.skills) {
    const found = groups.map((group) => `skills/${group.name}/${name}`).filter((path) => existsSync(join(upstream, path, 'SKILL.md')))
    if (found.length !== 1) throw new Error(`${name}: expected one upstream folder, found ${found.length} (renamed or removed upstream?)`)
    if (found[0].startsWith('skills/deprecated/')) console.warn(`${name}: deprecated upstream`)
    hashes[name] = git(upstream, 'rev-parse', `HEAD:${found[0]}`)
    if (hashes[name] !== manifest.hashes[name]) changed.push(name)
    rmSync(join(SKILLS, name), { recursive: true, force: true })
    cpSync(join(upstream, found[0]), join(SKILLS, name), { recursive: true })
  }
  copyFileSync(join(upstream, 'LICENSE'), join(SKILLS, 'LICENSE-mattpocock-skills'))

  const own = readdirSync(SKILLS, { withFileTypes: true }).filter((entry) => entry.isDirectory()).map((entry) => entry.name)
  for (const name of manifest.skills) {
    const text = readFileSync(join(SKILLS, name, 'SKILL.md'), 'utf8')
    for (const [, called] of text.matchAll(/Skill tool[^.\n]*?["`]([a-z0-9-]+)["`]/g)) {
      if (!own.includes(called)) console.warn(`${name} calls "${called}", which is not in skills/`)
    }
  }

  writeFileSync(MANIFEST, `${JSON.stringify({ ...manifest, commit, hashes }, null, 2)}\n`)
  console.log(`upstream ${commit.slice(0, 12)}; changed: ${changed.length ? changed.join(', ') : 'none'}`)
} finally {
  rmSync(tmp, { recursive: true, force: true })
}
