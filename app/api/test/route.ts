// app/api/run-attendance-status-check/route.ts
import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { Schedule, AttendanceLog } from "@/types"
import { parseISO, isBefore } from "date-fns"

export async function POST() {
  const { data: schedules, error } = await supabase
    .from("schedules")
    .select("*")

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  console.log(schedules)

  const now = new Date()
  const updates = []

  for (const schedule of schedules) {
    const end = parseISO(`${schedule.date}T${schedule.end_time}`)
      const { data: logs, error } = await supabase
        .from("attendance_logs")
        .select("*")
        .eq("schedule_id", schedule.id)

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      } 
      const hasLog = logs?.some(log => log.check_in_time && log.check_out_time)
      const newStatus = hasLog ? "completed" : "no-show"

      updates.push({ id: schedule.id, status: newStatus })
    
  }

  for (const update of updates) {
    await supabase
      .from("schedules")
      .update({ status: update.status })
      .eq("id", update.id)
  }

  return NextResponse.json({
    message: `✅ ${updates.length} schedule(s) updated.`,
    updated: updates,
  })
}
