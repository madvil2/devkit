import { Inter, JetBrains_Mono } from 'next/font/google'

const sans = Inter({
  subsets: ['latin', 'cyrillic'],
  display: 'swap',
  variable: '--font-sans-face',
})

const mono = JetBrains_Mono({
  subsets: ['latin', 'cyrillic'],
  display: 'swap',
  variable: '--font-mono-face',
})

export const fontVariables = `${sans.variable} ${mono.variable}`
