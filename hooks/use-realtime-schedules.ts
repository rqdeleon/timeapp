"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Schedule } from "@/types"
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js"

export function useRealtimeSchedules(initialSchedules: Schedule[] = []) {
  const [schedules, setSchedules] = useState<Schedule[]>(initialSchedules)

  useEffect(() => {
    // Set initial data
    setSchedules(initialSchedules)

    // Subscribe to real-time changes
    const channel = supabase
      .channel("schedules-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "schedules",
        },
        async (payload: RealtimePostgresChangesPayload<any>) => {
          console.log("Schedule change detected:", payload)

          if (payload.eventType === "INSERT") {
            // Fetch the new schedule with employee and shift type data
            const { data: newSchedule } = await supabase
              .from("schedules")
              .select(`
                *,
                employees:employee_id(*),
                shift_type:shift_type_id(*)
              `)
              .eq("id", payload.new.id)
              .single()

            if (newSchedule) {
              const normalizedSchedule = {
                ...newSchedule,
                employee: newSchedule.employees,
                shift_type: newSchedule.shift_type,
              } as Schedule

              setSchedules((prev) => [normalizedSchedule, ...prev])
            }
          } else if (payload.eventType === "UPDATE") {
            // Fetch the updated schedule with employee and shift type data
            const { data: updatedSchedule } = await supabase
              .from("schedules")
              .select(`
                *,
                employees:employee_id(*),
                shift_type:shift_type_id(*)
              `)
              .eq("id", payload.new.id)
              .single()

            if (updatedSchedule) {
              const normalizedSchedule = {
                ...updatedSchedule,
                employee: updatedSchedule.employees,
                shift_type: updatedSchedule.shift_type,
              } as Schedule

              setSchedules((prev) =>
                prev.map((schedule) => (schedule.id === payload.new.id ? normalizedSchedule : schedule)),
              )
            }
          } else if (payload.eventType === "DELETE") {
            setSchedules((prev) => prev.filter((schedule) => schedule.id !== payload.old.id))
          }
        },
      )
      .subscribe()

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel)
    }
  }, [initialSchedules])

  return schedules
}
