"use client"

import { useEffect, useMemo, useState } from "react"
import { format, parseISO } from "date-fns"
import { CalendarIcon } from "lucide-react"

import { supabase } from "@/lib/supabase"
import { cn } from "@/lib/utils"

import { Navigation } from "@/components/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"

/* ------------------------------------------------------------------ */
/* Types                                                              */
/* ------------------------------------------------------------------ */
type Department = { id: number; name: string }

type ScheduleRow = {
  id: number
  date: string // ISO
  start_time: string
  end_time: string
  status: string
  location: string | null
  shift_type: { name: string }
  employee: {
    id: number
    name: string
    avatar_url: string | null
    department: { id: number; name: string } | null
  }
}

/* ------------------------------------------------------------------ */
/* Component                                                          */
/* ------------------------------------------------------------------ */
export default function ScheduleListPage() {
  /* --------------------------- data states ------------------------- */
  const [loading, setLoading] = useState(true)
  const [schedules, setSchedules] = useState<ScheduleRow[]>([])
  const [departments, setDepartments] = useState<Department[]>([])

  /* --------------------------- filters ----------------------------- */
  const [dateFilter, setDateFilter] = useState("") // ISO string or ""
  const [deptFilter, setDeptFilter] = useState("all") // "all" or department id (string)

  /* --------------------------- fetch once -------------------------- */
  useEffect(() => {
    async function fetchData() {
      /* Schedules query */
      const { data: schedData, error: schedErr } = await supabase
        .from("schedules")
        .select(
          `
          id,
          date,
          start_time,
          end_time,
          status,
          location,
          shift_type: shift_types ( name ),
          employee: employees (
            id,
            name,
            avatar_url,
            department: departments ( id, name )
          )
        `,
        )
        .order("date", { ascending: false })

      /* Departments query */
      const { data: deptData, error: deptErr } = await supabase.from("departments").select("id, name").order("name")

      if (schedErr) console.error("Error loading schedules:", schedErr)
      if (deptErr) console.error("Error loading departments:", deptErr)

      setSchedules((schedData ?? []) as unknown as ScheduleRow[])
      setDepartments(deptData ?? [])
      setLoading(false)
    }

    fetchData()
  }, []) // ← empty dependency array => runs only once

  /* --------------------------- derived list ----------------------- */
  const filteredSchedules = useMemo(() => {
    return schedules.filter((row) => {
      const sameDate = !dateFilter || row.date === dateFilter
      const sameDept = deptFilter === "all" || String(row.employee.department?.id) === deptFilter
      return sameDate && sameDept
    })
  }, [schedules, dateFilter, deptFilter])

  /* --------------------------- render ------------------------------ */

  if (loading) {
    /* Simple loading skeleton */
    return (
      <div className="container mx-auto px-4 py-10 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  return (
    <main className="container mx-auto max-w-7xl space-y-6 px-4 py-8">
      <Navigation />
      <Card>
        <CardHeader>
          <CardTitle>Schedule List</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* ---------------------- Filters --------------------------- */}
          <div className="grid gap-4 sm:grid-cols-3">
            {/* Date */}
            <div className="space-y-1">
              <Label htmlFor="date">Date</Label>
              <div className="relative">
                <Input id="date" type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} />
                <CalendarIcon className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
              </div>
            </div>

            {/* Department */}
            <div className="space-y-1">
              <Label htmlFor="dept">Department</Label>
              <Select
                id="dept"
                value={deptFilter}
                onValueChange={(v) => setDeptFilter(v)} // always a string
              >
                <SelectTrigger>
                  <SelectValue placeholder="All departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All departments</SelectItem>
                  {departments.map((d) => (
                    <SelectItem key={d.id} value={String(d.id)}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Clear */}
            <div className="flex items-end">
              <Button
                variant="outline"
                className="w-full sm:w-auto bg-transparent"
                onClick={() => {
                  setDateFilter("")
                  setDeptFilter("all")
                }}
              >
                Clear Filters
              </Button>
            </div>
          </div>

          {/* ---------------------- Table ---------------------------- */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Shift</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSchedules.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-6">
                      No schedules match the current filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSchedules.map((row) => (
                    <TableRow key={row.id}>
                      {/* Employee */}
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-7 w-7">
                            {row.employee.avatar_url ? (
                              <AvatarImage
                                src={row.employee.avatar_url || "/placeholder.svg"}
                                alt={row.employee.name}
                              />
                            ) : (
                              <AvatarFallback>
                                {row.employee.name
                                  .split(" ")
                                  .map((w) => w[0])
                                  .slice(0, 2)
                                  .join("")}
                              </AvatarFallback>
                            )}
                          </Avatar>
                          <span className="truncate">{row.employee.name}</span>
                        </div>
                      </TableCell>

                      {/* Department */}
                      <TableCell>{row.employee.department?.name ?? "—"}</TableCell>

                      {/* Date */}
                      <TableCell>{format(parseISO(row.date), "PPP")}</TableCell>

                      {/* Shift type */}
                      <TableCell>{row.shift_type.name}</TableCell>

                      {/* Time */}
                      <TableCell>
                        {row.start_time} – {row.end_time}
                      </TableCell>

                      {/* Location */}
                      <TableCell>{row.location ?? "—"}</TableCell>

                      {/* Status */}
                      <TableCell>
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-xs font-medium capitalize",
                            row.status === "confirmed" && "bg-green-100 text-green-700",
                            row.status === "pending" && "bg-blue-100 text-blue-700",
                            row.status === "completed" && "bg-purple-100 text-purple-700",
                            row.status === "no-show" && "bg-red-100 text-red-700",
                          )}
                        >
                          {row.status}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
