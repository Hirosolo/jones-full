import type { NextApiRequest, NextApiResponse } from 'next'

import { defaultContent, type SiteContent } from '@Data/defaultContent'

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123'
const ADMIN_API_KEY = process.env.ADMIN_API_KEY || ''
const DJANGO_BASE_URL = process.env.NEXT_PUBLIC_DJANGO_BASE_URL || 'https://api.fulfillnext.com'
const COOKIE_NAME = 'admin_token'
const MAX_FILE_SIZE = 5 * 1024 * 1024

const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg', '.avif'])

type MultipartFile = {
  fieldName: string
  filename: string
  contentType: string
  data: Buffer
}

function parseCookies(cookieHeader: string | undefined): Record<string, string> {
  const cookies: Record<string, string> = {}
  if (!cookieHeader) return cookies
  cookieHeader.split(';').forEach(part => {
    const index = part.indexOf('=')
    if (index === -1) return
    const key = part.slice(0, index).trim()
    const value = part.slice(index + 1).trim()
    cookies[key] = decodeURIComponent(value)
  })
  return cookies
}

function validateToken(token: string): boolean {
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8')
    const parts = decoded.split(':')
    return parts[0] === 'admin' && parts[2] === ADMIN_PASSWORD
  } catch {
    return false
  }
}

function generateToken(): string {
  return Buffer.from(`admin:${Date.now()}:${ADMIN_PASSWORD}`).toString('base64')
}

function buildCookie(value: string, maxAgeSeconds = 60 * 60 * 24): string {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : ''
  return `${COOKIE_NAME}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSeconds}${secure}`
}

function clearCookie(): string {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : ''
  return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`
}

function isAuthenticated(req: NextApiRequest): boolean {
  const token = parseCookies(req.headers.cookie)[COOKIE_NAME]
  return !!token && validateToken(token)
}

function deepMerge<T extends Record<string, any>>(target: T, source: Partial<T>): T {
  const result = { ...target }
  for (const key of Object.keys(source) as (keyof T)[]) {
    const sourceValue = source[key]
    const targetValue = target[key]
    if (
      sourceValue &&
      typeof sourceValue === 'object' &&
      !Array.isArray(sourceValue) &&
      targetValue &&
      typeof targetValue === 'object' &&
      !Array.isArray(targetValue)
    ) {
      result[key] = deepMerge(targetValue as any, sourceValue as any)
    } else if (sourceValue !== undefined) {
      result[key] = sourceValue as T[keyof T]
    }
  }
  return result
}

async function readRawBody(req: NextApiRequest): Promise<Buffer> {
  const chunks: Buffer[] = []
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : Buffer.from(chunk as Uint8Array))
  }
  return Buffer.concat(chunks as unknown as readonly Uint8Array[])
}

function parseMultipart(buffer: Buffer, contentType = ''): MultipartFile[] {
  const boundaryMatch = /boundary=(?:(?:"([^"]+)")|([^;]+))/i.exec(contentType)
  const boundary = boundaryMatch?.[1] || boundaryMatch?.[2]
  if (!boundary) return []

  const delimiter = Buffer.from(`--${boundary}`)
  const parts = buffer.toString('binary').split(delimiter.toString('binary'))
  const files: MultipartFile[] = []

  for (const part of parts) {
    let chunk = part.trim()
    if (!chunk || chunk === '--') continue
    if (chunk.startsWith('--')) chunk = chunk.slice(2).trim()
    if (chunk.startsWith('\r\n')) chunk = chunk.slice(2)

    const headerEnd = chunk.indexOf('\r\n\r\n')
    if (headerEnd === -1) continue

    const headerText = chunk.slice(0, headerEnd)
    let bodyText = chunk.slice(headerEnd + 4)
    if (bodyText.endsWith('\r\n')) bodyText = bodyText.slice(0, -2)

    const disposition = /content-disposition:[^\n]*name="([^"]+)"(?:;\s*filename="([^"]*)")?/i.exec(headerText)
    if (!disposition || !disposition[2]) continue

    const contentTypeMatch = /content-type:\s*([^\r\n]+)/i.exec(headerText)
    files.push({
      fieldName: disposition[1],
      filename: disposition[2],
      contentType: contentTypeMatch?.[1]?.trim() || 'application/octet-stream',
      data: Buffer.from(bodyText, 'binary'),
    })
  }

  return files
}

function safeExt(filename: string, contentType: string): string {
  const ext = filename.includes('.') ? filename.split('.').pop() || '' : ''
  if (ext) return ext.toLowerCase()
  switch (contentType) {
    case 'image/jpeg': return 'jpg'
    case 'image/png': return 'png'
    case 'image/webp': return 'webp'
    case 'image/gif': return 'gif'
    case 'image/svg+xml': return 'svg'
    case 'image/avif': return 'avif'
    default: return 'jpg'
  }
}

function sanitizeBaseName(filename: string): string {
  return filename
    .replace(/\.[^.]+$/, '')
    .replace(/[^a-zA-Z0-9-_]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50) || 'upload'
}

async function saveLocalUploads(files: MultipartFile[]) {
  const fs = await import('fs')
  const path = await import('path')
  const uploadDir = path.join(process.cwd(), 'public', 'uploads')
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true })
  }

  const urls: string[] = []
  const errors: string[] = []

  for (const file of files) {
    if (!file.fieldName || file.fieldName !== 'file') continue
    if (file.data.length > MAX_FILE_SIZE) {
      errors.push(`${file.filename}: File too large (${(file.data.length / 1024 / 1024).toFixed(1)}MB). Max: 5MB`)
      continue
    }
    if (!file.contentType.startsWith('image/')) {
      errors.push(`${file.filename}: Invalid file type "${file.contentType}".`)
      continue
    }

    const safeName = sanitizeBaseName(file.filename)
    const ext = safeExt(file.filename, file.contentType)
    const generatedName = `${safeName}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
    const filePath = path.join(uploadDir, generatedName)
    fs.writeFileSync(filePath, new Uint8Array(file.data))
    urls.push(`/uploads/${generatedName}`)
  }

  return { urls, errors }
}

async function listLocalMedia() {
  const fs = await import('fs')
  const path = await import('path')
  const uploadDir = path.join(process.cwd(), 'public', 'uploads')

  if (!fs.existsSync(uploadDir)) {
    return []
  }

  return fs
    .readdirSync(uploadDir)
    .filter(fileName => IMAGE_EXTENSIONS.has(path.extname(fileName).toLowerCase()))
    .map(fileName => {
      const stat = fs.statSync(path.join(uploadDir, fileName))
      return {
        url: `/uploads/${fileName}`,
        pathname: `uploads/${fileName}`,
        size: stat.size,
        uploadedAt: stat.mtime.toISOString(),
      }
    })
    .sort((left, right) => new Date(right.uploadedAt).getTime() - new Date(left.uploadedAt).getTime())
}

async function deleteLocalMedia(url: string) {
  const fs = await import('fs')
  const path = await import('path')
  const filename = url.replace(/^\/uploads\//, '')
  const filePath = path.join(process.cwd(), 'public', 'uploads', filename)
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath)
  }
}

async function getBackendContent(): Promise<SiteContent> {
  const response = await fetch(`${DJANGO_BASE_URL}/api/shop/cms/site-content/`, { cache: 'no-store' })
  if (!response.ok) {
    return { ...defaultContent }
  }

  const saved = (await response.json()) as Partial<SiteContent> | Record<string, never>
  if (!saved || Object.keys(saved).length === 0) {
    return { ...defaultContent }
  }

  return deepMerge(defaultContent, saved as Partial<SiteContent>)
}

async function saveBackendContent(content: SiteContent) {
  if (!ADMIN_API_KEY) {
    throw new Error('ADMIN_API_KEY env var is missing on the Next.js server')
  }

  const response = await fetch(`${DJANGO_BASE_URL}/api/shop/cms/site-content/save/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Admin-Key': ADMIN_API_KEY,
    },
    body: JSON.stringify(content),
  })

  if (!response.ok) {
    const bodyText = await response.text().catch(() => '')
    throw new Error(bodyText || `Backend save failed with HTTP ${response.status}`)
  }
}

function backendAdminPath(pathSegments: string[], method: string): string | null {
  const [section, id, action] = pathSegments

  if (!section) return null

  const prefix = (value: string) => `${DJANGO_BASE_URL}/api/${value}`

  if (section === 'products') {
    if (id === 'options') return prefix('shop/admin-products/options/')
    if (id) {
      if (method === 'GET') return prefix(`shop/admin-products/${id}/`)
      if (method === 'DELETE') return prefix(`shop/admin-products/${id}/delete/`)
      return prefix(`shop/admin-products/${id}/update/`)
    }
    return method === 'POST'
      ? prefix('shop/admin-products/create/')
      : prefix('shop/admin-products/')
  }

  if (section === 'brands') {
    if (id) {
      if (method === 'GET') return prefix(`shop/admin-brands/${id}/`)
      if (method === 'DELETE') return prefix(`shop/admin-brands/${id}/delete/`)
      return prefix(`shop/admin-brands/${id}/update/`)
    }
    return method === 'POST'
      ? prefix('shop/admin-brands/create/')
      : prefix('shop/admin-brands/')
  }

  if (section === 'categories') {
    if (id) {
      if (method === 'GET') return prefix(`shop/admin-categories/${id}/`)
      if (method === 'DELETE') return prefix(`shop/admin-categories/${id}/delete/`)
      return prefix(`shop/admin-categories/${id}/update/`)
    }
    return method === 'POST'
      ? prefix('shop/admin-categories/create/')
      : prefix('shop/admin-categories/')
  }

  if (section === 'tags') {
    if (id) {
      if (method === 'GET') return null
      if (method === 'DELETE') return prefix(`shop/admin-tags/${id}/delete/`)
      return prefix(`shop/admin-tags/${id}/update/`)
    }
    return method === 'POST'
      ? prefix('shop/admin-tags/create/')
      : prefix('shop/admin-tags/')
  }

  if (section === 'articles') {
    if (id === 'options') return prefix('articles/admin-articles/options/')
    if (id) {
      if (method === 'GET') return prefix(`articles/admin-articles/${id}/`)
      if (method === 'DELETE') return prefix(`articles/admin-articles/${id}/delete/`)
      return prefix(`articles/admin-articles/${id}/update/`)
    }
    return method === 'POST'
      ? prefix('articles/admin-articles/create/')
      : prefix('articles/admin-articles/')
  }

  if (section === 'article-categories') {
    if (id) {
      if (method === 'GET') return null
      if (method === 'DELETE') return prefix(`articles/admin-article-categories/${id}/delete/`)
      return prefix(`articles/admin-article-categories/${id}/update/`)
    }
    return method === 'POST'
      ? prefix('articles/admin-article-categories/create/')
      : prefix('articles/admin-article-categories/')
  }

  return null
}

async function proxyToBackend(req: NextApiRequest, res: NextApiResponse, pathSegments: string[]) {
  const method = req.method || 'GET'
  const backendUrl = backendAdminPath(pathSegments, method)
  if (!backendUrl) {
    return res.status(404).json({ error: 'Unsupported admin path' })
  }

  if (!ADMIN_API_KEY) {
    return handleMissingAdminKey(req, res, pathSegments)
  }

  const headers: Record<string, string> = {
    Accept: 'application/json',
    'X-Admin-Key': ADMIN_API_KEY,
  }

  const contentType = req.headers['content-type']
  if (contentType) {
    headers['Content-Type'] = contentType
  }

  const options: RequestInit = { method, headers }

  if (!['GET', 'HEAD'].includes(method)) {
    if (contentType?.includes('multipart/form-data')) {
      options.body = new Uint8Array(await readRawBody(req))
    } else if (req.body && typeof req.body === 'object') {
      options.body = JSON.stringify(req.body)
    } else {
      const raw = await readRawBody(req)
      options.body = raw.length > 0 ? new Uint8Array(raw) : undefined
    }
  }

  const response = await fetch(backendUrl, options)
  const responseContentType = response.headers.get('content-type') || ''
  const body = responseContentType.includes('application/json')
    ? await response.json().catch(() => ({}))
    : await response.text()

  res.status(response.status)
  if (responseContentType) {
    res.setHeader('Content-Type', responseContentType)
  }

  if (typeof body === 'string') {
    return res.send(body)
  }
  return res.json(body)
}

export const config = {
  api: {
    bodyParser: false,
  },
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const pathSegments = Array.isArray(req.query.path) ? req.query.path : []
  const [section] = pathSegments

  if (section === 'auth') {
    if (req.method === 'GET') {
      return res.status(200).json({ authenticated: isAuthenticated(req) })
    }

    if (req.method === 'POST') {
      const body = await parseRequestBody(req)
      const password = String(body?.password || '')
      if (!password) {
        return res.status(400).json({ error: 'Password is required' })
      }
      if (password !== ADMIN_PASSWORD) {
        return res.status(401).json({ error: 'Invalid password' })
      }

      res.setHeader('Set-Cookie', buildCookie(generateToken()))
      return res.status(200).json({ success: true })
    }

    if (req.method === 'DELETE') {
      res.setHeader('Set-Cookie', clearCookie())
      return res.status(200).json({ success: true })
    }
  }

  if (section === 'content') {
    if (!isAuthenticated(req)) {
      return res.status(401).json({ error: 'Unauthorized. Please log in to the admin panel.' })
    }

    if (req.method === 'GET') {
      try {
        const content = await getBackendContent()
        return res.status(200).json(content)
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to load content'
        return res.status(500).json({ error: message })
      }
    }

    if (req.method === 'POST') {
      try {
        const body = await parseRequestBody(req)
        if (!body || typeof body !== 'object' || Array.isArray(body)) {
          return res.status(400).json({ error: 'Invalid content format. Expected a JSON object.' })
        }

        const current = await getBackendContent()
        const updated = deepMerge(current, body as Partial<SiteContent>)
        await saveBackendContent(updated)
        return res.status(200).json({ success: true, message: 'Content updated successfully' })
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to save content'
        return res.status(500).json({ error: 'Failed to save content', detail: message })
      }
    }
  }

  if (section === 'upload') {
    if (!isAuthenticated(req)) {
      return res.status(401).json({ error: 'Unauthorized. Please log in to the admin panel.' })
    }

    if (req.method === 'POST') {
      try {
        const raw = await readRawBody(req)
        const files = parseMultipart(raw, String(req.headers['content-type'] || ''))
        const { urls, errors } = await saveLocalUploads(files)
        return res.status(200).json({ success: true, urls, errors: errors.length > 0 ? errors : undefined, count: urls.length })
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Upload failed'
        return res.status(500).json({ error: message })
      }
    }
  }

  if (section === 'media') {
    if (!isAuthenticated(req)) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    if (req.method === 'GET') {
      try {
        const media = await listLocalMedia()
        return res.status(200).json({ media, count: media.length })
      } catch (error) {
        return res.status(500).json({ error: 'Failed to list media' })
      }
    }

    if (req.method === 'DELETE') {
      try {
        const body = await parseRequestBody(req)
        const url = String(body?.url || '')
        if (!url) {
          return res.status(400).json({ error: 'URL is required' })
        }
        await deleteLocalMedia(url)
        return res.status(200).json({ success: true, message: 'Media deleted' })
      } catch (error) {
        return res.status(500).json({ error: 'Failed to delete media' })
      }
    }
  }

  if (section === 'revalidate') {
    return res.status(200).json({ success: true })
  }

  if (!isAuthenticated(req)) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  if (section === 'menus' && req.method === 'GET') {
    try {
      const response = await fetch(`${DJANGO_BASE_URL}/api/utils/main-menus/`, { cache: 'no-store' })
      if (!response.ok) {
        return res.status(response.status).json({ error: 'Failed to load menus' })
      }
      const data = await response.json()
      return res.status(200).json(data)
    } catch {
      return res.status(500).json({ error: 'Failed to load menus' })
    }
  }

  return proxyToBackend(req, res, pathSegments)
}

async function handleMissingAdminKey(req: NextApiRequest, res: NextApiResponse, pathSegments: string[]) {
  const method = req.method || 'GET'
  const [section, id, action] = pathSegments

  if (method === 'GET') {
    if (section === 'products') {
      if (id === 'options') {
        try {
          const [catRes, brandRes, tagRes] = await Promise.all([
            fetch(`${DJANGO_BASE_URL}/api/shop/categories-list/`),
            fetch(`${DJANGO_BASE_URL}/api/shop/brands-list/`),
            fetch(`${DJANGO_BASE_URL}/api/shop/tags-list/`)
          ])
          const categories = catRes.ok ? await catRes.json() : []
          const brands = brandRes.ok ? await brandRes.json() : []
          const tags = tagRes.ok ? await tagRes.json() : []
          
          return res.status(200).json({
            categories: categories.map((c: any, i: number) => ({ ...c, id: c.id || c.slug, numProducts: c.num_product })),
            brands: brands.map((b: any, i: number) => ({ ...b, id: b.id || b.slug, numProducts: b.num_product })),
            tags: tags.map((t: any, i: number) => ({ ...t, id: t.id || t.slug, numProducts: t.num_product }))
          })
        } catch (e) {
          return res.status(200).json({ categories: [], brands: [], tags: [] })
        }
      }
      if (id) {
        return res.status(404).json({ error: 'Not found' })
      }
      return res.status(200).json({ total: 0, page: 1, pageSize: 20, numPages: 0, items: [] })
    }

    if (section === 'brands' || section === 'categories' || section === 'tags') {
      if (id) {
        return res.status(404).json({ error: 'Not found' })
      }
      
      const endpointMap: Record<string, string> = {
        'brands': 'brands-list',
        'categories': 'categories-list',
        'tags': 'tags-list'
      }
      
      try {
        const response = await fetch(`${DJANGO_BASE_URL}/api/shop/${endpointMap[section]}/`)
        if (response.ok) {
          const data = await response.json()
          const items = data.map((item: any, idx: number) => ({
            ...item,
            id: item.id || item.slug,
            numProducts: item.num_product
          }))
          return res.status(200).json({ total: items.length, items })
        }
      } catch (err) {
        // Fallback below
      }
      return res.status(200).json({ total: 0, items: [] })
    }

    if (section === 'articles') {
      if (id === 'options') {
        return res.status(200).json({ categories: [], tags: [] })
      }
      if (id) {
        return res.status(404).json({ error: 'Not found' })
      }
      return res.status(200).json({ total: 0, page: 1, pageSize: 20, numPages: 0, items: [] })
    }

    if (section === 'article-categories') {
      if (id) {
        return res.status(404).json({ error: 'Not found' })
      }
      return res.status(200).json({ items: [] })
    }

    if (section === 'menus') {
      return res.status(200).json({ items: [] })
    }
  }

  if (section === 'content' && method === 'GET') {
    return res.status(200).json({ ...defaultContent })
  }

  if (section === 'auth') {
    if (method === 'GET') {
      return res.status(200).json({ authenticated: isAuthenticated(req) })
    }
    if (method === 'DELETE') {
      res.setHeader('Set-Cookie', clearCookie())
      return res.status(200).json({ success: true })
    }
    if (method === 'POST') {
      return res.status(503).json({ error: 'ADMIN_API_KEY is not configured on the Next.js server' })
    }
  }

  return res.status(503).json({ error: 'ADMIN_API_KEY is not configured on the Next.js server' })
}

async function parseRequestBody(req: NextApiRequest): Promise<any> {
  const contentType = String(req.headers['content-type'] || '')
  if (contentType.includes('application/json')) {
    const raw = await readRawBody(req)
    const text = raw.toString('utf-8').trim()
    return text ? JSON.parse(text) : {}
  }

  if (contentType.includes('multipart/form-data')) {
    const raw = await readRawBody(req)
    const parsedFiles = parseMultipart(raw, contentType)
    const fields: Record<string, string | string[]> = {}
    for (const file of parsedFiles) {
      if (!fields[file.fieldName]) {
        fields[file.fieldName] = file.filename
      } else if (Array.isArray(fields[file.fieldName])) {
        const existing = fields[file.fieldName]
        if (Array.isArray(existing)) {
          existing.push(file.filename)
        }
      } else {
        fields[file.fieldName] = [fields[file.fieldName] as string, file.filename]
      }
    }
    return fields
  }

  const raw = await readRawBody(req)
  const text = raw.toString('utf-8').trim()
  if (!text) return {}
  try {
    return JSON.parse(text)
  } catch {
    return {}
  }
}