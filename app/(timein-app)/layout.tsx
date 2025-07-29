import React from 'react'

import { AuthProvider } from '@/components/auth/auth-provider'

export default async function TimeinAppLayout({children}:{ children: React.ReactNode}) {
  return (
    <AuthProvider>{children}</AuthProvider>
  )
}
