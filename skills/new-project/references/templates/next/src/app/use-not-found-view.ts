import { ROUTES } from '@/shared/config/routes'
import { useT } from '@/shared/i18n'

export const useNotFoundView = () => {
  const t = useT()
  return { t, homeHref: ROUTES.home() }
}
