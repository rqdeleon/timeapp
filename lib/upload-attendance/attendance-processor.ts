import { EmployeeTimeRecord, EmployeeTimeLogs, AttendanceLog } from "@/types";
import { createClient } from "@/utils/supabase/server";
import { format } from "date-fns";

export async function processAttendanceRecords(record: EmployeeTimeRecord):Promise<{
  success: boolean;
  message: string;
  recordsProcessed: number;
  errors: string[];
}> {
  const errors: string[] = [];
  const validLogs: any[] = [];

  const supabase = await createClient();

  let recordsProcessed = 0;

  if (!record) {
    throw new Error("No attendance data provided");
  }


  const logs = Array.isArray(record.logs) ? record.logs : [record.logs];
  
  for (const [index, log] of logs) {
    try {
      const validationError = validateRecord(log);
      if (validationError) {
        errors.push(`Employee ${record.logs.employeeName}: ${validationError}`);
        continue;
      }

      // Retrieve employee_id
      const userId = String(log.employeeId || '').trim();

      const { data: employee, error: empErr } = await supabase
        .from('employees')
        .select('id')
        .eq('user_id', userId)
        .single();
      
      if (empErr || !employee) {
        errors.push(`Row ${index + 1}: Employee with user_id ${userId} not found`);
        continue;
      }

      const employeeUuid = employee.id;

       // 4️⃣ Check for duplicates
      const { data: duplicate } = await supabase
        .from('attendance_logs')
        .select('id')
        .eq('employee_id', employeeUuid)
        .eq('check_in_time', format(`${log.date}-2025 ${log.timeIn}`, "yyyy-MM-dd HH:mm") )
        .maybeSingle();
      
      if (duplicate) {
        errors.push(`Row ${index + 1}: Duplicate entry for employee ${employeeUuid} at ${format(`${log.date}-2025 ${log.timeIn}`, "yyyy-MM-dd HH:mm")}`);
        continue;
      }

       validLogs.push({
        employee_id: employeeUuid,
        user_id: userId,
        check_in_time: format(`${log.date}-2025 ${log.timeIn}`, "yyyy-MM-dd HH:mm") ,
        check_out_time: format(`${log.date}-2025 ${log.timeOut}`, "yyyy-MM-dd HH:mm"),
        notes: `uploaded at ${ new Date()}`,
      });

      await saveRecordToDatabase(validLogs);
      recordsProcessed++;

    } catch (err) {
       errors.push(`Error processing record for ${log.employeeName}`, err);
    }
  }

   return {
    success: errors.length === 0,
    message: `Processed ${recordsProcessed} records${errors.length > 0 ? ` with ${errors.length} errors` : ''}`,
    recordsProcessed,
    errors,
  };
}

function validateRecord(log: EmployeeTimeLogs): string | null {
  if (!log.employeeId) return "Missing employee ID";
  if (!log.date) return "Missing date";
  return null;
}

async function saveRecordToDatabase(validLogs:any) {
  // Replace this with your real DB call
  const supabase = await createClient();

  try {
    if(validLogs){
      const { error } = await supabase.from("attendance_logs").insert([validLogs])
      if (error) throw error
    }
  } catch (error) {
    console.log(error)
  }
}

async function transformToAttendanceLog(record: EmployeeTimeRecord): Promise<Omit<AttendanceLog, 'id'>> {
  // Create a unique schedule_id based on employee ID and date
  const scheduleId = `${record.logs.employeeId}_${record.logs.date}`;
  
  // Combine date and time for full timestamps
  const checkInTime = `${record.logs.date}T${record.logs.timeIn}:00`;
  const checkOutTime = record.logs.timeOut ? `${record.logs.date}T${record.logs.timeOut}:00` : undefined;
  
  // Determine if the employee is late (assuming 9:00 AM is the standard start time)
  const standardStartTime = new Date(`${record.logs.date}T09:00:00`);
  const actualCheckIn = new Date(checkInTime);
  const isLate = actualCheckIn > standardStartTime;
  
  return {
    schedule_id: scheduleId,
    check_in_time: checkInTime,
    check_out_time: checkOutTime,
    notes: `Employee: ${record.logs.employeeName}`,
  };
}