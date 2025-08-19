// app/dashboard/employees/page.tsx
"use client"

import { useEffect, useState } from 'react'
import { EmployeeClient } from './components/client'
import { getAllEmployees, getAllDepartments } from '@/lib/services/employee-services'
import { EmployeeColumnProps } from '@/types'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<EmployeeColumnProps[]>([])
  const [departments, setDepartments] = useState<{ value: string; label: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const [employeesData, departmentsData] = await Promise.all([
          getAllEmployees(),
          getAllDepartments()
        ])

        const payload = employeesData.map((emp)=>({
          id: emp.id,
          employee_id: emp.employee_id || "",
          user_id: emp.user_id || "",
          name: emp.name,
          email: emp.email || "",
          phone: emp.phone || "",
          position: emp.position || "",
          department: emp.department?.name,
          salary: emp.salary,
          hire_date: emp.hire_date || "",
          status: emp.status,
          avatar_url: emp.avatar_url || "",
      }));

        setEmployees(payload)
        setDepartments(departmentsData.map(dept => ({
          value: dept.name,
          label: dept.name
        })))
        
      } catch (err) {
        console.error('Error fetching data:', err)
        setError('Failed to load employee data. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>

        {/* Stats Cards Skeleton */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between space-y-0 pb-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-4" />
                </div>
                <Skeleton className="h-8 w-12" />
                <Skeleton className="h-3 w-24 mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Table Skeleton */}
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex gap-4">
                <Skeleton className="h-10 w-64" />
                <Skeleton className="h-10 w-32" />
                <Skeleton className="h-10 w-32" />
              </div>
              <div className="border rounded-md">
                <div className="border-b p-4">
                  <div className="flex space-x-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <Skeleton key={i} className="h-4 w-24" />
                    ))}
                  </div>
                </div>
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="border-b p-4 last:border-b-0">
                    <div className="flex space-x-4 items-center">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      {Array.from({ length: 5 }).map((_, j) => (
                        <Skeleton key={j} className="h-4 w-20" />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Failed to load employees
          </h3>
          <p className="text-gray-500 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-gray-50 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6'>
      <EmployeeClient 
        data={employees} 
        departments={departments}
      />
    </div>
  )
}