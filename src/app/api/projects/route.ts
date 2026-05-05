import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/app/lib/supabase/admin'

export async function POST(req: NextRequest) {
  const { name, userId } = await req.json()

  const { data, error } = await adminClient
    .from('projects')
    .insert({ name, user_id: userId })
    .select()
    .single()

  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json(data)
}

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId')

  const { data, error } = await adminClient
    .from('projects')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json(data)
}