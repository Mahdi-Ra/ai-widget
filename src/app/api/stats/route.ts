import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const projectId = req.nextUrl.searchParams.get('projectId')

  const { count: conversations } = await adminClient
    .from('conversations')
    .select('*', { count: 'exact', head: true })
    .eq('project_id', projectId)

  const { count: chunks } = await adminClient
    .from('chunks')
    .select('*', { count: 'exact', head: true })
    .eq('project_id', projectId)

  return NextResponse.json({ conversations: conversations || 0, chunks: chunks || 0 })
}