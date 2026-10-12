;(() => {
  const root = document.documentElement
  root.style.fontSize = '16px'
  const webApp = window.Telegram?.WebApp
  if (!webApp) return
  try {
    webApp.ready()
    webApp.expand()
    webApp.disableVerticalSwipes?.()
    const mobile = webApp.platform === 'ios' || webApp.platform === 'android'
    if (mobile && webApp.isVersionAtLeast?.('8.0')) webApp.requestFullscreen()
    root.dataset.tgPlatform = webApp.platform
  } catch {
    root.dataset.tgPlatform = 'unknown'
  }
})()
