"use server";

import { createClient } from "@/utils/supabase/server";

export async function getEmployeeScheduleHistory(startDate: string, endDate: string, employeeId?: string) {
  const supabase = await createClient();

  if (!startDate || !endDate) return null;

  let query = supabase
    .from("schedules")
    .select(`
      *,
      shift_type:shift_type_id(
        name
      ),
      employee:employee_id (
        id,
        name,
        department:department_id (
          name
        )
      )
    `)
    .gte("date", startDate)
    .lte("date", endDate);

  if (employeeId) {
    query = query.eq("employee_id", employeeId);
  }

  const { data, error } = await query;

  if (error) throw new Error(error.message);

  // Optional: Format rows if needed
  const result = data.map((row) => ({
    date: row.date,
    shiftType: row.shift_type?.name,
    startTime: row.start_time,
    endTime: row.end_time,
    status: row.status,
    employeeName: row.employee?.name || "Unknown",
    department: row.employee?.department?.name || "N/A",
  }));

  return result;
}
