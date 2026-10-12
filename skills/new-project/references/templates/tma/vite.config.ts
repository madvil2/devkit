import { readFileSync } from 'node:fs'
import { fileURLToPath, URL } from 'node:url'
import babel from '@rolldown/plugin-babel'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import type { Plugin } from 'vite'
import { defineConfig } from 'vite'
import { PRE_PAINT_SCRIPT } from './src/shared/lib/theme/pre-paint.ts'

const PORT = {{port}}
const TELEGRAM_SDK = 'https://telegram.org/js/telegram-web-app.js'
const TMA_PRE_PAINT = readFileSync(
  new URL('./src/app/boot/pre-paint.js', import.meta.url),
  'utf8',
).trim()

const prePaint = (): Plugin => ({
  name: 'pre-paint',
  transformIndexHtml: () => [
    { tag: 'script', children: PRE_PAINT_SCRIPT, injectTo: 'head-prepend' },
    { tag: 'script', attrs: { src: TELEGRAM_SDK }, injectTo: 'head' },
    { tag: 'script', children: TMA_PRE_PAINT, injectTo: 'head' },
  ],
})

export default defineConfig({
  plugins: [
    tanstackRouter({
      target: 'react',
      autoCodeSplitting: true,
      routesDirectory: './src/app/routes',
      generatedRouteTree: './src/app/routeTree.gen.ts',
    }),
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    prePaint(),
  ],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: { port: PORT, strictPort: true, allowedHosts: true },
  preview: { port: PORT, strictPort: true },
})
