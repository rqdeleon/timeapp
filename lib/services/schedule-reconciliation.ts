"use server";

import { createClient } from '@/lib/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export interface ReconciliationResult {
  scheduleId: string;
  employeeId: string;
  date: string;
  previousStatus: string;
  newStatus: string;
  reason: string;
  attendanceData: {
    hasCheckIn: boolean;
    hasCheckOut: boolean;
    checkInTime?: string;
    checkOutTime?: string;
  };
}

export interface ReconciliationSummary {
  totalProcessed: number;
  statusChanges: number;
  results: ReconciliationResult[];
  errors: string[];
}

/**
 * Reconcile schedule status for a single employee on a specific date
 */
export async function reconcileEmployeeScheduleForDate(
  employeeId: string,
  date: string
): Promise<ReconciliationResult[]> {
  const supabase = await createClient();
  const results: ReconciliationResult[] = [];

  try {
    // Get all schedules for the employee on the specified date
    const { data: schedules, error: schedulesError } = await supabase
      .from('schedules')
      .select('*')
      .eq('employee_id', employeeId)
      .eq('date', date);

    if (schedulesError) {
      console.error('Error fetching schedules:', schedulesError);
      return results;
    }

    // Get all attendance logs for the employee on the specified date
    const { data: attendanceLogs, error: attendanceError } = await supabase
      .from('attendance_logs')
      .select('*')
      .eq('employee_id', employeeId)
      .eq('date', date);

    if (attendanceError) {
      console.error('Error fetching attendance logs:', attendanceError);
      return results;
    }

    // Process each schedule
    for (const schedule of schedules || []) {
      const previousStatus = schedule.status;
      const { newStatus, reason, attendanceData } = computeScheduleStatus(
        schedule,
        attendanceLogs || []
      );

      // Only update if status actually changed
      if (previousStatus !== newStatus) {
        const { error: updateError } = await supabase
          .from('schedules')
          .update({
            status: newStatus,
            status_updated_at: new Date().toISOString(),
            auto_computed: true,
          })
          .eq('id', schedule.id);

        if (!updateError) {
          results.push({
            scheduleId: schedule.id,
            employeeId,
            date,
            previousStatus,
            newStatus,
            reason,
            attendanceData,
          });
        } else {
          console.error(`Failed to update schedule ${schedule.id}:`, updateError);
        }
      }
    }

    return results;
  } catch (error) {
    console.error('Error in reconcileEmployeeScheduleForDate:', error);
    return results;
  }
}

export async function reconcileEmployeeAfterAttendance(
  employeeId: string,
  date: string,
  checkIn?: string,
  checkout?: string,
): Promise<ReconciliationResult[]> {
  const supabase = await createClient();
  const results: ReconciliationResult[] = [];

  try {
    // Get all schedules for the employee on the specified date
    const { data: schedules, error: schedulesError } = await supabase
      .from('schedules')
      .select('*')
      .eq('employee_id', employeeId)
      .eq('date', date);

    if (schedulesError) {
      console.error('Error fetching schedules:', schedulesError);
      return results;
    }

    const newAttendance = [{
      employee_id: employeeId,
      date: date,
      check_in_time: checkIn || null,
      check_out_time: checkout || null
    }]
    
    // Process each schedule
    for (const schedule of schedules || []) {
      const previousStatus = schedule.status;
      const { newStatus, reason, attendanceData } = computeScheduleStatus(
        schedule,
        newAttendance
      );

      // Only update if status actually changed
      if (previousStatus !== newStatus) {
        const { error: updateError } = await supabase
          .from('schedules')
          .update({
            status: newStatus,
            status_updated_at: new Date().toISOString(),
            auto_computed: true,
          })
          .eq('id', schedule.id);

        if (!updateError) {
          results.push({
            scheduleId: schedule.id,
            employeeId,
            date,
            previousStatus,
            newStatus,
            reason,
            attendanceData,
          });
        } else {
          console.error(`Failed to update schedule ${schedule.id}:`, updateError);
        }
      }
    }

    return results;
  } catch (error) {
    console.error('Error in reconcileEmployeeScheduleForDate:', error);
    return results;
  }
}

/**
 * Reconcile schedule statuses for multiple employees on a specific date
 */
export async function reconcileSchedulesForDate(
  date: string,
  employeeIds?: string[]
): Promise<ReconciliationSummary> {
  const supabase = await createClient();
  const summary: ReconciliationSummary = {
    totalProcessed: 0,
    statusChanges: 0,
    results: [],
    errors: [],
  };

  try {
    // Get employee IDs to process
    let targetEmployeeIds = employeeIds;
    
    if (!targetEmployeeIds) {
      // Get all employees who have schedules on this date
      const { data: scheduledEmployees } = await supabase
        .from('schedules')
        .select('employee_id')
        .eq('date', date);
      
      targetEmployeeIds = [...new Set(
        scheduledEmployees?.map(s => s.employee_id) || []
      )];
    }

    // Process each employee
    for (const employeeId of targetEmployeeIds) {
      try {
        const employeeResults = await reconcileEmployeeScheduleForDate(employeeId, date);
        summary.results.push(...employeeResults);
        summary.totalProcessed++;
      } catch (error) {
        const errorMsg = `Failed to reconcile employee ${employeeId}: ${error.message}`;
        summary.errors.push(errorMsg);
        console.error(errorMsg, error);
      }
    }

    summary.statusChanges = summary.results.length;

    // Revalidate relevant paths to refresh the UI
    revalidatePath('/dashboard/schedule');
    revalidatePath('/dashboard/attendance');

    return summary;
  } catch (error) {
    summary.errors.push(`Reconciliation failed: ${error.message}`);
    console.error('Error in reconcileSchedulesForDate:', error);
    return summary;
  }
}

/**
 * Reconcile schedules for a date range
 */
export async function reconcileSchedulesForDateRange(
  startDate: string,
  endDate: string,
  employeeIds?: string[]
): Promise<ReconciliationSummary> {
  const summary: ReconciliationSummary = {
    totalProcessed: 0,
    statusChanges: 0,
    results: [],
    errors: [],
  };

  const start = new Date(startDate);
  const end = new Date(endDate);
  const currentDate = new Date(start);

  while (currentDate <= end) {
    const dateStr = currentDate.toISOString().split('T')[0];
    
    try {
      const dayResults = await reconcileSchedulesForDate(dateStr, employeeIds);
      
      summary.totalProcessed += dayResults.totalProcessed;
      summary.statusChanges += dayResults.statusChanges;
      summary.results.push(...dayResults.results);
      summary.errors.push(...dayResults.errors);
    } catch (error) {
      summary.errors.push(`Failed to process date ${dateStr}: ${error.message}`);
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return summary;
}

/**
 * Core logic to compute schedule status based on attendance
 */
function computeScheduleStatus(
  schedule: any,
  attendanceLogs: any[]
): {
  newStatus: string;
  reason: string;
  attendanceData: {
    hasCheckIn: boolean;
    hasCheckOut: boolean;
    checkInTime?: string;
    checkOutTime?: string;
  };
} {
  // Find relevant attendance logs for this schedule
  console.log(attendanceLogs)
  const relevantLogs = attendanceLogs.filter(log =>
    log.schedule_id === schedule.id ||
    (log.date === schedule.date && log.employee_id === schedule.employee_id)
  );

  const attendanceData = {
    hasCheckIn: false,
    hasCheckOut: false,
    checkInTime: undefined,
    checkOutTime: undefined,
  };

  if (relevantLogs.length === 0) {
    return {
      newStatus: 'no-show',
      reason: 'No attendance recorded for scheduled shift',
      attendanceData,
    };
  }

  // For simplicity, take the first/primary log
  // In a more complex system, you might merge multiple logs
  const primaryLog = relevantLogs[0];
  
  attendanceData.hasCheckIn = !!primaryLog.check_in_time;
  attendanceData.hasCheckOut = !!primaryLog.check_out_time;
  attendanceData.checkInTime = primaryLog.check_in_time;
  attendanceData.checkOutTime = primaryLog.check_out_time;

  if (primaryLog.check_in_time && primaryLog.check_out_time) {
    return {
      newStatus: 'completed',
      reason: 'Employee checked in and out successfully',
      attendanceData,
    };
  } else if (primaryLog.check_in_time && !primaryLog.check_out_time) {
    return {
      newStatus: 'checked-in',
      reason: 'Employee checked in but has not checked out yet',
      attendanceData,
    };
  } else if (!primaryLog.check_in_time && primaryLog.check_out_time) {
    // Edge case: checkout without checkin
    return {
      newStatus: 'pending',
      reason: 'Employee checked out without checking in (data anomaly)',
      attendanceData,
    };
  } else {
    return {
      newStatus: 'pending',
      reason: 'Attendance record exists but no check-in/out times',
      attendanceData,
    };
  }
}

/**
 * Trigger reconciliation when attendance is modified
 * This is called from attendance-related server actions
 */
export async function triggerReconciliationForAttendance(
  employeeId: string,
  date: string,
  operationType: 'INSERT' | 'UPDATE' | 'DELETE'
): Promise<ReconciliationResult[]> {
  console.log(`Triggering reconciliation for employee ${employeeId} on ${date} (${operationType})`);
  
  try {
    const results = await reconcileEmployeeScheduleForDate(employeeId, date);
    
    if (results.length > 0) {
      console.log(`Reconciliation completed: ${results.length} status changes`);
      results.forEach(result => {
        console.log(`Schedule ${result.scheduleId}: ${result.previousStatus} → ${result.newStatus}`);
      });
    }
    
    return results;
  } catch (error) {
    console.error('Error in triggerReconciliationForAttendance:', error);
    return [];
  }
}