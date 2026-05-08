import { adminClient } from './supabase/admin'
import { openai } from './openai'

// تبدیل متن به embedding
export async function embedText(text: string): Promise<number[]> {
  const res = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  })
  return res.data[0].embedding
}

// جستجوی مرتبط‌ترین چانک‌ها
export async function searchChunks(projectId: string, query: string) {
  const embedding = await embedText(query)

  const { data } = await adminClient.rpc('match_chunks', {
    query_embedding: embedding,
    match_project_id: projectId,
    match_count: 5,
  })

  return data || []
}

// تقطیع متن به چانک‌های کوچک
export function chunkText(text: string, size = 500): string[] {
  if (!text || text.trim().length === 0) return []

  // نرمال‌سازی فاصله‌ها
  const normalized = text.replace(/\s+/g, ' ').trim()

  // اگه متن کوچیکتر از size بود، همونطور برگردون
  if (normalized.length <= size) return [normalized]

  const chunks: string[] = []
  let start = 0

  while (start < normalized.length) {
    let end = start + size

    if (end >= normalized.length) {
      chunks.push(normalized.slice(start).trim())
      break
    }

    // سعی کن روی فاصله برش بزنه
    const spaceIndex = normalized.lastIndexOf(' ', end)
    if (spaceIndex > start) end = spaceIndex

    const chunk = normalized.slice(start, end).trim()
    if (chunk.length > 0) chunks.push(chunk)
    start = end + 1
  }

  return chunks
}