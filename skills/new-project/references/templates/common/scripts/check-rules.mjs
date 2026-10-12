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
const SUPPRESSION = /^\s*biome-ignore(?:-all|-start|-end)?\s+([^:]*)/
const NARROW = /^lint\/(?:plugin\/R-[\w-]+|(?!plugin\/)\w+\/\w+)$/
const ALLOWED = [
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

const JSX = new Set(['.tsx', '.jsx'])

const scanScript = (source, jsx) => {
  const comments = []
  const stack = []
  let mode = 'code'
  let last = ''
  let index = 0
  const line = (at) => source.slice(0, at).split('\n').length
  const comment = () => {
    const block = source[index + 1] === '*'
    const end = block ? source.indexOf('*/', index + 2) : source.indexOf('\n', index)
    const stop = end === -1 ? source.length : block ? end + 2 : end
    comments.push({
      text: source.slice(index + 2, block ? stop - 2 : stop),
      line: line(index),
      block,
    })
    index = stop
  }
  const leaveElement = () => {
    if (stack.at(-1) === 'element') mode = 'text'
    else {
      mode = 'code'
      last = 'value'
    }
  }
  const opensElement = () => {
    if (!jsx || last === 'value') return false
    const rest = source.slice(index + 1, index + 80)
    if (rest.startsWith('>')) return true
    const name = rest.match(/^[A-Za-z_$][\w$.:-]*/)
    if (!name) return false
    return !/^\s*,|^\s+extends\s/.test(rest.slice(name[0].length))
  }
  while (index < source.length) {
    const char = source[index]
    const next = source[index + 1]
    if (mode === 'text') {
      if (char === '{') {
        stack.push('child')
        mode = 'code'
        last = ''
      } else if (char === '<' && next === '/') {
        const close = source.indexOf('>', index)
        index = close === -1 ? source.length : close
        stack.pop()
        leaveElement()
      } else if (char === '<') mode = 'tag'
      index += 1
      continue
    }
    if (mode === 'tag') {
      if (char === '/' && (next === '/' || next === '*')) {
        comment()
        continue
      }
      if (char === '"' || char === "'") {
        const close = source.indexOf(char, index + 1)
        index = close === -1 ? source.length : close + 1
        continue
      }
      if (char === '{') {
        stack.push('attr')
        mode = 'code'
        last = ''
      } else if (char === '/' && next === '>') {
        index += 1
        leaveElement()
      } else if (char === '>') {
        stack.push('element')
        mode = 'text'
      }
      index += 1
      continue
    }
    if (char === '/' && (next === '/' || next === '*')) {
      comment()
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
    if (char === '`' || (char === '}' && stack.at(-1) === 'template')) {
      if (char === '}') stack.pop()
      index += 1
      while (
        index < source.length &&
        source[index] !== '`' &&
        !(source[index] === '$' && source[index + 1] === '{')
      )
        index += source[index] === '\\' ? 2 : 1
      if (source[index] === '$') {
        stack.push('template')
        index += 2
        last = ''
      } else {
        index += 1
        last = 'value'
      }
      continue
    }
    if (char === '<' && opensElement()) {
      mode = 'tag'
      index += 1
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
    if ((char === '+' || char === '-') && next === char) {
      index += 2
      last = 'value'
      continue
    }
    if (char === '{') stack.push('code')
    if (char === '}') {
      const frame = stack.pop()
      index += 1
      if (frame === 'attr') mode = 'tag'
      else if (frame === 'child') mode = 'text'
      else last = 'value'
      continue
    }
    if (/[\w$]/.test(char)) {
      let end = index
      while (end < source.length && /[\w$]/.test(source[end])) end += 1
      last = REGEX_AFTER_WORD.has(source.slice(index, end)) ? '' : 'value'
      index = end
      continue
    }
    if (!/\s/.test(char)) last = char === ')' || char === ']' ? 'value' : ''
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
  for (const comment of css ? scanCss(source) : scanScript(source, JSX.has(extname(file)))) {
    const reference =
      !comment.block && /^\/\s*<reference /.test(comment.text) && file.endsWith('.d.ts')
    if (reference || ALLOWED.some((pattern) => pattern.test(comment.text))) continue
    const suppression = comment.text.match(SUPPRESSION)
    if (suppression) {
      const broad = suppression[1]
        .trim()
        .split(/\s+/)
        .filter((category) => /^lint(?:\/|$)/.test(category) && !NARROW.test(category))
      if (broad.length === 0) continue
      console.log(
        `${file}:${comment.line} R-comments suppression ${broad.join(' ')} is too broad; name the check, lint/plugin/R-<check> or lint/<group>/<rule> (TOOL-5)`,
      )
      errors += 1
      continue
    }
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
