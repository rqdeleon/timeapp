"use client"

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, ComposedChart, Line, LineChart } from "recharts"
import { AttendanceColumnProps } from "./columns"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface AttendanceChartProps {
  data: AttendanceColumnProps[]
}

export default function AttendanceChart({ data }: AttendanceChartProps) {
  // Group data by department for chart visualization
  const departmentData = data.reduce((acc, curr) => {
    const dept = curr.department || 'Unassigned'
    
    if (!acc[dept]) {
      acc[dept] = {
        department: dept,
        totalEmployees: 0,
        totalScheduledHours: 0,
        totalWorkedHours: 0,
        totalOvertimeHours: 0,
        totalLateCount: 0,
        totalAbsences: 0,
        totalUnscheduledWorkDays: 0,
      }
    }
    
    acc[dept].totalEmployees += 1
    acc[dept].totalScheduledHours += curr.totalScheduledHours
    acc[dept].totalWorkedHours += curr.totalWorkedHours
    acc[dept].totalOvertimeHours += curr.overtimeHours
    acc[dept].totalLateCount += curr.lateCount
    acc[dept].totalAbsences += curr.absences
    acc[dept].totalUnscheduledWorkDays += curr.unscheduledWorkDays
    
    return acc
  }, {} as Record<string, {
    department: string
    totalEmployees: number
    totalScheduledHours: number
    totalWorkedHours: number
    totalOvertimeHours: number
    totalLateCount: number
    totalAbsences: number
    totalUnscheduledWorkDays: number
  }>)

  const chartData = Object.values(departmentData).map(dept => ({
    department: dept.department,
    'Scheduled Hours': Math.round(dept.totalScheduledHours),
    'Worked Hours': Math.round(dept.totalWorkedHours),
    'Overtime Hours': Math.round(dept.totalOvertimeHours * 10) / 10, // Keep one decimal for overtime
    'Late Arrivals': dept.totalLateCount,
    'Absences': dept.totalAbsences,
    'Unscheduled Work Days': dept.totalUnscheduledWorkDays,
    'Employees': dept.totalEmployees,
    'Attendance Rate': dept.totalScheduledHours > 0 
      ? Math.round((dept.totalWorkedHours / dept.totalScheduledHours) * 100)
      : 0,
    'Avg Hours per Employee': dept.totalEmployees > 0
      ? Math.round((dept.totalWorkedHours / dept.totalEmployees) * 10) / 10
      : 0
  }))

  // Performance metrics for line chart
  const performanceData = chartData.map(dept => ({
    department: dept.department,
    'Attendance Rate': dept['Attendance Rate'],
    'Avg Hours per Employee': dept['Avg Hours per Employee'],
    'Overtime per Employee': dept.Employees > 0 ? Math.round((dept['Overtime Hours'] / dept.Employees) * 10) / 10 : 0,
  }))

  if (chartData.length === 0) {
    return (
      <div className="flex h-[400px] items-center justify-center text-sm text-muted-foreground">
        No data available for visualization
      </div>
    )
  }

  return (
    <Tabs defaultValue="hours" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="hours">Hours Analysis</TabsTrigger>
        <TabsTrigger value="performance">Performance Metrics</TabsTrigger>
        <TabsTrigger value="issues">Issues Overview</TabsTrigger>
      </TabsList>
      
      <TabsContent value="hours" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Hours Comparison by Department</CardTitle>
            <CardDescription>Scheduled vs Worked hours with overtime breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <XAxis 
                  dataKey="department" 
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px',
                  }}
                />
                <Legend />
                <Bar 
                  dataKey="Scheduled Hours" 
                  fill="hsl(var(--chart-1))" 
                  name="Scheduled Hours"
                  radius={[2, 2, 0, 0]}
                />
                <Bar 
                  dataKey="Worked Hours" 
                  fill="hsl(var(--chart-2))" 
                  name="Worked Hours"
                  radius={[2, 2, 0, 0]}
                />
                <Bar 
                  dataKey="Overtime Hours" 
                  fill="hsl(var(--chart-3))" 
                  name="Overtime Hours"
                  radius={[2, 2, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="performance" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Performance Metrics by Department</CardTitle>
            <CardDescription>Attendance rates and productivity indicators</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={performanceData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <XAxis 
                  dataKey="department" 
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px',
                  }}
                />
                <Legend />
                <Bar 
                  yAxisId="left"
                  dataKey="Attendance Rate" 
                  fill="hsl(var(--chart-1))" 
                  name="Attendance Rate (%)"
                  radius={[2, 2, 0, 0]}
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="Avg Hours per Employee" 
                  stroke="hsl(var(--chart-2))" 
                  strokeWidth={2}
                  name="Avg Hours per Employee"
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="Overtime per Employee" 
                  stroke="hsl(var(--chart-3))" 
                  strokeWidth={2}
                  name="Overtime per Employee"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="issues" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Issues and Irregularities by Department</CardTitle>
            <CardDescription>Late arrivals, absences, and unscheduled work</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <XAxis 
                  dataKey="department" 
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px',
                  }}
                />
                <Legend />
                <Bar 
                  dataKey="Late Arrivals" 
                  fill="hsl(var(--chart-3))" 
                  name="Late Arrivals"
                  radius={[2, 2, 0, 0]}
                />
                <Bar 
                  dataKey="Absences" 
                  fill="hsl(var(--chart-4))" 
                  name="Absences"
                  radius={[2, 2, 0, 0]}
                />
                <Bar 
                  dataKey="Unscheduled Work Days" 
                  fill="hsl(var(--chart-5))" 
                  name="Unscheduled Work Days"
                  radius={[2, 2, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}