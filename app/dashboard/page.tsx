"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Calendar,
  Users,
  Clock,
  AlertTriangle,
  CheckCircle,
  Phone,
  Mail,
  MapPin,
  Timer,
  UserCheck,
  UserX,
  XCircle,
} from "lucide-react"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { supabase } from "@/lib/supabase"
import { Schedule, ShiftType, Department, Employee} from "@/types"
import { useRealtimeSchedules } from "@/hooks/use-realtime-schedules"
import { useRealtimeEmployees } from "@/hooks/use-realtime-employees"

export default function Dashboard() {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [initialSchedules, setInitialSchedules] = useState<Schedule[]>([])
  const [initialEmployees, setInitialEmployees] = useState<Employee[]>([])
  const [shiftTypes, setShiftTypes] = useState<ShiftType[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)

  // Use real-time hooks
  const todayShifts = useRealtimeSchedules(initialSchedules)
  const employees = useRealtimeEmployees(initialEmployees)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    fetchInitialData()
  }, [])

  const fetchInitialData = async () => {
    setLoading(true)
    try {
      // Fetch today's schedules with employee and shift type data
      const today = new Date().toISOString().split("T")[0]
      const { data: schedulesData, error: schedulesError } = await supabase
        .from("schedules")
        .select(
          `
          *,
          employees:employee_id(name, department, position, phone, email),
          shift_type:shift_type_id(name, default_start_time, default_end_time)
        `,
        )
        .eq("date", today)

      if (schedulesError) throw schedulesError

      const normalizedSchedules = (schedulesData ?? []).map((row) => ({
        ...row,
        employee: row.employees,
        shift_type: row.shift_type,
      })) as Schedule[]

      setInitialSchedules(normalizedSchedules)

      // Fetch all active employees
      const { data: employeesData, error: employeesError } = await supabase
        .from("employees")
        .select("*")
        .eq("status", "active")

      if (employeesError) throw employeesError
      setInitialEmployees(employeesData || [])

      // Fetch all shift types
      const { data: shiftTypesData, error: shiftTypesError } = await supabase
        .from("shift_types")
        .select("*")
        .order("name")
      if (shiftTypesError) throw shiftTypesError
      setShiftTypes(shiftTypesData || [])

      // Fetch all departments
      const { data: departmentsData, error: departmentsError } = await supabase
        .from("departments")
        .select("*")
        .order("name")
      if (departmentsError) throw departmentsError
      setDepartments(departmentsData || [])
    } catch (error) {
      console.error("Error fetching initial data for dashboard:", error)
    } finally {
      setLoading(false)
    }
  }

  // Today's Shifts specific calculations
  const activeShifts = todayShifts.filter((shift) => shift.status === "confirmed" && shift.checked_in_at)
  const upcomingShifts = todayShifts.filter((shift) => shift.status === "pending")
  const completedShifts = todayShifts.filter((shift) => shift.status === "completed")
  const lateEmployees = todayShifts.filter((shift) => shift.is_late || shift.status === "no-show")

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-blue-100 text-blue-800"
      case "completed":
        return "bg-gray-100 text-gray-800"
      case "no-show":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "confirmed":
        return <UserCheck className="w-4 h-4" />
      case "pending":
        return <Clock className="w-4 h-4" />
      case "completed":
        return <CheckCircle className="w-4 h-4" />
      case "no-show":
        return <UserX className="w-4 h-4" />
      default:
        return <Clock className="w-4 h-4" />
    }
  }

  const calculateShiftProgress = (startTime: string, endTime: string) => {
    const now = currentTime
    const [startHour, startMin] = startTime.split(":").map(Number)
    const [endHour, endMin] = endTime.split(":").map(Number)

    const start = new Date(now)
    start.setHours(startHour, startMin, 0, 0)

    const end = new Date(now)
    end.setHours(endHour, endMin, 0, 0)

    if (now < start) return 0
    if (now > end) return 100

    const total = end.getTime() - start.getTime()
    const elapsed = now.getTime() - start.getTime()

    return Math.round((elapsed / total) * 100)
  }

  // Dashboard specific calculations
  const totalEmployeesCount = employees.length
  const todayShiftsCount = todayShifts.length
  const thisWeekShiftsCount = todayShifts.length * 7 // Simplified calculation for demo

  const recentSchedules = todayShifts.slice(0, 4).map((schedule) => ({
    employee: schedule.employee?.name || "Unknown",
    shift: schedule.shift_type?.name || "N/A",
    time: `${schedule.start_time} - ${schedule.end_time}`,
    status: schedule.status,
  }))

  // Dynamic Department Status for Overview
  const departmentStats = departments
    .map((dept) => {
      const deptShifts = todayShifts.filter((s) => s.employee?.department === dept.name)
      const coveredCount = deptShifts.filter((s) => s.status === "confirmed" || s.status === "completed").length
      const totalCount = deptShifts.length

      return {
        name: dept.name,
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
        <main className="container mx-auto px-4 py-8">
          {/* Header with Live Clock (from Today's Shifts) */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600 mt-1">Real-time shift monitoring and overall management</p>
            </div>
            <div className="flex items-center gap-4">
              <Card className="w-full lg:w-auto">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-blue-600" />
                    <div>
                      <div className="text-2xl font-bold text-gray-900">{currentTime.toLocaleTimeString()}</div>
                      <div className="text-sm text-gray-600">
                        {currentTime.toLocaleDateString("en-US", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>


          {/* Main Content Tabs (from Today's Shifts) */}
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview" className="flex gap-2">
              <CheckCircle className="w-4 h-4 text-gray-600" />
                Overview
                &#40;{completedShifts.length}&#41;
              </TabsTrigger>

              <TabsTrigger value="active" className="flex gap-2">
                <UserCheck className="w-4 h-4 text-green-600" />
                Active Shifts 
                &#40;{activeShifts.length}&#41;
              </TabsTrigger>

              <TabsTrigger value="upcoming" className="flex gap-2">
                <Clock className="w-4 h-4 text-blue-600" />
                Upcoming
                &#40;{upcomingShifts.length}&#41;
              </TabsTrigger>
              
              <TabsTrigger value="issues" className="flex gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                Issues&#40;{lateEmployees.length}&#41;
              </TabsTrigger>
            </TabsList>

            {/* Active Shifts Tab */}
            <TabsContent value="active" className="space-y-6">
              <div className="grid gap-6">
                {activeShifts.map((shift) => (
                  <Card key={shift.id} className="transition-all duration-200 hover:shadow-md">
                    <CardHeader>
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <Avatar className="w-12 h-12">
                            <AvatarImage src="/placeholder.svg" />
                            <AvatarFallback>
                              {shift.employee?.name
                                ?.split(" ")
                                .map((n) => n[0])
                                .join("") || "U"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">{shift.employee?.name}</h3>
                            <p className="text-sm text-gray-600">
                              {shift.employee?.position} • {shift.employee?.department}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getStatusColor(shift.status)}>
                            {getStatusIcon(shift.status)}
                            <span className="ml-1 capitalize">{shift.status}</span>
                          </Badge>
                          {shift.is_late && (
                            <Badge variant="destructive">
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              Late {shift.late_minutes}min
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Shift Progress */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Shift Progress</span>
                          <span>{calculateShiftProgress(shift.start_time, shift.end_time)}%</span>
                        </div>
                        <Progress value={calculateShiftProgress(shift.start_time, shift.end_time)} className="h-2" />
                        <div className="flex justify-between text-xs text-gray-600">
                          <span>{shift.start_time}</span>
                          <span>{shift.end_time}</span>
                        </div>
                      </div>

                      {/* Details Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t">
                        <div className="flex items-center gap-2 text-sm">
                          <Timer className="w-4 h-4 text-gray-500" />
                          <div>
                            <p className="text-gray-600">Check-in</p>
                            <p className="font-medium">
                              {shift.checked_in_at
                                ? new Date(shift.checked_in_at).toLocaleTimeString()
                                : "Not checked in"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="w-4 h-4 text-gray-500" />
                          <div>
                            <p className="text-gray-600">Location</p>
                            <p className="font-medium">{shift.location || "Not specified"}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="w-4 h-4 text-gray-500" />
                          <div>
                            <p className="text-gray-600">Phone</p>
                            <p className="font-medium">{shift.employee?.phone || "N/A"}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Users className="w-4 h-4 text-gray-500" />
                          <div>
                            <p className="text-gray-600">Breaks</p>
                            <p className="font-medium">
                              {shift.breaks_taken}/{shift.total_breaks}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-wrap gap-2 pt-4 border-t">
                        <Button size="sm" variant="outline">
                          <Phone className="w-4 h-4 mr-1" />
                          Call
                        </Button>
                        <Button size="sm" variant="outline">
                          <Mail className="w-4 h-4 mr-1" />
                          Message
                        </Button>
                        <Button size="sm" variant="outline">
                          View Details
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {activeShifts.length === 0 && (
                  <Card>
                    <CardContent className="p-6 text-center text-gray-500">No active shifts currently.</CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            {/* Upcoming Shifts Tab */}
            <TabsContent value="upcoming" className="space-y-6">
              <div className="grid gap-4">
                {upcomingShifts.map((shift) => (
                  <Card key={shift.id} className="transition-all duration-200 hover:shadow-md">
                    <CardContent className="p-6">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <Avatar className="w-10 h-10">
                            <AvatarImage src="/placeholder.svg" />
                            <AvatarFallback>
                              {shift.employee?.name
                                ?.split(" ")
                                .map((n) => n[0])
                                .join("") || "U"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-semibold text-gray-900">{shift.employee?.name}</h3>
                            <p className="text-sm text-gray-600">{shift.employee?.position}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-sm font-medium">
                              {shift.start_time} - {shift.end_time}
                            </p>
                            <p className="text-xs text-gray-600">{shift.shift_type?.name} Shift</p>
                          </div>
                          <Badge className={getStatusColor(shift.status)}>
                            {getStatusIcon(shift.status)}
                            <span className="ml-1">Upcoming</span>
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {upcomingShifts.length === 0 && (
                  <Card>
                    <CardContent className="p-6 text-center text-gray-500">No upcoming shifts for today.</CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            {/* Issues Tab */}
            <TabsContent value="issues" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-600">
                    <AlertTriangle className="w-5 h-5" />
                    Attendance Issues
                  </CardTitle>
                  <CardDescription>Employees who are late or haven't shown up</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {lateEmployees.map((shift) => (
                      <div
                        key={shift.id}
                        className="flex flex-col lg:flex-row lg:items-center justify-between p-4 border border-red-200 rounded-lg bg-red-50 transition-all duration-200 hover:shadow-md"
                      >
                        <div className="flex items-center gap-4">
                          <Avatar className="w-10 h-10">
                            <AvatarImage src="/placeholder.svg" />
                            <AvatarFallback>
                              {shift.employee?.name
                                ?.split(" ")
                                .map((n) => n[0])
                                .join("") || "U"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-semibold text-gray-900">{shift.employee?.name}</h3>
                            <p className="text-sm text-gray-600">
                              {shift.employee?.position} • {shift.employee?.department}
                            </p>
                            <p className="text-sm text-gray-600">
                              Scheduled: {shift.start_time} - {shift.end_time}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-4 lg:mt-0">
                          {shift.status === "no-show" ? (
                            <Badge variant="destructive">
                              <UserX className="w-3 h-3 mr-1" />
                              No Show
                            </Badge>
                          ) : (
                            <Badge variant="destructive">
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              Late {shift.late_minutes}min
                            </Badge>
                          )}
                          <Button size="sm" variant="outline">
                            <Phone className="w-4 h-4 mr-1" />
                            Contact
                          </Button>
                        </div>
                      </div>
                    ))}
                    {lateEmployees.length === 0 && (
                      <div className="text-center text-gray-500 py-8">No attendance issues found.</div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Overview Tab (Combined Dashboard & Today's Shifts Overview) */}
            <TabsContent value="overview" className="space-y-6">
              {/* Original Dashboard Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">Total Employees</CardTitle>
                    <Users className="w-4 h-4 text-blue-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-gray-900">{totalEmployeesCount}</div>
                    <p className="text-xs text-gray-600 mt-1">Active employees</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">Today's Shifts</CardTitle>
                    <Clock className="w-4 h-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-gray-900">{todayShiftsCount}</div>
                    <p className="text-xs text-gray-600 mt-1">Scheduled shifts</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">This Week</CardTitle>
                    <Calendar className="w-4 h-4 text-purple-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-gray-900">{thisWeekShiftsCount}</div>
                    <p className="text-xs text-gray-600 mt-1">Total shifts</p>
                  </CardContent>
                </Card>
              </div>

              {/* Shift Coverage (from Today's Shifts Overview) */}
              <Card>
                <CardHeader>
                  <CardTitle>Shift Coverage</CardTitle>
                  <CardDescription>Coverage by time periods (updates in real-time)</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {shiftTypes.map((shiftType) => {
                    const shiftSchedules = todayShifts.filter((s) => s.shift_type_id === shiftType.id)
                    const coveredCount = shiftSchedules.filter((s) => s.status === "confirmed").length
                    const totalCount = shiftSchedules.length
                    const percentage = totalCount > 0 ? Math.round((coveredCount / totalCount) * 100) : 0

                    return (
                      <div key={shiftType.id} className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium capitalize">
                            {shiftType.name} ({shiftType.default_start_time} - {shiftType.default_end_time})
                          </span>
                          <Badge
                            className={
                              percentage >= 90
                                ? "bg-green-100 text-green-800"
                                : percentage >= 70
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-red-100 text-red-800"
                            }
                          >
                            {percentage}%
                          </Badge>
                        </div>
                        <Progress
                          value={percentage}
                          className={`h-2 ${
                            percentage >= 90 ? "bg-green-500" : percentage >= 70 ? "bg-yellow-500" : "bg-red-500"
                          }`}
                        />
                      </div>
                    )
                  })}
                  {shiftTypes.length === 0 && (
                    <div className="text-center text-gray-500 py-4">No shift types defined.</div>
                  )}
                </CardContent>
              </Card>

              {/* Department Status (from Today's Shifts Overview) */}
              <Card>
                <CardHeader>
                  <CardTitle>Department Status</CardTitle>
                  <CardDescription>Current staffing by department (live data)</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {departmentStats.map((dept) => (
                    <div key={dept.name} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <span className="font-medium">{dept.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">
                          {dept.covered}/{dept.total}
                        </span>
                        <Badge
                          className={
                            dept.percentage >= 90
                              ? "bg-green-100 text-green-800"
                              : dept.percentage >= 70
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                          }
                        >
                          {dept.percentage >= 90
                            ? "Fully Staffed"
                            : dept.percentage >= 70
                              ? "Understaffed"
                              : "Critical"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  {departmentStats.length === 0 && (
                    <div className="text-center text-gray-500 py-4">No department data available.</div>
                  )}
                </CardContent>
              </Card>

              {/* Recent Schedules (from Original Dashboard) */}
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

              {/* Today's Timeline (from Today's Shifts Overview) */}
              <Card>
                <CardHeader>
                  <CardTitle>Today's Timeline</CardTitle>
                  <CardDescription>Shift changes and key events</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {todayShifts
                      .filter((s) => s.checked_in_at || s.status === "no-show")
                      .sort((a, b) => {
                        const timeA = a.checked_in_at
                          ? new Date(a.checked_in_at).getTime()
                          : new Date(`2000-01-01T${a.start_time}`).getTime()
                        const timeB = b.checked_in_at
                          ? new Date(b.checked_in_at).getTime()
                          : new Date(`2000-01-01T${b.start_time}`).getTime()
                        return timeA - timeB
                      })
                      .map((shift) => (
                        <div
                          key={shift.id}
                          className={`flex items-center gap-4 p-3 border-l-4 ${
                            shift.status === "no-show"
                              ? "border-red-500 bg-red-50"
                              : shift.is_late
                                ? "border-orange-500 bg-orange-50"
                                : "border-green-500 bg-green-50"
                          }`}
                        >
                          {shift.status === "no-show" ? (
                            <XCircle className="w-5 h-5 text-red-600" />
                          ) : shift.is_late ? (
                            <AlertTriangle className="w-5 h-5 text-orange-600" />
                          ) : (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          )}
                          <div>
                            <p className="font-medium">
                              {shift.checked_in_at
                                ? `${new Date(shift.checked_in_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} - ${shift.employee?.name} checked in ${shift.is_late ? `(${shift.late_minutes} min late)` : ""}`
                                : `${shift.start_time} - ${shift.employee?.name} no-show`}
                            </p>
                            <p className="text-sm text-gray-600">
                              {shift.status === "no-show"
                                ? `${shift.employee?.department} understaffed`
                                : `${shift.shift_type?.name} shift started`}
                            </p>
                          </div>
                        </div>
                      ))}
                    {todayShifts.filter((s) => s.checked_in_at || s.status === "no-show").length === 0 && (
                      <div className="text-center text-gray-500 py-8">No timeline events yet.</div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </ProtectedRoute>
  )
}
