"use client"

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  Calendar, 
  Clock, 
  Timer, 
  CheckCircle, 
  Sun, 
  Moon,
  TrendingUp,
  Users
} from 'lucide-react'
import { AttendanceSummary } from '@/types/attendance'

interface AttendanceSummaryCardsProps {
  summary: AttendanceSummary | null
  loading: boolean
}

export const AttendanceSummaryCards: React.FC<AttendanceSummaryCardsProps> = ({
  summary,
  loading
}) => {
  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-3 w-24 mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!summary) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
        <Card className="md:col-span-2 lg:col-span-6">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">No attendance data available for the selected period.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const cards = [
    {
      title: "Total Days Worked",
      value: summary.total_days_worked.toLocaleString(),
      description: "Distinct working days",
      icon: Calendar,
      color: "text-blue-600"
    },
    {
      title: "Total Hours",
      value: `${summary.total_hours_worked.toFixed(1)}h`,
      description: "Regular work hours",
      icon: Clock,
      color: "text-green-600"
    },
    {
      title: "Overtime Hours",
      value: `${summary.total_overtime_hours.toFixed(1)}h`,
      description: `${summary.total_approved_overtime.toFixed(1)}h approved`,
      icon: Timer,
      color: "text-orange-600"
    },
    // {
    //   title: "Sunday Hours",
    //   value: `${summary.total_sunday_hours.toFixed(1)}h`,
    //   description: "Weekend work hours",
    //   icon: Sun,
    //   color: "text-yellow-600"
    // },
    // {
    //   title: "Overnight Hours",
    //   value: `${summary.total_overnight_hours.toFixed(1)}h`,
    //   description: "Night shift hours",
    //   icon: Moon,
    //   color: "text-purple-600"
    // },
    {
      title: "Approval Rate",
      value: `${summary.total_overtime_hours > 0 
        ? ((summary.total_approved_overtime / summary.total_overtime_hours) * 100).toFixed(1)
        : 0}%`,
      description: "OT approval rate",
      icon: CheckCircle,
      color: "text-emerald-600"
    }
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
      {cards.map((card, index) => {
        const Icon = card.icon
        return (
          <Card key={index} className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {card.title}
              </CardTitle>
              <Icon className={`h-4 w-4 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${card.color}`}>
                {card.value}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {card.description}
              </p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}