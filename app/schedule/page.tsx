"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, ChevronLeft, ChevronRight, Plus } from "lucide-react"
import { Navigation } from "@/components/navigation"
import { ScheduleForm } from "@/components/schedule-form"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { supabase } from "@/lib/supabase"
import { useRealtimeSchedules } from "@/hooks/use-realtime-schedules"

export default function SchedulePage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [showScheduleForm, setShowScheduleForm] = useState(false)
  const [initialSchedules, setInitialSchedules] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Use real-time hook for schedules
  const allSchedules = useRealtimeSchedules(initialSchedules)

  useEffect(() => {
    fetchSchedules()
  }, [currentDate])

  const fetchSchedules = async () => {
    try {
      // Get the current week's date range
      const weekDates = generateWeekDates()
      const startDate = weekDates[0].toISOString().split("T")[0]
      const endDate = weekDates[6].toISOString().split("T")[0]

      const { data: schedulesData, error } = await supabase
        .from("schedules")
        .select(`
          *,
          employees:employees(*)
        `)
        .gte("date", startDate)
        .lte("date", endDate)
        .order("date", { ascending: true })
        .order("start_time", { ascending: true })

      if (error) throw error

      const normalizedSchedules = (schedulesData ?? []).map((row) => ({
        ...row,
        employee: row.employees,
      }))

      setInitialSchedules(normalizedSchedules)
    } catch (error) {
      console.error("Error fetching schedules:", error)
    } finally {
      setLoading(false)
    }
  }

  const weekDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
  const shifts = ["morning", "evening", "night"]
  const shiftLabels = {
    morning: "Morning",
    evening: "Evening",
    night: "Night",
  }

  const getSchedulesForDate = (date: Date) => {
    const dateStr = date.toISOString().split("T")[0]
    return allSchedules.filter((schedule) => schedule.date === dateStr)
  }

  const getSchedulesForDateAndShift = (date: Date, shift: string) => {
    const dateStr = date.toISOString().split("T")[0]
    return allSchedules.filter((schedule) => schedule.date === dateStr && schedule.shift_type === shift)
  }

  const generateWeekDates = () => {
    const week = []
    const startOfWeek = new Date(currentDate)
    const day = startOfWeek.getDay()
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1)
    startOfWeek.setDate(diff)

    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek)
      date.setDate(startOfWeek.getDate() + i)
      week.push(date)
    }
    return week
  }

  const weekDates = generateWeekDates()

  const navigateWeek = (direction: number) => {
    const newDate = new Date(currentDate)
    newDate.setDate(currentDate.getDate() + direction * 7)
    setCurrentDate(newDate)
  }

  // Calculate statistics for overview boxes
  const weekSchedules = allSchedules
  const totalScheduledHours = weekSchedules.reduce((total, schedule) => {
    const start = new Date(`2000-01-01T${schedule.start_time}`)
    const end = new Date(`2000-01-01T${schedule.end_time}`)
    let hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60)

    // Handle overnight shifts
    if (hours < 0) {
      hours += 24
    }

    return total + hours
  }, 0)

  const totalShifts = weekSchedules.length
  const coveredShifts = weekSchedules.filter((s) => s.status === "confirmed" || s.status === "completed").length
  const coveragePercentage = totalShifts > 0 ? Math.round((coveredShifts / totalShifts) * 100) : 0
  const pendingShifts = weekSchedules.filter((s) => s.status === "pending").length

  // Department coverage analysis
  const departments = ["Operations", "Sales", "Customer Service", "HR", "IT"]
  const departmentStats = departments
    .map((dept) => {
      const deptSchedules = weekSchedules.filter((s) => s.employee?.department === dept)
      const coveredCount = deptSchedules.filter((s) => s.status === "confirmed" || s.status === "completed").length
      const totalCount = deptSchedules.length

      return {
        name: dept,
        covered: coveredCount,
        total: totalCount,
        percentage: totalCount > 0 ? Math.round((coveredCount / totalCount) * 100) : 0,
      }
    })
    .filter((dept) => dept.total > 0) // Only show departments with schedules

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
              <h1 className="text-3xl font-bold text-gray-900">Schedule</h1>
              <p className="text-gray-600 mt-1">Manage employee shifts and schedules</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                Live Updates
              </Badge>
              <Button onClick={() => setShowScheduleForm(true)} className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Add Schedule
              </Button>
            </div>
          </div>

          {/* Week Navigation */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Weekly Schedule
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" onClick={() => navigateWeek(-1)}>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-sm font-medium px-4">
                    {weekDates[0]?.toLocaleDateString()} - {weekDates[6]?.toLocaleDateString()}
                  </span>
                  <Button variant="outline" size="icon" onClick={() => navigateWeek(1)}>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <div className="grid grid-cols-8 gap-2 min-w-[800px]">
                  {/* Header */}
                  <div className="font-medium text-sm text-gray-600 p-2">Shift</div>
                  {weekDates.map((date, index) => (
                    <div key={index} className="font-medium text-sm text-gray-600 p-2 text-center">
                      <div>{weekDays[index]}</div>
                      <div className="text-xs text-gray-500">{date.getDate()}</div>
                    </div>
                  ))}

                  {/* Schedule Grid */}
                  {shifts.map((shift) => (
                    <div key={shift} className="contents">
                      <div className="font-medium text-sm p-2 bg-gray-50 rounded capitalize">
                        {shiftLabels[shift as keyof typeof shiftLabels]}
                      </div>
                      {weekDates.map((date, dateIndex) => {
                        const daySchedules = getSchedulesForDateAndShift(date, shift)
                        return (
                          <div
                            key={dateIndex}
                            className="p-2 border rounded min-h-[100px] bg-white hover:bg-gray-50 transition-colors"
                          >
                            {daySchedules.map((schedule) => (
                              <div
                                key={schedule.id}
                                className="mb-2 p-2 bg-gray-50 rounded border transition-all duration-200 hover:shadow-sm"
                              >
                                <div
                                  className="text-xs font-medium text-gray-900 truncate"
                                  title={schedule.employee?.name}
                                >
                                  {schedule.employee?.name || "Unknown"}
                                </div>
                                <div className="text-xs text-gray-600">
                                  {schedule.start_time} - {schedule.end_time}
                                </div>
                                <div className="text-xs text-gray-500 truncate" title={schedule.employee?.department}>
                                  {schedule.employee?.department}
                                </div>
                                <Badge
                                  size="sm"
                                  variant={schedule.status === "confirmed" ? "default" : "secondary"}
                                  className={`text-xs mt-1 ${
                                    schedule.status === "confirmed"
                                      ? "bg-green-100 text-green-800"
                                      : schedule.status === "completed"
                                        ? "bg-blue-100 text-blue-800"
                                        : schedule.status === "no-show"
                                          ? "bg-red-100 text-red-800"
                                          : ""
                                  }`}
                                >
                                  {schedule.status}
                                </Badge>
                              </div>
                            ))}
                            {daySchedules.length === 0 && (
                              <div className="text-xs text-gray-400 text-center py-4">No shifts</div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Schedule Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">This Week</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">{Math.round(totalScheduledHours)}</div>
                <p className="text-sm text-gray-600">Total scheduled hours</p>
                <p className="text-xs text-gray-500 mt-1">{totalShifts} total shifts</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Coverage</CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className={`text-2xl font-bold ${
                    coveragePercentage >= 90
                      ? "text-green-600"
                      : coveragePercentage >= 70
                        ? "text-yellow-600"
                        : "text-red-600"
                  }`}
                >
                  {coveragePercentage}%
                </div>
                <p className="text-sm text-gray-600">Shifts covered</p>
                <p className="text-xs text-gray-500 mt-1">
                  {coveredShifts}/{totalShifts} confirmed
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Pending</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${pendingShifts > 0 ? "text-orange-600" : "text-gray-900"}`}>
                  {pendingShifts}
                </div>
                <p className="text-sm text-gray-600">Awaiting confirmation</p>
                <p className="text-xs text-gray-500 mt-1">{pendingShifts > 0 ? "Needs attention" : "All confirmed"}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Departments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">{departmentStats.length}</div>
                <p className="text-sm text-gray-600">Active departments</p>
                <p className="text-xs text-gray-500 mt-1">With scheduled shifts</p>
              </CardContent>
            </Card>
          </div>

          {/* Department Coverage Details */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Department Coverage</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {departmentStats.map((dept) => (
                  <div key={dept.name} className="p-4 border rounded-lg bg-white">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-medium text-gray-900">{dept.name}</h3>
                      <Badge
                        className={
                          dept.percentage >= 90
                            ? "bg-green-100 text-green-800"
                            : dept.percentage >= 70
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                        }
                      >
                        {dept.percentage}%
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-600">
                      {dept.covered}/{dept.total} shifts covered
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div
                        className={`h-2 rounded-full ${
                          dept.percentage >= 90
                            ? "bg-green-500"
                            : dept.percentage >= 70
                              ? "bg-yellow-500"
                              : "bg-red-500"
                        }`}
                        style={{ width: `${dept.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
                {departmentStats.length === 0 && (
                  <div className="col-span-full text-center py-8 text-gray-500">
                    No department schedules found for this week
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Shift Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Shift Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {shifts.map((shift) => {
                  const shiftSchedules = weekSchedules.filter((s) => s.shift_type === shift)
                  const shiftHours = shiftSchedules.reduce((total, schedule) => {
                    const start = new Date(`2000-01-01T${schedule.start_time}`)
                    const end = new Date(`2000-01-01T${schedule.end_time}`)
                    let hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60)
                    if (hours < 0) hours += 24
                    return total + hours
                  }, 0)

                  return (
                    <div key={shift} className="p-4 border rounded-lg bg-white">
                      <h3 className="font-medium text-gray-900 capitalize mb-2">
                        {shiftLabels[shift as keyof typeof shiftLabels]} Shift
                      </h3>
                      <div className="text-2xl font-bold text-gray-900">{shiftSchedules.length}</div>
                      <div className="text-sm text-gray-600">shifts scheduled</div>
                      <div className="text-xs text-gray-500 mt-1">{Math.round(shiftHours)} total hours</div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          <ScheduleForm open={showScheduleForm} onOpenChange={setShowScheduleForm} />
        </main>
      </div>
    </ProtectedRoute>
  )
}
