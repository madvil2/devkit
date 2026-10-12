import type { JsonLdData } from './structured-data'
import { useJsonLd } from './use-json-ld'

type JsonLdProps = {
  data: JsonLdData
}

export const JsonLd = ({ data }: JsonLdProps) => {
  const { html } = useJsonLd(data)
  return (
    // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD is serialized with <, > and & escaped (NXT-3)
    <script type="application/ld+json" dangerouslySetInnerHTML={html} />
  )
}
