"use client"
import React from 'react'
import { Clock, DollarSign, FileText, Users, UserPlus, Calculator, Upload, CheckCircle, XCircle } from 'lucide-react';

import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableHead, TableHeader, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { ResponsiveContainer, PieChart, Bar, Pie, Cell, LineChart, XAxis, YAxis, Line, CartesianGrid, BarChart, Tooltip } from 'recharts';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import StatCard from '@/components/ui/stats-card';

const DashboardOverview = () => {
  // Mock data - replace with Supabase queries later
  const mockStats = {
    headcount: 247,
    attendanceToday: 198,
    payrollThisMonth: 285000,
    payrollLastMonth: 275000,
    pendingLeaveRequests: 12,
  };

  const attendanceData = [
  { name: 'Present', value: 198, color: '#10b981' },
  { name: 'Absent', value: 15, color: '#ef4444' },
  { name: 'Late', value: 18, color: '#f59e0b' },
  { name: 'On Leave', value: 16, color: '#6366f1' },
];

const departmentData = [
  { name: 'Engineering', value: 85, color: '#3b82f6' },
  { name: 'Sales', value: 52, color: '#10b981' },
  { name: 'Marketing', value: 34, color: '#f59e0b' },
  { name: 'HR', value: 18, color: '#ef4444' },
  { name: 'Finance', value: 25, color: '#8b5cf6' },
  { name: 'Operations', value: 33, color: '#06b6d4' },
];

  const attritionData = [
    { month: 'Jan', hires: 12, exits: 8 },
    { month: 'Feb', hires: 15, exits: 5 },
    { month: 'Mar', hires: 18, exits: 12 },
    { month: 'Apr', hires: 22, exits: 9 },
    { month: 'May', hires: 19, exits: 14 },
    { month: 'Jun', hires: 25, exits: 11 },
  ];

  const overtimeData = [
    { month: 'Jan', hours: 1250 },
    { month: 'Feb', hours: 1180 },
    { month: 'Mar', hours: 1420 },
    { month: 'Apr', hours: 1350 },
    { month: 'May', hours: 1580 },
    { month: 'Jun', hours: 1720 },
  ];

  const birthdaysAnniversaries = [
    { id: 1, name: 'Sarah Johnson', type: 'birthday', date: 'Today', avatar: '/api/placeholder/32/32' },
    { id: 2, name: 'Mike Chen', type: 'anniversary', date: 'Tomorrow', years: 3, avatar: '/api/placeholder/32/32' },
    { id: 3, name: 'Emily Davis', type: 'birthday', date: 'Jun 25', avatar: '/api/placeholder/32/32' },
    { id: 4, name: 'John Smith', type: 'anniversary', date: 'Jun 26', years: 5, avatar: '/api/placeholder/32/32' },
  ];

  const pendingLeaveRequests = [
    { id: 1, employee: 'Alice Brown', leaveType: 'Annual Leave', duration: '3 days', startDate: '2024-06-28' },
    { id: 2, employee: 'David Wilson', leaveType: 'Sick Leave', duration: '1 day', startDate: '2024-06-25' },
    { id: 3, employee: 'Lisa Garcia', leaveType: 'Maternity Leave', duration: '90 days', startDate: '2024-07-01' },
    { id: 4, employee: 'Tom Anderson', leaveType: 'Personal Leave', duration: '2 days', startDate: '2024-06-30' },
  ];

  const payrollChange = ((mockStats.payrollThisMonth - mockStats.payrollLastMonth) / mockStats.payrollLastMonth) * 100;
    
  return (
    <main className="p-6 space-y-6 bg-background min-h-screen">
      {/* Header */}
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold text-foreground">HR Dashboard</h1>
        <p className="text-muted-foreground">Overview of your organization's human resources</p>
      </div>

      {/* Top Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Headcount"
          trend="up"
          value={mockStats.headcount}
          Icon={ <Users className="-4 h-4 text-muted-foreground" />}
        />
        <StatCard
          title="Attendance Today"
          value={mockStats.attendanceToday}
          Icon={<Clock className="w-4 h-4 text-muted-foreground" />}
          trend="up"
        />
        <StatCard
          title="Payroll This Month"
          value={`$${Math.round(mockStats.payrollThisMonth / 1000)}K`}
          Icon={<DollarSign className="w-4 h-4 text-muted-foreground" />}
          trend={payrollChange > 0 ? 'up' : 'down'}
          trendValue={`${Math.abs(payrollChange).toFixed(1)}%`}
        />
        <StatCard
          title="Pending Leave Requests"
          value={mockStats.pendingLeaveRequests}
          Icon={<FileText  className="w-4 h-4 text-muted-foreground"/>}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Attendance Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={attendanceData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {attendanceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              {attendanceData.map((entry, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-sm text-muted-foreground">
                    {entry.name} ({entry.value})
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Department Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Department Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={departmentData}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {departmentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-4">
              {departmentData.map((entry, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-sm text-muted-foreground">
                    {entry.name} ({entry.value})
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Attrition Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Hiring vs Attrition Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={attritionData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Bar dataKey="hires" fill="#10b981" name="Hires" />
                  <Bar dataKey="exits" fill="#ef4444" name="Exits" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Overtime Hours */}
        <Card>
          <CardHeader>
            <CardTitle>Overtime Hours Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={overtimeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Line
                    type="monotone"
                    dataKey="hours"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    dot={{ fill: '#3b82f6', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Birthdays & Anniversaries */}
        <Card>
          <CardHeader>
            <CardTitle>Birthdays & Anniversaries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {birthdaysAnniversaries.map((item) => (
                <div key={item.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={item.avatar} />
                      <AvatarFallback>
                        {item.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{item.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.type === 'birthday' ? 'Birthday' : `${item.years} Year Anniversary`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-muted-foreground">{item.date}</span>
                    <span className="text-lg">
                      {item.type === 'birthday' ? '🎂' : '🎉'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Pending Leave Requests */}
        <Card>
          <CardHeader>
            <CardTitle>Pending Leave Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingLeaveRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium">{request.employee}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{request.leaveType}</Badge>
                    </TableCell>
                    <TableCell>{request.duration}</TableCell>
                    <TableCell className="space-x-2">
                      <Button size="sm" variant="outline" className="text-green-600 hover:text-green-700">
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                      <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                        <XCircle className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Button className="flex items-center space-x-2">
              <UserPlus className="h-4 w-4" />
              <span>Add Employee</span>
            </Button>
            <Button variant="outline" className="flex items-center space-x-2">
              <Upload className="h-4 w-4" />
              <span>Upload Attendance</span>
            </Button>
            <Button variant="outline" className="flex items-center space-x-2">
              <Calculator className="h-4 w-4" />
              <span>Run Payroll</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}

export default DashboardOverview;