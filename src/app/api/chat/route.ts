import { NextRequest, NextResponse } from 'next/server'
import { searchChunks } from '@/app/lib/rag'
import { openai } from '@/app/lib/openai'
import { adminClient } from '@/app/lib/supabase/admin'

export async function POST(req: NextRequest) {
  const { projectId, message, conversationId, lang } = await req.json()

  if (!projectId || !message) {
    return NextResponse.json({ error: 'projectId and message required' }, { status: 400 })
  }

  // پیدا کردن مرتبط‌ترین چانک‌ها
  const chunks = await searchChunks(projectId, message)
  const context = chunks.map((c: any) => c.content).join('\n\n')

  // گرفتن تاریخچه مکالمه
  let history: any[] = []
  let convId = conversationId

  if (convId) {
    const { data } = await adminClient
      .from('conversations')
      .select('messages')
      .eq('id', convId)
      .single()
    if (data) history = data.messages
  }

  // ساخت پاسخ با GPT-4o-mini
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `You are a helpful AI assistant. Answer questions ONLY based on the context below. If the answer is not in the context, say you don't know. Always respond in the same language the user is writing in (detected language hint: ${lang || 'en'}).

Context:
${context}`,
      },
      ...history,
      { role: 'user', content: message },
    ],
    max_tokens: 500,
  })

  const reply = response.choices[0].message.content

  // ذخیره مکالمه
  const updatedMessages = [
    ...history,
    { role: 'user', content: message },
    { role: 'assistant', content: reply },
  ]

  if (convId) {
    await adminClient
      .from('conversations')
      .update({ messages: updatedMessages })
      .eq('id', convId)
  } else {
    const { data } = await adminClient
      .from('conversations')
      .insert({ project_id: projectId, messages: updatedMessages })
      .select()
      .single()
    convId = data?.id
  }

  return NextResponse.json({ reply, conversationId: convId })
}