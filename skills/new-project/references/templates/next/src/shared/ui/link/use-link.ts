const EXTERNAL_REL = 'noopener noreferrer'

export const useLink = (external: boolean) =>
  external ? { rel: EXTERNAL_REL, target: '_blank' } : { rel: undefined, target: undefined }
