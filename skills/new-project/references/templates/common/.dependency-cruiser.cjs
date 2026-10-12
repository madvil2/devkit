const { existsSync } = require('node:fs')

const LAYERS = [{{layers}}]
const SLICED = ['pages', 'views', 'widgets', 'features', 'entities', 'sections']
const VENDOR_UI = ['@base-ui/react', 'lucide-react']
const SERVER_ONLY = [
  '[.]server[.]tsx?$',
  '^src/shared/config/env[.]server[.]ts$',
  '^src/shared/api/server[.]ts$',
  '(^|/)node_modules/server-only/',
]

const layerRules = LAYERS.slice(1).map((layer, index) => ({
  name: 'layers',
  comment: `${layer} imports only from layers below it (STR-1)`,
  severity: 'error',
  from: { path: `^src/${layer}/` },
  to: { path: `^src/(${LAYERS.slice(0, index + 1).join('|')})/` },
}))

module.exports = {
  forbidden: [
    ...layerRules,
    {
      name: 'no-circular',
      comment: 'No import cycles (STR-1)',
      severity: 'error',
      from: {},
      to: { circular: true, dependencyTypesNot: ['type-only'] },
    },
    {
      name: 'no-deep-import',
      comment: 'Slices are imported through their index.ts only (STR-2)',
      severity: 'error',
      from: { path: '^src/([^/]+/[^/]+)/' },
      to: {
        path: `^src/(${SLICED.join('|')})/[^/]+/.+`,
        pathNot: ['^src/$1/', `^src/(${SLICED.join('|')})/[^/]+/index[.]tsx?$`],
      },
    },
    {
      name: 'no-deep-import',
      comment: 'Slices are imported through their index.ts only (STR-2)',
      severity: 'error',
      from: { path: '^src/[^/]+$' },
      to: {
        path: `^src/(${SLICED.join('|')})/[^/]+/.+`,
        pathNot: `^src/(${SLICED.join('|')})/[^/]+/index[.]tsx?$`,
      },
    },
    {
      name: 'no-sibling-slices',
      comment: 'No imports between sibling slices of one layer (STR-3)',
      severity: 'error',
      from: { path: '^src/(pages|views|widgets|features|sections)/([^/]+)/' },
      to: { path: '^src/$1/', pathNot: '^src/$1/$2/' },
    },
    {
      name: 'no-sibling-slices',
      comment: 'Entities import each other only with import type (STR-3)',
      severity: 'error',
      from: { path: '^src/(entities)/([^/]+)/' },
      to: {
        path: '^src/$1/',
        pathNot: '^src/$1/$2/',
        dependencyTypesNot: ['type-only'],
      },
    },
    {
      name: 'relative-only-within-slice',
      comment: 'Relative imports stay inside one slice; use the @/ alias across slices (STR-8)',
      severity: 'error',
      from: { path: '^src/([^/]+/[^/]+)/' },
      to: { dependencyTypes: ['local'], dependencyTypesNot: ['aliased'], pathNot: '^src/$1/' },
    },
    {
      name: 'vendor-ui-only-in-shared',
      comment: 'Base UI and lucide-react are used only inside shared/ui (KIT-6)',
      severity: 'error',
      from: { pathNot: '^src/shared/ui/' },
      to: { path: `(^|/)node_modules/(${VENDOR_UI.join('|')})/` },
    },
    {
      name: 'client-cannot-import-server-only',
      comment: 'Client modules never import server-only modules (NXT-1)',
      severity: 'error',
      from: {
        path: [
          '^src/shared/ui/',
          '^src/shared/lib/',
          '^src/(views|widgets|features|entities|sections)/[^/]+/model/',
        ],
      },
      to: { path: SERVER_ONLY },
    },
    {
      name: 'mocks-only-from-transport',
      comment: 'Only the transport loads src/mocks (API-4)',
      severity: 'error',
      from: { path: '^src/', pathNot: ['^src/shared/api/transport[.]ts$', '^src/mocks/'] },
      to: { path: '^src/mocks/' },
    },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    exclude: { path: '[.]css$' },
    tsPreCompilationDeps: true,
    tsConfig: {
      fileName: existsSync('tsconfig.app.json') ? 'tsconfig.app.json' : 'tsconfig.json',
    },
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['import', 'require', 'node', 'default', 'types'],
      mainFields: ['module', 'main', 'types', 'typings'],
    },
    reporterOptions: {
      text: { highlightFocused: true },
    },
  },
}
