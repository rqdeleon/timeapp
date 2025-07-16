"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, Users, Clock, Upload } from "lucide-react"
import { Navigation } from "@/components/navigation"
import { CSVUpload } from "@/components/csv-upload"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { supabase, type Schedule, type Employee } from "@/lib/supabase"
import { useRealtimeSchedules } from "@/hooks/use-realtime-schedules"

export default function Dashboard() {
  const [showCSVUpload, setShowCSVUpload] = useState(false)
  const [initialSchedules, setInitialSchedules] = useState<Schedule[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)

  // Use real-time hook for schedules
  const schedules = useRealtimeSchedules(initialSchedules)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      // Fetch today's schedules with employee data
      const today = new Date().toISOString().split("T")[0]
      const { data: schedulesData, error: schedulesError } = await supabase
        .from("schedules")
        .select(`
          *,
          employees:employees(*)
        `)
        .eq("date", today)

      if (schedulesError) throw schedulesError

      // Convert "employees" property to "employee"
      const normalizedSchedules = (schedulesData ?? []).map((row) => ({
        ...row,
        employee: row.employees,
      })) as Schedule[]

      setInitialSchedules(normalizedSchedules)

      // Fetch all employees
      const { data: employeesData, error: employeesError } = await supabase
        .from("employees")
        .select("*")
        .eq("status", "active")

      if (employeesError) throw employeesError

      setEmployees(employeesData || [])
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }

  const activeShifts = schedules.filter((s) => s.status === "confirmed" && s.checked_in_at)
  const todayShifts = schedules.length
  const thisWeekShifts = schedules.length * 7 // Simplified calculation

  const recentSchedules = schedules.slice(0, 4).map((schedule) => ({
    employee: schedule.employee?.name || "Unknown",
    shift: schedule.shift_type,
    time: `${schedule.start_time} - ${schedule.end_time}`,
    status: schedule.status,
  }))

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <Navigation />

        <main className="container mx-auto px-4 py-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600 mt-1">Manage your employee scheduling</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                Live Updates
              </Badge>
              <Button onClick={() => setShowCSVUpload(true)} className="flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Import CSV
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Total Employees</CardTitle>
                <Users className="w-4 h-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">{employees.length}</div>
                <p className="text-xs text-gray-600 mt-1">Active employees</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Today's Shifts</CardTitle>
                <Clock className="w-4 h-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">{todayShifts}</div>
                <p className="text-xs text-gray-600 mt-1">Scheduled shifts</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">This Week</CardTitle>
                <Calendar className="w-4 h-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">{thisWeekShifts}</div>
                <p className="text-xs text-gray-600 mt-1">Total shifts</p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Schedules */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Schedules</CardTitle>
              <CardDescription>Latest employee shift assignments (updates in real-time)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentSchedules.map((schedule, index) => (
                  <div
                    key={index}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg transition-all duration-200 hover:shadow-sm"
                  >
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{schedule.employee}</h3>
                      <p className="text-sm text-gray-600 capitalize">{schedule.shift} Shift</p>
                      <p className="text-sm text-gray-500">{schedule.time}</p>
                    </div>
                    <div className="mt-2 sm:mt-0">
                      <Badge
                        variant={schedule.status === "confirmed" ? "default" : "secondary"}
                        className={schedule.status === "confirmed" ? "bg-green-100 text-green-800" : ""}
                      >
                        {schedule.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <CSVUpload open={showCSVUpload} onOpenChange={setShowCSVUpload} />
        </main>
      </div>
    </ProtectedRoute>
  )
}
