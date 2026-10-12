import { type JsonLdData, serializeJsonLd } from './structured-data'

export const useJsonLd = (data: JsonLdData) => ({
  html: { __html: serializeJsonLd(data) },
})
