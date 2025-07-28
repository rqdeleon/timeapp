// pages/api/cron/update-schedule-status.ts
import { supabase } from "@/lib/supabase"
import { NextApiRequest, NextApiResponse } from "next"
import { isBefore, parseISO } from "date-fns"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Get schedules that are pending or confirmed and in the past
  const { data: schedules, error } = await supabase
    .from("schedules")
    .select("*")
    .in("status", ["pending", "confirmed"])

  if (error) return res.status(500).json({ error })

  const now = new Date()
  const updates = []

  for (const schedule of schedules) {
    const endTime = parseISO(`${schedule.date}T${schedule.end_time}`)

    if (isBefore(endTime, now)) {
      const { data: logs, error: logsError } = await supabase
        .from("attendance_logs")
        .select("*")
        .eq("schedule_id", schedule.id)

      if (logsError) continue

      const hasAttendance = logs?.some(log => log.check_in_time && log.check_out_time)

      const newStatus = hasAttendance ? "completed" : "no-show"

      updates.push({
        id: schedule.id,
        status: newStatus,
      })
    }
  }

  // Batch update all statuses
  for (const update of updates) {
    await supabase
      .from("schedules")
      .update({ status: update.status })
      .eq("id", update.id)
  }

  return res.status(200).json({ updated: updates.length })
}
