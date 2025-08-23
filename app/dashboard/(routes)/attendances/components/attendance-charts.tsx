"use client"

import React from 'react'
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, TrendingDown, Minus, BarChart3, PieChart as PieChartIcon } from 'lucide-react'

interface AttendanceChartsProps {
  trendData: Array<{
    date: string
    totalHours: number
    overtimeHours: number
    employees: number
  }>
  departmentData: Array<{
    department: string
    totalHours: number
    overtimeHours: number
    employees: number
  }>
  loading?: boolean
}

export const AttendanceCharts: React.FC<AttendanceChartsProps> = ({
  trendData,
  departmentData,
  loading = false
}) => {
  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded mb-4 w-1/3"></div>
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded mb-4 w-1/3"></div>
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Calculate trend indicators
  const getTrendIndicator = (data: number[]) => {
    if (data.length < 2) return { trend: 'neutral', change: 0 }
    
    const recent = data.slice(-7) // Last 7 days
    const previous = data.slice(-14, -7) // Previous 7 days
    
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length
    const previousAvg = previous.reduce((a, b) => a + b, 0) / previous.length
    
    const change = ((recentAvg - previousAvg) / previousAvg) * 100
    
    if (Math.abs(change) < 2) return { trend: 'neutral', change: 0 }
    return { trend: change > 0 ? 'up' : 'down', change: Math.abs(change) }
  }

  const hoursTrend = getTrendIndicator(trendData.map(d => d.totalHours))
  const overtimeTrend = getTrendIndicator(trendData.map(d => d.overtimeHours))

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {`${entry.dataKey}: ${entry.value.toFixed(1)}${entry.dataKey.includes('Hours') ? 'h' : ''}`}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  // Colors for charts
  const COLORS = {
    primary: '#3b82f6',
    secondary: '#f59e0b',
    success: '#10b981',
    warning: '#f97316',
    danger: '#ef4444'
  }

  const departmentColors = [
    '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', 
    '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6b7280'
  ]

  return (
    <div className="space-y-6">
      {/* Trend Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Hours Trend Line Chart */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Hours Trend
              </CardTitle>
              <div className="flex items-center gap-2">
                {hoursTrend.trend === 'up' && (
                  <Badge className="bg-green-100 text-green-800">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    +{hoursTrend.change.toFixed(1)}%
                  </Badge>
                )}
                {hoursTrend.trend === 'down' && (
                  <Badge className="bg-red-100 text-red-800">
                    <TrendingDown className="h-3 w-3 mr-1" />
                    -{hoursTrend.change.toFixed(1)}%
                  </Badge>
                )}
                {hoursTrend.trend === 'neutral' && (
                  <Badge className="bg-gray-100 text-gray-800">
                    <Minus className="h-3 w-3 mr-1" />
                    Stable
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#6b7280"
                    fontSize={12}
                    tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  />
                  <YAxis stroke="#6b7280" fontSize={12} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line 
                    type="monotone" 
                    dataKey="totalHours" 
                    stroke={COLORS.primary} 
                    strokeWidth={2}
                    dot={{ fill: COLORS.primary, strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: COLORS.primary, strokeWidth: 2 }}
                    name="Regular Hours"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="overtimeHours" 
                    stroke={COLORS.warning} 
                    strokeWidth={2}
                    dot={{ fill: COLORS.warning, strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: COLORS.warning, strokeWidth: 2 }}
                    name="Overtime Hours"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Department Hours Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Department Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={departmentData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="department" 
                    stroke="#6b7280"
                    fontSize={12}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis stroke="#6b7280" fontSize={12} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar 
                    dataKey="totalHours" 
                    fill={COLORS.primary} 
                    radius={[4, 4, 0, 0]}
                    name="Regular Hours"
                  />
                  <Bar 
                    dataKey="overtimeHours" 
                    fill={COLORS.warning} 
                    radius={[4, 4, 0, 0]}
                    name="Overtime Hours"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Department Distribution and Employee Count */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Department Hours Distribution Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="h-5 w-5" />
              Hours Distribution by Department
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={departmentData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="totalHours"
                  >
                    {departmentData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={departmentColors[index % departmentColors.length]} 
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: any) => [`${value.toFixed(1)}h`, 'Hours']}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36}
                    formatter={(value, entry) => (
                      <span style={{ color: entry.color }}>{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Employee Count by Department */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Active Employees by Department
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={departmentData} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" stroke="#6b7280" fontSize={12} />
                  <YAxis 
                    dataKey="department" 
                    type="category" 
                    stroke="#6b7280" 
                    fontSize={12}
                    width={80}
                  />
                  <Tooltip 
                    formatter={(value: any) => [`${value}`, 'Employees']}
                  />
                  <Bar 
                    dataKey="employees" 
                    fill={COLORS.success}
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Analytics Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-700">
                {departmentData.reduce((sum, dept) => sum + dept.totalHours, 0).toFixed(0)}h
              </div>
              <div className="text-sm text-blue-600">Total Hours This Period</div>
            </div>
            
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-700">
                {departmentData.reduce((sum, dept) => sum + dept.overtimeHours, 0).toFixed(0)}h
              </div>
              <div className="text-sm text-orange-600">Total Overtime</div>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-700">
                {departmentData.reduce((sum, dept) => sum + dept.employees, 0)}
              </div>
              <div className="text-sm text-green-600">Active Employees</div>
            </div>
            
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-700">
                {(departmentData.reduce((sum, dept) => sum + dept.totalHours, 0) / 
                  departmentData.reduce((sum, dept) => sum + dept.employees, 0) || 0).toFixed(1)}h
              </div>
              <div className="text-sm text-purple-600">Avg Hours per Employee</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}