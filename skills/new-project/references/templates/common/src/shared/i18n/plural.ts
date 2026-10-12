export type PluralForms = Partial<Record<Intl.LDMLPluralRule, string>> & { other: string }

const rules = new Map<string, Intl.PluralRules>()

export const plural = (count: number, forms: PluralForms, locale: string): string => {
  const cached = rules.get(locale)
  const rule = cached ?? new Intl.PluralRules(locale)
  if (!cached) rules.set(locale, rule)
  return forms[rule.select(count)] ?? forms.other
}
