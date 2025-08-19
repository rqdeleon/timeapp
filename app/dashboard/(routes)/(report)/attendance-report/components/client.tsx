"use client"

import React from 'react'
import { useParams, useRouter } from 'next/navigation'

import { AttendanceColumnProps, columns } from './columns'
import { DataTable } from '@/components/ui/table/data-table'
import { Skeleton } from '@/components/ui/skeleton'

interface AttendanceClientProps {
  data: AttendanceColumnProps[]
  loading?: boolean
}

export const AttendanceReportClient: React.FC<AttendanceClientProps> = ({
  data,
  loading = false
}) => {
  const router = useRouter()
  const params = useParams()

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-[200px]" />
          <Skeleton className="h-8 w-[100px]" />
        </div>
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    )
  }

  const departmentOptions = Array.from(
    new Set(data.map(item => item.department).filter(Boolean))
  ).map(dept => ({
    value: dept,
    label: dept
  }))

  return (
    <>
      <DataTable 
        columns={columns} 
        data={data} 
        searchKey={{ label: 'Name', key: 'name' }} 
        filter={departmentOptions.length > 1 ? {
          column: 'department',
          label: 'Department',
          options: departmentOptions
        } : undefined}
      />
    </>
  )
}