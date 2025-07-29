import { supabase } from "@/lib/supabase";
import { format } from "date-fns";

export async function GetAttendanceReport(startDate: string, endDate: string, department?: string) {
  let query = supabase
    .from("schedules")
    .select(`
      employee:employee_id (
        *
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

  if (department) {
    query = query.eq("employee.department", department);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  // Group and calculate
  const report = new Map();

  for (const record of data) {
    const emp = record.employee;
    const empId = emp.id;

    if (!report.has(empId)) {
      report.set(empId, {
        name: emp.name,
        department: emp.department,
        totalScheduledHours: 0,
        totalWorkedHours: 0,
        lateCount: 0,
        absences: 0,
      });
    }

    const hoursScheduled = calculateHours(record.start_time, record.end_time);
    const log = record.attendance_logs?.[0];

    const entry = report.get(empId);
    entry.totalScheduledHours += hoursScheduled;

    if (record.status === "no-show") {
      entry.absences += 1;
    }

    if (log) {
      const worked = calculateHoursFromCheckIn(log.check_in_time, log.check_out_time);
      entry.totalWorkedHours += worked;
      if (log.is_late) entry.lateCount += 1;
    }
  }

  return Array.from(report.values());
}

// helpers
function calculateHours(start: string, end: string) {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  return (eh * 60 + em - (sh * 60 + sm)) / 60;
}

function calculateHoursFromCheckIn(checkIn: string, checkOut: string | null) {
  if (!checkOut) return 0;
  const start = new Date(checkIn).getTime();
  const end = new Date(checkOut).getTime();
  return (end - start) / (1000 * 60 * 60); // ms to hours
}


export async function GetSchedulesByDate(startDate: string, endDate: string) {
  const { data, error } = await supabase
    .from("schedules")
    .select(`
      *,
      shiftType:shift_type_id(
        id,
        name
      ),
      employee:employee_id (
        id,
        name,
        department
      ),
      attendance_logs (
        check_in_time,
        check_out_time
      )
    `)
    .gte("date", startDate)
    .lte("date", endDate)
    .order("date", { ascending: true });

  if (error) throw new Error(error.message);

  const formatted = data.map((entry) => {
    const { employee, attendance_logs, shiftType } = entry;
    const checkIn = attendance_logs?.[0]?.check_in_time ?? null;
    const checkOut = attendance_logs?.[0]?.check_out_time ?? null;
    const late = computeLate(entry.start_time, checkIn);
    const formattedLocalTime = format(checkIn,"HH:mm:ss") 

    return {
      date: entry.date,
      shiftType: shiftType.name,
      employeeName: employee.name,
      department: employee.department,
      startTime: entry.start_time,
      endTime: entry.end_time,
      checkInTime: formattedLocalTime,
      checkOutTime: checkOut,
      late,
      scheduleStatus: entry.status,
    };
  });

  return formatted;
}

// Late computation helper
function computeLate(scheduleStart: string, checkIn: string | null): string | null {
  if (!checkIn) return null;

  const sched = parseTimeToDate(scheduleStart);
  const actual = new Date(checkIn);
  const diffMs = actual.getTime() - sched.getTime();

  if (diffMs <= 0) return "0 min";

  const mins = Math.floor(diffMs / 1000 / 60);
  return mins >= 60
    ? `${Math.floor(mins / 60)} hr ${mins % 60} min`
    : `${mins} min`;
}

function parseTimeToDate(timeStr: string): Date {
  const now = new Date();
  const [h, m] = timeStr.split(":").map(Number);
  now.setHours(h, m, 0, 0);
  return now;
}