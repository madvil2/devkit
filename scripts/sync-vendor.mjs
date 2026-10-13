import { execFileSync } from 'node:child_process'
import { cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = process.env.VENDOR_ROOT ?? join(dirname(fileURLToPath(import.meta.url)), '..')
const MANIFEST = join(ROOT, 'vendor.json')
const MARKETPLACE = join(ROOT, '.claude-plugin', 'marketplace.json')
const NAME = /^[a-z0-9-]+$/
const VERSION = /^[0-9A-Za-z.+-]{1,64}$/

const git = (cwd, ...args) => execFileSync('git', args, { cwd, encoding: 'utf8' }).trim()
const dirsIn = (dir) => readdirSync(dir, { withFileTypes: true }).filter((entry) => entry.isDirectory()).map((entry) => entry.name)
const filesIn = (dir) =>
  readdirSync(dir, { withFileTypes: true, recursive: true })
    .filter((entry) => entry.isFile())
    .map((entry) => join(entry.parentPath, entry.name))
const readVersion = (dir) => {
  const file = join(dir, '.claude-plugin', 'plugin.json')
  if (!existsSync(file)) return undefined
  return JSON.stringify(JSON.parse(readFileSync(file, 'utf8')).version ?? null)
}
const showVersion = (raw) => {
  const version = JSON.parse(raw)
  if (version === null) return 'unset'
  return typeof version === 'string' && VERSION.test(version) ? version : 'unprintable'
}

const LAYOUTS = {
  skills: {
    target: 'skills',
    sparse: (name) => `skills/*/${name}/`,
    locate: (upstream, name) =>
      dirsIn(join(upstream, 'skills'))
        .map((group) => `skills/${group}/${name}`)
        .filter((path) => existsSync(join(upstream, path, 'SKILL.md'))),
    inspect(upstream, name, path) {
      if (path.startsWith('skills/deprecated/')) console.warn(`${name}: deprecated upstream`)
    },
    after(names) {
      const own = dirsIn(join(ROOT, 'skills'))
      for (const name of names) {
        const text = readFileSync(join(ROOT, 'skills', name, 'SKILL.md'), 'utf8')
        for (const [, called] of text.matchAll(/Skill tool[^.\n]*?["`]([a-z0-9-]+)["`]/g)) {
          if (!own.includes(called)) console.warn(`${name} calls "${called}", which is not in skills/`)
        }
      }
    },
  },
  plugins: {
    target: 'plugins',
    sparse: (name) => `/plugins/${name}/`,
    locate: (upstream, name) => [`plugins/${name}`].filter((path) => existsSync(join(upstream, path, '.claude-plugin', 'plugin.json'))),
    inspect(upstream, name, path) {
      const declared = JSON.parse(readFileSync(join(upstream, path, '.claude-plugin', 'plugin.json'), 'utf8')).name
      if (declared !== name) throw new Error(`${name}: plugin.json declares ${JSON.stringify(declared)}; the folder and the plugin name must agree`)
    },
    version: readVersion,
    after(names) {
      const listed = JSON.parse(readFileSync(MARKETPLACE, 'utf8')).plugins
      for (const name of names) {
        if (!listed.some((entry) => entry.name === name && entry.source === `./plugins/${name}`)) {
          console.warn(`plugins/${name} is not listed in .claude-plugin/marketplace.json`)
        }
        for (const file of filesIn(join(ROOT, 'plugins', name))) {
          if (readFileSync(file, 'utf8').includes('${CLAUDE_PLUGIN_ROOT}/..')) {
            console.warn(`${name}: ${JSON.stringify(file.slice(ROOT.length + 1))} reaches outside its plugin folder`)
          }
        }
      }
    },
  },
}

const manifest = JSON.parse(readFileSync(MANIFEST, 'utf8'))

const claimed = new Map()
for (const source of manifest.sources) {
  const layout = LAYOUTS[source.layout]
  if (!layout) throw new Error(`${source.name}: unknown layout "${source.layout}"`)
  for (const name of source.items) {
    if (!NAME.test(name)) throw new Error(`${source.name}: bad item name: ${name}`)
    const target = `${layout.target}/${name}`
    if (claimed.has(target)) throw new Error(`${target} is listed by both ${claimed.get(target)} and ${source.name}`)
    claimed.set(target, source.name)
    if (existsSync(join(ROOT, target)) && !(name in source.hashes)) {
      throw new Error(`${target} exists and is not vendored from ${source.name}; refusing to overwrite it`)
    }
  }
}

const tmp = mkdtempSync(join(tmpdir(), 'devkit-vendor-'))
try {
  const resolved = manifest.sources.map((source, index) => {
    const layout = LAYOUTS[source.layout]
    const upstream = join(tmp, String(index))
    git(tmp, 'clone', '--quiet', '--depth', '1', '--branch', source.ref, '--filter=blob:none', '--sparse', source.source, String(index))
    git(upstream, 'sparse-checkout', 'set', '--no-cone', '/LICENSE', ...source.items.map(layout.sparse))
    const commit = git(upstream, 'rev-parse', 'HEAD')
    if (!existsSync(join(upstream, 'LICENSE'))) throw new Error(`${source.name}: no LICENSE at the upstream root`)
    const paths = {}
    const hashes = {}
    for (const name of source.items) {
      const found = layout.locate(upstream, name)
      if (found.length !== 1) throw new Error(`${source.name}/${name}: expected one upstream folder, found ${found.length} (renamed or removed upstream?)`)
      layout.inspect(upstream, name, found[0])
      paths[name] = found[0]
      hashes[name] = git(upstream, 'rev-parse', `HEAD:${found[0]}`)
      const modes = git(upstream, 'ls-tree', '-r', `HEAD:${found[0]}`)
        .split('\n')
        .filter(Boolean)
        .map((line) => line.split(' ')[0])
      if (modes.some((mode) => mode === '120000' || mode === '160000')) {
        throw new Error(`${source.name}/${name}: upstream folder contains a symlink or submodule; refusing to vendor it`)
      }
      const relative = filesIn(join(upstream, found[0])).map((file) => `${layout.target}/${name}/${file.slice(join(upstream, found[0]).length + 1)}`)
      let ignored = ''
      try {
        ignored = execFileSync('git', ['check-ignore', '--no-index', '--stdin', '-z'], { cwd: ROOT, input: relative.join('\0'), encoding: 'utf8' })
      } catch (error) {
        if (error.status !== 1) throw error
      }
      if (ignored) throw new Error(`${source.name}/${name}: devkit's .gitignore would drop ${ignored.split('\0').filter(Boolean).map((path) => JSON.stringify(path)).join(', ')}`)
    }
    return { source, layout, upstream, commit, paths, hashes }
  })

  const index = join(tmp, 'verify-index')
  let verified = 0
  for (const { source, layout, upstream, commit, paths, hashes } of resolved) {
    const changed = source.items.filter((name) => hashes[name] !== source.hashes[name])
    mkdirSync(join(ROOT, layout.target), { recursive: true })
    for (const name of source.items) {
      const target = join(ROOT, layout.target, name)
      const before = layout.version && existsSync(target) ? layout.version(target) : undefined
      rmSync(target, { recursive: true, force: true })
      cpSync(join(upstream, paths[name]), target, { recursive: true })
      if (before !== undefined && changed.includes(name) && layout.version(target) === before) {
        console.warn(`${name}: content changed but version ${showVersion(before)} did not; installers may need to reinstall`)
      }
    }
    for (const name of source.items) {
      const prefix = `${layout.target}/${name}`
      rmSync(index, { force: true })
      const env = { ...process.env, GIT_INDEX_FILE: index }
      execFileSync('git', ['add', '-f', '--', prefix], { cwd: ROOT, env })
      const tree = execFileSync('git', ['write-tree', `--prefix=${prefix}/`], { cwd: ROOT, env, encoding: 'utf8' }).trim()
      rmSync(index, { force: true })
      if (tree !== hashes[name]) throw new Error(`${source.name}/${name}: copied tree ${tree} differs from upstream ${hashes[name]}`)
      verified += 1
    }
    cpSync(join(upstream, 'LICENSE'), join(ROOT, source.license))
    Object.assign(source, { commit, hashes })
    console.log(`${source.name}: upstream ${commit.slice(0, 12)}; changed: ${changed.length ? changed.join(', ') : 'none'}`)
  }
  console.log(`verified: ${verified} folders match their upstream tree hashes`)
  for (const { source, layout } of resolved) layout.after(source.items)

  writeFileSync(MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`)
} finally {
  rmSync(tmp, { recursive: true, force: true })
}
