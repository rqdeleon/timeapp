'use client';

import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useRouter } from 'next/navigation';

import WeeklyCalendar from './weekly-calendar';
import { ScheduleFormClient } from './schedule-form';
// import { ScheduleStats } from './ScheduleStats';
import ShiftModal from './shift-modal';
import { ErrorBoundary } from './error-boundary';
import { AttendanceLog, Department, Employee, Schedule, ShiftType } from '@/types';
import { ScheduleAnalytics } from './schedule-analytics';

interface SchedulePageClientProps {
  initialData: {
    initialSchedules: Schedule[];
    attendances: AttendanceLog[];
    employees: Employee[];
    departments: Department[];
    shiftTypes: ShiftType[];
    initialDate?: string | null;
  }
}

// Create a stable query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchInterval: 1000 * 60 * 10, // 10 minutes
      retry: (failureCount, error: any) => {
        if (error?.status === 404) return false;
        return failureCount < 3;
      },
    },
  },
});

export function SchedulePageClient({ initialData }: SchedulePageClientProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <SchedulePageContent initialData={initialData} />
      </ErrorBoundary>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

function SchedulePageContent({ initialData }: SchedulePageClientProps) {
  const [selectedShift, setSelectedShift] = useState(null);
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);

  // Schedule Form states (for creating new schedules)
  const [isScheduleFormOpen, setIsScheduleFormOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState({id:"",name:""});
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [weekDate, setWeekDate] = useState<Date>( new Date)
  const router = useRouter();
  const handleSave = () => {
    router.refresh();
  }
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Statistics Overview */}
      <ScheduleAnalytics 
        schedules={initialData.initialSchedules}
        employees={initialData.employees}
        weekDate={weekDate}
      />
      
      {/* Main Schedule View */}
      <WeeklyCalendar
        employees={initialData.employees}
        schedules={initialData.initialSchedules}
        attendances={initialData.attendances}
        departments={initialData.departments}
        onShiftClick={(shift) => {
          setSelectedShift(shift);
        }}
        onCellClick={(employee, date, shift) => {  
          setSelectedDate(date);
          setSelectedEmployee(employee);
          setSelectedShift(shift);
          setIsScheduleFormOpen(true);
        }}
        viewMode={viewMode}
        weekDate={weekDate}
        setWeekDate={ (newDate)=> setWeekDate(newDate)}
      />
    
      <ShiftModal
        shift={selectedShift}
        onClose={() => setIsShiftModalOpen(false)}
        isOpen={isShiftModalOpen}
        onSave={(updatedShift) => {
          console.log('Saving shift:', updatedShift);
          setIsShiftModalOpen(false);
        }}
      />  
      <ScheduleFormClient
        open={isScheduleFormOpen}
        onOpenChange={setIsScheduleFormOpen}
        onSaved={handleSave}
        initialData={initialData}
        selectedEmployee={selectedEmployee}
        selectedDate = {selectedDate}
        selectedShift = {selectedShift}
        // shiftTypes={shiftTypes}
        loading={false}
        error={null}
      />      
    </div>
  );
}