import { spawnSync } from 'node:child_process'
import { readdirSync, readFileSync } from 'node:fs'
import { extname, join, relative, sep } from 'node:path'

const ROOTS = ['src', 'scripts', 'tests']
const ROOT_FILE = /^[\w.-]+\.config\.(?:ts|mjs|js|cjs)$|^\.dependency-cruiser\.cjs$/
const SKIP = [
  /(?:^|\/)routeTree\.gen\.ts$/,
  /\.gen\.ts$/,
  /^src\/shared\/api\/generated\//,
  /^next-env\.d\.ts$/,
]
const SCRIPT = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.mts', '.cts'])
const ALLOWED = [
  /^\s*biome-ignore(?:-all|-start|-end)?\s/,
  /^\s*TODO\(api\):/,
  /^\s*@vite-ignore\s*$/,
]
const REGEX_AFTER_WORD = new Set([
  'return',
  'typeof',
  'instanceof',
  'in',
  'of',
  'new',
  'delete',
  'void',
  'throw',
  'case',
  'do',
  'else',
  'yield',
  'await',
])

const walk = (dir) => {
  let entries
  try {
    entries = readdirSync(dir, { withFileTypes: true })
  } catch {
    return []
  }
  return entries.flatMap((entry) => {
    if (entry.name === 'node_modules' || entry.name.startsWith('.')) return []
    const full = join(dir, entry.name)
    return entry.isDirectory() ? walk(full) : [relative('.', full).split(sep).join('/')]
  })
}

const scanScript = (source) => {
  const comments = []
  const braces = []
  let last = ''
  let index = 0
  const line = (at) => source.slice(0, at).split('\n').length
  while (index < source.length) {
    const char = source[index]
    const next = source[index + 1]
    if (char === '/' && next === '/') {
      const end = source.indexOf('\n', index)
      const stop = end === -1 ? source.length : end
      comments.push({ text: source.slice(index + 2, stop), line: line(index), block: false })
      index = stop
      continue
    }
    if (char === '/' && next === '*') {
      const end = source.indexOf('*/', index + 2)
      const stop = end === -1 ? source.length : end + 2
      comments.push({ text: source.slice(index + 2, stop - 2), line: line(index), block: true })
      index = stop
      continue
    }
    if (char === "'" || char === '"') {
      index += 1
      while (index < source.length && source[index] !== char && source[index] !== '\n')
        index += source[index] === '\\' ? 2 : 1
      index += 1
      last = 'value'
      continue
    }
    if (char === '`' || (char === '}' && braces.at(-1) === 'template')) {
      if (char === '}') braces.pop()
      index += 1
      while (
        index < source.length &&
        source[index] !== '`' &&
        !(source[index] === '$' && source[index + 1] === '{')
      )
        index += source[index] === '\\' ? 2 : 1
      if (source[index] === '$') {
        braces.push('template')
        index += 2
        last = ''
      } else {
        index += 1
        last = 'value'
      }
      continue
    }
    if (char === '/' && last !== 'value') {
      let inClass = false
      index += 1
      while (
        index < source.length &&
        source[index] !== '\n' &&
        (inClass || source[index] !== '/')
      ) {
        if (source[index] === '[') inClass = true
        if (source[index] === ']') inClass = false
        index += source[index] === '\\' ? 2 : 1
      }
      index += 1
      last = 'value'
      continue
    }
    if (char === '{') braces.push('code')
    if (char === '}') braces.pop()
    if (/[\w$]/.test(char)) {
      let end = index
      while (end < source.length && /[\w$]/.test(source[end])) end += 1
      last = REGEX_AFTER_WORD.has(source.slice(index, end)) ? '' : 'value'
      index = end
      continue
    }
    if (!/\s/.test(char)) last = char === ')' || char === ']' || char === '}' ? 'value' : ''
    index += 1
  }
  return comments
}

const scanCss = (source) => {
  const comments = []
  let index = 0
  while (index < source.length) {
    const char = source[index]
    if (char === "'" || char === '"') {
      index += 1
      while (index < source.length && source[index] !== char && source[index] !== '\n')
        index += source[index] === '\\' ? 2 : 1
      index += 1
      continue
    }
    if (char === '/' && source[index + 1] === '*') {
      const end = source.indexOf('*/', index + 2)
      const stop = end === -1 ? source.length : end + 2
      comments.push({
        text: source.slice(index + 2, stop - 2),
        line: source.slice(0, index).split('\n').length,
        block: true,
      })
      index = stop
      continue
    }
    index += 1
  }
  return comments
}

const files = [...ROOTS.flatMap(walk), ...readdirSync('.').filter((name) => ROOT_FILE.test(name))]
  .filter((file) => !SKIP.some((pattern) => pattern.test(file)))
  .filter((file) => SCRIPT.has(extname(file)) || extname(file) === '.css')
  .sort()

let errors = 0
for (const file of files) {
  const source = readFileSync(file, 'utf8')
  const css = extname(file) === '.css'
  for (const comment of css ? scanCss(source) : scanScript(source)) {
    const reference =
      !comment.block && /^\/\s*<reference /.test(comment.text) && file.endsWith('.d.ts')
    if (reference || ALLOWED.some((pattern) => pattern.test(comment.text))) continue
    console.log(`${file}:${comment.line} R-comments comment in ${css ? 'CSS' : 'code'} (WF-1)`)
    errors += 1
  }
}

const biome = spawnSync('biome', ['lint', '--reporter=json', '--max-diagnostics=none'], {
  encoding: 'utf8',
  maxBuffer: 256 * 1024 * 1024,
  shell: process.platform === 'win32',
})
let report
try {
  report = JSON.parse(biome.stdout)
} catch {
  console.error(biome.stderr || biome.stdout)
  console.error('lint:rules: biome did not return a JSON report')
  process.exit(2)
}
for (const diagnostic of report.diagnostics) {
  if (diagnostic.category !== 'plugin' || !/^\S+ errored: /.test(diagnostic.message)) continue
  console.log(`${diagnostic.location?.path ?? 'biome.json'} plugin failure: ${diagnostic.message}`)
  errors += 1
}

console.log(`lint:rules: ${files.length} files scanned for comments, ${errors} errors`)
process.exit(errors > 0 ? 1 : 0)
