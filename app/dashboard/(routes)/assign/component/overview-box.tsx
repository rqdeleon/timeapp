"use client"
import React from 'react'
import { useState, useEffect } from 'react'

import { Schedule, Department, ShiftType } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

type DeptStats = {
    name: string,
    covered: number,
    total: number,
    percentage: number, 
} 

interface DepartmentStatsProps {
  deptStats:DeptStats[]
}

interface ScheduleOverviewProps {
  weekSchedules : Schedule[],
  departmentStats: DeptStats[],
}

interface ShiftDistributionProp{
  allShifts: ShiftType[],
  weekSchedules: Schedule[],
}



export const ScheduleOverview: React.FC<ScheduleOverviewProps> = ({ weekSchedules, departmentStats })=>{
  const totalShifts = weekSchedules.length
  const coveredShifts = weekSchedules.filter((s) => s.status === "confirmed" || s.status === "completed").length
  const coveragePercentage = totalShifts > 0 ? Math.round((coveredShifts / totalShifts) * 100) : 0
  const pendingShifts = weekSchedules.filter((s) => s.status === "pending").length
  
  const totalScheduledHours = weekSchedules.reduce((total, schedule) => {
  const start = new Date(`2000-01-01T${schedule.start_time}`)
  const end = new Date(`2000-01-01T${schedule.end_time}`)
  let hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60)

  // Handle overnight shifts
  if (hours < 0) {
    hours += 24
  }

    return total + hours
  }, 0)

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">This Week</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900">{Math.round(totalScheduledHours)}</div>
          <p className="text-sm text-gray-600">Total scheduled hours</p>
          <p className="text-xs text-gray-500 mt-1">{totalShifts} total shifts</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Coverage</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className={`text-2xl font-bold ${
              coveragePercentage >= 90
                ? "text-green-600"
                : coveragePercentage >= 70
                  ? "text-yellow-600"
                  : "text-red-600"
            }`}
          >
            {coveragePercentage}%
          </div>
          <p className="text-sm text-gray-600">Shifts covered</p>
          <p className="text-xs text-gray-500 mt-1">
            {coveredShifts}/{totalShifts} confirmed
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Pending</CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${pendingShifts > 0 ? "text-orange-600" : "text-gray-900"}`}>
            {pendingShifts}
          </div>
          <p className="text-sm text-gray-600">Awaiting confirmation</p>
          <p className="text-xs text-gray-500 mt-1">{pendingShifts > 0 ? "Needs attention" : "All confirmed"}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Departments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900">{departmentStats.length}</div>
          <p className="text-sm text-gray-600">Active departments</p>
          <p className="text-xs text-gray-500 mt-1">With scheduled shifts</p>
        </CardContent>
      </Card>
    </div>
  )
}


export const DepartmentCoverage: React.FC<DepartmentStatsProps> = ({ deptStats })=>{

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Department Coverage</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {deptStats.map((dept) => (
            <div key={dept.name} className="p-4 border rounded-lg bg-white">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-medium text-gray-900">{dept.name}</h3>
                <Badge
                  className={
                    dept.percentage >= 90
                      ? "bg-green-100 text-green-800"
                      : dept.percentage >= 70
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800"
                  }
                >
                  {dept.percentage}%
                </Badge>

              </div>
              <div className="text-sm text-gray-600">
                {dept.covered}/{dept.total} shifts covered
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div
                  className={`h-2 rounded-full ${
                    dept.percentage >= 90
                      ? "bg-green-500"
                      : dept.percentage >= 70
                        ? "bg-yellow-500"
                        : "bg-red-500"
                  }`}
                  style={{ width: `${dept.percentage}%` }}
                ></div>
              </div>
            </div>
          ))}
          {deptStats.length === 0 && (
            <div className="col-span-full text-center py-8 text-gray-500">
              No department schedules found for this week
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
 
export const ShiftDistribution: React.FC<ShiftDistributionProp> = ({allShifts, weekSchedules}) => {
  return(
    <Card>
      <CardHeader>
        <CardTitle>Shift Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {allShifts.map((shiftType) => {
            const shiftSchedules = weekSchedules.filter((s) => s.shift_type_id === shiftType.id)
            const shiftHours = shiftSchedules.reduce((total, schedule) => {
              const start = new Date(`2000-01-01T${schedule.start_time}`)
              const end = new Date(`2000-01-01T${schedule.end_time}`)
              let hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60)
              if (hours < 0) hours += 24
              return total + hours
            }, 0)

            return (
              <div key={shiftType.id} className="p-4 border rounded-lg bg-white">
                <h3 className="font-medium text-gray-900 capitalize mb-2">{shiftType.name} Shift</h3>
                <div className="text-2xl font-bold text-gray-900">{shiftSchedules.length}</div>
                <div className="text-sm text-gray-600">shifts scheduled</div>
                <div className="text-xs text-gray-500 mt-1">{Math.round(shiftHours)} total hours</div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}