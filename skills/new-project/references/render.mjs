import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, resolve, sep } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const TEMPLATES = join(HERE, 'templates')

const TYPES = {
  marketing: { sets: ['common', 'next'], layers: ['app', 'sections', 'shared'] },
  'landing-product': {
    sets: ['common', 'next'],
    layers: ['app', 'views', 'widgets', 'features', 'entities', 'shared'],
  },
  admin: {
    sets: ['common', 'vite'],
    layers: ['app', 'pages', 'widgets', 'features', 'entities', 'shared'],
  },
  spa: {
    sets: ['common', 'vite'],
    layers: ['app', 'pages', 'widgets', 'features', 'entities', 'shared'],
  },
  tma: {
    sets: ['common', 'vite', 'tma'],
    layers: ['app', 'pages', 'widgets', 'features', 'entities', 'shared'],
  },
}

const CLI_LEFTOVERS = {
  vite: [
    'src/App.tsx',
    'src/App.css',
    'src/index.css',
    'src/assets',
    'public/icons.svg',
    '.oxlintrc.json',
    'eslint.config.js',
  ],
  next: [
    'src/app/page.module.css',
    'src/app/globals.css',
    'src/app/page.tsx',
    'public/file.svg',
    'public/globe.svg',
    'public/next.svg',
    'public/vercel.svg',
    'public/window.svg',
  ],
}

const CLI_DEV_DEPENDENCIES_TO_DROP = ['oxlint', 'eslint', 'eslint-config-next']
const CLI_SCRIPTS_TO_DROP = ['format']
const NEXT_TYPE_INCLUDES = [
  '.next*/types/**/*.ts',
  '.next*/dev/types/**/*.ts',
  '.next-build/types/**/*.ts',
  '.next-build/dev/types/**/*.ts',
  '.next-e2e/types/**/*.ts',
  '.next-e2e/dev/types/**/*.ts',
]

const isPlainObject = (value) =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const deepMerge = (base, extra) => {
  const result = { ...base }
  for (const [key, value] of Object.entries(extra)) {
    result[key] = isPlainObject(value) && isPlainObject(base[key]) ? deepMerge(base[key], value) : value
  }
  return result
}

const POST_RENDER = new Set(['prePaintHash', 'tmaPrePaintHash'])
const PLACEHOLDER = /(?<!\$)\{\{(\w+)\}\}/g

const fail = (message) => {
  console.error(`render: ${message}`)
  process.exit(1)
}

const parseArgs = (argv) => {
  const args = { set: {} }
  for (let index = 0; index < argv.length; index += 1) {
    const flag = argv[index]
    const value = argv[index + 1]
    if (flag === '--answers') args.answers = value
    else if (flag === '--target') args.target = value
    else if (flag === '--sets') args.sets = value.split(',')
    else if (flag === '--set') {
      const [key, ...rest] = value.split('=')
      args.set[key] = rest.join('=')
    } else if (flag === '--dry') {
      args.dry = true
      index -= 1
    } else fail(`unknown flag ${flag}`)
    index += 1
  }
  return args
}

const walk = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name)
    return entry.isDirectory() ? walk(full) : [full]
  })

const toPosix = (path) => path.split(sep).join('/')

const quoteList = (items) => items.map((item) => `'${item}'`).join(', ')

const args = parseArgs(process.argv.slice(2))
if (!args.answers || !args.target) {
  fail('usage: node render.mjs --answers <file> --target <dir> [--sets a,b] [--set key=value]')
}

const answers = JSON.parse(readFileSync(resolve(args.answers), 'utf8'))
const type = TYPES[answers.type]
if (!type) fail(`unknown project type ${answers.type}`)

const locales = answers.locales ?? ['en']
const defaultLocale = answers.defaultLocale ?? locales[0]
if (!locales.includes(defaultLocale)) fail('defaultLocale must be one of locales')

const vars = {
  name: answers.name,
  port: String(answers.port),
  locales: quoteList(locales),
  defaultLocale,
  siteUrl: answers.siteUrl ?? `http://localhost:${answers.port}`,
  layers: quoteList(type.layers),
  rulebookRevision: answers.rulebookRevision,
  biomeVersion: answers.versions?.biome,
  nodeMajor: answers.versions?.nodeMajor,
  localeLoaders: locales
    .map((locale) => {
      const key = /^[a-z]+$/.test(locale) ? locale : `'${locale}'`
      return locale === defaultLocale
        ? `  ${key}: () => Promise.resolve(baseDict),`
        : `  ${key}: () => import('./${locale}').then((module) => module.dict),`
    })
    .join('\n'),
  ...args.set,
}

for (const [key, value] of Object.entries(vars)) {
  if (value === undefined || value === null || value === 'undefined') fail(`missing value for {{${key}}}`)
}

const sets = args.sets ?? [...type.sets, ...(answers.addons ?? []).filter((addon) => existsSync(join(TEMPLATES, addon)))]
const target = resolve(args.target)

const fill = (text) =>
  text.replace(PLACEHOLDER, (match, key) => (key in vars && !POST_RENDER.has(key) ? vars[key] : match))

const files = new Map()
const fragments = []
for (const set of sets) {
  const root = join(TEMPLATES, set)
  if (!existsSync(root)) fail(`template set ${set} does not exist`)
  for (const file of walk(root)) {
    const rel = toPosix(relative(root, file))
    if (rel === 'package.fragment.json') {
      fragments.push(file)
      continue
    }
    files.set(rel.replaceAll('__defaultLocale__', defaultLocale), file)
  }
}

const written = []
const write = (rel, content) => {
  const destination = join(target, rel)
  if (!args.dry) {
    mkdirSync(dirname(destination), { recursive: true })
    writeFileSync(destination, content)
  }
  written.push(rel)
}

for (const set of sets) {
  for (const leftover of CLI_LEFTOVERS[set] ?? []) {
    const path = join(target, leftover)
    if (existsSync(path) && !files.has(leftover)) {
      if (!args.dry) rmSync(path, { recursive: true, force: true })
      console.log(`removed ${leftover}`)
    }
  }
}

for (const [rel, source] of files) write(rel, fill(readFileSync(source, 'utf8')))

const baseLocalePath = `src/shared/i18n/locales/${defaultLocale}.ts`
if (files.has(baseLocalePath)) {
  const base = fill(readFileSync(files.get(baseLocalePath), 'utf8'))
  const body = base
    .replace(/\n+export type Dict = typeof dict\n*$/, '\n')
    .replace('export const dict = {', `import type { Dict } from './${defaultLocale}'\n\nexport const dict: Dict = {`)
  for (const locale of locales.filter((item) => item !== defaultLocale)) {
    write(`src/shared/i18n/locales/${locale}.ts`, body)
  }
}

const packagePath = join(target, 'package.json')
const pkg = existsSync(packagePath) ? JSON.parse(readFileSync(packagePath, 'utf8')) : {}
const base = { ...pkg, name: vars.name, private: true }
if (base.scripts) {
  base.scripts = { ...base.scripts }
  for (const name of CLI_SCRIPTS_TO_DROP) delete base.scripts[name]
}
const merged = fragments
  .map((file) => JSON.parse(fill(readFileSync(file, 'utf8'))))
  .reduce((result, fragment) => deepMerge(result, fragment), base)
if (merged.devDependencies) {
  for (const name of CLI_DEV_DEPENDENCIES_TO_DROP) delete merged.devDependencies[name]
}
if (!args.dry) writeFileSync(packagePath, `${JSON.stringify(merged, null, 2)}\n`)
written.push('package.json')

const tsconfigPath = join(target, 'tsconfig.json')
if (sets.includes('next') && existsSync(tsconfigPath) && !args.dry) {
  const tsconfig = JSON.parse(readFileSync(tsconfigPath, 'utf8'))
  const include = tsconfig.include ?? []
  tsconfig.include = [...include, ...NEXT_TYPE_INCLUDES.filter((entry) => !include.includes(entry))]
  writeFileSync(tsconfigPath, `${JSON.stringify(tsconfig, null, 2)}\n`)
  written.push('tsconfig.json')
}

const sha = (text) => `sha256-${createHash('sha256').update(text).digest('base64')}`

if (!args.dry) {
  const prePaintPath = join(target, 'src/shared/lib/theme/pre-paint.ts')
  if (existsSync(prePaintPath)) {
    const module = await import(pathToFileURL(prePaintPath).href)
    vars.prePaintHash = sha(module.PRE_PAINT_SCRIPT)
  }
  const tmaPrePaintPath = join(target, 'src/app/boot/pre-paint.js')
  if (existsSync(tmaPrePaintPath)) {
    vars.tmaPrePaintHash = sha(readFileSync(tmaPrePaintPath, 'utf8').trim())
  }
}

const leftovers = []
for (const rel of written) {
  const destination = join(target, rel)
  if (args.dry || !existsSync(destination)) continue
  const content = readFileSync(destination, 'utf8')
  const final = content.replace(PLACEHOLDER, (match, key) => (key in vars ? vars[key] : match))
  if (final !== content) writeFileSync(destination, final)
  for (const match of final.matchAll(PLACEHOLDER)) leftovers.push(`${rel}: ${match[0]}`)
}

console.log(`rendered ${written.length} files from ${sets.join(', ')} into ${target}`)
if (leftovers.length > 0) fail(`unfilled placeholders:\n${leftovers.join('\n')}`)
