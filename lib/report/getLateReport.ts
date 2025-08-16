"use server";

import { createClient } from "@/lib/utils/supabase/server";
import { format } from "date-fns";

export async function getLateAndTardyReport(startDate: string, endDate: string, departmentId?: string) {
  
  const supabase = await createClient();

  let query = supabase
    .from("schedules")
    .select(`
      *,
      employee:employee_id (
        id,
        name,
        department:department_id (
          name
        )
      ),
      attendance_logs(
        check_in_time
      )
    `)
    .gte("date", startDate)
    .lte("date", endDate);

  if (departmentId) {
    query = query.eq("employee.department_id", departmentId);
  }

  const { data, error } = await query;

  if (error) throw new Error(error.message);
  
  
     const formatted = data.map((entry) => {
        const { employee, attendance_logs } = entry;
        const checkIn = attendance_logs?.[0]?.check_in_time ?? null;
        const formattedLocalTime = checkIn && format(new Date(checkIn),"HH:mm:ss") 
        const lateDuration = computeLate(entry.start_time, formattedLocalTime);
    
        return {
          date: entry.date,
          employeeName: employee.name,
          department: employee.department.name,
          scheduledTime: entry.start_time,
          timeIn: formattedLocalTime,
          lateDuration,
          status: entry.status,
        };
      });

 
  
  return formatted;
}

function parseTimeToDate(timeStr: string): Date {
  const now = new Date();
  const [h, m] = timeStr.split(":").map(Number);
  now.setHours(h, m, 0, 0);
  return now;
}

function computeLate(scheduleStart: string, checkIn: string | null): string | null {
  if (!checkIn) return null;

  const sched = parseTimeToDate(scheduleStart);
  const actual = parseTimeToDate(checkIn);
  const diffMs = actual.getTime() - sched.getTime();
  if (diffMs <= 0) return "0 min";

  const mins = Math.floor(diffMs / 1000 / 60);
  return mins >= 60
    ? `${Math.floor(mins / 60)} hr ${mins % 60} min`
    : `${mins} min`;
}