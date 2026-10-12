import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { initEnv } from '@/shared/config'
import { initI18n } from '@/shared/i18n'
import { initTelegramPort, watchThemeForChrome } from '@/shared/lib/telegram'
import { initTheme } from '@/shared/lib/theme'
import { Providers } from './providers'
import { createQueryClient } from './query-client'
import { createAppRouter } from './router'

export const bootstrap = async (): Promise<void> => {
  initEnv()
  const telegram = initTelegramPort()
  await initI18n(telegram.viewerHint?.languageCode ?? undefined)
  initTheme()
  watchThemeForChrome()
  const container = document.getElementById('root')
  if (!container) throw new Error('Missing #root container')
  const queryClient = createQueryClient()
  const router = createAppRouter(queryClient)
  createRoot(container).render(
    <StrictMode>
      <Providers queryClient={queryClient} router={router} />
    </StrictMode>,
  )
  telegram.ready()
}
