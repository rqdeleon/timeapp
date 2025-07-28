"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Plus, Edit, Trash2, Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { Department } from "@/types"

export function DepartmentManagement() {
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null)
  const [formData, setFormData] = useState({ name: "" })
  const [formLoading, setFormLoading] = useState(false)

  useEffect(() => {
    fetchDepartments()
  }, [])

  const fetchDepartments = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase.from("departments").select("*").order("name")
      if (error) throw error
      setDepartments(data || [])
    } catch (error) {
      console.error("Error fetching departments:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = () => {
    setEditingDepartment(null)
    setFormData({ name: "" })
    setDialogOpen(true)
  }

  const handleEdit = (department: Department) => {
    setEditingDepartment(department)
    setFormData({ name: department.name })
    setDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this department? This will affect employees and positions linked to it.",
      )
    )
      return
    setLoading(true)
    try {
      const { error } = await supabase.from("departments").delete().eq("id", id)
      if (error) throw error
      await fetchDepartments()
    } catch (error) {
      console.error("Error deleting department:", error)
      alert("Error deleting department. It might have associated employees or positions.")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormLoading(true)
    try {
      if (editingDepartment) {
        const { error } = await supabase.from("departments").update(formData).eq("id", editingDepartment.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from("departments").insert([formData])
        if (error) throw error
      }
      setDialogOpen(false)
      await fetchDepartments()
    } catch (error) {
      console.error("Error saving department:", error)
      alert("Error saving department. Name might already exist.")
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
          <Plus className="w-4 h-4" /> Add Department
        </Button>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {departments.map((department) => (
              <TableRow key={department.id}>
                <TableCell className="font-medium">{department.name}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(department)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(department.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {departments.length === 0 && (
              <TableRow>
                <TableCell colSpan={2} className="text-center text-gray-500 py-8">
                  No departments found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingDepartment ? "Edit Department" : "Add New Department"}</DialogTitle>
            <DialogDescription>
              {editingDepartment ? "Update the department name." : "Create a new department."}
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
                onChange={(e) => setFormData({ name: e.target.value })}
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
                {editingDepartment ? "Save Changes" : "Add Department"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
