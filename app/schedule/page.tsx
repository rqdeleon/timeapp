"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, ChevronLeft, ChevronRight, Plus } from "lucide-react"
import { Navigation } from "@/components/navigation"
import { ScheduleForm } from "@/components/schedule-form"

export default function Schedule() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [showScheduleForm, setShowScheduleForm] = useState(false)

  const schedules = [
    {
      id: 1,
      employee: "John Doe",
      date: "2024-01-15",
      shift: "Morning",
      startTime: "09:00",
      endTime: "17:00",
      status: "confirmed",
    },
    {
      id: 2,
      employee: "Jane Smith",
      date: "2024-01-15",
      shift: "Evening",
      startTime: "14:00",
      endTime: "22:00",
      status: "pending",
    },
    {
      id: 3,
      employee: "Mike Johnson",
      date: "2024-01-16",
      shift: "Night",
      startTime: "22:00",
      endTime: "06:00",
      status: "confirmed",
    },
    {
      id: 4,
      employee: "Sarah Wilson",
      date: "2024-01-16",
      shift: "Morning",
      startTime: "08:00",
      endTime: "16:00",
      status: "confirmed",
    },
  ]

  const weekDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
  const shifts = ["Morning", "Evening", "Night"]

  const getSchedulesForDate = (date) => {
    const dateStr = date.toISOString().split("T")[0]
    return schedules.filter((schedule) => schedule.date === dateStr)
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

  const navigateWeek = (direction) => {
    const newDate = new Date(currentDate)
    newDate.setDate(currentDate.getDate() + direction * 7)
    setCurrentDate(newDate)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Schedule</h1>
            <p className="text-gray-600 mt-1">Manage employee shifts and schedules</p>
          </div>
          <Button onClick={() => setShowScheduleForm(true)} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Schedule
          </Button>
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
                    <div className="font-medium text-sm p-2 bg-gray-50 rounded">{shift}</div>
                    {weekDates.map((date, dateIndex) => {
                      const daySchedules = getSchedulesForDate(date).filter((s) => s.shift === shift)
                      return (
                        <div key={dateIndex} className="p-2 border rounded min-h-[80px]">
                          {daySchedules.map((schedule) => (
                            <div key={schedule.id} className="mb-2">
                              <div className="text-xs font-medium text-gray-900">{schedule.employee}</div>
                              <div className="text-xs text-gray-600">
                                {schedule.startTime} - {schedule.endTime}
                              </div>
                              <Badge
                                size="sm"
                                variant={schedule.status === "confirmed" ? "default" : "secondary"}
                                className={`text-xs ${schedule.status === "confirmed" ? "bg-green-100 text-green-800" : ""}`}
                              >
                                {schedule.status}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Schedule Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">This Week</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">84</div>
              <p className="text-sm text-gray-600">Total scheduled hours</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Coverage</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">95%</div>
              <p className="text-sm text-gray-600">Shifts covered</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">3</div>
              <p className="text-sm text-gray-600">Awaiting confirmation</p>
            </CardContent>
          </Card>
        </div>

        <ScheduleForm open={showScheduleForm} onOpenChange={setShowScheduleForm} />
      </main>
    </div>
  )
}
