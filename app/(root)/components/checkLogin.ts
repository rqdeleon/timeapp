import React from 'react'
import { supabase } from '@/lib/supabase'

const checkLogin = async () => {
  const { data: { user} } = await supabase.auth.getUser()
  return !user ? false: true
}

export default checkLogin