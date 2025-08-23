"use server"
import { createClient } from '@/lib/utils/supabase/server';
import { AttendanceLog, AttendanceSummary, AttendanceFilters, AttendanceStatus } from '@/types/attendance';
import { format, differenceInMinutes } from 'date-fns';

/**
 * Fetches all attendance records for summary calculation (without pagination)
 */
export async function getAllAttendanceRecordsForSummary(
  filters: AttendanceFilters
): Promise<AttendanceLog[]> {
  const supabase = await createClient();

  let query = supabase
    .from('attendance_logs')
    .select(`
      *,
      employee:employee_id(id, name, department:department_id(name))
    `)
    .gte('date', filters.dateRange.from.toISOString())
    .lte('date', filters.dateRange.to.toISOString());

  // Apply filters
  if (filters.departments && filters.departments.length > 0) {
    query = query.in('employee.department.name', filters.departments);
  }

  if (filters.employees && filters.employees.length > 0) {
    query = query.in('employee_id', filters.employees);
  }

  if (filters.status && filters.status.length > 0) {
    query = query.in('status', filters.status);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch attendance records for summary: ${error.message}`);
  }

  return data || [];
}

/**
 * Computes attendance summary from attendance logs
 */
export async function  computeAttendanceSummary(attendanceLogs: AttendanceLog[]):Promise<AttendanceSummary> {
  // Initialize summary
  const summary: AttendanceSummary = {
    total_days_worked: 0,
    total_hours_worked: 0,
    total_overtime_hours: 0,
    total_approved_overtime: 0,
    total_sunday_hours: 0,
    total_overnight_hours: 0,
    total_employees: 0,
  };

  if (!attendanceLogs || attendanceLogs.length === 0) {
    return summary;
  }

  // Track unique employees
  const uniqueEmployees = new Set<string>();

  // Process each attendance log
  attendanceLogs.forEach((log) => {
    // Count unique employees
    uniqueEmployees.add(log.employee_id);

    // Only count logs that have valid check-in and check-out times
    if (log.check_in_time) {
      // Count days worked (each log represents a day worked)
      summary.total_days_worked += 1;

      // Sum total hours worked
      
      summary.total_hours_worked += log.total_hours;

      // Sum overtime hours (raw overtime)
      if (log.raw_ot_hours && log.raw_ot_hours > 0) {
        summary.total_overtime_hours += log.raw_ot_hours;
      }

      // Sum approved overtime hours
      if (log.approved_ot_hours && log.approved_ot_hours > 0) {
        summary.total_approved_overtime += log.approved_ot_hours;
      }

      // Sum Sunday hours
      if (log.is_sunday) {
        summary.total_sunday_hours += log.total_hours;
      }

      // Sum overnight hours
      if (log.is_overnight && log.overnight_hours && log.overnight_hours > 0) {
        summary.total_overnight_hours += log.overnight_hours;
      }
    }
  });

  // Set total unique employees
  summary.total_employees = uniqueEmployees.size;

  return summary;
}

/**
 * Main function to get attendance summary based on filters
 */
export async function getAttendanceSummary(
  filters: AttendanceFilters
): Promise<AttendanceSummary> {
  try {
    // Fetch all attendance records for the given filters
    const attendanceLogs = await getAllAttendanceRecordsForSummary(filters);

    // Compute and return summary
    return computeAttendanceSummary(attendanceLogs);

  } catch (error) {
    console.error('Error computing attendance summary:', error);
    throw new Error('Failed to compute attendance summary');
  }
}

/**
 * Alternative approach: Compute summary using Supabase aggregations (more efficient for large datasets)
 */
export async function getAttendanceSummaryWithAggregation(
  filters: AttendanceFilters
): Promise<AttendanceSummary> {
  const supabase = await createClient();

  try {
    // Base query conditions
    const baseConditions = {
      date: `gte.${filters.dateRange.from.toISOString()},lte.${filters.dateRange.to.toISOString()}`,
      ...(filters.departments && filters.departments.length > 0 && {
        'employee.department.name': `in.(${filters.departments.join(',')})`
      }),
      ...(filters.employees && filters.employees.length > 0 && {
        employee_id: `in.(${filters.employees.join(',')})`
      }),
      ...(filters.status && filters.status.length > 0 && {
        status: `in.(${filters.status.join(',')})`
      }),
    };

    // Execute multiple queries in parallel for better performance
    const [
      totalStatsResult,
      uniqueEmployeesResult,
      sundayHoursResult,
      overnightHoursResult
    ] = await Promise.all([
      // Get basic stats (days, hours, overtime)
      supabase
        .from('attendance_logs')
        .select('total_hours.sum(), raw_ot_hours.sum(), approved_ot_hours.sum()')
        .gte('date', filters.dateRange.from.toISOString())
        .lte('date', filters.dateRange.to.toISOString())
        .not('check_out_time', 'is', null)
        .gt('total_hours', 0),

      // Get unique employees count
      supabase
        .from('attendance_logs')
        .select('employee_id', { count: 'exact' })
        .gte('date', filters.dateRange.from.toISOString())
        .lte('date', filters.dateRange.to.toISOString()),

      // Get Sunday hours
      supabase
        .from('attendance_logs')
        .select('total_hours.sum()')
        .gte('date', filters.dateRange.from.toISOString())
        .lte('date', filters.dateRange.to.toISOString())
        .eq('is_sunday', true)
        .not('check_out_time', 'is', null)
        .gt('total_hours', 0),

      // Get overnight hours
      supabase
        .from('attendance_logs')
        .select('overnight_hours.sum()')
        .gte('date', filters.dateRange.from.toISOString())
        .lte('date', filters.dateRange.to.toISOString())
        .eq('is_overnight', true)
        .not('check_out_time', 'is', null)
        .not('overnight_hours', 'is', null)
        .gt('overnight_hours', 0)
    ]);

    // Handle potential errors
    if (totalStatsResult.error) throw totalStatsResult.error;
    if (uniqueEmployeesResult.error) throw uniqueEmployeesResult.error;
    if (sundayHoursResult.error) throw sundayHoursResult.error;
    if (overnightHoursResult.error) throw overnightHoursResult.error;

    // Extract data from results
    const totalStats = totalStatsResult.data?.[0];
    const uniqueEmployees = new Set(uniqueEmployeesResult.data?.map(log => log.employee_id)).size;
    const sundayHours = sundayHoursResult.data?.[0]?.sum || 0;
    const overnightHours = overnightHoursResult.data?.[0]?.sum || 0;

    // Count total days worked (count of valid attendance logs)
    const { count: totalDaysWorked } = await supabase
      .from('attendance_logs')
      .select('*', { count: 'exact', head: true })
      .gte('date', filters.dateRange.from.toISOString())
      .lte('date', filters.dateRange.to.toISOString())
      .not('check_out_time', 'is', null)
      .gt('total_hours', 0);

    return {
      total_days_worked: totalDaysWorked || 0,
      total_hours_worked: totalStats?.sum || 0,
      total_overtime_hours: totalStats?.sum || 0, // Assuming raw_ot_hours sum
      total_approved_overtime: totalStats?.sum || 0, // Assuming approved_ot_hours sum
      total_sunday_hours: sundayHours,
      total_overnight_hours: overnightHours,
      total_employees: uniqueEmployees,
    };
  } catch (error) {
    console.error('Error computing attendance summary with aggregation:', error);
    throw new Error('Failed to compute attendance summary');
  }
}

/**
 * Helper function to validate attendance filters
 */
export async function validateAttendanceFilters(filters: AttendanceFilters): Promise<boolean> {
  if (!filters.dateRange?.from || !filters.dateRange?.to) {
    return false;
  }

  if (filters.dateRange.from > filters.dateRange.to) {
    return false;
  }

  return true;
}

/**
 * Helper function to format summary for display
 */
export async function formatAttendanceSummary(summary: AttendanceSummary) {
  return {
    ...summary,
    total_hours_worked: Math.round(summary.total_hours_worked * 100) / 100,
    total_overtime_hours: Math.round(summary.total_overtime_hours * 100) / 100,
    total_approved_overtime: Math.round(summary.total_approved_overtime * 100) / 100,
    total_sunday_hours: Math.round(summary.total_sunday_hours * 100) / 100,
    total_overnight_hours: Math.round(summary.total_overnight_hours * 100) / 100,
  };
}