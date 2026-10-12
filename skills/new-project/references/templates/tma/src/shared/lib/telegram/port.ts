import { createBrowserPort } from './browser-port'
import { createTelegramPort } from './telegram-port'
import type { TelegramPort } from './types'

let port: TelegramPort | null = null

const hasInitData = (): boolean => Boolean(window.Telegram?.WebApp?.initData)

export const initTelegramPort = (): TelegramPort => {
  port = hasInitData() ? createTelegramPort(window.Telegram.WebApp) : createBrowserPort()
  return port
}

export const getTelegram = (): TelegramPort => port ?? initTelegramPort()
