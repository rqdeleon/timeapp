import { supabase } from "@/lib/supabase";

export async function checkIn(schedule_id: string, check_in_time: string) {
  const { data: schedule } = await supabase
    .from("schedules")
    .select("date, start_time")
    .eq("id", schedule_id)
    .single();

  const is_late = new Date(check_in_time) > new Date(`${schedule?.date}T${schedule?.start_time}`);

  const { error } = await supabase.from("attendance_logs").insert([
    { schedule_id, check_in_time, is_late }
  ]);

  if (error) throw new Error(error.message);
}

export async function checkOut(schedule_id: string, check_out_time: string) {
  const { data, error } = await supabase
    .from("attendance_logs")
    .update({ check_out_time })
    .eq("schedule_id", schedule_id)
    .is("check_out_time", null); // prevent overwrite

  if (error) throw new Error(error.message);
  return data;
}
