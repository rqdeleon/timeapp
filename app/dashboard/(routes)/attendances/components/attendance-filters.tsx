"use client"

import React, { useState, useEffect } from 'react'
import { CalendarIcon, X, Filter } from 'lucide-react'
import { format } from 'date-fns'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { AttendanceFilters as FilterType } from '@/types/attendance'
import { Department, Employee } from '@/types'
import { getAllDepartments, getAllEmployees } from '@/lib/services/employee-services'

interface AttendanceFiltersProps {
  filters: FilterType
  onFiltersChange: (filters: FilterType) => void
}

export const AttendanceFilters: React.FC<AttendanceFiltersProps> = ({
  filters,
  onFiltersChange
}) => {
  const [departments, setDepartments] = useState<Department[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [dateRange, setDateRange] = useState<{from: Date; to: Date}>(filters.dateRange)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [deptData, empData] = await Promise.all([
          getAllDepartments(),
          getAllEmployees()
        ])
        setDepartments(deptData)
        setEmployees(empData)
      } catch (error) {
        console.error('Error fetching filter data:', error)
      }
    }
    fetchData()
  }, [])

  const handleDateRangeChange = (newRange: {from: Date; to: Date}) => {
    setDateRange(newRange)
    onFiltersChange({
      ...filters,
      dateRange: newRange
    })
  }

  const handleDepartmentToggle = (deptName: string) => {
    const newDepartments = filters.departments.includes(deptName)
      ? filters.departments.filter(d => d !== deptName)
      : [...filters.departments, deptName]
    
    onFiltersChange({
      ...filters,
      departments: newDepartments
    })
  }

  const handleEmployeeToggle = (employeeId: string) => {
    const newEmployees = filters.employees.includes(employeeId)
      ? filters.employees.filter(e => e !== employeeId)
      : [...filters.employees, employeeId]
    
    onFiltersChange({
      ...filters,
      employees: newEmployees
    })
  }

  const handleStatusToggle = (status: 'active' | 'incomplete' | 'approved' | 'rejected') => {
    const newStatuses = filters.status.includes(status)
      ? filters.status.filter(s => s !== status)
      : [...filters.status, status]
    
    onFiltersChange({
      ...filters,
      status: newStatuses
    })
  }

  const clearAllFilters = () => {
    onFiltersChange({
      dateRange: {
        from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        to: new Date()
      },
      departments: [],
      employees: [],
      status: []
    })
  }

  const hasActiveFilters = filters.departments.length > 0 || 
                          filters.employees.length > 0 || 
                          filters.status.length > 0

  const statusOptions = [
    { value: 'pending', label: 'Pending' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' }
  ]

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4" />
              <span className="font-medium">Filters</span>
            </div>
            {hasActiveFilters && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={clearAllFilters}
                className="text-muted-foreground hover:text-foreground"
              >
                Clear all
                <X className="h-4 w-4 ml-1" />
              </Button>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Date Range Picker */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Date Range</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dateRange && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange?.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "LLL dd, y")} -{" "}
                          {format(dateRange.to, "LLL dd, y")}
                        </>
                      ) : (
                        format(dateRange.from, "LLL dd, y")
                      )
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={handleDateRangeChange}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Department Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Departments</label>
              <Select
                onValueChange={(value)=> handleDepartmentToggle(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select departments" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem 
                      key={dept.id} 
                      value={dept.name}
                    >
                        {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Employee Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Employees</label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select employees" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((emp) => (
                    <SelectItem 
                      key={emp.id} 
                      value={emp.id}
                      onClick={() => handleEmployeeToggle(emp.id)}
                    >
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={filters.employees.includes(emp.id)}
                          readOnly
                        />
                        <span>{emp.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Approval Status</label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((status) => (
                    <SelectItem 
                      key={status.value} 
                      value={status.value}
                      //@ts-ignore
                      onClick={() => handleStatusToggle(status.value)}
                    >
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                           //@ts-ignore
                          checked={filters.status.includes(status.value)}
                          readOnly
                        />
                        <span>{status.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Active Filters Display */}
          {hasActiveFilters && (
            <div className="space-y-2">
              <span className="text-sm font-medium">Active Filters:</span>
              <div className="flex flex-wrap gap-2">
                {filters.departments.map((dept) => (
                  <Badge key={dept} variant="secondary" className="gap-1">
                    {dept}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => handleDepartmentToggle(dept)}
                    />
                  </Badge>
                ))}
                {filters.employees.map((empId) => {
                  const employee = employees.find(e => e.id === empId)
                  return (
                    <Badge key={empId} variant="secondary" className="gap-1">
                      {employee?.name}
                      <X 
                        className="h-3 w-3 cursor-pointer" 
                        onClick={() => handleEmployeeToggle(empId)}
                      />
                    </Badge>
                  )
                })}
                {filters.status.map((status) => (
                  <Badge key={status} variant="secondary" className="gap-1">
                    {statusOptions.find(s => s.value === status)?.label}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => handleStatusToggle(status)}
                    />
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}