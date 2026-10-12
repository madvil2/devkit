import type { IconName } from './icons'
import { ICONS } from './icons'

type UseIconParams = {
  name: IconName
  label?: string
}

export const useIcon = ({ name, label }: UseIconParams) => ({
  Glyph: ICONS[name],
  hidden: label ? undefined : true,
  role: label ? 'img' : undefined,
})
