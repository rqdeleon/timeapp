"use client"
import { useCallback } from "react";
import { format, isSameDay } from "date-fns";
import { Plus, PlusCircle } from "lucide-react";

import ShiftCard from "./shift-card";

// Employee Row Component
const EmployeeRow = ({ employee, weekDates, schedules, attendances, onCellClick, onEditShift }) => {
  const getShiftsForDate = useCallback((date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return schedules.filter(s => s.employee_id === employee.id && s.date === dateStr);
  }, [schedules, employee.id]);

  const getAttendansForDate = useCallback((date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return attendances.filter(s => s.employee_id === employee.id && s.date === dateStr);
  }, [attendances, employee.id]);
  
  return (
    <div className="contents" role="row">
      {/* Employee Info */}
      <div className="sticky left-0 bg-white border-r border-gray-200 p-4 flex items-center gap-3 min-w-[200px] shadow-sm z-10">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold">
          {employee.name.split(' ').map(n => n[0]).join('')}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-gray-900 truncate">{employee.name}</div>
          <div className="text-sm text-gray-500 truncate">{employee.position ? employee.position: " " }</div>
          <div className="text-xs text-gray-400 truncate">{employee.department ? employee.department.name : " "}</div>
        </div>
      </div>
      
      <div className="col-span-7 grid grid-cols-7 pl-[70px]">
        {/* Date Cells */}
        {weekDates.map((date) => {
          const shifts = getShiftsForDate(date);
          const isToday = isSameDay(date, new Date());
          const checkins = getAttendansForDate(date);

          return (
            <div
              key={date.toISOString()}
              className={`
                min-h-[100px] p-2 border-r border-b border-gray-200 group 
                hover:bg-gray-50 transition-colors cursor-pointer
                ${isToday ? 'bg-blue-50 ring-1 ring-blue-200' : 'bg-white'}
              `}
              role="gridcell"
              aria-label={`${employee.name} schedule for ${format(date, 'EEEE, MMMM d')}`}
              
            >
              <div className="space-y-2 h-full w-full" >
                {shifts.length > 0 ? (
                  shifts.map((shift) => (
                    <div
                      key={shift.id}
                      onClick={() => {onCellClick(employee, date, shift)}}
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          onCellClick(employee, date, shift);
                        }
                      }}
                    >
                      <ShiftCard
                        shift={shift}
                        onEdit={onEditShift}
                        conflicts={[]} // Would implement conflict detection
                      />

                    </div>
                  ))
                ) : (
                  <div 
                    className="h-full w-full flex items-center justify-center"
                    onClick={() => onCellClick(employee, date)}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onCellClick(employee, date);
                      }
                    }}
                  >
                    <PlusCircle className="w-5 h-5 text-gray-300 group-hover:w-7 group-hover:h-7 transition-transform" />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default EmployeeRow;