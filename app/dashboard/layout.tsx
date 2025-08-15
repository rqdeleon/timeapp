import React from 'react'

import { AuthProvider } from '@/components/auth/auth-provider'
import AdminPanelLayout from '@/components/admin-panel/admin-panel-layout'
import { Toaster } from "@/components/ui/sonner"
import { ProtectedRoute } from '@/components/auth/protected-route'

export default async function Dashboardlayout({
  children,
}:{
  children: React.ReactNode
}) {
  // check for authentication redirect to login if no credentials
    
  return (
    <AuthProvider>
      <ProtectedRoute>
        <AdminPanelLayout>
          {children}
          <Toaster  position="bottom-right" />
        </AdminPanelLayout>
      </ProtectedRoute>
    </AuthProvider>
  )
}
