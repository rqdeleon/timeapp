"use client"

import { useEffect, useMemo, useState, useCallback } from "react"
import { format, parseISO } from "date-fns"
import { CalendarIcon, Edit, Trash2 } from "lucide-react"

import { supabase } from "@/lib/supabase"
import { Schedule, Department, ShiftType, Employee } from "@/types"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { ScheduleForm } from "@/components/schedule-form" // Import ScheduleForm

/* ------------------------------------------------------------------ */
/* Component                                                          */
/* ------------------------------------------------------------------ */
export default function ScheduleListPage() {
  /* --------------------------- data states ------------------------- */
  const [loading, setLoading] = useState(true)
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [shiftTypes, setShiftTypes] = useState<ShiftType[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])

  /* --------------------------- filters ----------------------------- */
  const [dateFilter, setDateFilter] = useState<Date | undefined>(undefined)
  const [deptFilter, setDeptFilter] = useState("all") // "all" or department name (string)
  const [searchQuery, setSearchQuery] = useState("")

  /* --------------------------- form states ------------------------- */
  const [showScheduleForm, setShowScheduleForm] = useState(false)
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null)

  /* --------------------------- fetch data function -------------------------- */
  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      /* Schedules query */
      const { data: schedData, error: schedErr } = await supabase
        .from("schedules")
        .select(
          `
            *,
            employee:employees (
              id,
              name,
              avatar_url,
              department
            ),
            shift_type:shift_types (
              id,
              name,
              default_start_time,
              default_end_time
            )
          `,
        )
        .order("date", { ascending: false })

      /* Departments query */
      const { data: deptData, error: deptErr } = await supabase.from("departments").select("*").order("name")

      /* Shift Types query */
      const { data: shiftTypeData, error: shiftTypeErr } = await supabase
        .from("shift_types")
        .select("*")
        .order("name")

      /* Employees query */
      const { data: employeeData, error: employeeErr } = await supabase
        .from("employees")
        .select("*")
        .order("name")

      if (schedErr) console.error("Error loading schedules:", schedErr)
      if (deptErr) console.error("Error loading departments:", deptErr)
      if (shiftTypeErr) console.error("Error loading shift types:", shiftTypeErr)
      if (employeeErr) console.error("Error loading employees:", employeeErr)

      setSchedules((schedData ?? []) as Schedule[])
      setDepartments(deptData ?? [])
      setShiftTypes(shiftTypeData ?? [])
      setEmployees(employeeData ?? [])
    } catch (error) {
      console.error("Failed to fetch initial data:", error)
    } finally {
      setLoading(false)
    }
  }, []) // Empty dependency array means this function is stable and won't re-create

  /* --------------------------- initial fetch -------------------------- */
  useEffect(() => {
    fetchData()
  }, [fetchData]) // Call fetchData once on mount

  /* --------------------------- derived list ----------------------- */
  const filteredSchedules = useMemo(() => {
    return schedules.filter((row) => {
      const matchesDate = dateFilter
        ? format(parseISO(row.date), "yyyy-MM-dd") === format(dateFilter, "yyyy-MM-dd")
        : true
      const matchesDepartment = deptFilter === "all" || row.employee?.department === deptFilter
      
      const matchesSearch = searchQuery.trim() === "" || [row.employee?.name, row.shift_type?.name].some((field) =>
        field?.toLowerCase().includes(searchQuery.trim().toLowerCase())
      )

      return matchesDate && matchesDepartment && matchesSearch
    })
  }, [schedules, dateFilter, deptFilter, searchQuery])

  /* --------------------------- handlers ---------------------------- */
  const handleClearFilters = () => {
    setDateFilter(undefined)
    setDeptFilter("all")
    setSearchQuery("")
  }

  const handleEditSchedule = (schedule: Schedule) => {
    setSelectedSchedule(schedule)
    setShowScheduleForm(true)
  }

  const handleDeleteSchedule = async (scheduleId: string) => {
    if (!confirm("Are you sure you want to delete this schedule?")) {
      return
    }
    setLoading(true)
    try {
      const { error } = await supabase.from("schedules").delete().eq("id", scheduleId)
      if (error) {
        console.error("Error deleting schedule:", error)
        alert("Error deleting schedule.")
      } else {
        fetchData() // Re-fetch data after successful deletion
      }
    } catch (error) {
      console.error("Error deleting schedule:", error)
      alert("An unexpected error occurred during deletion.")
    } finally {
      setLoading(false)
    }
  }

  const handleFormClose = () => {
    setShowScheduleForm(false)
    setSelectedSchedule(null) // Clear selected schedule when form closes
    //fetchData() // Re-fetch data to ensure list is up-to-date after form submission
  }

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
      <Card>
        <CardHeader>
          <CardTitle>Schedule List</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* ---------------------- Filters --------------------------- */}
          <div className="grid gap-4 sm:grid-cols-3">
          {/* Search */}
            <div className="space-y-1 sm:col-span-3">
              <Label htmlFor="search">Search name or shift</Label>
              <Input
                id="search"
                type="text"
                placeholder="Type..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Date */}
            <div className="space-y-1">
              <Label htmlFor="date">Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn("w-full justify-start text-left font-normal", !dateFilter && "text-muted-foreground")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateFilter ? format(dateFilter, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={dateFilter} onSelect={setDateFilter} initialFocus />
                </PopoverContent>
              </Popover>
            </div>

            {/* Department */}
            <div className="space-y-1">
              <Label htmlFor="dept">Department</Label>
              <Select
                value={deptFilter}
                onValueChange={(v) => setDeptFilter(v)} // always a string
              >
                <SelectTrigger>
                  <SelectValue placeholder="All departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All departments</SelectItem>
                  {departments.map((d) => (
                    <SelectItem key={d.id} value={d.name}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Clear */}
            <div className="flex items-end">
              <Button variant="outline" className="w-full sm:w-auto bg-transparent" onClick={handleClearFilters}>
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
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead> {/* New Actions column header */}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSchedules.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-6">
                      No schedules match the current filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSchedules.map((schedule) => (
                    <TableRow key={schedule.id}>
                      {/* Employee */}
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-7 w-7">
                            {schedule.employee?.avatar_url ? (
                              <AvatarImage
                                src={schedule.employee.avatar_url}
                                alt={schedule.employee.name}
                              />
                            ) : (
                              <AvatarFallback>
                                {schedule.employee?.name
                                  ?.split(" ")
                                  .map((w) => w[0])
                                  .slice(0, 2)
                                  .join("") || "U"}
                              </AvatarFallback>
                            )}
                          </Avatar>
                          <span className="truncate">{schedule.employee?.name || "Unknown"}</span>
                        </div>
                      </TableCell>

                      {/* Department */}
                      <TableCell>{schedule.employee?.department ?? "—"}</TableCell>

                      {/* Date */}
                      <TableCell>{format(parseISO(schedule.date), "PPP")}</TableCell>

                      {/* Shift type */}
                      <TableCell>{schedule.shift_type?.name || "N/A"}</TableCell>

                      {/* Status */}
                      <TableCell>
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-xs font-medium capitalize",
                            schedule.status === "confirmed" && "bg-green-100 text-green-700",
                            schedule.status === "pending" && "bg-blue-100 text-blue-700",
                            schedule.status === "completed" && "bg-purple-100 text-purple-700",
                            schedule.status === "no-show" && "bg-red-100 text-red-700",
                          )}
                        >
                          {schedule.status}
                        </span>
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleEditSchedule(schedule)}>
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteSchedule(schedule.id)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      <ScheduleForm open={showScheduleForm} onOpenChange={handleFormClose} onSaved={fetchData} initialData={selectedSchedule} />
    </main>
  )
}
