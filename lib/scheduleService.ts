import { supabase } from "@/lib/supabase";
import { Schedule } from "@/types";

export async function getSchedulesByDate(date: string): Promise<Schedule[]> {
  const { data, error } = await supabase
    .from("schedules")
    .select(`
      *,
      employee:employee_id (id, name, department, avatar_url),
      shift_type:shift_type_id (id, name, default_start_time, default_end_time),
      attendance_logs (id, check_in_time, check_out_time, is_late)
    `)
    .eq("date", date);

  if (error) throw new Error(error.message);
  return data;
}
