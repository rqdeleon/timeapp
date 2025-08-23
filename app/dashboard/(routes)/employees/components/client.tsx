"use client"

import React from 'react'
import { Plus, Users, UserCheck, UserX } from 'lucide-react'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { employeeColumns } from './columns'
import { EmployeeColumnProps } from '@/types'
import { DataTable } from '@/components/ui/table/data-table'
import { Badge } from '@/components/ui/badge'

interface EmployeeClientProps {
  data: EmployeeColumnProps[]
  departments?: { value: string; label: string }[]
}

export const EmployeeClient: React.FC<EmployeeClientProps> = ({
  data,
  departments
}) => {
  const router = useRouter()


  // Calculate statistics
  const totalEmployees = data.length
  const activeEmployees = data.filter(emp => emp.status === 'active').length
  const inactiveEmployees = data.filter(emp => emp.status === 'inactive').length
  const onLeaveEmployees = data.filter(emp => emp.status === 'on_leave').length

  // Status filter options for the data table
  const statusOptions = [
    {
      value: "active",
      label: "Active",
    },
    {
      value: "inactive", 
      label: "Inactive",
    },
    {
      value: "on_leave",
      label: "On Leave",
    },
    {
      value: "terminated",
      label: "Terminated",
    }
  ]

  return (
    <div className="space-y-6">
      {/* Header with Add Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Employees</h2>
          <p className="text-muted-foreground">
            Manage your organization's employees and their information.
          </p>
        </div>
        <Button
          onClick={() => router.push(`/dashboard/employees/new`)}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Employee
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Employees
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEmployees}</div>
            <p className="text-xs text-muted-foreground">
              All registered employees
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Employees
            </CardTitle>
            <UserCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeEmployees}</div>
            <p className="text-xs text-muted-foreground">
              Currently working
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              On Leave
            </CardTitle>
            <UserX className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{onLeaveEmployees}</div>
            <p className="text-xs text-muted-foreground">
              Temporarily away
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Inactive
            </CardTitle>
            <UserX className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{inactiveEmployees}</div>
            <p className="text-xs text-muted-foreground">
              Not currently active
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Data Table */}
      <Card>
        <CardContent className="p-6">
          <DataTable 
            columns={employeeColumns} 
            data={data} 
            searchKey={{ label: 'Employee', key: 'name' }} 
            filter={{
              column: 'status',
              label: 'Status',
              options: statusOptions
            }}
          />
        </CardContent>
      </Card>
    </div>
  )
}