"use server"

import { createClient } from "@/utils/supabase/server";

export async function getAttendance(startDate: string, endDate: string, department?: string) {
  
  const supabase = await createClient()
  
  if( !startDate || !endDate ) return null

  let query = supabase
    .from("schedules")
    .select(`
      employee:employee_id (
        id,
        name,
        department:department_id(
          id,
          name
        )
      ),
      *,
      attendance_logs (
        check_in_time,
        check_out_time,
        is_late
      )
    `)
    .gte("date", startDate)
    .lte("date", endDate);

  // if (department) query = query.eq("employee.department.name", department);

  const { data, error } = await query;

  if (error) throw new Error(error.message);

  const reportMap = new Map();

  for (const row of data) {
    const emp = row.employee;
    if (!emp) continue;

    if (!reportMap.has(emp.id)) {
      reportMap.set(emp.id, {
        name: emp.name,
        department: emp.department?.name,
        totalScheduledHours: 0,
        totalWorkedHours: 0,
        lateCount: 0,
        absences: 0,
      });
    }

    const entry = reportMap.get(emp.id);
    const scheduledHours = calculateHours(row.start_time, row.end_time);
    entry.totalScheduledHours += scheduledHours;

    if (row.status === "no-show") entry.absences += 1;

    const log = row.attendance_logs?.[0];
    if (log?.check_in_time && log?.check_out_time) {
      const worked = calculateWorkedHours(log.check_in_time, log.check_out_time);
      entry.totalWorkedHours += worked;
      if (log.is_late) entry.lateCount += 1;
    }
  }

  return Array.from(reportMap.values());
}

function calculateHours(start: string, end: string) {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  return Math.round((eh * 60 + em - (sh * 60 + sm)) / 60);
}

function calculateWorkedHours(checkIn: string, checkOut: string) {
  const inTime = new Date(checkIn).getTime();
  const outTime = new Date(checkOut).getTime();
  return Math.round((outTime - inTime) / (1000 * 60 * 60)); // ms to hours
}
