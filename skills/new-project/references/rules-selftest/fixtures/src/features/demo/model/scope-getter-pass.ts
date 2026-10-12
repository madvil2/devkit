export const viewport = {
  get width() {
    return window.innerWidth
  },
}
export class Screen {
  get height() {
    return window.innerHeight
  }
}
if (import.meta.hot) {
  import.meta.hot.accept()
  const stored = localStorage.getItem('k')
  console.log(stored)
}
