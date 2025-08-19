"use client";
import { useEffect, useMemo, useState } from 'react';
import { format, startOfWeek, addDays } from 'date-fns';

import { Schedule, Employee } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell } from 'recharts';
import { Calendar, Clock, Users, AlertTriangle } from 'lucide-react';

interface ScheduleAnalyticsProps {
  schedules: Schedule[];
  employees: Employee[];
  weekDate: Date;
}

export function ScheduleAnalytics({ schedules, employees, weekDate }: ScheduleAnalyticsProps) {

  const analytics = useMemo(() => {
    console.log(weekDate)
    // Generate week dates
    const start = startOfWeek(weekDate, { weekStartsOn: 0 }); // Sunday start
    const weekdates = Array.from({ length: 7 }, (_, i) => addDays(start, i))

    const weekStart = format(weekdates[0], 'yyyy-MM-dd');
    const weekEnd = format(weekdates[6], 'yyyy-MM-dd');

    const weekSchedules = schedules.filter(s => s.date >= weekStart && s.date <= weekEnd);
    
    const statusCounts = weekSchedules.reduce((acc, schedule) => {
      acc[schedule.status] = (acc[schedule.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const dailyStats = weekdates.map(date => {
      const dateStr = format(date, 'yyyy-MM-dd');
      const daySchedules = weekSchedules.filter(s => s.date === dateStr);
      return {
        date: format(date, 'EEE'),
        total: daySchedules.length,
        completed: daySchedules.filter(s => s.status === 'completed').length,
        'checked-in': daySchedules.filter(s => s.status === 'checked-in').length,
        pending: daySchedules.filter(s => s.status === 'pending').length,
        'no-show': daySchedules.filter(s => s.status === 'no-show').length,
      };
    });

    return {
      total: weekSchedules.length,
      statusCounts,
      dailyStats,
      pieData: Object.entries(statusCounts).map(([status, count]) => ({
        name: status,
        value: count,
        color: getStatusColor(status)
      }))
    };
  }, [schedules, weekDate]);

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Schedules</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.total}</div>
            <p className="text-xs text-muted-foreground">This week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <Clock className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {analytics.statusCounts.completed || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {analytics.total > 0 ? 
                `${Math.round((analytics.statusCounts.completed || 0) / analytics.total * 100)}%` : 
                '0%'} completion rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">No Shows</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {analytics.statusCounts['no-show'] || 0}
            </div>
            <p className="text-xs text-muted-foreground">Require attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{employees.length}</div>
            <p className="text-xs text-muted-foreground">Scheduled this week</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'completed': return '#10b981';
    case 'checked-in': return '#3b82f6';
    case 'pending': return '#f59e0b';
    case 'no-show': return '#ef4444';
    default: return '#6b7280';
  }
}