"use server"

import { createClient } from "@/lib/utils/supabase/server";

export type AttendanceReportData = {
  empId: string;
  name: string;
  department: string;
  totalScheduledHours: number;
  totalWorkedHours: number;
  lateCount: number;
  absences: number;
  overtimeHours: number;
  scheduledDays: number;
  workedDays: number;
  unscheduledWorkDays: number; // Days worked without schedule
}

type AttendanceLogData = {
  id: string;
  schedule_id: string | null;
  employee_id: string;
  date: string;
  check_in_time: string;
  check_out_time: string | null;
  is_late: boolean;
  notes: string | null;
  employee: {
    id: string;
    name: string;
    department: {
      id: string;
      name: string;
    } | null;
  };
  schedule: {
    id: string;
    date: string;
    start_time: string;
    end_time: string;
    status: string;
  } | null;
}

type ScheduleData = {
  id: string;
  employee_id: string;
  date: string;
  start_time: string;
  end_time: string;
  status: string;
  employee: {
    id: string;
    name: string;
    department: {
      id: string;
      name: string;
    } | null;
  };
}

export async function getAttendance(
  startDate: string, 
  endDate: string, 
  department?: string
): Promise<AttendanceReportData[]> {
  
  const supabase = await createClient()
  
  if (!startDate || !endDate) {
    throw new Error("Start date and end date are required")
  }

  try {
    // Step 1: Get all attendance logs in date range with employee and schedule info
    const { data: attendanceLogs, error: logsError } = await supabase
      .from("attendance_logs")
      .select(`
        *,
        employee:employee_id (
          id,
          name,
          department:department_id (
            id,
            name
          )
        ),
        schedule:schedule_id (
          *
        )
      `)
      .gte("date", startDate)
      .lte("date", endDate)
      .not('employee', 'is', null)
      .order('date', { ascending: true }) as { data: AttendanceLogData[] | null, error: any };

    if (logsError) {
      console.error('Error fetching attendance logs:', logsError);
      throw new Error(`Failed to fetch attendance logs: ${logsError.message}`);
    }

    // Step 2: Get all schedules in date range (including those without attendance logs)
    const { data: schedules, error: schedulesError } = await supabase
      .from("schedules")
      .select(`
        *,
        employee:employee_id (
          id,
          name,
          department:department_id (
            id,
            name
          )
        )
      `)
      .gte("date", startDate)
      .lte("date", endDate)
      .not('employee', 'is', null)
      .order('date', { ascending: true }) as { data: ScheduleData[] | null, error: any };

    if (schedulesError) {
      console.error('Error fetching schedules:', schedulesError);
      throw new Error(`Failed to fetch schedules: ${schedulesError.message}`);
    }

    const logs = attendanceLogs || [];
    const scheduleData = schedules || [];

    // Step 3: Build comprehensive employee attendance map
    const employeeMap = new Map<string, AttendanceReportData>();
    const processedSchedules = new Set<string>(); // Track which schedules have logs

    // Process attendance logs first
    for (const log of logs) {
      const emp = log.employee;
      if (!emp || !emp.id) continue;

      // Filter by department if specified
      if (department && emp.department?.name?.toLowerCase() !== department.toLowerCase()) {
        continue;
      }

      if (!employeeMap.has(emp.id)) {
        employeeMap.set(emp.id, {
          empId: emp.id,
          name: emp.name || 'Unknown',
          department: emp.department?.name || 'Unassigned',
          totalScheduledHours: 0,
          totalWorkedHours: 0,
          lateCount: 0,
          absences: 0,
          overtimeHours: 0,
          scheduledDays: 0,
          workedDays: 0,
          unscheduledWorkDays: 0,
        });
      }

      const entry = employeeMap.get(emp.id)!;

      // Calculate worked hours for this log
      if (log.check_in_time && log.check_out_time) {
        const workedHours = calculateWorkedHours(log.check_in_time, log.check_out_time);
        entry.totalWorkedHours += workedHours;
        entry.workedDays += 1;

        // Handle late arrivals
        if (log.is_late) {
          entry.lateCount += 1;
        }

        // If there's a corresponding schedule
        if (log.schedule_id && log.schedule) {
          processedSchedules.add(log.schedule_id);
          const scheduledHours = calculateHours(log.schedule.start_time, log.schedule.end_time);
          entry.totalScheduledHours += scheduledHours;
          entry.scheduledDays += 1;

          // Calculate overtime (worked hours exceed scheduled hours for this day)
          const overtime = Math.max(0, workedHours - scheduledHours);
          entry.overtimeHours += overtime;
        } else {
          // No schedule but worked - unscheduled work day
          entry.unscheduledWorkDays += 1;
        }
      } else if (log.check_in_time && !log.check_out_time) {
        // Incomplete log - still counts as worked day but with 0 hours
        entry.workedDays += 1;
        
        if (log.schedule_id && log.schedule) {
          processedSchedules.add(log.schedule_id);
          const scheduledHours = calculateHours(log.schedule.start_time, log.schedule.end_time);
          entry.totalScheduledHours += scheduledHours;
          entry.scheduledDays += 1;
        } else {
          entry.unscheduledWorkDays += 1;
        }
        
      }
    }

    // Step 4: Process schedules that don't have attendance logs (absences)
    for (const schedule of scheduleData) {
      const emp = schedule.employee;
      if (!emp || !emp.id) continue;

      // Filter by department if specified
      if (department && emp.department?.name?.toLowerCase() !== department.toLowerCase()) {
        continue;
      }

      // Skip if this schedule already has an attendance log
      if (processedSchedules.has(schedule.id)) {
        continue;
      }

      if (!employeeMap.has(emp.id)) {
        employeeMap.set(emp.id, {
          empId: emp.id,
          name: emp.name || 'Unknown',
          department: emp.department?.name || 'Unassigned',
          totalScheduledHours: 0,
          totalWorkedHours: 0,
          lateCount: 0,
          absences: 0,
          overtimeHours: 0,
          scheduledDays: 0,
          workedDays: 0,
          unscheduledWorkDays: 0,
        });
      }

      const entry = employeeMap.get(emp.id)!;
      const scheduledHours = calculateHours(schedule.start_time, schedule.end_time);
      
      entry.totalScheduledHours += scheduledHours;
      entry.scheduledDays += 1;

      // Count as absence if status indicates no-show or if no attendance log exists
      if (schedule.status === "no-show" || schedule.status === "pending") {
        entry.absences += 1;
      }
    }

    return Array.from(employeeMap.values()).sort((a, b) => a.name.localeCompare(b.name));

  } catch (error) {
    console.error('Error in getAttendance:', error);
    throw error;
  }
}

function calculateHours(startTime: string, endTime: string): number {
  try {
    const [startHour, startMinute] = startTime.split(":").map(Number);
    const [endHour, endMinute] = endTime.split(":").map(Number);
    
    const startMinutes = startHour * 60 + startMinute;
    const endMinutes = endHour * 60 + endMinute;
    
    // Handle overnight shifts
    const diffMinutes = endMinutes >= startMinutes 
      ? endMinutes - startMinutes 
      : (24 * 60) + endMinutes - startMinutes;
    
    return Math.round((diffMinutes / 60) * 100) / 100; // Round to 2 decimal places
  } catch (error) {
    console.error('Error calculating hours:', error);
    return 0;
  }
}

function calculateWorkedHours(checkInTime: string, checkOutTime: string): number {
  try {
    const inTime = new Date(checkInTime).getTime();
    const outTime = new Date(checkOutTime).getTime();
    
    if (isNaN(inTime) || isNaN(outTime) || outTime <= inTime) {
      return 0;
    }
    
    const diffMs = outTime - inTime;
    const diffHours = diffMs / (1000 * 60 * 60);
    
    return Math.round(diffHours * 100) / 100; // Round to 2 decimal places
  } catch (error) {
    console.error('Error calculating worked hours:', error);
    return 0;
  }
}