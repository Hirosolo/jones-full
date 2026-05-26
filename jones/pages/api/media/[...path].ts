import type { NextApiRequest, NextApiResponse } from 'next'

const DJANGO_BASE_URL =
  process.env.DJANGO_BASE_URL ||
  process.env.NEXT_PUBLIC_DJANGO_BASE_URL ||
  'http://127.0.0.1:8000'

const ALLOWED_METHODS = ['GET', 'HEAD', 'OPTIONS']

function buildBackendMediaUrl(pathSegments: string[] | undefined): string {
  const pathname = `/media/${(pathSegments || []).map(encodeURIComponent).join('/')}`
  return new URL(pathname, DJANGO_BASE_URL).toString()
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!ALLOWED_METHODS.includes(req.method || 'GET')) {
    res.setHeader('Allow', ALLOWED_METHODS)
    return res.status(405).json({ detail: 'Method not allowed' })
  }

  const pathSegments = Array.isArray(req.query.path) ? req.query.path : []
  const backendUrl = buildBackendMediaUrl(pathSegments)

  try {
    const backendResponse = await fetch(backendUrl, {
      method: req.method,
      headers: {
        Accept: req.headers.accept || '*/*',
      },
    })

    res.status(backendResponse.status)

    const contentType = backendResponse.headers.get('content-type')
    if (contentType) {
      res.setHeader('Content-Type', contentType)
    }

    const cacheControl = backendResponse.headers.get('cache-control')
    if (cacheControl) {
      res.setHeader('Cache-Control', cacheControl)
    }

    if (req.method === 'HEAD') {
      return res.end()
    }

    const body = Buffer.from(await backendResponse.arrayBuffer())
    return res.send(body)
  } catch {
    return res.status(502).json({ detail: 'Failed to proxy media file' })
  }
}