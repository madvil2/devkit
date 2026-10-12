# Telegram Mini App

Applies to: tma

- **TMA-1** All Telegram access goes through the `shared/lib/telegram` port (typed with `@types/telegram-web-app`). The pre-paint script is the only exception. [rules: R-telegram-global]
- **TMA-2** The pre-paint script handles expand, fullscreen, chrome colors and the html font-size pin.
- **TMA-3** Safe areas only via `--safe-area-*` tokens (`tokens/safe-area.css`).
- **TMA-4** No DOM back buttons. Back is logical; `pushBackHandler` for overlays; swipe-back wired once.
- **TMA-5** Haptics in the kit; `aria-disabled` for blocked feedback.
- **TMA-6** CloudStorage via the storage port (CFG-5).
- **TMA-7** Never follow `--tg-theme-*`; push our colors to the Telegram chrome.
- **TMA-8** HTTPS tunnel for devices.
