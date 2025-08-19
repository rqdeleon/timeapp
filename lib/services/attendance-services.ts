"use server"
import { createClient } from '../utils/supabase/server';
import { AttendanceConflict, AttendanceLog, Schedule,  ScheduleConflict } from '@/types';
import { formatInTimeZone } from 'date-fns-tz';
import { parseISO, format, startOfWeek, endOfWeek } from 'date-fns';


  export async  function getAllAttendance(): Promise<AttendanceLog[]> {
    const supabase = await createClient();

    let query = supabase
      .from('attendance_logs')
      .select(`
        *,
        employee:employee_id(
          *,
          department:department_id(id, name)
        )
      `)
      .order('date')

    const { data, error } = await query;
    
    if (error) throw error;
    
    return data.map(normalizeSchedule);
  }

  // Fetch schedules for a date range with proper timezone handling
  export async function getAttendanceByDateRange(
    startDate: string,
    endDate: string,
    employeeIds?: string[],
  ): Promise<AttendanceLog[]> {
    const supabase = await createClient();

    let query = supabase
      .from('attendance_logs')
      .select(`
        *,
        employee:employee_id(
          *,
          department:department_id(id, name)
        )
      `)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date')
      .order('start_time');

    if (employeeIds?.length) {
      query = query.eq('employee_id', employeeIds);
    }


    const { data, error } = await query;
    
    if (error) throw error;
    
    return data.map(normalizeSchedule);
  }

  // Get weekly schedules
  export async function getWeeklyAttendance(date: Date, filters: {
    departmentIds?: string[];
    employeeIds?: string[];
    statuses?: string[];
  } = {}): Promise<AttendanceLog[]> {
    const startDate = format(startOfWeek(date), 'yyyy-MM-dd');
    const endDate = format(endOfWeek(date), 'yyyy-MM-dd');
    
    return getAttendanceByDateRange(startDate, endDate, filters.employeeIds);
  }


  // Create or update schedule with conflict detection
  export async function UpsertAttendance(schedule: Partial<AttendanceLog>): Promise<{
    success: boolean;
    attendance?: AttendanceLog;
    conflicts?: AttendanceConflict[];
    error?: string;
  }> {
    const supabase = await createClient();

    try {
      // Convert times to UTC if timezone is provided
      const utcSchedule = convertToUTC(schedule);
      
      // Check for conflicts before saving
      const conflicts = await detectConflicts(utcSchedule);
      
      // If there are blocking conflicts, return them
      const blockingConflicts = conflicts.filter(c => c.severity === 'error');
      if (blockingConflicts.length > 0) {
        return {
          success: false,
          conflicts: blockingConflicts,
          error: 'Schedule conflicts detected'
        };
      }

      let result;
      if (schedule.id) {
        // Update existing schedule
        const { data, error } = await supabase
          .from('attendance_logs')
          .update(utcSchedule)
          .eq('id', schedule.id)
          .select()
          .single();
        
        if (error) throw error;
        result = data;
      } else {
        // Create new schedule
        const { data, error } = await supabase
          .from('attendance_logs')
          .insert([utcSchedule])
          .select()
          .single();
        
        if (error) throw error;
        result = data;
      }

      return {
        success: true,
        attendance: normalizeSchedule(result),
        conflicts: conflicts.filter(c => c.severity === 'warning')
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Delete schedule
  export async function deleteSchedule(id: string): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient();
    try {
      const { error } = await supabase
        .from('attendance_logs')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Detect scheduling conflicts
  export async function detectConflicts(attendance: Partial<AttendanceLog>): Promise<AttendanceConflict[]> {
    if (!attendance.employee_id || !attendance.date || !attendance.check_in_time ) {
      return [];
    }
    const supabase = await createClient();
    const { data: existingSchedules, error } = await supabase
      .from('attendance_logs')
      .select('*')
      .eq('employee_id', attendance.employee_id)
      .eq('date', attendance.date)
      .neq('id', attendance.id || '');

    if (error) return [];

    const conflicts: AttendanceConflict[] = [];
    const newCheckIn = parseISO(attendance.check_in_time);
    const newCheckOut = parseISO(attendance.check_out_time);

    for (const existing of existingSchedules) {
      const existingStart = parseISO(existing.check_in_time);
      const existingEnd = parseISO(existing.end_time);

      // Check for overlap
      if (newCheckIn < existingEnd && newCheckOut > existingStart) {
        conflicts.push({
          type: 'overlap',
          conflicting_attendance: existing as AttendanceLog,
          message: `Overlaps with existing shift from ${format(existingStart, 'HH:mm')} to ${format(existingEnd, 'HH:mm')}`,
          severity: 'error'
        });
      }
    }

    return conflicts;
  }

  // Convert schedule times to UTC
  function convertToUTC(schedule: Partial<Schedule>): Partial<Schedule> {
    if (!schedule.timezone || !schedule.start_time || !schedule.end_time) {
      return schedule;
    }

    const date = schedule.date || format(new Date(), 'yyyy-MM-dd');
    
    const startDateTime = parseISO(`${date}T${schedule.start_time}`);
    const endDateTime = parseISO(`${date}T${schedule.end_time}`);
    
    return {
      ...schedule,
      start_time: formatInTimeZone(startDateTime, schedule.timezone, 'yyyy-MM-dd').toString(),
      end_time: formatInTimeZone(endDateTime, schedule.timezone, 'yyyy-MM-dd').toString()
    };
  }

    // Normalize schedule data from database
  function normalizeSchedule(raw: any): AttendanceLog {
    return {
      ...raw,
      employee: raw.employees || raw.employee,
      shift_type: raw.shift_types || raw.shift_type,
      recurrence_rule: raw.schedule_recurrence || raw.recurrence_rule
    };
  }
