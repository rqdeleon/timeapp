"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Clock, Users, AlertTriangle, CheckCircle, Phone, Mail, MapPin, Timer, UserCheck, UserX } from "lucide-react"
import { Navigation } from "@/components/navigation"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { supabase, type Schedule } from "@/lib/supabase"
import { useRealtimeSchedules } from "@/hooks/use-realtime-schedules"

export default function TodayShifts() {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [initialSchedules, setInitialSchedules] = useState<Schedule[]>([])
  const [loading, setLoading] = useState(true)

  // Use real-time hook for schedules
  const todayShifts = useRealtimeSchedules(initialSchedules)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    fetchTodaySchedules()
  }, [])

  const fetchTodaySchedules = async () => {
    try {
      const today = new Date().toISOString().split("T")[0]
      const { data: schedulesData, error } = await supabase
        .from("schedules")
        .select(`
          *,
          employees:employees(*)
        `)
        .eq("date", today)

      if (error) throw error

      const normalizedSchedules = (schedulesData ?? []).map((row) => ({
        ...row,
        employee: row.employees,
      })) as Schedule[]

      setInitialSchedules(normalizedSchedules)
    } catch (error) {
      console.error("Error fetching today's schedules:", error)
    } finally {
      setLoading(false)
    }
  }

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
          {/* Header with Live Clock */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Today's Shifts</h1>
              <p className="text-gray-600 mt-1">Real-time shift monitoring and management</p>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                Live Updates
              </Badge>
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

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Active Now</CardTitle>
                <UserCheck className="w-4 h-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">{activeShifts.length}</div>
                <p className="text-xs text-gray-600 mt-1">Currently working</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Upcoming</CardTitle>
                <Clock className="w-4 h-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">{upcomingShifts.length}</div>
                <p className="text-xs text-gray-600 mt-1">Starting later</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Late/No-Show</CardTitle>
                <AlertTriangle className="w-4 h-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{lateEmployees.length}</div>
                <p className="text-xs text-gray-600 mt-1">Needs attention</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Completed</CardTitle>
                <CheckCircle className="w-4 h-4 text-gray-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">{completedShifts.length}</div>
                <p className="text-xs text-gray-600 mt-1">Shifts finished</p>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Tabs */}
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="active">Active Shifts</TabsTrigger>
              <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
              <TabsTrigger value="issues">Issues</TabsTrigger>
              <TabsTrigger value="overview">Overview</TabsTrigger>
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
              </div>
            </TabsContent>

            {/* Other tabs remain the same but with real-time data */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Shift Coverage */}
                <Card>
                  <CardHeader>
                    <CardTitle>Shift Coverage</CardTitle>
                    <CardDescription>Coverage by time periods (updates in real-time)</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Morning (6AM - 2PM)</span>
                        <Badge className="bg-green-100 text-green-800">
                          {Math.round(
                            (todayShifts.filter((s) => s.shift_type === "morning").length /
                              Math.max(todayShifts.filter((s) => s.shift_type === "morning").length, 1)) *
                              100,
                          )}
                          %
                        </Badge>
                      </div>
                      <Progress
                        value={Math.round(
                          (todayShifts.filter((s) => s.shift_type === "morning").length /
                            Math.max(todayShifts.filter((s) => s.shift_type === "morning").length, 1)) *
                            100,
                        )}
                        className="h-2"
                      />
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Evening (2PM - 10PM)</span>
                        <Badge className="bg-yellow-100 text-yellow-800">
                          {Math.round(
                            (todayShifts.filter((s) => s.shift_type === "evening").length /
                              Math.max(todayShifts.filter((s) => s.shift_type === "evening").length, 1)) *
                              100,
                          )}
                          %
                        </Badge>
                      </div>
                      <Progress
                        value={Math.round(
                          (todayShifts.filter((s) => s.shift_type === "evening").length /
                            Math.max(todayShifts.filter((s) => s.shift_type === "evening").length, 1)) *
                            100,
                        )}
                        className="h-2"
                      />
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Night (10PM - 6AM)</span>
                        <Badge className="bg-red-100 text-red-800">
                          {Math.round(
                            (todayShifts.filter((s) => s.shift_type === "night").length /
                              Math.max(todayShifts.filter((s) => s.shift_type === "night").length, 1)) *
                              100,
                          )}
                          %
                        </Badge>
                      </div>
                      <Progress
                        value={Math.round(
                          (todayShifts.filter((s) => s.shift_type === "night").length /
                            Math.max(todayShifts.filter((s) => s.shift_type === "night").length, 1)) *
                            100,
                        )}
                        className="h-2"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Department Status */}
                <Card>
                  <CardHeader>
                    <CardTitle>Department Status</CardTitle>
                    <CardDescription>Current staffing by department (live data)</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {["Operations", "Sales", "Customer Service"].map((dept) => {
                      const deptShifts = todayShifts.filter((s) => s.employee?.department === dept)
                      const activeCount = deptShifts.filter((s) => s.status === "confirmed").length
                      const totalCount = deptShifts.length

                      return (
                        <div key={dept} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                          <span className="font-medium">{dept}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">
                              {activeCount}/{totalCount}
                            </span>
                            <Badge
                              className={
                                activeCount === totalCount
                                  ? "bg-green-100 text-green-800"
                                  : activeCount > 0
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-red-100 text-red-800"
                              }
                            >
                              {activeCount === totalCount
                                ? "Fully Staffed"
                                : activeCount > 0
                                  ? "Understaffed"
                                  : "Critical"}
                            </Badge>
                          </div>
                        </div>
                      )
                    })}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </ProtectedRoute>
  )
}
