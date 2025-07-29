"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Camera, Clock, User, CheckCircle, XCircle } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { ProtectedRoute } from "@/components/auth/protected-route"

interface AttendanceLog {
  id: string
  employee_id: string
  employee_name: string
  action: "check_in" | "check_out"
  timestamp: string
  notes?: string
}

export default function AttendanceApp() {
  const [isLoading, setIsLoading] = useState(false)
  const [employeeId, setEmployeeId] = useState("")
  const [employeeName, setEmployeeName] = useState("")
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [recentLogs, setRecentLogs] = useState<AttendanceLog[]>([])
  const [message, setMessage] = useState("")
  const [currentTime, setCurrentTime] = useState(new Date())

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)


  useEffect(() => {
    startCamera()
    fetchRecentLogs()

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop())
      }
    }
  }, [])

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
      })
      setStream(mediaStream)
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
      }
    } catch (error) {
      console.error("Error accessing camera:", error)
      setMessage("Error accessing camera. Please ensure camera permissions are granted.")
    }
  }

  const fetchRecentLogs = async () => {
    try {
      const { data, error } = await supabase
        .from("attendance_logs")
        .select(`
        *,
        schedules!inner(
          employee_id,
          date,
          employees!inner(
            name,
            user_id
          )
        )
      `)
        .order("created_at", { ascending: false })
        .limit(10)

      if (error) throw error

      const formattedLogs =
        data?.map((log) => {
          let action: "check_in" | "check_out" = "check_in"
          let timestamp = log.created_at

          if (log.check_in_time && log.check_out_time) {
            // If both exist, show the most recent action
            action = new Date(log.check_out_time) > new Date(log.check_in_time) ? "check_out" : "check_in"
            timestamp = action === "check_out" ? log.check_out_time : log.check_in_time
          } else if (log.check_out_time) {
            action = "check_out"
            timestamp = log.check_out_time
          } else if (log.check_in_time) {
            action = "check_in"
            timestamp = log.check_in_time
          }

          return {
            id: log.id,
            employee_id: log.schedules.employees.user_id,
            employee_name: log.schedules.employees.name,
            action,
            timestamp,
            notes: log.notes,
          }
        }) || []

      setRecentLogs(formattedLogs)
    } catch (error) {
      console.error("Error fetching logs:", error)
    }
  }

  const capturePhoto = async (): Promise<string | null> => {
    if (!videoRef.current || !canvasRef.current) return null

    const canvas = canvasRef.current
    const video = videoRef.current
    const context = canvas.getContext("2d")

    if (!context) return null

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    context.drawImage(video, 0, 0)

    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const file = new File([blob], `attendance-${Date.now()}.jpg`, { type: "image/jpeg" })
            resolve(URL.createObjectURL(file))
          } else {
            resolve(null)
          }
        },
        "image/jpeg",
        0.8,
      )
    })
  }

  const formatDateTime = (date: Date) => {
    return {
      time: date.toLocaleTimeString("en-US", {
        hour12: true,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
      date: date.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
    }
  }

  const handleAttendance = async (action: "check_in" | "check_out") => {
    if (!employeeId) {
      setMessage("Please enter employee ID")
      return
    }

    setIsLoading(true)
    setMessage("")

    try {
      // First, get the employee from the database
      const { data: employee, error: employeeError } = await supabase
        .from("employees")
        .select("id, name")
        .eq("user_id", employeeId)
        .single()

      if (employeeError || !employee) {
        setMessage("Employee not found. Please check the employee ID.")
        setIsLoading(false)
        return
      }

      // Capture photo
      if (!videoRef.current || !canvasRef.current) {
        throw new Error("Camera not ready")
      }

      const canvas = canvasRef.current
      const video = videoRef.current
      const context = canvas.getContext("2d")

      if (!context) throw new Error("Canvas context not available")

      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      context.drawImage(video, 0, 0)

      // Save photo locally
      const photoDataUrl = canvas.toDataURL("image/jpeg", 0.8)
      const fileName = `attendance-${employeeId}-${action}-${Date.now()}.jpg`

      // Create download link for the photo
      const link = document.createElement("a")
      link.download = fileName
      link.href = photoDataUrl
      link.click()

      // Also store in localStorage for reference (optional)
      const photoKey = `photo-${employee.id}-${Date.now()}`
      try {
        localStorage.setItem(photoKey, photoDataUrl)
      } catch (storageError) {
        console.warn("Could not save photo to localStorage:", storageError)
      }

      // Get or create today's schedule
      const today = new Date().toISOString().split("T")[0]
      let { data: schedule, error: scheduleError } = await supabase
        .from("schedules")
        .select("id")
        .eq("employee_id", employee.id)
        .eq("date", today)
        .single()

      if (scheduleError || !schedule) {
        // Create a new schedule for today
        const { data: newSchedule, error: createScheduleError } = await supabase
          .from("schedules")
          .insert([
            {
              employee_id: employee.id,
              date: today,
              start_time: "09:00:00",
              end_time: "17:00:00",
              status: "pending",
            },
          ])
          .select("id")
          .single()

        if (createScheduleError) throw createScheduleError
        schedule = newSchedule
      }

      // Update or create attendance log
      const currentTime = new Date()
      const currentTimeString = currentTime.toISOString()

      if (action === "check_in") {

          // Always create new log
          const { error } = await supabase.from("attendance_logs").insert([
            {
              schedule_id: schedule.id,
              check_in_time: currentTime,
              notes: `Check-in photo saved locally as: ${fileName}`,
            },
          ])

          if (error) { console.log(error)} 
        
      } else {
        // For check_out, find existing record and update it
        const { data: existingLog } = await supabase
          .from("attendance_logs")
          .select("id, check_in_time")
          .eq("schedule_id", schedule.id)


        if (existingLog) {
          const { error } = await supabase
            .from("attendance_logs")
            .update({
              check_out_time: currentTimeString,
              updated_at: currentTimeString,
              notes: `Check-out photo saved locally as: ${fileName}`,
            })
            .eq("id", existingLog[0].id)

          if (error) throw error
        } else {
          // Create new log with only check-out time (unusual case)
          const { error } = await supabase.from("attendance_logs").insert([
            {
              schedule_id: schedule.id,
              check_out_time: currentTimeString,
              notes: `Check-out photo saved locally as: ${fileName}`,
            },
          ])

          if (error) throw error
        }
      }

      setMessage(`Successfully ${action === "check_in" ? "checked in" : "checked out"}! Photo saved locally.`)
      fetchRecentLogs()

      // Clear form after successful submission
      setTimeout(() => {
        setEmployeeId("")
        setMessage("")
      }, 3000)
    } catch (error) {
      console.error("Error recording attendance:", error)
      setMessage("Error recording attendance. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString()
  }

  return (
    <ProtectedRoute>
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Employee Attendance System</h1>
          <p className="text-gray-600">Check in and check out with automatic photo capture</p>
        </div>

        {/* Real-time Clock Display */}
        <Card className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
          <CardContent className="p-6 text-center">
            <div className="text-4xl font-bold mb-2">{formatDateTime(currentTime).time}</div>
            <div className="text-lg opacity-90">{formatDateTime(currentTime).date}</div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Camera and Check-in/out Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5" />
                Camera & Attendance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Camera Preview */}
              <div className="relative bg-black rounded-lg overflow-hidden">
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-64 object-cover" />
                <canvas ref={canvasRef} className="hidden" />
              </div>

              {/* Employee Information */}
              <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="employeeId">Employee ID</Label>
                  <Input
                    id="employeeId"
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    placeholder="Enter employee ID"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-4">
                <Button
                  onClick={() => handleAttendance("check_in")}
                  disabled={isLoading}
                  className="bg-green-600 hover:bg-green-700"
                  size="lg"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {isLoading ? "Processing..." : "Check In"}
                </Button>
                <Button
                  onClick={() => handleAttendance("check_out")}
                  disabled={isLoading}
                  variant="destructive"
                  size="lg"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  {isLoading ? "Processing..." : "Check Out"}
                </Button>
              </div>

              {/* Status Message */}
              {message && (
                <div
                  className={`p-3 rounded-lg text-center ${
                    message.includes("Error") ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
                  }`}
                >
                  {message}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Attendance Logs */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Recent Attendance Logs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {recentLogs.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No attendance logs yet</p>
                ) : (
                  recentLogs.map((log) => (
                    <div key={log.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <User className="h-4 w-4 text-gray-500" />
                        <div>
                          <p className="font-medium">{log.employee_name}</p>
                          <p className="text-sm text-gray-500">ID: {log.employee_id}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge
                          variant={log.action === "check_in" ? "default" : "secondary"}
                          className={
                            log.action === "check_in" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                          }
                        >
                          {log.action === "check_in" ? "Check In" : "Check Out"}
                        </Badge>
                        <p className="text-xs text-gray-500 mt-1">{formatTime(log.timestamp)}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  </ProtectedRoute>
  )
}
