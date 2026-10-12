import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { PRE_PAINT_SCRIPT } from '../../src/shared/lib/theme/pre-paint.ts'

const hash = (script: string): string =>
  `sha256-${createHash('sha256').update(script).digest('base64')}`

describe('nginx CSP', () => {
  it('allows the inline pre-paint script by hash', () => {
    const nginx = readFileSync(resolve('nginx.conf'), 'utf8')
    expect(nginx).toContain(`'${hash(PRE_PAINT_SCRIPT)}'`)
  })

  it('allows the Telegram pre-paint script by hash', () => {
    const nginx = readFileSync(resolve('nginx.conf'), 'utf8')
    const script = readFileSync(resolve('src/app/boot/pre-paint.js'), 'utf8').trim()
    expect(nginx).toContain(`'${hash(script)}'`)
  })
})
