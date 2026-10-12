export type TemplateParams = Record<string, string | number>

export const format = (template: string, params: TemplateParams): string =>
  Object.entries(params).reduce(
    (result, [key, value]) => result.split(`{${key}}`).join(String(value)),
    template,
  )
