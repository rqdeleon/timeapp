import React from 'react'
import { redirect } from 'next/navigation';

import { getServerSession, getServerUser } from '@/lib/utils/supabase/server';
import AdminPanelLayout from '@/components/admin-panel/admin-panel-layout'
import { Toaster } from "@/components/ui/sonner"

export const revalidate = 0;

export default async function Dashboardlayout({
  children,
}:{
  children: React.ReactNode
}) {
  
  // check for login user
  const { session } = await getServerSession();

  if (!session){
      redirect('login');
  }
  const user = await getServerUser();

  return (
    <AdminPanelLayout user={user.user}>
      {children}
      <Toaster  position="bottom-right" />
    </AdminPanelLayout>
  )
}
