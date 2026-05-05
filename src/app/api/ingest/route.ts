import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/app/lib/supabase/admin'
import { embedText, chunkText } from '@/app/lib/rag'

export const maxDuration = 60 
async function ingestChunks(projectId: string, text: string, source: string) {
  const chunks = chunkText(text)
  console.log('Chunks count:', chunks.length)
  console.log('First chunk:', chunks[0]?.substring(0, 100))

  let saved = 0
  for (const chunk of chunks) {
    try {
      const embedding = await embedText(chunk)
      const { error } = await adminClient.from('chunks').insert({
        project_id: projectId,
        content: chunk,
        embedding,
        source,
      })
      if (error) {
        console.error('Insert error:', error)
      } else {
        saved++
      }
    } catch (e) {
      console.error('Chunk error:', e)
    }
  }

  console.log('Saved chunks:', saved)
  return saved
}

// متن ساده
async function handleText(projectId: string, text: string, source: string) {
  return await ingestChunks(projectId, text, source)
}

// PDF
async function handlePdf(projectId: string, file: File) {
  const buffer = Buffer.from(await file.arrayBuffer())
  const pdfParse = require('pdf-parse')
  const data = await pdfParse(buffer)
  return await ingestChunks(projectId, data.text, file.name)
}

// URL
async function handleUrl(projectId: string, url: string) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 15000)

  const res = await fetch(url, {
    signal: controller.signal,
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1)'
    }
  })
  clearTimeout(timeout)

  const html = await res.text()
  const cheerio = await import('cheerio')
  const $ = cheerio.load(html)

  $('script, style, nav, footer, header, aside, noscript').remove()

  // همه متن body رو بگیر
  let text = $('body').text().replace(/\s+/g, ' ').trim()

  // اگه body خالی بود، کل HTML رو امتحان کن
  if (text.length < 100) {
    text = $.root().text().replace(/\s+/g, ' ').trim()
  }

  console.log('URL text length:', text.length)
  console.log('URL text preview:', text.substring(0, 200))

  if (text.length < 50) {
    throw new Error('Could not extract text from this URL. The page may require JavaScript to load.')
  }

  if (text.length > 8000) text = text.substring(0, 8000)

  return await ingestChunks(projectId, text, url)
}

export async function POST(req: NextRequest) {
  const contentType = req.headers.get('content-type') || ''

  // اگه فرم‌دیتا بود (PDF)
  if (contentType.includes('multipart/form-data')) {
    const formData = await req.formData()
    const projectId = formData.get('projectId') as string
    const file = formData.get('file') as File

    if (!projectId || !file) {
      return NextResponse.json({ error: 'projectId and file required' }, { status: 400 })
    }

    const count = await handlePdf(projectId, file)
    return NextResponse.json({ success: true, chunks: count, type: 'pdf' })
  }

  // اگه JSON بود (متن یا URL)
  const body = await req.json()
  const { projectId, text, source, url } = body

  if (!projectId) {
    return NextResponse.json({ error: 'projectId required' }, { status: 400 })
  }

  if (url) {
    const count = await handleUrl(projectId, url)
    return NextResponse.json({ success: true, chunks: count, type: 'url' })
  }

  if (text) {
    const count = await handleText(projectId, text, source || 'manual')
    return NextResponse.json({ success: true, chunks: count, type: 'text' })
  }

  return NextResponse.json({ error: 'text or url required' }, { status: 400 })
}