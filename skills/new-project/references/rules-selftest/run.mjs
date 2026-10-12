import { spawnSync } from 'node:child_process'
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { delimiter, dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const COMMON = join(HERE, '..', 'templates', 'common')
const flag = process.argv.indexOf('--biome')
const biome = flag === -1 ? 'biome' : resolve(process.argv[flag + 1])
const env = { ...process.env, PATH: `${dirname(biome)}${delimiter}${process.env.PATH}` }
const work = mkdtempSync(join(tmpdir(), 'rules-selftest-'))

const config = JSON.parse(readFileSync(join(COMMON, 'biome.json'), 'utf8'))
delete config.$schema
writeFileSync(join(work, 'biome.json'), JSON.stringify(config))
cpSync(join(COMMON, 'biome-plugins'), join(work, 'biome-plugins'), { recursive: true })
cpSync(join(COMMON, 'scripts', 'check-rules.mjs'), join(work, 'scripts', 'check-rules.mjs'))
cpSync(join(HERE, 'fixtures', 'src'), join(work, 'src'), { recursive: true })
spawnSync('git', ['init', '-q'], { cwd: work })

const lint = spawnSync(biome, ['lint', '--reporter=json', '--max-diagnostics=none'], {
  cwd: work,
  env,
  encoding: 'utf8',
  maxBuffer: 256 * 1024 * 1024,
})
const rules = spawnSync(process.execPath, ['scripts/check-rules.mjs'], {
  cwd: work,
  env,
  encoding: 'utf8',
})
const found = []
for (const diagnostic of JSON.parse(lint.stdout).diagnostics) {
  const id = diagnostic.message.match(/^(R-[\w-]+) /)?.[1]
  if (diagnostic.category === 'plugin' && / errored: /.test(diagnostic.message))
    found.push({ file: diagnostic.location?.path, id: 'plugin-failure' })
  else if (id && diagnostic.location?.path) found.push({ file: diagnostic.location.path, id })
}
for (const line of rules.stdout.split('\n')) {
  const match = line.match(/^(\S+):\d+ (R-comments) /)
  if (match) found.push({ file: match[1], id: match[2] })
}

const expect = JSON.parse(readFileSync(join(HERE, 'expect.json'), 'utf8'))
let failures = found.filter((item) => item.id === 'plugin-failure').length
for (const [file, checks] of Object.entries(expect)) {
  for (const [id, want] of Object.entries(checks)) {
    const hit = found.some((item) => item.file === file && item.id === id)
    if (hit === (want === 'fail')) continue
    failures += 1
    console.log(`${file}: expected ${id} to ${want}`)
  }
}
rmSync(work, { recursive: true, force: true })
console.log(`rules-selftest: ${Object.keys(expect).length} samples, ${failures} failures`)
process.exit(failures > 0 ? 1 : 0)
