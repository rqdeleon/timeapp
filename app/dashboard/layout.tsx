import React from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { redirect } from 'next/navigation'

import { AuthProvider } from '@/components/auth/auth-provider'
import AdminPanelLayout from '@/components/ui/admin-panel/admin-panel-layout'

export default async function Dashboardlayout({
  children,
}:{
  children: React.ReactNode
}) {
  // check for authentication redirect to login if no credentials
    
  return (
    <AuthProvider>
      <AdminPanelLayout>
        {children}
      </AdminPanelLayout>
    </AuthProvider>
  )
}
