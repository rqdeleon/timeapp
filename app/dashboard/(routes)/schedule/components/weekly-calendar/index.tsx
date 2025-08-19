"use client"
import React, { useState, useMemo, useCallback } from 'react';
import { format, startOfWeek, addDays, isSameDay, addWeeks, subWeeks } from 'date-fns';
import { ChevronLeft, ChevronRight, Plus,  Search } from 'lucide-react';

import { AttendanceLog, Department, Employee, Schedule } from '@/types';
import EmployeeRow from './employee-row';
import FilterControls from './filter-controls';
import { Button } from '@/components/ui/button';

interface WeeklyCalenderProps {
  schedules: Schedule[];
  attendances: AttendanceLog[];
  employees: Employee[];
  departments: Department[];
  onShiftClick: (shift)=> void;
  onCellClick: (employee, date, shift)=> void;
  onScheduleUpdate?: () => void;
  weekDate: Date;
  setWeekDate: (newDate)=> void;
  viewMode: "calendar" | "list";
}

// Main Weekly Calendar Component
const WeeklyCalendar:React.FC<WeeklyCalenderProps> = (
  {
    schedules,
    attendances,
    employees,
    departments,
    onShiftClick,
    onCellClick,
    onScheduleUpdate,
    viewMode,
    weekDate,
    setWeekDate,
  }
) => {
  const [selectedShift, setSelectedShift] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [ search, setSearch] = useState(" ");
  const [ currentDate, setCurrentDate] = useState(new Date)
  const [ filters, setFilters] = useState({
    department: 'all',
    status: 'all',
    search: '',
    showOnlyConflicts: false
  })

  // Generate week dates
  const weekDates = useMemo(() => {
    const start = startOfWeek(currentDate, { weekStartsOn: 0 }); // Sunday start
    setWeekDate(currentDate);
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [currentDate]);


  // Filter employees based on current filters
  const filteredEmployees = useMemo(() => {
    return employees.filter(employee => {
      const matchesDepartment = filters.department === 'all' || 
        employee.department?.id === filters.department;
      const matchesSearch = !filters.search || 
        employee.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        employee.position.toLowerCase().includes(filters.search.toLowerCase());
      
      return matchesDepartment && matchesSearch;
    });
  }, [filters]);

  // Navigation handlers
  const navigateWeek = useCallback((direction) => {
    setCurrentDate(prev => direction > 0 ? addWeeks(prev, 1) : subWeeks(prev, 1));
    setWeekDate(currentDate);
  }, []);

  const goToToday = useCallback(() => {
    setCurrentDate(new Date());
    setWeekDate(currentDate);
  }, []);

  // Event handlers
  const handleCellClick = useCallback((employee, date, shift) => {
    
    // Call the parent's onCellClick if provided
    onCellClick?.(employee, date, shift);

  }, [onCellClick]);

    // Handle schedule form save
  const handleScheduleSaved = useCallback(() => {
    
    // Call parent update callback if provided
    onScheduleUpdate?.();
    
    console.log('Schedule saved successfully');
  }, [onScheduleUpdate]);

  const handleEditShift = useCallback((shift) => {
    setSelectedShift(shift);

    onShiftClick?.(shift);
  }, [onShiftClick]);

  const handleSearch = useCallback((searchTerm) => {
    setFilters(prev => ({ ...prev, search: searchTerm }));
  }, []);

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Weekly Schedule</h1>
            <p className="text-gray-600">Manage employee shifts and schedules</p>
          </div>
          
          {/* Week Navigation */}
          <div className="flex items-center gap-4">
            <button
              onClick={goToToday}
              className="px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              Today
            </button>
            
            <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => navigateWeek(-1)}
                className="p-2 hover:bg-white rounded-md transition-colors"
                aria-label="Previous week"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              <div className="px-4 py-2 text-sm font-medium text-gray-900 min-w-[200px] text-center">
                {format(weekDates[0], 'MMM d')} - {format(weekDates[6], 'MMM d, yyyy')}
              </div>
              
              <button
                onClick={() => navigateWeek(1)}
                className="p-2 hover:bg-white rounded-md transition-colors"
                aria-label="Next week"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

          {/* Quick Add Button */}
            <Button
              onClick={() => {
                
              }}
              className="flex items-center gap-2 px-4 py-2 text-sm"
              variant="outline"
            >
              <Plus className="w-4 h-4" />
              Add Schedule
            </Button>
          </div>
        </div>
      </div>

      {/* Filters */}

      <FilterControls
        departments={departments}
        filters={filters}
        onFilterChange={setFilters}
        onSearch={handleSearch}
      />

      {/* Calendar Grid */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-auto">
          <div className="min-w-[1000px]">
            {/* Calendar Header */}
            <div className="bg-white sticky top-0 z-20 shadow-sm">
              <div className="grid grid-cols-8 border-b border-gray-200">
                <div className="sticky left-0 flex items-center gap-3 min-w-[200px] p-4 border-r border-gray-200 bg-gray-50 font-medium text-gray-700">
                  Employee
                </div>
                <div className="col-span-7 grid grid-cols-7 pl-[70px]">
                  {weekDates.map((date, index) => (
                    <div
                      key={index}
                      className={`
                        p-4 text-center border-r border-gray-200 font-medium
                        ${isSameDay(date, new Date()) ? 'bg-blue-100 text-blue-800' : 'bg-gray-50 text-gray-700'}
                      `}
                    >
                      <div className="text-sm">{format(date, 'EEE')}</div>
                      <div className="text-lg font-bold">{format(date, 'd')}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Employee Rows */}
            <div className="bg-white grid grid-cols-8" role="grid">
              {filteredEmployees.map((employee) => (
                <EmployeeRow
                  key={employee.id}
                  employee={employee}
                  weekDates={weekDates}
                  schedules={schedules}
                  attendances={attendances}
                  onCellClick={handleCellClick}
                  onEditShift={handleEditShift}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Footer */}
      <div className="bg-white border-t border-gray-200 px-6 py-3">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div>
            Showing {filteredEmployees.length} employees
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-200 border border-green-300"></div>
              <span>Confirmed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-200 border border-yellow-300"></div>
              <span>Pending</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-200 border border-blue-300"></div>
              <span>Completed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-200 border border-red-300"></div>
              <span>No Show</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};



export default WeeklyCalendar;