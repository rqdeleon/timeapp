// app/dashboard/attendances/page.tsx
import React from 'react'
import { AttendanceClient } from './components/client'

export default function AttendancesPage() {
  return (
    <div className='min-h-screen bg-gray-50 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6'>
      <AttendanceClient />
    </div>
  )
}