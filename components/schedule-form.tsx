"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { supabase, type Employee, type ShiftType } from "@/lib/supabase"
import { Loader2 } from "lucide-react"

interface ScheduleFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ScheduleForm({ open, onOpenChange }: ScheduleFormProps) {
  const [formData, setFormData] = useState({
    employee_id: "",
    date: "",
    shift_type_id: "", // Changed to shift_type_id
    start_time: "",
    end_time: "",
    status: "pending",
    location: "",
  })
  const [employees, setEmployees] = useState<Employee[]>([])
  const [shiftTypes, setShiftTypes] = useState<ShiftType[]>([]) // Fetch shift types
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      fetchDependencies()
    }
  }, [open])

  const fetchDependencies = async () => {
    setLoading(true)
    try {
      const { data: employeesData, error: employeesError } = await supabase
        .from("employees")
        .select("*")
        .eq("status", "active")
        .order("name")
      if (employeesError) throw employeesError
      setEmployees(employeesData || [])

      const { data: shiftTypesData, error: shiftTypesError } = await supabase
        .from("shift_types")
        .select("*")
        .order("name")
      if (shiftTypesError) throw shiftTypesError
      setShiftTypes(shiftTypesData || [])
    } catch (error) {
      console.error("Error fetching form dependencies:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase.from("schedules").insert([
        {
          ...formData,
          total_breaks: 2, // Default value
          breaks_taken: 0, // Default value
        },
      ])

      if (error) throw error

      onOpenChange(false)
      setFormData({
        employee_id: "",
        date: "",
        shift_type_id: "",
        start_time: "",
        end_time: "",
        status: "pending",
        location: "",
      })
    } catch (error) {
      console.error("Error creating schedule:", error)
      alert("Error creating schedule. Please check your input.")
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))

    // Auto-set times based on selected shift type
    if (field === "shift_type_id") {
      const selectedShiftType = shiftTypes.find((st) => st.id === value)
      if (selectedShiftType) {
        setFormData((prev) => ({
          ...prev,
          start_time: selectedShiftType.default_start_time,
          end_time: selectedShiftType.default_end_time,
        }))
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Schedule</DialogTitle>
          <DialogDescription>Create a new shift assignment for an employee</DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center items-center h-40">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="employee_id">Employee</Label>
              <Select value={formData.employee_id} onValueChange={(value) => handleChange("employee_id", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.name} - {employee.department}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleChange("date", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="shift_type_id">Shift Type</Label>
                <Select value={formData.shift_type_id} onValueChange={(value) => handleChange("shift_type_id", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select shift type" />
                  </SelectTrigger>
                  <SelectContent>
                    {shiftTypes.map((shiftType) => (
                      <SelectItem key={shiftType.id} value={shiftType.id}>
                        {shiftType.name} ({shiftType.default_start_time} - {shiftType.default_end_time})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_time">Start Time</Label>
                <Input
                  id="start_time"
                  type="time"
                  value={formData.start_time}
                  onChange={(e) => handleChange("start_time", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_time">End Time</Label>
                <Input
                  id="end_time"
                  type="time"
                  value={formData.end_time}
                  onChange={(e) => handleChange("end_time", e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                placeholder="e.g., Floor 1 - Operations"
                value={formData.location}
                onChange={(e) => handleChange("location", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => handleChange("status", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Schedule
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
