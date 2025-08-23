// utils/supabase/client.ts
import { createClient } from "@supabase/supabase-js"

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function getClientUser() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if( !user ){ return false }
  
  return user
}