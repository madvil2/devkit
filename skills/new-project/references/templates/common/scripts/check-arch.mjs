import { spawnSync } from 'node:child_process'

const result = spawnSync(
  'depcruise',
  ['src', '--config', '.dependency-cruiser.cjs', '--output-type', 'json'],
  { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024, shell: process.platform === 'win32' },
)

if (result.error) {
  console.error(`lint:arch: cannot run dependency-cruiser: ${result.error.message}`)
  process.exit(2)
}

let report
try {
  report = JSON.parse(result.stdout)
} catch {
  console.error(result.stderr || result.stdout)
  console.error('lint:arch: dependency-cruiser did not return a JSON report')
  process.exit(2)
}

const { summary, modules } = report
const cruised = modules.filter((module) => module.source.startsWith('src/')).length

if (summary.totalCruised === 0 || cruised === 0) {
  console.error(
    'lint:arch: dependency-cruiser cruised 0 modules in src (TOOL-8). Check the TypeScript version it supports and the tsconfig path.',
  )
  process.exit(1)
}

const lines = summary.violations.map((violation) => {
  const target = violation.cycle
    ? violation.cycle.map((step) => step.name ?? step).join(' -> ')
    : violation.to
  return `${violation.from} -> ${target} ${violation.rule.name} (${violation.rule.severity})`
})

for (const line of lines) console.error(line)

const errors = summary.violations.filter((violation) => violation.rule.severity === 'error').length
console.log(
  `lint:arch: ${cruised} modules, ${summary.totalDependenciesCruised} dependencies, ${errors} errors, ${summary.violations.length - errors} other violations`,
)
process.exit(errors > 0 ? 1 : 0)
