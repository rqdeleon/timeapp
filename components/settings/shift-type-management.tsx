"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Plus, Edit, Trash2, Loader2 } from "lucide-react"
import { supabase, type ShiftType } from "@/lib/supabase"

export function ShiftTypeManagement() {
  const [shiftTypes, setShiftTypes] = useState<ShiftType[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingShiftType, setEditingShiftType] = useState<ShiftType | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    default_start_time: "09:00",
    default_end_time: "17:00",
  })
  const [formLoading, setFormLoading] = useState(false)

  useEffect(() => {
    fetchShiftTypes()
  }, [])

  const fetchShiftTypes = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase.from("shift_types").select("*").order("name")
      if (error) throw error
      setShiftTypes(data || [])
    } catch (error) {
      console.error("Error fetching shift types:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = () => {
    setEditingShiftType(null)
    setFormData({ name: "", default_start_time: "09:00", default_end_time: "17:00" })
    setDialogOpen(true)
  }

  const handleEdit = (shiftType: ShiftType) => {
    setEditingShiftType(shiftType)
    setFormData({
      name: shiftType.name,
      default_start_time: shiftType.default_start_time,
      default_end_time: shiftType.default_end_time,
    })
    setDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this shift type? This cannot be undone.")) return
    setLoading(true)
    try {
      const { error } = await supabase.from("shift_types").delete().eq("id", id)
      if (error) throw error
      await fetchShiftTypes()
    } catch (error) {
      console.error("Error deleting shift type:", error)
      alert("Error deleting shift type. It might be in use by existing schedules.")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormLoading(true)
    try {
      if (editingShiftType) {
        const { error } = await supabase.from("shift_types").update(formData).eq("id", editingShiftType.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from("shift_types").insert([formData])
        if (error) throw error
      }
      setDialogOpen(false)
      await fetchShiftTypes()
    } catch (error) {
      console.error("Error saving shift type:", error)
      alert("Error saving shift type. Name might already exist.")
    } finally {
      setFormLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-40">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button onClick={handleAdd} className="flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Shift Type
        </Button>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Default Start Time</TableHead>
              <TableHead>Default End Time</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {shiftTypes.map((shiftType) => (
              <TableRow key={shiftType.id}>
                <TableCell className="font-medium capitalize">{shiftType.name}</TableCell>
                <TableCell>{shiftType.default_start_time}</TableCell>
                <TableCell>{shiftType.default_end_time}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(shiftType)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(shiftType.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {shiftTypes.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-gray-500 py-8">
                  No shift types found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingShiftType ? "Edit Shift Type" : "Add New Shift Type"}</DialogTitle>
            <DialogDescription>
              {editingShiftType ? "Update the shift type details." : "Create a new shift type with default times."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="col-span-3"
                required
                disabled={formLoading}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="default_start_time" className="text-right">
                Start Time
              </Label>
              <Input
                id="default_start_time"
                type="time"
                value={formData.default_start_time}
                onChange={(e) => setFormData({ ...formData, default_start_time: e.target.value })}
                className="col-span-3"
                required
                disabled={formLoading}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="default_end_time" className="text-right">
                End Time
              </Label>
              <Input
                id="default_end_time"
                type="time"
                value={formData.default_end_time}
                onChange={(e) => setFormData({ ...formData, default_end_time: e.target.value })}
                className="col-span-3"
                required
                disabled={formLoading}
              />
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={formLoading}>
                Cancel
              </Button>
              <Button type="submit" disabled={formLoading}>
                {formLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingShiftType ? "Save Changes" : "Add Shift Type"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
