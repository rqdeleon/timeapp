"use server"
import { createClient } from '../utils/supabase/server';
import { Schedule,  ScheduleConflict } from '@/types';
import { formatInTimeZone } from 'date-fns-tz';
import { parseISO, format, startOfWeek, endOfWeek } from 'date-fns';


  export async  function GetAllSchedule(): Promise<Schedule[]> {
    const supabase = await createClient();

    let query = supabase
      .from('schedules')
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
  export async function GetSchedulesByDateRange(
    startDate: string,
    endDate: string,
    employeeIds?: string[],
    departmentId?: string
  ): Promise<Schedule[]> {
    const supabase = await createClient();

    let query = supabase
      .from('schedules')
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
      query = query.in('employee_id', employeeIds);
    }

    if (departmentId) {
      query = query.eq('employee.department_id', departmentId);
    }

    const { data, error } = await query;
    
    if (error) throw error;
    
    return data.map(normalizeSchedule);
  }

  // Get weekly schedules
  export async function GetWeeklySchedules(date: Date, filters: {
    departmentIds?: string[];
    employeeIds?: string[];
    statuses?: string[];
  } = {}): Promise<Schedule[]> {
    const startDate = format(startOfWeek(date), 'yyyy-MM-dd');
    const endDate = format(endOfWeek(date), 'yyyy-MM-dd');
    
    return GetSchedulesByDateRange(startDate, endDate, filters.employeeIds);
  }


  // Create or update schedule with conflict detection
  export async function UpsertSchedule(schedule: Partial<Schedule>): Promise<{
    success: boolean;
    schedule?: Schedule;
    conflicts?: ScheduleConflict[];
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
          .from('schedules')
          .update(utcSchedule)
          .eq('id', schedule.id)
          .select()
          .single();
        
        if (error) throw error;
        result = data;
      } else {
        // Create new schedule
        const { data, error } = await supabase
          .from('schedules')
          .insert([utcSchedule])
          .select()
          .single();
        
        if (error) throw error;
        result = data;
      }

      return {
        success: true,
        schedule: normalizeSchedule(result),
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
        .from('schedules')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Detect scheduling conflicts
  export async function detectConflicts(schedule: Partial<Schedule>): Promise<ScheduleConflict[]> {
    if (!schedule.employee_id || !schedule.date || !schedule.start_time || !schedule.end_time) {
      return [];
    }
    const supabase = await createClient();
    const { data: existingSchedules, error } = await supabase
      .from('schedules')
      .select('*')
      .eq('employee_id', schedule.employee_id)
      .eq('date', schedule.date)
      .neq('id', schedule.id || '');

    if (error) return [];

    const conflicts: ScheduleConflict[] = [];
    const newStart = parseISO(schedule.start_time);
    const newEnd = parseISO(schedule.end_time);

    for (const existing of existingSchedules) {
      const existingStart = parseISO(existing.start_time);
      const existingEnd = parseISO(existing.end_time);

      // Check for overlap
      if (newStart < existingEnd && newEnd > existingStart) {
        conflicts.push({
          type: 'overlap',
          conflicting_schedule: existing as Schedule,
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
  function normalizeSchedule(raw: any): Schedule {
    return {
      ...raw,
      employee: raw.employees || raw.employee,
      shift_type: raw.shift_types || raw.shift_type,
      recurrence_rule: raw.schedule_recurrence || raw.recurrence_rule
    };
  }
