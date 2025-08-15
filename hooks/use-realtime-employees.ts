"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Employee } from "@/types"
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js"

export function useRealtimeEmployees(initialEmployees: Employee[] = []) {
  const [employees, setEmployees] = useState<Employee[]>(initialEmployees)

  useEffect(() => {
    // Set initial data
    setEmployees(initialEmployees)

    // Subscribe to real-time changes
    const channel = supabase
      .channel("employees-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "employees",
        },
        (payload: RealtimePostgresChangesPayload<any>) => {
          console.log("Employee change detected:", payload)

          if (payload.eventType === "INSERT") {
            setEmployees((prev) => [payload.new as Employee, ...prev])
          } else if (payload.eventType === "UPDATE") {
            setEmployees((prev) =>
              prev.map((employee) => (employee.id === payload.new.id ? (payload.new as Employee) : employee)),
            )
          } else if (payload.eventType === "DELETE") {
            setEmployees((prev) => prev.filter((employee) => employee.id !== payload.old.id))
          }
        },
      )
      .subscribe()

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel)
    }
  }, [initialEmployees])

  return employees
}
