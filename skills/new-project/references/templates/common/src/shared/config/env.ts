import { z } from 'zod'
import { PUBLIC_ENV } from './public-env'

const envSchema = z.object({
  API_MODE: z.enum(['mock', 'http']).default('http'),
  API_URL: z.string().min(1).default('/api'),
})

export type Env = z.infer<typeof envSchema>

let current: Env | null = null

export const initEnv = (): Env => {
  const result = envSchema.safeParse(PUBLIC_ENV)
  if (!result.success) {
    throw new Error(`Invalid environment:\n${z.prettifyError(result.error)}`)
  }
  current = result.data
  return result.data
}

export const getEnv = (): Env => current ?? initEnv()
