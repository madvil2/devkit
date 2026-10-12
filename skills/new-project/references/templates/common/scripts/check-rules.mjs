import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { basename, dirname, extname, join, normalize, relative, sep } from 'node:path'
import { parseSync } from 'oxc-parser'

const ROOT = process.cwd()
const CONFIG_PATH = join(ROOT, 'scripts', 'check-rules.config.json')
const config = JSON.parse(readFileSync(CONFIG_PATH, 'utf8'))

const SCRIPT_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.mts', '.cts'])
const NATIVE_ELEMENTS = new Set([
  'span',
  'p',
  'a',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'button',
  'input',
  'select',
  'textarea',
  'form',
  'label',
  'img',
  'pre',
])
const MEMO_HOOKS = new Set(['useMemo', 'useCallback', 'memo'])
const STORAGE_GLOBALS = new Set(['localStorage', 'sessionStorage'])
const BROWSER_GLOBALS = new Set([
  'window',
  'document',
  'navigator',
  'location',
  'localStorage',
  'sessionStorage',
  'matchMedia',
])
const NAMED_COLORS =
  'aliceblue antiquewhite aqua aquamarine azure beige bisque black blanchedalmond blue blueviolet brown burlywood cadetblue chartreuse chocolate coral cornflowerblue cornsilk crimson cyan darkblue darkcyan darkgoldenrod darkgray darkgreen darkgrey darkkhaki darkmagenta darkolivegreen darkorange darkorchid darkred darksalmon darkseagreen darkslateblue darkslategray darkslategrey darkturquoise darkviolet deeppink deepskyblue dimgray dimgrey dodgerblue firebrick floralwhite forestgreen fuchsia gainsboro ghostwhite gold goldenrod gray green greenyellow grey honeydew hotpink indianred indigo ivory khaki lavender lavenderblush lawngreen lemonchiffon lightblue lightcoral lightcyan lightgoldenrodyellow lightgray lightgreen lightgrey lightpink lightsalmon lightseagreen lightskyblue lightslategray lightslategrey lightsteelblue lightyellow lime limegreen linen magenta maroon mediumaquamarine mediumblue mediumorchid mediumpurple mediumseagreen mediumslateblue mediumspringgreen mediumturquoise mediumvioletred midnightblue mintcream mistyrose moccasin navajowhite navy oldlace olive olivedrab orange orangered orchid palegoldenrod palegreen paleturquoise palevioletred papayawhip peru pink plum powderblue purple rebeccapurple red rosybrown royalblue saddlebrown salmon sandybrown seagreen seashell sienna silver skyblue slateblue slategray slategrey snow springgreen steelblue tan teal thistle tomato turquoise violet wheat white whitesmoke yellow yellowgreen'.split(
    ' ',
  )
const NAMED_COLOR_PATTERN = new RegExp(`(?<![\\w-])(${NAMED_COLORS.join('|')})(?![\\w(-])`, 'i')
const HEX_PATTERN = /#[0-9a-f]{3,8}\b/i
const COLOR_FUNCTION_PATTERN = /(?<![\w-])(rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)\(/i
const PX_PATTERN = /(?<![\w.-])-?(\d*\.?\d+)px\b/gi
const REM_PATTERN = /(?<![\w.-])-?\d*\.?\d+r?em\b/i
const TIME_PATTERN = /(?<![\w.-])-?(\d*\.?\d+)m?s\b/gi
const TOKEN_TIER_FILES = new Set([
  'primitives.css',
  'semantic.css',
  'components.css',
  'media.css',
  'fonts.css',
  'safe-area.css',
])
const NBSP = '\u00a0'
const EM_DASH = '\u2014'

const globCache = new Map()
const globToRegExp = (glob) => {
  const cached = globCache.get(glob)
  if (cached) return cached
  let pattern = ''
  for (let index = 0; index < glob.length; index += 1) {
    const char = glob[index]
    if (char === '*' && glob[index + 1] === '*') {
      if (glob[index + 2] === '/') {
        pattern += '(?:.*/)?'
        index += 2
      } else {
        pattern += '.*'
        index += 1
      }
    } else if (char === '*') {
      pattern += '[^/]*'
    } else if (char === '?') {
      pattern += '[^/]'
    } else if (char === '{') {
      pattern += '(?:'
    } else if (char === '}') {
      pattern += ')'
    } else if (char === ',' && pattern.includes('(?:')) {
      pattern += '|'
    } else {
      pattern += char.replace(/[.+^$()|[\]\\]/g, '\\$&')
    }
  }
  const regExp = new RegExp(`^${pattern}$`)
  globCache.set(glob, regExp)
  return regExp
}

const matches = (file, globs = []) => globs.some((glob) => globToRegExp(glob).test(file))
const inGroup = (file, group) => matches(file, config.globs[group])

const toPosix = (path) => path.split(sep).join('/')

const walk = (dir) => {
  if (!existsSync(dir)) return []
  const entries = readdirSync(dir, { withFileTypes: true })
  return entries.flatMap((entry) => {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name.startsWith('.')) return []
      return walk(full)
    }
    return [toPosix(relative(ROOT, full))]
  })
}

const collectFiles = () => {
  const fromRoots = config.roots.flatMap((root) => walk(join(ROOT, root)))
  const rootLevel = readdirSync(ROOT, { withFileTypes: true })
    .filter((entry) => entry.isFile() && matches(entry.name, config.rootFiles))
    .map((entry) => entry.name)
  return [...new Set([...fromRoots, ...rootLevel])]
    .filter((file) => !matches(file, config.globs.generated))
    .filter((file) => SCRIPT_EXTENSIONS.has(extname(file)) || extname(file) === '.css')
    .sort()
}

const findings = []

const lineIndex = (source) => {
  const starts = [0]
  for (let index = 0; index < source.length; index += 1) {
    if (source[index] === '\n') starts.push(index + 1)
  }
  return (offset) => {
    let low = 0
    let high = starts.length - 1
    while (low < high) {
      const middle = Math.ceil((low + high) / 2)
      if (starts[middle] <= offset) low = middle
      else high = middle - 1
    }
    return low + 1
  }
}

const allowed = (file, check) =>
  config.allow.some((entry) => entry.check === check && matches(file, [entry.file]))

const report = (file, line, check, message, level = 'error') => {
  if (allowed(file, check)) return
  findings.push({ file, line, check, message, level })
}

const isSrc = (file) => file.startsWith('src/')

const checkNbsp = (file, source, lineOf) => {
  let index = source.indexOf(NBSP)
  while (index !== -1) {
    report(file, lineOf(index), 'R-literal-nbsp', 'literal U+00A0; write the \\u00a0 escape')
    index = source.indexOf(NBSP, index + 1)
  }
}

const ALLOWED_COMMENT = [
  /^\s*biome-ignore/,
  /^\s*TODO\(api\):/,
  /^\/\s*<reference /,
  /^\s*@vite-ignore\s*$/,
]

const visit = (node, parent, enter) => {
  if (!node || typeof node !== 'object') return
  if (Array.isArray(node)) {
    for (const child of node) visit(child, parent, enter)
    return
  }
  if (typeof node.type !== 'string') return
  enter(node, parent)
  for (const key of Object.keys(node)) {
    if (key === 'type' || key === 'start' || key === 'end' || key === 'range' || key === 'loc')
      continue
    const value = node[key]
    if (value && typeof value === 'object') visit(value, node, enter)
  }
}

const isPascal = (name) => /^[A-Z][A-Za-z0-9]*$/.test(name)
const kebab = (name) =>
  name
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
    .toLowerCase()

const isReference = (node, parent) => {
  if (!parent) return true
  if (parent.type === 'MemberExpression' && parent.property === node && !parent.computed)
    return false
  if (
    (parent.type === 'Property' ||
      parent.type === 'MethodDefinition' ||
      parent.type === 'PropertyDefinition') &&
    parent.key === node &&
    !parent.computed
  )
    return false
  if (parent.type === 'ImportSpecifier' || parent.type === 'ExportSpecifier') return false
  if (parent.type === 'TSPropertySignature' || parent.type === 'TSQualifiedName') return false
  return true
}

const stringValue = (node) => {
  if (node.type === 'Literal' && typeof node.value === 'string') return node.value
  if (node.type === 'TemplateLiteral')
    return node.quasis.map((quasi) => quasi.value.cooked ?? '').join('{}')
  return null
}

const ruWords = new RegExp(`(?<![\\p{L}\\p{N}])(${config.ruShortWords.join('|')}) `, 'iu')
const digitSpaceLetter = /\d \p{L}/u
const spaceBeforeDash = new RegExp(` ${EM_DASH}`)

const checkTypography = (file, value, line) => {
  if (ruWords.test(value))
    report(file, line, 'R-typography', 'short word followed by a plain space; bind it with \\u00a0')
  if (digitSpaceLetter.test(value))
    report(file, line, 'R-typography', 'number followed by a plain space; bind it with \\u00a0')
  if (spaceBeforeDash.test(value))
    report(file, line, 'R-typography', 'plain space before an em dash; use \\u00a0')
}

const topLevelComponents = (program) => {
  const components = []
  for (const statement of program.body) {
    const declaration =
      statement.type === 'ExportNamedDeclaration' || statement.type === 'ExportDefaultDeclaration'
        ? statement.declaration
        : statement
    if (declaration?.type !== 'VariableDeclaration') continue
    for (const declarator of declaration.declarations) {
      if (
        declarator.id.type === 'Identifier' &&
        isPascal(declarator.id.name) &&
        declarator.init &&
        (declarator.init.type === 'ArrowFunctionExpression' ||
          declarator.init.type === 'FunctionExpression')
      ) {
        components.push(declarator)
      }
    }
  }
  return components
}

const containsBrowserRead = (node) => {
  let found = null
  visit(node, null, (child, parent) => {
    if (found) return
    if (
      child.type === 'Identifier' &&
      BROWSER_GLOBALS.has(child.name) &&
      isReference(child, parent)
    ) {
      found = child.name
    }
    if (
      child.type === 'NewExpression' &&
      child.callee.type === 'Identifier' &&
      child.callee.name === 'Date'
    ) {
      found = 'new Date()'
    }
    if (
      child.type === 'MemberExpression' &&
      child.object.type === 'MetaProperty' &&
      child.property.type === 'Identifier' &&
      child.property.name === 'env'
    ) {
      found = 'import.meta.env'
    }
  })
  return found
}

const stripFunctions = (node) => {
  if (!node || typeof node !== 'object') return node
  if (node.type === 'ArrowFunctionExpression' || node.type === 'FunctionExpression') return null
  if (Array.isArray(node)) return node.map(stripFunctions)
  const copy = {}
  for (const key of Object.keys(node)) copy[key] = stripFunctions(node[key])
  return copy
}

const checkModuleScope = (file, program, lineOf) => {
  for (const statement of program.body) {
    const declaration =
      statement.type === 'ExportNamedDeclaration' ? statement.declaration : statement
    if (!declaration) continue
    if (declaration.type === 'ExpressionStatement') {
      report(
        file,
        lineOf(statement.start),
        'R-module-scope-side-effects',
        'statement runs at module scope; move it into an init* function',
        'warn',
      )
      continue
    }
    if (declaration.type !== 'VariableDeclaration') continue
    for (const declarator of declaration.declarations) {
      const read = containsBrowserRead(stripFunctions(declarator.init))
      if (read) {
        report(
          file,
          lineOf(declarator.start),
          'R-module-scope-side-effects',
          `${read} read at module scope`,
          'warn',
        )
      }
    }
  }
}

const checkScript = (file, source) => {
  const lineOf = lineIndex(source)
  checkNbsp(file, source, lineOf)
  const result = parseSync(file, source, { sourceType: 'module' })
  if (result.errors.length > 0) {
    const [error] = result.errors
    report(file, 1, 'R-parse', error.message)
    return
  }
  const isDts = file.endsWith('.d.ts')
  for (const comment of result.comments) {
    const text = comment.value
    const allowedComment =
      ALLOWED_COMMENT.some((pattern) => pattern.test(text)) && (!text.startsWith('/') || isDts)
    if (!allowedComment) report(file, lineOf(comment.start), 'R-comments', 'comment in code (WF-1)')
  }
  if (!isSrc(file)) return

  const { program } = result
  const isTsx = file.endsWith('.tsx') || file.endsWith('.jsx')
  const inUi = inGroup(file, 'ui')
  const inSlice = inGroup(file, 'slices')
  const isLocale = inGroup(file, 'locales')

  if (isTsx) {
    const components = topLevelComponents(program)
    if (components.length > 1) {
      for (const component of components.slice(1)) {
        report(
          file,
          lineOf(component.start),
          'R-one-component',
          `second component ${component.id.name} in one file`,
        )
      }
    }
    if (components.length === 1 && !matches(file, config.componentNameExempt)) {
      const [component] = components
      const expected = kebab(component.id.name)
      const actual = basename(file, extname(file))
      if (expected !== actual) {
        report(
          file,
          lineOf(component.start),
          'R-one-component',
          `file name should be ${expected}${extname(file)}`,
        )
      }
    }
  }

  if (inSlice) checkModuleScope(file, program, lineOf)

  visit(program, null, (node, parent) => {
    const line = () => lineOf(node.start)

    if (node.type === 'FunctionDeclaration') {
      report(file, line(), 'R-no-function-decl', 'use an arrow function')
    }
    if (
      node.type === 'FunctionExpression' &&
      !(
        parent &&
        (parent.type === 'MethodDefinition' ||
          (parent.type === 'Property' && (parent.method || parent.kind !== 'init')))
      )
    ) {
      report(file, line(), 'R-no-function-decl', 'use an arrow function')
    }

    if (
      node.type === 'JSXOpeningElement' &&
      node.name.type === 'JSXIdentifier' &&
      NATIVE_ELEMENTS.has(node.name.name) &&
      !inUi
    ) {
      report(
        file,
        line(),
        'R-native-elements',
        `<${node.name.name}> outside shared/ui; use the kit`,
      )
    }

    if (node.type === 'JSXAttribute' && node.name.type === 'JSXIdentifier') {
      const attribute = node.name.name
      if (attribute === 'style') {
        const expression =
          node.value?.type === 'JSXExpressionContainer' ? node.value.expression : null
        const onlyCustomProperties =
          inUi &&
          expression?.type === 'ObjectExpression' &&
          expression.properties.every(
            (property) =>
              property.type === 'Property' &&
              property.key.type === 'Literal' &&
              typeof property.key.value === 'string' &&
              property.key.value.startsWith('--'),
          )
        if (!onlyCustomProperties) {
          report(
            file,
            line(),
            'R-inline-style',
            inUi ? 'only runtime CSS variables in style' : 'inline style outside shared/ui',
          )
        }
      }
      if (attribute === 'className' && !inUi && !matches(file, config.globs.classNameExempt)) {
        const expression =
          node.value?.type === 'JSXExpressionContainer' ? node.value.expression : null
        const single =
          expression &&
          ((expression.type === 'MemberExpression' &&
            !expression.computed &&
            expression.object.type === 'Identifier' &&
            expression.object.name === 'styles' &&
            expression.property.type === 'Identifier') ||
            (expression.type === 'Identifier' && expression.name === 'className'))
        if (!single)
          report(file, line(), 'R-classname', 'className must be one styles.<name> (STY-3)')
      }
    }

    if (
      node.type === 'VariableDeclarator' &&
      node.id.type === 'ObjectPattern' &&
      node.init?.type === 'CallExpression'
    ) {
      const callee = node.init.callee
      if (
        callee.type === 'Identifier' &&
        /^use[A-Z]/.test(callee.name) &&
        node.id.properties.length > config.hookFieldLimit
      ) {
        report(
          file,
          line(),
          'R-hook-fields',
          `${node.id.properties.length} fields from ${callee.name}; the cap is ${config.hookFieldLimit}`,
        )
      }
    }

    if (node.type === 'Literal' && node.regex && !inGroup(file, 'patterns')) {
      report(
        file,
        line(),
        'R-inline-regex',
        'regex literal; add a named helper in shared/lib/patterns',
      )
    }
    if (
      node.type === 'NewExpression' &&
      node.callee.type === 'Identifier' &&
      node.callee.name === 'RegExp' &&
      !inGroup(file, 'patterns')
    ) {
      report(
        file,
        line(),
        'R-inline-regex',
        'RegExp constructor; add a named helper in shared/lib/patterns',
      )
    }

    if (node.type === 'CallExpression') {
      const callee = node.callee
      const name =
        callee.type === 'Identifier'
          ? callee.name
          : callee.type === 'MemberExpression' &&
              !callee.computed &&
              callee.property.type === 'Identifier'
            ? callee.property.name
            : null
      if (name && MEMO_HOOKS.has(name)) {
        report(file, line(), 'R-manual-memo', `${name} without a profiler trace (CMP-8)`, 'warn')
      }
      const isFetch =
        (callee.type === 'Identifier' && callee.name === 'fetch') ||
        (callee.type === 'MemberExpression' &&
          callee.object.type === 'Identifier' &&
          (callee.object.name === 'window' || callee.object.name === 'globalThis') &&
          callee.property.type === 'Identifier' &&
          callee.property.name === 'fetch')
      if (isFetch && !inGroup(file, 'fetchAllowed')) {
        report(file, line(), 'R-fetch', 'fetch outside the API client')
      }
    }

    if (
      inGroup(file, 'endpointScope') &&
      !inGroup(file, 'endpoints') &&
      parent?.type !== 'ImportDeclaration' &&
      parent?.type !== 'ImportExpression'
    ) {
      const value = stringValue(node)
      if (value !== null && value.length > 1 && value.startsWith('/') && !value.startsWith('//')) {
        report(
          file,
          line(),
          'R-endpoint-literals',
          'endpoint path literal; use shared/api/endpoints.ts',
        )
      }
    }

    if (node.type === 'MemberExpression' && !node.computed && node.property.type === 'Identifier') {
      const isEnv =
        node.property.name === 'env' &&
        (node.object.type === 'MetaProperty' ||
          (node.object.type === 'Identifier' && node.object.name === 'process'))
      if (isEnv && !inGroup(file, 'env')) {
        report(file, line(), 'R-env-access', 'env read outside shared/config env modules')
      }
      if (STORAGE_GLOBALS.has(node.property.name) && !inGroup(file, 'storage')) {
        report(file, line(), 'R-storage', `${node.property.name} outside shared/lib/storage`)
      }
      if (node.property.name === 'Telegram' && !inGroup(file, 'telegram')) {
        report(file, line(), 'R-telegram-global', 'Telegram global outside shared/lib/telegram')
      }
      if (
        node.property.name === 'message' &&
        (inSlice || inUi || file.startsWith('src/app/')) &&
        isTsx
      ) {
        report(
          file,
          line(),
          'R-error-message',
          'error .message rendered; map errors with errorKey',
          'warn',
        )
      }
    }

    if (node.type === 'Identifier' && isReference(node, parent)) {
      if (STORAGE_GLOBALS.has(node.name) && !inGroup(file, 'storage')) {
        report(file, line(), 'R-storage', `${node.name} outside shared/lib/storage`)
      }
      if (node.name === 'Telegram' && !inGroup(file, 'telegram')) {
        report(file, line(), 'R-telegram-global', 'Telegram global outside shared/lib/telegram')
      }
    }

    if (node.type === 'ImportDeclaration' && typeof node.source.value === 'string') {
      const source = node.source.value
      if (
        source.endsWith('.css') &&
        !source.endsWith('.module.css') &&
        !inGroup(file, 'globalCssEntries')
      ) {
        report(file, line(), 'R-global-css-import', 'global CSS is imported only by the app entry')
      }
    }

    if (isLocale) {
      const value = stringValue(node)
      if (value !== null) checkTypography(file, value, line())
    }
  })
}

const stripCssComments = (source, file, lineOf) => {
  let output = ''
  let index = 0
  while (index < source.length) {
    if (source[index] === '/' && source[index + 1] === '*') {
      const end = source.indexOf('*/', index + 2)
      const close = end === -1 ? source.length : end + 2
      const text = source.slice(index + 2, close - 2)
      if (!/^\s*biome-ignore/.test(text))
        report(file, lineOf(index), 'R-comments', 'comment in CSS (WF-1)')
      output += source.slice(index, close).replace(/[^\n]/g, ' ')
      index = close
    } else {
      output += source[index]
      index += 1
    }
  }
  return output
}

const parseCss = (source) => {
  const items = []
  let buffer = ''
  let start = 0
  let quote = null
  let depth = 0
  for (let index = 0; index < source.length; index += 1) {
    const char = source[index]
    if (quote) {
      buffer += char
      if (char === quote && source[index - 1] !== '\\') quote = null
      continue
    }
    if (char === '"' || char === "'") {
      if (buffer.trim() === '') start = index
      quote = char
      buffer += char
      continue
    }
    if (char === '(') depth += 1
    if (char === ')') depth -= 1
    if ((char === '{' || char === '}' || char === ';') && depth === 0) {
      const text = buffer.trim()
      if (text) items.push({ text, start, kind: char === '{' ? 'prelude' : 'declaration' })
      if (char === '}') items.push({ text: '}', start: index, kind: 'close' })
      buffer = ''
      continue
    }
    if (buffer.trim() === '' && !/\s/.test(char)) start = index
    buffer += char
  }
  return items
}

const removeFunction = (value, name) => {
  let output = value
  let index = output.toLowerCase().indexOf(`${name}(`)
  while (index !== -1) {
    let depth = 0
    let end = index + name.length
    for (; end < output.length; end += 1) {
      if (output[end] === '(') depth += 1
      if (output[end] === ')') {
        depth -= 1
        if (depth === 0) break
      }
    }
    output = `${output.slice(0, index)} ${output.slice(end + 1)}`
    index = output.toLowerCase().indexOf(`${name}(`)
  }
  return output
}

const cleanValue = (value) =>
  removeFunction(removeFunction(value.replace(/(["'])(?:\\.|(?!\1).)*\1/g, ' '), 'var'), 'url')

const rawValueProblems = (property, value) => {
  const problems = []
  const cleaned = cleanValue(value)
  if (HEX_PATTERN.test(cleaned)) problems.push('hex color')
  if (COLOR_FUNCTION_PATTERN.test(cleaned)) problems.push('color function')
  const named = cleaned.match(NAMED_COLOR_PATTERN)
  if (named) problems.push(`named color ${named[1]}`)
  for (const match of cleaned.matchAll(PX_PATTERN)) {
    if (Number(match[1]) !== 1) problems.push(`${match[0]}`)
  }
  if (REM_PATTERN.test(cleaned)) problems.push('rem/em literal')
  for (const match of cleaned.matchAll(TIME_PATTERN)) {
    if (Number(match[1]) !== 0) problems.push(`time literal ${match[0]}`)
  }
  if (property === 'z-index') {
    const number = cleaned.trim()
    if (/^-?\d+$/.test(number) && number !== '0' && number !== '-1')
      problems.push(`z-index ${number}`)
  }
  return problems
}

const resolveComposesPath = (file, target) => {
  if (target.startsWith('@/')) return `src/${target.slice(2)}`
  if (target.startsWith('.')) return toPosix(normalize(join(dirname(file), target)))
  return target
}

const checkCss = (file, source) => {
  const lineOf = lineIndex(source)
  checkNbsp(file, source, lineOf)
  const cleanSource = stripCssComments(source, file, lineOf)
  if (!isSrc(file)) return
  const inTokens = inGroup(file, 'tokens')
  const tierFile = basename(file)
  if (inTokens && !TOKEN_TIER_FILES.has(tierFile)) {
    report(file, 1, 'R-token-tiers', `unknown token tier file ${tierFile}`)
  }
  for (const item of parseCss(cleanSource)) {
    const line = lineOf(item.start)
    if (item.kind === 'prelude' && item.text.startsWith('@media')) {
      const params = item.text
        .slice('@media'.length)
        .replace(/\(\s*--[\w-]+\s*\)/g, ' ')
        .replace(/\b(and|or|not|only|screen|print|all)\b/g, ' ')
        .replace(/,/g, ' ')
        .trim()
      if (params && !inTokens)
        report(file, line, 'R-raw-values', '@media with raw values; use a custom media name')
      continue
    }
    if (item.kind === 'declaration' && item.text.startsWith('@import')) {
      if (!inGroup(file, 'globalCss'))
        report(file, line, 'R-global-css-import', '@import outside the global stylesheet')
      continue
    }
    if (item.kind !== 'declaration' || item.text.startsWith('@')) continue
    const colon = item.text.indexOf(':')
    if (colon === -1) continue
    const property = item.text.slice(0, colon).trim().toLowerCase()
    const value = item.text
      .slice(colon + 1)
      .replace(/!important\s*$/i, '')
      .trim()

    if (property === 'composes') {
      const fromMatch = value.match(/\bfrom\s+(?:(['"])(.*?)\1|(\w+))\s*$/)
      if (fromMatch) {
        const target = fromMatch[2] ?? fromMatch[3]
        const resolved = fromMatch[3] ? target : resolveComposesPath(file, target)
        if (!matches(resolved, config.globs.recipes)) {
          report(
            file,
            line,
            'R-composes-source',
            `composes from ${target}; only src/shared/styles/*.module.css recipes`,
          )
        }
      }
      continue
    }

    if (inTokens) {
      if (tierFile === 'semantic.css' && property !== 'color-scheme') {
        const rest = removeFunction(value, 'var').replace(/[\s,]/g, '')
        if (!property.startsWith('--') || rest !== '') {
          report(
            file,
            line,
            'R-token-tiers',
            `semantic token ${property} must reference other tokens with var() only`,
          )
        }
      }
      if (tierFile === 'components.css') {
        const cleaned = cleanValue(value)
        if (
          HEX_PATTERN.test(cleaned) ||
          COLOR_FUNCTION_PATTERN.test(cleaned) ||
          NAMED_COLOR_PATTERN.test(cleaned)
        ) {
          report(file, line, 'R-token-tiers', `component token ${property} holds a color`)
        }
        if (value.includes('--palette-')) {
          report(
            file,
            line,
            'R-token-tiers',
            `component token ${property} references a palette primitive`,
          )
        }
      }
      continue
    }

    for (const problem of rawValueProblems(property, value)) {
      report(file, line, 'R-raw-values', `${property}: ${problem}; use a token`)
    }
  }
}

if (
  !Array.isArray(config.allow) ||
  config.allow.some((entry) => !entry.file || !entry.check || !entry.reason)
) {
  console.error('check-rules: every allow entry needs file, check and reason')
  process.exit(2)
}

for (const file of collectFiles()) {
  const source = readFileSync(join(ROOT, file), 'utf8')
  if (extname(file) === '.css') checkCss(file, source)
  else checkScript(file, source)
}

findings.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line)
for (const finding of findings) {
  const suffix = finding.level === 'warn' ? ' (warn)' : ''
  console.log(`${finding.file}:${finding.line} ${finding.check} ${finding.message}${suffix}`)
}
const errors = findings.filter((finding) => finding.level === 'error').length
const warnings = findings.length - errors
console.log(`check-rules: ${errors} errors, ${warnings} warnings`)
process.exit(errors > 0 ? 1 : 0)
