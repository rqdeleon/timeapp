// app/dashboard/attendances/[employeeId]/page.tsx
"use client"

import React, { useState, useEffect } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { 
  ArrowLeft, 
  Download, 
  Calendar,
  Clock,
  Timer,
  Sun,
  Moon,
  User,
  Building2,
  CheckCircle,
  Edit,
  EyeIcon
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { DataTable } from '@/components/ui/table/data-table'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/components/ui/use-toast'
import { AttendanceFilters } from '../components/attendance-filters'
import { attendanceColumns } from '../components/columns'
import { 
  AttendanceLog, 
  AttendanceFilters as FilterType, 
  AttendanceSummary 
} from '@/types/attendance'
import { Employee } from '@/types'
import { getAttendanceSummary } from '@/lib/services/attendance-summary'
import Link from 'next/link'

export default function EmployeeAttendanceDetailPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const employeeId = params.employeeId as string
  const date = searchParams.get('date')
  
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [attendanceData, setAttendanceData] = useState<AttendanceLog[]>([])
  const [summary, setSummary] = useState<AttendanceSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<FilterType>({
    dateRange: {
      from: new Date(new Date(date).getFullYear(), new Date(date).getMonth(), 1),
      to: new Date()
    },
    departments: [],
    employees: [employeeId], // Pre-filter to this employee
    status: []
  })

  useEffect(() => {
    fetchData()
  }, [employeeId, filters])

  const fetchData = async () => {
    setLoading(true)
    try {
      // Fetch employee details and attendance records
      const [employeeRes, attendanceRes, summaryRes] = await Promise.all([
        fetch(`/api/employees/${employeeId}`),
        fetch(`/api/attendances?${new URLSearchParams({
          employeeId,
          startDate: filters.dateRange.from.toISOString(),
          endDate: filters.dateRange.to.toISOString(),
          ...filters.status.length > 0 && { status: filters.status.join(',') }
        })}`),
        getAttendanceSummary(filters)
      ])

      if (!employeeRes.ok) {
        throw new Error('Failed to fetch data')
      }

      const [employeeData, attendanceRecords, summaryData] = await Promise.all([
        employeeRes.json(),
        attendanceRes.json(),
        summaryRes
      ])

      setEmployee(employeeData)
      setAttendanceData(attendanceRecords.data || [])
      setSummary(summaryData)

    } catch (error) {
      console.error('Error fetching data:', error)
      toast({
        variant: 'destructive',
        description: 'Failed to load attendance data'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async () => {
    try {
      const response = await fetch(`/api/attendances/export?${new URLSearchParams({
        employeeId,
        startDate: filters.dateRange.from.toISOString(),
        endDate: filters.dateRange.to.toISOString(),
        format: 'csv'
      })}`)

      if (!response.ok) throw new Error('Export failed')

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${employee?.name || 'employee'}_attendance_${filters.dateRange.from.toISOString().split('T')[0]}_to_${filters.dateRange.to.toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)

      toast({
        description: 'Attendance data exported successfully'
      })
    } catch (error) {
      toast({
        variant: 'destructive',
        description: 'Failed to export data'
      })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="space-y-6">
          {/* Header Skeleton */}
          <div className="flex items-center space-x-4">
            <Skeleton className="h-10 w-10 rounded" />
            <div className="space-y-2">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-96" />
            </div>
          </div>

          {/* Employee Info Skeleton */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-4">
                <Skeleton className="h-16 w-16 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Summary Cards Skeleton */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="pt-6">
                  <Skeleton className="h-8 w-16 mb-2" />
                  <Skeleton className="h-4 w-20" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!employee) {
    return (
      <div className="min-h-screen bg-gray-50 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Employee not found
          </h3>
          <p className="text-gray-500 mb-4">
            The employee you're looking for doesn't exist or has been removed.
          </p>
          <Button onClick={() => router.push('/dashboard/attendances')}>
            Back to Attendances
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h2 className="text-2xl font-bold tracking-tight">
                Employee Attendance Details
              </h2>
              <p className="text-muted-foreground">
                View detailed attendance records for {employee.name}
              </p>
            </div>
          </div>
          <Button onClick={handleExport} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
        </div>

        {/* Employee Info Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={employee.avatar_url || ''} alt={employee.name} />
                <AvatarFallback className="text-lg">
                  {employee.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-1">        
                  <Link
                    href={`/dashboard/employees/${employee.id}`}
                    className="hover:underline"
                  >
                    <h3 className="text-xl font-semibold flex items-center">{employee.name}</h3>
                  </Link>                  
                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    {employee.position}
                  </div>
                  <div className="flex items-center gap-1">
                    <Building2 className="h-4 w-4" />
                    {employee.department?.name}
                  </div>
                  <div className="flex items-center gap-1">
                    <Badge 
                      className={
                        employee.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }
                    >
                      {employee.status}
                    </Badge>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Employee ID: {employee.employee_id || employee.user_id} • {employee.email || "no email set"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Date Range Filter */}
        <AttendanceFilters 
          filters={filters} 
          onFiltersChange={setFilters}
        />

        {/* Summary Cards */}
        {summary && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Days Worked</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {summary.total_days_worked}
                </div>
                <p className="text-xs text-muted-foreground">
                  in selected period
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
                <Clock className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {summary.total_hours_worked?.toFixed(1)}h
                </div>
                <p className="text-xs text-muted-foreground">
                  regular work hours
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Overtime</CardTitle>
                <Timer className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {summary.total_overtime_hours?.toFixed(1)}h
                </div>
                <p className="text-xs text-muted-foreground">
                  {summary.total_approved_overtime?.toFixed(1)}h approved
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Sunday Hours</CardTitle>
                <Sun className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">
                  {summary.total_sunday_hours?.toFixed(1)}h
                </div>
                <p className="text-xs text-muted-foreground">
                  weekend work
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Overnight</CardTitle>
                <Moon className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {summary.total_overnight_hours?.toFixed(1)}h
                </div>
                <p className="text-xs text-muted-foreground">
                  night shift hours
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Attendance Records Table */}
        <Card>
          <CardHeader>
            <CardTitle>Attendance Records</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={attendanceColumns}
              data={attendanceData}
              searchKey={{ label: 'Date', key: 'date' }}
              filter={{
                column: 'approval_status',
                label: 'Status',
                options: [
                  { value: 'pending', label: 'Pending' },
                  { value: 'approved', label: 'Approved' },
                  { value: 'rejected', label: 'Rejected' }
                ]
              }}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}