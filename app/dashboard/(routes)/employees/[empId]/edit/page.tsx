"use client"

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { EmployeeForm } from '../../components/employee-form'
import { 
  getEmployeeById,
  getAllDepartments,
  getPotentialManagers,
  updateEmployee
} from '@/lib/services/employee-services'
import { Employee, Department, EmployeeFormData } from '@/types'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

export default function EditEmployeePage() {
  const params = useParams()
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [departments, setDepartments] = useState<Department[]>([])
  const [managers, setManagers] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        if (typeof params.empId === 'string') {
          const [employeeData, departmentsData, managersData] = await Promise.all([
            getEmployeeById(params.empId),
            getAllDepartments(),
            getPotentialManagers()
          ])
          
          if (!employeeData) {
            setError('Employee not found')
            return
          }
          
          setEmployee(employeeData)
          setDepartments(departmentsData)
          // Filter out the current employee from potential managers
          setManagers(managersData.filter(manager => manager.id !== employeeData.id))
        }
        
      } catch (err) {
        console.error('Error fetching data:', err)
        setError('Failed to load employee data. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [params.id])

  const handleSubmit = async (data: EmployeeFormData) => {
    if (!employee) return
    await updateEmployee(employee.id, data)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Skeleton className="h-8 w-8" />
            <div className="space-y-2">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-96" />
            </div>
          </div>
        </div>

        {/* Form Skeleton - Same as New Employee Page */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-center">
                <Skeleton className="h-24 w-24 rounded-full" />
              </div>
              <div className="flex justify-center space-x-2">
                <Skeleton className="h-9 w-20" />
                <Skeleton className="h-9 w-20" />
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent className="space-y-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (error || !employee) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {error || 'Employee not found'}
          </h3>
          <p className="text-gray-500 mb-4">
            {error === 'Employee not found' 
              ? 'The employee you are trying to edit does not exist.'
              : 'Failed to load employee data. Please try again.'
            }
          </p>
          <button
            onClick={() => window.history.back()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <EmployeeForm
      initialData={employee}
      departments={departments}
      managers={managers}
      onSubmit={handleSubmit}
    />
  )
}