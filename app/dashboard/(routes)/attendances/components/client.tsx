"use client"

import React, { useState, useEffect } from 'react'
import { Plus, Upload, Download, CheckCircle, BarChart3 } from 'lucide-react'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { DataTable } from '@/components/ui/table/data-table'
import { useToast } from '@/components/ui/use-toast'
import { AttendanceSummaryCards } from './attendance-summary-cards'
import { AttendanceFilters } from './attendance-filters'
import { AttendanceCharts } from './attendance-charts'
// import { UploadDialog } from './upload-dialog'
import { BulkApproveDialog } from './bulk-approve-dialog'
import { attendanceColumns } from './columns'
import { 
  getAttendanceRecords,  
} from '@/lib/services/attendance-services'
import { getAttendanceSummary } from '@/lib/services/attendance-summary'
import { 
  AttendanceLog, 
  AttendanceFilters as FilterType, 
  AttendanceSummary 
} from '@/types/attendance'

export const AttendanceClient = () => {
  const router = useRouter()
  const { toast } = useToast()
  
  const [data, setData] = useState<AttendanceLog[]>([])
  const [summary, setSummary] = useState<AttendanceSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedRows, setSelectedRows] = useState<AttendanceLog[]>([])
  const [showCharts, setShowCharts] = useState(false)
  
  const [filters, setFilters] = useState<FilterType>({
    dateRange: {
      from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      to: new Date()
    },
    departments: [],
    employees: [],
    status: []
  })

  // Mock chart data - replace with actual API calls
  const [chartData, setChartData] = useState({
    trendData: [
      { date: '2024-01-01', totalHours: 160, overtimeHours: 12, employees: 25 },
      { date: '2024-01-02', totalHours: 168, overtimeHours: 8, employees: 26 },
      { date: '2024-01-03', totalHours: 172, overtimeHours: 15, employees: 27 },
      { date: '2024-01-04', totalHours: 155, overtimeHours: 5, employees: 24 },
      { date: '2024-01-05', totalHours: 180, overtimeHours: 20, employees: 28 },
    ],
    departmentData: [
      { department: 'Engineering', totalHours: 320, overtimeHours: 25, employees: 12 },
      { department: 'Marketing', totalHours: 280, overtimeHours: 15, employees: 10 },
      { department: 'Sales', totalHours: 240, overtimeHours: 10, employees: 8 },
      { department: 'HR', totalHours: 160, overtimeHours: 5, employees: 6 },
    ]
  })
  
  const fetchData = async () => {
    setLoading(true)
    try {
      const [recordsData, summaryData] = await Promise.all([
        getAttendanceRecords(filters),
        getAttendanceSummary(filters)
      ])

      // fix for search key *employeeName
      const nw = recordsData.data
      const newRecordsData = nw.map((record)=>{
        return {
          employeeName: record.employee?.name,
          ...record
        }
      })

      setData(newRecordsData)
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
  
  useEffect(() => {
    fetchData()
  }, [filters])

  const handleExport = async () => {
    try {
      const queryParams = new URLSearchParams({
        startDate: filters.dateRange.from.toISOString(),
        endDate: filters.dateRange.to.toISOString(),
        format: 'csv'
      })

      if (filters.departments.length > 0) {
        queryParams.append('departments', filters.departments.join(','))
      }
      if (filters.employees.length > 0) {
        queryParams.append('employees', filters.employees.join(','))
      }

      const response = await fetch(`/api/attendances/export?${queryParams}`)
      
      if (!response.ok) throw new Error('Export failed')

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `attendance_export_${new Date().toISOString().split('T')[0]}.csv`
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

  const handleBulkApprovalComplete = () => {
    fetchData()
    setSelectedRows([])
  }

  // Enhanced columns with row selection handling
  const enhancedColumns = React.useMemo(() => {
    return attendanceColumns.map(col => {
      if (col.id === 'select') {
        return {
          ...col,
          header: ({ table }: any) => (
            <input
              type="checkbox"
              checked={table.getIsAllPageRowsSelected()}
              onChange={(e) => {
                table.toggleAllPageRowsSelected(e.target.checked)
                if (e.target.checked) {
                  setSelectedRows(data)
                } else {
                  setSelectedRows([])
                }
              }}
            />
          ),
          cell: ({ row }: any) => (
            <input
              type="checkbox"
              checked={selectedRows.some(r => r.id === row.original.id)}
              onChange={(e) => {
                if (e.target.checked) {
                  setSelectedRows(prev => [...prev, row.original])
                } else {
                  setSelectedRows(prev => prev.filter(r => r.id !== row.original.id))
                }
              }}
            />
          )
        }
      }
      return col
    })
  }, [data, selectedRows])

  const hasOvertimeSelected = selectedRows.some(record => 
    record.raw_ot_hours && record.raw_ot_hours > 0
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Attendance Management</h2>
          <p className="text-muted-foreground">
            Track and manage employee attendance records and overtime approvals
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => setShowCharts(!showCharts)}
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            {showCharts ? 'Hide Charts' : 'Show Charts'}
          </Button>
          {/* <UploadDialog onUploadComplete={fetchData} /> */}
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Filters */}
      <AttendanceFilters filters={filters} onFiltersChange={setFilters} />

      {/* Summary Cards */}
      <AttendanceSummaryCards summary={summary} loading={loading} />

      {/* Charts Section */}
      {showCharts && (
        <Card>
          <CardContent className="p-6">
            <AttendanceCharts 
              trendData={chartData.trendData}
              departmentData={chartData.departmentData}
              loading={loading}
            />
          </CardContent>
        </Card>
      )}

      {/* Bulk Actions */}
      {selectedRows.length > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium">
                  {selectedRows.length} record{selectedRows.length !== 1 ? 's' : ''} selected
                </span>
                {hasOvertimeSelected && (
                  <span className="text-xs text-muted-foreground">
                    {selectedRows.filter(r => r.raw_ot_hours && r.raw_ot_hours > 0).length} with overtime
                  </span>
                )}
              </div>
              <div className="flex space-x-2">
                {hasOvertimeSelected && (
                  <BulkApproveDialog 
                    selectedRecords={selectedRows}
                    onApprovalComplete={handleBulkApprovalComplete}
                  >
                    <Button size="sm">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Bulk Approve
                    </Button>
                  </BulkApproveDialog>
                )}
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => setSelectedRows([])}
                >
                  Clear Selection
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Data Table */}
      <Card>
        <CardContent className="p-6">
          {loading ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="animate-pulse h-10 bg-gray-200 rounded w-64"></div>
                <div className="animate-pulse h-10 bg-gray-200 rounded w-32"></div>
              </div>
              <div className="border rounded-md">
                <div className="h-12 border-b bg-gray-50 animate-pulse"></div>
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className="h-16 border-b animate-pulse">
                    <div className="flex items-center h-full px-4 space-x-4">
                      <div className="h-4 bg-gray-200 rounded w-4"></div>
                      <div className="h-4 bg-gray-200 rounded w-32"></div>
                      <div className="h-4 bg-gray-200 rounded w-24"></div>
                      <div className="h-4 bg-gray-200 rounded w-20"></div>
                      <div className="h-4 bg-gray-200 rounded w-20"></div>
                      <div className="h-4 bg-gray-200 rounded w-16"></div>
                      <div className="h-4 bg-gray-200 rounded w-16"></div>
                      <div className="h-4 bg-gray-200 rounded w-20"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <DataTable 
              columns={attendanceColumns}
              data={data}
              searchKey={{ label: 'Employee', key: 'employeeName' }}
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
          )}
        </CardContent>
      </Card>

      {/* Empty State */}
      {!loading && data.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="mx-auto w-48 text-gray-400 mb-4">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15l-5-5 1.41-1.41L11 14.17l7.59-7.59L20 8l-9 9z"/>
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No attendance records found
            </h3>
            <p className="text-gray-500 mb-6 max-w-sm mx-auto">
              There are no attendance records for the selected date range and filters. 
              Upload attendance data to get started.
            </p>
            {/* <UploadDialog onUploadComplete={fetchData}>
              <Button>
                <Upload className="h-4 w-4 mr-2" />
                Upload Attendance Data
              </Button>
            </UploadDialog> */}
          </CardContent>
        </Card>
      )}

      {/* Quick Stats Footer */}
      {!loading && data.length > 0 && (
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-lg font-semibold text-blue-700">
                  {data.filter(r => r.approval_status === 'pending').length}
                </div>
                <div className="text-xs text-blue-600">Pending Approval</div>
              </div>
              <div>
                <div className="text-lg font-semibold text-green-700">
                  {data.filter(r => r.approval_status === 'approved').length}
                </div>
                <div className="text-xs text-green-600">Approved</div>
              </div>
              <div>
                <div className="text-lg font-semibold text-orange-700">
                  {data.filter(r => r.raw_ot_hours && r.raw_ot_hours > 0).length}
                </div>
                <div className="text-xs text-orange-600">With Overtime</div>
              </div>
              <div>
                <div className="text-lg font-semibold text-purple-700">
                  {data.filter(r => r.check_out_time).length}
                </div>
                <div className="text-xs text-purple-600">Incomplete</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}