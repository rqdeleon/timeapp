"use server"

import { createClient } from "@/utils/supabase/server";

export async function getTimeinReport(date: string, department?: string) {
  const supabase = await createClient()
  
  if ( !date ) return null
  
  try {
    let query = supabase
      .from("schedules")
      .select(
        `*,
        employee:employee_id (
          id,
          name,
          department:department_id(
            id,
            name
          )
        ),
        attendance_logs (
          check_in_time,
          check_out_time,
          is_late
        )
      `
      )
      .eq("date", date)

    if (department) {
      query = query.eq("employee.department", department);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Format the results into a simpler report
    const report = data.map((record: any) => {
      const schedID = record.id;
      const employee = record.employee;
      const log = record.attendance_logs?.[0];

      return {
        id: schedID,
        name: employee?.name || "Unknown",
        department: employee?.department.name || "N/A",
        date: record.date,
        timeIn: log?.check_in_time ?? "--",
        timeOut: log?.check_out_time ?? "--",
        isLate: log?.is_late ?? false,
        status: record.status || (log ? "Present" : "No-show"),
      }
    })
    return report;
  } catch (err: any) {
    return null
  }
}
