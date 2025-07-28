"use client"
import { useState, useEffect } from "react"
import { format } from "date-fns"
import { Loader2 } from "lucide-react"

import { Schedule, ShiftType, Employee } from "@/types"
import { supabase } from "@/lib/supabase"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"


interface AssignShiftFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  employee: Employee | undefined
  date: Date
  onSaved: ()=> void
  initData?: Schedule | null
}

export function AssignShiftForm({ open, onOpenChange, employee, date, onSaved, initData }: AssignShiftFormProps) {
  const [loading, setLoading] = useState(true)
  const [shiftTypes, setShiftTypes] = useState<ShiftType[]>([])

  const [formData, setFormData] = useState({
    id: initData?.id || "", // Include ID for updates
    employee_id: employee?.id ,
    date: date,
    shift_type_id: initData?.shift_type_id || "",
    start_time: initData?.start_time || "",
    end_time: initData?.end_time || "",
    status: initData?.status || "confirmed",
    location: initData?.location || "",
  })

  useEffect(() => {
    fetchData()
    if (initData) {
      setFormData({
        id: initData.id,
        employee_id: employee?.id,
        date: date,
        shift_type_id: initData.shift_type_id,
        start_time: initData.start_time,
        end_time: initData.end_time,
        status: initData.status,
        location: initData.location || "",
      })
    } else {
      setFormData({
        id: "",
        employee_id: "",
        // @ts-ignore
        date: "",
        shift_type_id: "",
        start_time: "",
        end_time: "",
        status: "confirmed",
        location: "",
      })
    }
  }, [open,initData])

  const fetchData = async () =>{
     // Fetch shift types
    setLoading(true)
    try {
      const { data: shiftTypesData, error: shiftTypesError } = await supabase
        .from("shift_types")
        .select("*")
        .order("name")
      if (shiftTypesError) throw shiftTypesError
      setShiftTypes(shiftTypesData || [])
    } catch (error) {
      console.error("Error fetching initial data for schedule page:", error)
    }finally{
      setLoading(false)
    }
  }

  // ------------- ACTIONS --------------//
  const buildSchedulePayload = () => ({
    employee_id: employee?.id,
    date: date,
    shift_type_id: formData.shift_type_id || null,
    start_time: formData.start_time,
    end_time: formData.end_time,
    status: formData.status,
    location: formData.location || null,
    total_breaks: 2,
    breaks_taken: 0,
  })
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Basic client-side validation
    if ( !formData.shift_type_id) {
      alert("Please select a shift type.")
      return
    }

    setLoading(true)

    try {
      if (formData.id) {
        // ---------- UPDATE ----------
        const payload = buildSchedulePayload()
        const { error } = await supabase.from("schedules").update(payload).eq("id", formData.id)

        if (error) throw error
      } else {
        // ---------- INSERT ----------
        const payload = buildSchedulePayload()
        const { error } = await supabase.from("schedules").insert([payload])
        if (error) throw error
      }

      onOpenChange(false)
      // reset
      // setFormData({
      //   id: "",
      //   employee_id: "",
      //   shift_type_id: "",
      //   start_time: "",
      //   end_time: "",
      //   status: "pending",
      //   location: "",
      // })
    } catch (error) {
      console.error("Error saving schedule:", error)
      alert("Error saving schedule. Please check your input.")
    } finally {
      setLoading(false)
    }

    if (typeof onSaved === "function") onSaved()
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
          <DialogTitle>{employee?.name} - {format(date, 'MMM dd, yyyy')}</DialogTitle>
          <DialogDescription>Assign shift to <b>{employee?.name}</b> on this date </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center items-center h-40">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
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
              <Button
                type="submit"
                disabled={
                  loading ||
                  !formData.shift_type_id ||
                  !formData.start_time ||
                  !formData.end_time
                }
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                submit
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}

