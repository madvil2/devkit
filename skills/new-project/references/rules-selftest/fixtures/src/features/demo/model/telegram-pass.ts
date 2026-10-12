import { telegram } from '@/shared/lib/telegram'
export type App = Telegram.WebApp
export const app = () => telegram.expand()
