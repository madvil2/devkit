import { fileURLToPath, URL } from 'node:url'
import babel from '@rolldown/plugin-babel'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import type { Plugin } from 'vite'
import { defineConfig } from 'vite'
import { PRE_PAINT_SCRIPT } from './src/shared/lib/theme/pre-paint.ts'

const PORT = {{port}}

const prePaintTheme = (): Plugin => ({
  name: 'pre-paint-theme',
  transformIndexHtml: () => [
    { tag: 'script', children: PRE_PAINT_SCRIPT, injectTo: 'head-prepend' },
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
    prePaintTheme(),
  ],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: { port: PORT, strictPort: true },
  preview: { port: PORT, strictPort: true },
})
