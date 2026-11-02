import { readFile, stat } from 'node:fs/promises'
import { createServer } from 'node:http'
import { extname, join, resolve, sep } from 'node:path'

const [dir = 'out', port = '3000'] = process.argv.slice(2)
const ROOT = resolve(dir)

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.map': 'application/json',
}

const isFile = async (path) => (await stat(path).catch(() => null))?.isFile() ?? false

const pathnameOf = (url) => {
  try {
    return decodeURIComponent(new URL(url ?? '/', 'http://localhost').pathname)
  } catch {
    return null
  }
}

const locate = async (pathname) => {
  if (pathname === null) return null
  const base = join(ROOT, pathname)
  if (base !== ROOT && !base.startsWith(ROOT + sep)) return null
  for (const candidate of [base, `${base}.html`, join(base, 'index.html')]) {
    if (await isFile(candidate)) return candidate
  }
  return null
}

const send = async (response, status, file) => {
  response.writeHead(status, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' })
  response.end(await readFile(file))
}

createServer(async (request, response) => {
  const file = await locate(pathnameOf(request.url))
  if (file) return send(response, 200, file)
  const notFound = join(ROOT, '404.html')
  if (await isFile(notFound)) return send(response, 404, notFound)
  response.writeHead(404).end()
}).listen(Number(port), '127.0.0.1', () => {
  console.log(`serving ${ROOT} on http://127.0.0.1:${port}`)
})
