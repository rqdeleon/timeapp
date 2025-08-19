"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AttendanceReportClient } from './components/client'
import { getAttendance } from '@/lib/report/getAttendance' 
import ReportGenerator from './components/report-generator'
import { AttendanceColumnProps } from './components/columns'
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle, Users, Clock, UserX, UserCheck, Zap, Calendar, TrendingUp } from "lucide-react"
import AttendanceSummaryCards from './components/summary-cards'
import AttendanceChart from './components/attendance-chart'

export default function AttendancePage() {
  const now = new Date()
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  
  const formatDate = (date: Date) => date.toISOString().split('T')[0]
  
  const [data, setData] = useState<AttendanceColumnProps[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [startDate, setStartDate] = useState<Date>(firstDay)
  const [endDate, setEndDate] = useState<Date>(lastDay)
  const [department, setDepartment] = useState<string>("all")

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const result = await getAttendance(
        formatDate(startDate),
        formatDate(endDate),
        department === "all" ? undefined : department
      )
      
      if (result) {
        setData(result)
      } else {
        setData([])
      }
    } catch (err) {
      console.error('Error fetching attendance data:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch attendance data')
      setData([])
    } finally {
      setLoading(false)
    }
  }, [startDate, endDate, department])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Calculate enhanced summary statistics
  const summaryStats = {
    totalEmployees: data.length,
    totalScheduledHours: data.reduce((sum, item) => sum + item.totalScheduledHours, 0),
    totalWorkedHours: data.reduce((sum, item) => sum + item.totalWorkedHours, 0),
    totalLateCount: data.reduce((sum, item) => sum + item.lateCount, 0),
    totalAbsences: data.reduce((sum, item) => sum + item.absences, 0),
    totalOvertimeHours: data.reduce((sum, item) => sum + item.overtimeHours, 0),
    totalScheduledDays: data.reduce((sum, item) => sum + item.scheduledDays, 0),
    totalWorkedDays: data.reduce((sum, item) => sum + item.workedDays, 0),
    totalUnscheduledWorkDays: data.reduce((sum, item) => sum + item.unscheduledWorkDays, 0),
  }

  // Additional calculated metrics
  const additionalMetrics = {
    attendanceRate: summaryStats.totalScheduledHours > 0 
      ? ((summaryStats.totalWorkedHours / summaryStats.totalScheduledHours) * 100).toFixed(1)
      : "0",
    productivityRate: summaryStats.totalScheduledDays > 0
      ? ((summaryStats.totalWorkedDays / summaryStats.totalScheduledDays) * 100).toFixed(1)
      : "0",
    avgOvertimePerEmployee: summaryStats.totalEmployees > 0
      ? (summaryStats.totalOvertimeHours / summaryStats.totalEmployees).toFixed(1)
      : "0",
    avgHoursPerEmployee: summaryStats.totalEmployees > 0
      ? (summaryStats.totalWorkedHours / summaryStats.totalEmployees).toFixed(1)
      : "0",
  }

  return (
    <main>
      <div className="flex-col">
        <div className="flex-1 space-y-6 p-8 pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Enhanced Attendance Report</h2>
              <p className="text-muted-foreground">
                Comprehensive analysis of employee attendance based on actual logs vs scheduled time
              </p>
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <ReportGenerator
            startDate={startDate}
            endDate={endDate}
            department={department}
            setStartDate={setStartDate}
            setEndDate={setEndDate}
            setDepartment={setDepartment}
            loading={loading}
            onGenerate={fetchData}
          />

          {!loading && data.length > 0 && (
            <>
              {/* Key Insights Banner */}
              <div className="grid gap-4 md:grid-cols-3">
                <Card className="border-l-4 border-l-blue-500">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-blue-500" />
                      Overall Performance
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Attendance Rate</p>
                      <p className="text-2xl font-bold text-blue-600">{additionalMetrics.attendanceRate}%</p>
                      <p className="text-xs text-muted-foreground">
                        {summaryStats.totalWorkedHours.toFixed(1)}h worked of {summaryStats.totalScheduledHours.toFixed(1)}h scheduled
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-orange-500">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Zap className="h-5 w-5 text-orange-500" />
                      Overtime Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Total Overtime</p>
                      <p className="text-2xl font-bold text-orange-600">{summaryStats.totalOvertimeHours.toFixed(1)}h</p>
                      <p className="text-xs text-muted-foreground">
                        Avg {additionalMetrics.avgOvertimePerEmployee}h per employee
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-green-500">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-green-500" />
                      Extra Work
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Unscheduled Work Days</p>
                      <p className="text-2xl font-bold text-green-600">{summaryStats.totalUnscheduledWorkDays}</p>
                      <p className="text-xs text-muted-foreground">
                        Work performed without prior scheduling
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <AttendanceSummaryCards stats={summaryStats} />
              
              <div className="grid gap-4 md:grid-cols-1">
                <Card>
                  <CardHeader>
                    <CardTitle>Attendance Analytics Dashboard</CardTitle>
                    <CardDescription>
                      Multi-dimensional analysis of attendance patterns and performance metrics
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pl-2">
                    <AttendanceChart data={data} />
                  </CardContent>
                </Card>
              </div>
            </>
          )}

          {!loading && data.length === 0 && !error && (
            <Card>
              <CardContent className="py-8">
                <div className="text-center">
                  <Users className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-semibold">No attendance data found</h3>
                  <p className="mt-2 text-muted-foreground">
                    No attendance records were found for the selected date range and department.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="py-4">
              <AttendanceReportClient data={data} loading={loading} />
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}