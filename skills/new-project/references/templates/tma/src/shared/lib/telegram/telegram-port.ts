import type { WebApp } from 'telegram-web-app'
import type { HapticKind, TelegramPort, TelegramViewer } from './types'

const IMPACT: Partial<Record<HapticKind, 'light' | 'medium' | 'heavy'>> = {
  light: 'light',
  medium: 'medium',
  heavy: 'heavy',
}

const NOTIFICATION: Partial<Record<HapticKind, 'success' | 'warning' | 'error'>> = {
  success: 'success',
  warning: 'warning',
  error: 'error',
}

const viewerHint = (webApp: WebApp): TelegramViewer | null => {
  const user = webApp.initDataUnsafe.user
  if (!user) return null
  return {
    id: user.id,
    firstName: user.first_name,
    lastName: user.last_name ?? null,
    username: user.username ?? null,
    languageCode: user.language_code ?? null,
  }
}

export const createTelegramPort = (webApp: WebApp): TelegramPort => ({
  env: 'telegram',
  platform: webApp.platform,
  initData: webApp.initData,
  viewerHint: viewerHint(webApp),
  ready: () => webApp.ready(),
  close: () => webApp.close(),
  setHeaderColor: (color) => webApp.setHeaderColor(color),
  setBackgroundColor: (color) => webApp.setBackgroundColor(color),
  setBottomBarColor: (color) => webApp.setBottomBarColor(color),
  setBackButtonVisible: (visible) =>
    visible ? webApp.BackButton.show() : webApp.BackButton.hide(),
  onBackButtonClick: (handler) => {
    webApp.BackButton.onClick(handler)
    return () => webApp.BackButton.offClick(handler)
  },
  haptic: (kind) => {
    const impact = IMPACT[kind]
    const notification = NOTIFICATION[kind]
    if (impact) webApp.HapticFeedback.impactOccurred(impact)
    else if (notification) webApp.HapticFeedback.notificationOccurred(notification)
    else webApp.HapticFeedback.selectionChanged()
  },
  openLink: (url) => webApp.openLink(url),
  openTelegramLink: (url) => webApp.openTelegramLink(url),
  storageGet: (keys) =>
    new Promise((resolve, reject) => {
      webApp.CloudStorage.getItems(keys, (error, values) => {
        if (error) reject(new Error(error))
        else resolve(values ?? {})
      })
    }),
  storageSet: (key, value) =>
    new Promise((resolve, reject) => {
      webApp.CloudStorage.setItem(key, value, (error) => {
        if (error) reject(new Error(error))
        else resolve()
      })
    }),
})
