import { NextResponse } from 'next/server'

const BASE = 'https://openseadragon.github.io/example-images/highsmith'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params
  const filePath = path.join('/')

  if (filePath.includes('..')) {
    return NextResponse.json({ error: 'Invalid path' }, { status: 400 })
  }

  const url = `${BASE}/${filePath}`
  const upstream = await fetch(url, { next: { revalidate: 86400 } })

  if (!upstream.ok) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const contentType = upstream.headers.get('content-type') ?? 'application/octet-stream'
  const body = await upstream.arrayBuffer()

  return new NextResponse(body, {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=86400',
    },
  })
}
