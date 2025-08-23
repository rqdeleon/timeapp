"use server"
import { createClient } from '@/lib/utils/supabase/server'
import { AttendanceLog, AttendanceFilters, AttendanceSummary } from '@/types/attendance'

export async function getAllAttendance(): Promise<AttendanceLog[]>{
  const supabase = await createClient()
  
  let query = supabase
    .from('attendance_logs')
    .select(`
      *,
      employee:employees(id, name, department:departments(name))
    `)
    .order('date', { ascending: false })
  
  const { data, error } = await query
  
  return data || []
}

export async function getAttendanceRecords(
  filters: AttendanceFilters,
  page = 1,
  pageSize = 50
): Promise<{ data: AttendanceLog[]; total: number }> {
  const supabase = await createClient()
  
  let query = supabase
    .from('attendance_logs')
    .select(`
      *,
      employee:employee_id(*, department:department_id(id,name))
    `)
    .gte('date', filters.dateRange.from.toISOString())
    .lte('date', filters.dateRange.to.toISOString())
    .order('date', { ascending: false })

  // Apply filters
  if (filters.departments.length > 0) {
    query = query.in('employee.department.id', filters.departments)
  }
  
  if (filters.employees.length > 0) {
    query = query.in('employee_id', filters.employees)
  }

  // Get total count
  const { count } = await supabase
    .from('attendance_logs')
    .select('*', { count: 'exact', head: true })
    .gte('date', filters.dateRange.from.toISOString())
    .lte('date', filters.dateRange.to.toISOString())

  // Get paginated data
  const { data, error } = await query

  if (error) throw new Error('Failed to fetch attendance records')
  
  return { data: data || [], total: count || 0 }
}

export async function getAttendanceByEmployeeId(
  empId: string
): Promise<AttendanceLog[]>{
  const supabase = await createClient()

  const { data, error} = await supabase
  .from('attendance_logs')
  .select('*, employee:employee_id(id,name)')
  .eq('employee_id', empId)
  
  return data
};

export async function getAttendanceSummary(
  filters: AttendanceFilters
): Promise<AttendanceSummary> {
  const supabase = await createClient()
  
  // Use SQL function for efficient calculation
  const { data, error } = await supabase.rpc('calculate_attendance_summary', {
    start_date: filters.dateRange.from.toISOString(),
    end_date: filters.dateRange.to.toISOString(),
  })

  if (error) throw new Error('Failed to calculate attendance summary')
  
  return data[0]
}

export async function updateAttendanceRecord(
  id: string,
  updates: Partial<AttendanceLog>
): Promise<void> {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('attendance_logs')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)

  if (error) throw new Error('Failed to update attendance record')
}

export async function bulkApproveOvertime(
  recordIds: string[],
  approvedHours?: number
): Promise<void> {
  const supabase = await createClient()
  
  const updates = recordIds.map(id => ({
    id,
    approval_status: 'approved' as const,
    overtime_hours_approved: approvedHours,
    updated_at: new Date().toISOString()
  }))

  const { error } = await supabase
    .from('attendance_records')
    .upsert(updates)

  if (error) throw new Error('Failed to bulk approve overtime')
}