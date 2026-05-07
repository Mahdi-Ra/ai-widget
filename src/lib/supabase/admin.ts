import { createClient } from '@supabase/supabase-js'

export function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export const adminClient = {
  from: (table: string) => getAdminClient().from(table),
  rpc: (fn: string, args: Record<string, unknown>) => getAdminClient().rpc(fn, args),
}