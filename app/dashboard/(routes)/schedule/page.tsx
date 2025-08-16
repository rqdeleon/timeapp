import { Suspense } from 'react';
import { Metadata } from 'next';
import { SchedulePageClient } from './components/schedule-client';
import { SchedulePageSkeleton } from './components/schedule-skeleton';
import { GetAllSchedule } from '@/lib/services/schedule-service';
import { getAllEmployees, getAllDepartments } from '@/lib/employees/api';
import { getAllShiftType } from '@/lib/services/shift-type';
import { format, startOfWeek, endOfWeek } from 'date-fns';

export const metadata: Metadata = {
  title: 'Weekly Schedule | HRIS',
  description: 'Manage employee shifts and schedules',
};

// Initial data fetching on server
async function getInitialData() {
  const currentDate = new Date();
  const startDate = format(startOfWeek(currentDate), 'yyyy-MM-dd');
  const endDate = format(endOfWeek(currentDate), 'yyyy-MM-dd');

  try {
    const [schedules, employees, departments, shiftTypes] = await Promise.all([
      GetAllSchedule(),
      getAllEmployees(),
      // These would be separate services
      getAllDepartments(),
      getAllShiftType(),
    ]);
    return {
      initialSchedules: schedules,
      employees,
      departments,
      shiftTypes,
      initialDate: currentDate.toISOString()
    };
  } catch (error) {
    console.error('Failed to fetch initial data:', error);
    return {
      initialSchedules: [],
      employees: [],
      departments: [],
      shiftTypes: [],
      initialDate: currentDate.toISOString()
    };
  }
}

export default async function SchedulePage() {
  const initialData = await getInitialData();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Weekly Schedule Management
              </h1>
              <p className="mt-2 text-gray-600">
                Manage employee shifts, track attendance, and optimize scheduling
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-500">
                Last updated: {format(new Date(), 'MMM d, yyyy h:mm a')}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Suspense fallback={<SchedulePageSkeleton />}>
        <SchedulePageClient initialData={initialData}  />
      </Suspense>
    </div>
  );
}