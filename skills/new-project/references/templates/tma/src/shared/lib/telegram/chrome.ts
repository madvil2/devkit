import { getTelegram } from './port'

const tokenColor = (token: string): string =>
  getComputedStyle(document.documentElement).getPropertyValue(token).trim()

export const syncTelegramChrome = (): void => {
  const telegram = getTelegram()
  const background = tokenColor('--color-bg')
  if (!background) return
  telegram.setHeaderColor(background)
  telegram.setBackgroundColor(background)
  telegram.setBottomBarColor(background)
}

export const watchThemeForChrome = (): (() => void) => {
  const observer = new MutationObserver(() => syncTelegramChrome())
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
  syncTelegramChrome()
  return () => observer.disconnect()
}
