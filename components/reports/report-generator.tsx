"use client"

import { AlertTriangle } from "lucide-react" // Import AlertTriangle
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Download } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { Schedule } from "@/types"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table" // Import Table components
import { GetAttendanceReport, GetSchedulesByDate } from "@/lib/reportService"

export function ReportGenerator() {
  const [reportType, setReportType] = useState<string>("employee_hours")
  const [reportReady, setReportReady] = useState<boolean>(false)
  const [startDate, setStartDate] = useState<string>("")
  const [endDate, setEndDate] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [reportData, setReportData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const handleGenerateReport = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setReportData(null)
    setError(null)
    setReportReady(false) 
    
    if (!startDate || !endDate) {
      setError("Please select both start and end dates.")
      setLoading(false)
      return
    }

    try {
      if (reportType === "employee_hours") {
        const { data: schedules, error: schedulesError } = await supabase
          .from("schedules")
          .select(`
            *,
            employees:employee_id(name, position, department)
          `)
          .gte("date", startDate)
          .lte("date", endDate)
          .eq("status", "confirmed") // Only count confirmed shifts

        if (schedulesError) throw schedulesError

        const employeeHours: { [key: string]: { name: string; position: string; department: string; hours: number } } =
          {}

        schedules.forEach((schedule) => {
          const employeeName = schedule.employees?.name || "Unknown"
          const employeePosition = schedule.employees?.position || "N/A"
          const employeeDepartment = schedule.employees?.department || "N/A"

          const start = new Date(`2000-01-01T${schedule.start_time}`)
          const end = new Date(`2000-01-01T${schedule.end_time}`)
          let hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60)
          if (hours < 0) hours += 24 // Handle overnight shifts
          if (isNaN(hours)) hours = 0

          if (!employeeHours[employeeName]) {
            employeeHours[employeeName] = {
              name: employeeName,
              position: employeePosition,
              department: employeeDepartment,
              hours: 0,
            }
          }
          employeeHours[employeeName].hours += hours
        })

        setReportData(Object.values(employeeHours).sort((a, b) => b.hours - a.hours))
        setReportReady(true)

      } else if (reportType === "attendance_summary") {
        const data = await GetAttendanceReport(startDate, endDate)

        setReportData(Object.values(data).sort((a, b) => b.total - a.total))
        setReportReady(true)

      }else if (reportType === "schedule_report") {
        const data = await GetSchedulesByDate(startDate, endDate)

        setReportData(Object.values(data))
        setReportReady(true)

      }
       else if (reportType === "salary_overview") {
        const { data: employees, error: employeesError } = await supabase
          .from("employees")
          .select("name, position, department, salary")
          .not("salary", "is", null)
          .order("name")

        if (employeesError) throw employeesError

        setReportData(employees || [])
        setReportReady(true)
      }
    } catch (err) {
      console.error("Error generating report:", err)
      setError("Failed to generate report. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const downloadReport = () => {
    if (!reportData) return

    let csvContent = ""
    let filename = "report.csv"

    if (reportType === "employee_hours") {
      csvContent = "Employee Name,Position,Department,Total Hours\n"
      reportData.forEach((row: any) => {
        csvContent += `${row.name},${row.position},${row.department},${row.hours.toFixed(2)}\n`
      })
      filename = "employee_hours_report.csv"
    } else if (reportType === "attendance_summary") {
      csvContent = "Employee Name,Total Shifts,Confirmed,No-Show,Pending\n"
      reportData.forEach((row: any) => {
        csvContent += `${row.name},${row.total},${row.confirmed},${row.noShow},${row.pending}\n`
      })
      filename = "attendance_summary_report.csv"
    } else if (reportType === "salary_overview") {
      csvContent = "Employee Name,Position,Department,Salary\n"
      reportData.forEach((row: any) => {
        csvContent += `${row.name},${row.position},${row.department},${row.salary?.toFixed(2) || "N/A"}\n`
      })
      filename = "salary_overview_report.csv"
    }

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob)
      link.setAttribute("href", url)
      link.setAttribute("download", filename)
      link.style.visibility = "hidden"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleGenerateReport} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
        <div className="space-y-2">
          <Label htmlFor="report-type">Report Type</Label>
          <Select value={reportType} onValueChange={(value)=>{
            setReportType(value)
            setReportReady(false)
          }} disabled={loading}>
            <SelectTrigger id="report-type">
              <SelectValue placeholder="Select a report type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="employee_hours">Employee Hours Summary</SelectItem>
              <SelectItem value="attendance_summary">Attendance Summary</SelectItem>
              <SelectItem value="schedule_report">Schedule Report</SelectItem>
              <SelectItem value="salary_overview">Salary Overview</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="start-date">Start Date</Label>
          <Input
            id="start-date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
            disabled={loading}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="end-date">End Date</Label>
          <Input
            id="end-date"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            required
            disabled={loading}
          />
        </div>
        <div className="md:col-span-3 flex justify-end">
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Generate Report
          </Button>
        </div>
      </form>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4 flex items-center gap-2 text-red-800">
            <AlertTriangle className="w-5 h-5" />
            <p>{error}</p>
          </CardContent>
        </Card>
      )}

      {reportReady && reportData  && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Generated Report</CardTitle>
              <CardDescription>
                Data for {reportType.replace(/_/g, " ")} from {startDate} to {endDate}
              </CardDescription>
            </div>
            <Button onClick={downloadReport} className="flex items-center gap-2">
              <Download className="w-4 h-4" /> Download CSV
            </Button>
          </CardHeader>
          <CardContent>
            {reportType === "employee_hours" && (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee Name</TableHead>
                      <TableHead>Position</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Total Hours</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData.map((row: any, index: number) => (
                      <TableRow key={index}>
                        <TableCell>{row.name}</TableCell>
                        <TableCell>{row.position}</TableCell>
                        <TableCell>{row.department}</TableCell>
                        <TableCell>{row.hours ? row.hours.toFixed(2) : 0.00}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
            {reportType === "attendance_summary" && (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee Name</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Scheduled Hours</TableHead>
                      <TableHead>Worked Hours</TableHead>
                      <TableHead>Late</TableHead>
                      <TableHead>No-Shows</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData.map((row: any, index: number) => (
                      <TableRow key={index}>
                        <TableCell>{row.name}</TableCell>
                        <TableCell>{row.department}</TableCell>
                        <TableCell>{row.totalScheduledHours ? row.totalScheduledHours.toFixed(1) : 0.00}</TableCell>
                        <TableCell>{row.totalWorkedHours ? row.totalWorkedHours.toFixed(1) : 0.00}</TableCell>
                        <TableCell>{row.lateCount}</TableCell>
                        <TableCell>{row.absences}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
             {reportType === "schedule_report" && (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Employee</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Shift</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Start</TableHead>
                      <TableHead>End</TableHead>
                      <TableHead>Check in time</TableHead>
                      <TableHead>Check out time</TableHead>
                      <TableHead>Tardiness</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData.map((row: any, index: number) => (
                      <TableRow key={index} className="items-center">
                        <TableCell>{row.date}</TableCell>
                        <TableCell>{row.employeeName}</TableCell>
                        <TableCell>{row.department}</TableCell>
                        <TableCell>{row.shiftType}</TableCell>
                        <TableCell>{row.scheduleStatus}</TableCell>
                        <TableCell>{row.startTime }</TableCell>
                        <TableCell>{row.endTime }</TableCell>
                        <TableCell>{row.checkInTime ? row.checkInTime : "n/a" }</TableCell>
                        <TableCell>{row.checkOutTime ? row.checkOutTime : "n/a"}</TableCell>
                        <TableCell>{row.late ? row.late : "n/a"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
            {reportType === "salary_overview" && (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee Name</TableHead>
                      <TableHead>Position</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Salary</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData.map((row: any, index: number) => (
                      <TableRow key={index}>
                        <TableCell>{row.name}</TableCell>
                        <TableCell>{row.position}</TableCell>
                        <TableCell>{row.department}</TableCell>
                        <TableCell>{row.salary ? `$${row.salary.toFixed(2)}` : "N/A"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
            {reportData.length === 0 && (
              <div className="text-center text-gray-500 py-8">No data found for the selected criteria.</div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
