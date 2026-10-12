export type TelegramEnv = 'telegram' | 'browser'

export type HapticKind =
  | 'light'
  | 'medium'
  | 'heavy'
  | 'success'
  | 'warning'
  | 'error'
  | 'selection'

export type TelegramViewer = {
  id: number
  firstName: string
  lastName: string | null
  username: string | null
  languageCode: string | null
}

export type TelegramPort = {
  env: TelegramEnv
  platform: string
  initData: string
  viewerHint: TelegramViewer | null
  ready: () => void
  close: () => void
  setHeaderColor: (color: string) => void
  setBackgroundColor: (color: string) => void
  setBottomBarColor: (color: string) => void
  setBackButtonVisible: (visible: boolean) => void
  onBackButtonClick: (handler: () => void) => () => void
  haptic: (kind: HapticKind) => void
  openLink: (url: string) => void
  openTelegramLink: (url: string) => void
  storageGet: (keys: string[]) => Promise<Record<string, string>>
  storageSet: (key: string, value: string) => Promise<void>
}
