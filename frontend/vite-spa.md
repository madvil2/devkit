# Vite SPA

Applies to: vite

- **SPA-1** TanStack Router file-based with `autoCodeSplitting`. Search params validated with zod.
- **SPA-2** `main.tsx` imports `global.css` and dynamically imports `app/bootstrap`. Bootstrap order: env → storage hydrate → i18n → theme → render. The pre-paint theme script is inlined in `index.html`.
- **SPA-3** `server.port` fixed with `strictPort`.
- **SPA-4** Static deploy: SPA fallback; `index.html` no-cache; hashed assets immutable.
- **SPA-5** (pwa) `vite-plugin-pwa` caches the shell only, never API responses. Offline state.
- **SPA-6** `create-vite` output is a base: its oxlint setup is removed (Biome is the linter, TOOL-3) and its React Compiler wiring follows CMP-8.

## vite.config.ts shape

```ts
export default defineConfig({
  plugins: [
    tanstackRouter({ target: 'react', autoCodeSplitting: true }),
    react(),
    babel({ presets: [reactCompilerPreset()] }),
  ],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  server: { port: PORT, strictPort: true },
})
```
