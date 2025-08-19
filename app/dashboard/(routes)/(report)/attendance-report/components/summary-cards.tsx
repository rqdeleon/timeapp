"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Clock, UserX, AlertTriangle, Zap, Calendar, TrendingUp } from "lucide-react"

interface SummaryStats {
  totalEmployees: number
  totalScheduledHours: number
  totalWorkedHours: number
  totalLateCount: number
  totalAbsences: number
  totalOvertimeHours: number
  totalScheduledDays: number
  totalWorkedDays: number
  totalUnscheduledWorkDays: number
}

interface AttendanceSummaryCardsProps {
  stats: SummaryStats
}

export default function AttendanceSummaryCards({ stats }: AttendanceSummaryCardsProps) {
  const attendanceRate = stats.totalScheduledHours > 0 
    ? ((stats.totalWorkedHours / stats.totalScheduledHours) * 100).toFixed(1)
    : "0"

  const avgHoursPerEmployee = stats.totalEmployees > 0
    ? (stats.totalWorkedHours / stats.totalEmployees).toFixed(1)
    : "0"

  const productivityRate = stats.totalScheduledDays > 0
    ? ((stats.totalWorkedDays / stats.totalScheduledDays) * 100).toFixed(1)
    : "0"

  const overtimePerEmployee = stats.totalEmployees > 0
    ? (stats.totalOvertimeHours / stats.totalEmployees).toFixed(1)
    : "0"

  const cards = [
    {
      title: "Total Employees",
      value: stats.totalEmployees.toString(),
      description: "Active in selected period",
      icon: Users,
      color: "text-blue-600",
    },
    {
      title: "Attendance Rate",
      value: `${attendanceRate}%`,
      description: "Hours worked vs scheduled",
      icon: Clock,
      color: attendanceRate >= "95" ? "text-green-600" : attendanceRate >= "80" ? "text-yellow-600" : "text-red-600",
    },
    {
      title: "Productivity Rate",
      value: `${productivityRate}%`,
      description: "Days worked vs scheduled",
      icon: TrendingUp,
      color: productivityRate >= "95" ? "text-green-600" : productivityRate >= "80" ? "text-yellow-600" : "text-red-600",
    },
    {
      title: "Total Overtime",
      value: `${stats.totalOvertimeHours.toFixed(1)}h`,
      description: `Avg ${overtimePerEmployee}h per employee`,
      icon: Zap,
      color: stats.totalOvertimeHours === 0 ? "text-gray-600" : stats.totalOvertimeHours <= 20 ? "text-orange-600" : "text-red-600",
    },
    {
      title: "Late Arrivals",
      value: stats.totalLateCount.toString(),
      description: "Across all employees",
      icon: AlertTriangle,
      color: "text-orange-600",
    },
    {
      title: "Total Absences",
      value: stats.totalAbsences.toString(),
      description: "No-show incidents",
      icon: UserX,
      color: "text-red-600",
    },
    {
      title: "Unscheduled Work",
      value: stats.totalUnscheduledWorkDays.toString(),
      description: "Days worked without schedule",
      icon: Calendar,
      color: stats.totalUnscheduledWorkDays === 0 ? "text-gray-600" : "text-blue-600",
    },
    {
      title: "Avg Hours/Employee",
      value: `${avgHoursPerEmployee}h`,
      description: "Total worked hours",
      icon: Clock,
      color: "text-green-600",
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => {
        const IconComponent = card.icon
        return (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {card.title}
              </CardTitle>
              <IconComponent className={`h-4 w-4 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <p className="text-xs text-muted-foreground">
                {card.description}
              </p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}