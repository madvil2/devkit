import 'server-only'
import { z } from 'zod'
import { MOCK_API } from './public-env'

const siteEnvSchema = z.object({
  SITE_URL: z.url(),
})

const serverEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  API_UPSTREAM_URL: z.url(),
})

export type SiteEnv = z.infer<typeof siteEnvSchema>

export type ServerEnv = z.infer<typeof serverEnvSchema>

const parseEnv = <Schema extends z.ZodType>(schema: Schema, label: string): z.infer<Schema> => {
  const parsed = schema.safeParse(process.env)
  if (!parsed.success) {
    throw new Error(`Invalid ${label} environment:\n${z.prettifyError(parsed.error)}`)
  }
  return parsed.data
}

let site: SiteEnv | undefined
let server: ServerEnv | undefined

export const siteEnv = (): SiteEnv => {
  site ??= parseEnv(siteEnvSchema, 'site')
  return site
}

export const serverEnv = (): ServerEnv => {
  server ??= parseEnv(serverEnvSchema, 'server')
  return server
}

export const assertEnv = () => {
  siteEnv()
  if (!MOCK_API) serverEnv()
}
