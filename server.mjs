/**
 * Production server: static file server + API proxy to backend.
 * Uses only Node.js built-in modules - no external packages needed.
 */
import { createServer, request as httpRequest } from 'node:http'
import { readFileSync, existsSync, statSync } from 'node:fs'
import { join, extname } from 'node:path'
import { URL } from 'node:url'

const PORT = parseInt(process.env.DEPLOY_RUN_PORT || '5000', 10)
const DIR = process.cwd()
const BACKEND_PORT = 8000

const MIME_MAP = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.gif': 'image/gif', '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon', '.webp': 'image/webp',
  '.woff': 'font/woff', '.woff2': 'font/woff2',
  '.ttf': 'font/ttf', '.eot': 'font/eot',
}

// API path prefixes that should be proxied to the backend
const API_PREFIXES = [
  '/dashboard', '/suppliers', '/materials', '/products',
  '/purchase-orders', '/sales-orders', '/production', '/warehouses',
  '/supplier-portal', '/health', '/sourcing', '/contracts',
  '/contract-templates', '/announcements', '/logistics', '/financial',
  '/qualification',
]

function getMime(path) {
  return MIME_MAP[extname(path)] || 'application/octet-stream'
}

function isApiPath(pathname) {
  return API_PREFIXES.some(prefix => pathname.startsWith(prefix))
}

/**
 * Proxy API requests to the backend server.
 */
function proxyRequest(req, res) {
  const options = {
    hostname: '127.0.0.1',
    port: BACKEND_PORT,
    path: req.url,
    method: req.method,
    headers: { ...req.headers, host: `localhost:${BACKEND_PORT}` },
  }

  const proxyReq = httpRequest(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers)
    proxyRes.pipe(res, { end: true })
  })

  proxyReq.on('error', () => {
    res.writeHead(502, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Backend service unavailable' }))
  })

  req.pipe(proxyReq, { end: true })
}

const server = createServer((req, res) => {
  try {
    const url = new URL(req.url || '/', 'http://localhost:' + PORT)
    let pathname = url.pathname

    // API routes: proxy to backend
    if (isApiPath(pathname)) {
      proxyRequest(req, res)
      return
    }

    if (pathname === '/') pathname = '/index.html'

    // Security: prevent path traversal
    if (pathname.includes('..')) {
      res.writeHead(400)
      res.end('Bad Request')
      return
    }

    const filePath = join(DIR, decodeURIComponent(pathname))

    if (!existsSync(filePath)) {
      // SPA fallback: serve index.html for non-file routes
      const indexPath = join(DIR, 'index.html')
      if (existsSync(indexPath)) {
        const content = readFileSync(indexPath)
        res.writeHead(200, {
          'Content-Type': 'text/html; charset=utf-8',
          'Content-Length': Buffer.byteLength(content),
          'Cache-Control': 'no-cache',
        })
        res.end(content)
        return
      }
      res.writeHead(404)
      res.end('Not Found')
      return
    }

    const stat = statSync(filePath)
    if (stat.isDirectory()) {
      res.writeHead(403)
      res.end('Forbidden')
      return
    }

    const content = readFileSync(filePath)
    const contentType = getMime(filePath)

    // Cache static assets aggressively
    const cacheControl = filePath.includes('/assets/')
      ? 'public, max-age=31536000, immutable'
      : 'no-cache'

    res.writeHead(200, {
      'Content-Type': contentType,
      'Content-Length': Buffer.byteLength(content),
      'Cache-Control': cacheControl,
    })
    res.end(content)
  } catch (err) {
    console.error('[static-server] Error:', err)
    res.writeHead(500)
    res.end('Internal Server Error')
  }
})

server.listen(PORT, '0.0.0.0', () => {
  console.log('[server] Serving on http://0.0.0.0:' + PORT)
})
