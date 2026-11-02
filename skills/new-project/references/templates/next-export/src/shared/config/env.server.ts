import 'server-only'
import { z } from 'zod'

const siteEnvSchema = z.object({
  SITE_URL: z.url(),
})

export type SiteEnv = z.infer<typeof siteEnvSchema>

const parseEnv = <Schema extends z.ZodType>(schema: Schema, label: string): z.infer<Schema> => {
  const parsed = schema.safeParse(process.env)
  if (!parsed.success) {
    throw new Error(`Invalid ${label} environment:\n${z.prettifyError(parsed.error)}`)
  }
  return parsed.data
}

let site: SiteEnv | undefined

export const siteEnv = (): SiteEnv => {
  site ??= parseEnv(siteEnvSchema, 'site')
  return site
}
