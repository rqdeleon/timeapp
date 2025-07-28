import { supabase } from "@/lib/supabase"
import { isBefore, parseISO } from "date-fns"

async function simulateCron() {
  const { data: schedules, error } = await supabase
    .from("schedules")
    .select("id, employee_id, date, end_time, status")
    .in("status", ["pending", "confirmed"])

  if (error) {
    console.error("Schedule fetch error:", error)
    return
  }

  const now = new Date()
  const updates = []

  for (const schedule of schedules) {
    const endTime = parseISO(`${schedule.date}T${schedule.end_time}`)
    if (isBefore(endTime, now)) {
      const { data: logs, error: logsError } = await supabase
        .from("attendance_logs")
        .select("clock_in, clock_out")
        .eq("schedule_id", schedule.id)

      if (logsError) continue

      const hasAttendance = logs?.some(log => log.clock_in && log.clock_out)
      const newStatus = hasAttendance ? "completed" : "no-show"

      updates.push({ id: schedule.id, status: newStatus })
    }
  }

  for (const update of updates) {
    await supabase
      .from("schedules")
      .update({ status: update.status })
      .eq("id", update.id)
  }

  console.log("Simulated cron job: updated", updates.length, "schedules.")
}

simulateCron()
