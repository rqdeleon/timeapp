"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Plus, Edit, Trash2 } from "lucide-react"
import { EmployeeForm } from "@/components/employee-form"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { supabase } from "@/lib/supabase"
import { Employee } from "@/types"
import { useRealtimeEmployees } from "@/hooks/use-realtime-employees"

export default function Employees() {
  const [searchTerm, setSearchTerm] = useState("")
  const [showEmployeeForm, setShowEmployeeForm] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [initialEmployees, setInitialEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)

  // Use real-time hook for employees
  const employees = useRealtimeEmployees(initialEmployees)

  useEffect(() => {
    fetchEmployees()
  }, [])

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
      .from("employees")
      .select("*, department: department_id(id,name)")
      .order("name", { ascending: true })

      if (error) throw error
      setInitialEmployees(data || [])
    } catch (error) {
      console.error("Error fetching employees:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this employee? This cannot be undone.")) {
      try {
        const { error } = await supabase.from("employees").delete().eq("id", id)

        if (error) throw error
        // Real-time subscription will handle the UI update
      } catch (error) {
        console.error("Error deleting employee:", error)
        alert("Error deleting employee. They might be linked to existing schedules.")
      }
    }
  }

  const filteredEmployees = employees.filter(
    (employee) =>
      employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.position?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee)
    setShowEmployeeForm(true)
  }

  const handleAdd = () => {
    setEditingEmployee(null)
    setShowEmployeeForm(true)
  }

  const handleFormClose = () => {
    setShowEmployeeForm(false)
    setEditingEmployee(null)
    // Real-time subscription will handle the data refresh
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">

        <main className="container mx-auto px-4 py-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Employees</h1>
              <p className="text-gray-600 mt-1">Manage your team members</p>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={handleAdd} className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Add Employee
              </Button>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Employee Directory</CardTitle>
              <CardDescription>View and manage all employees (updates in real-time)</CardDescription>
              <div className="flex items-center gap-2 mt-4">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search employees..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead className="hidden sm:table-cell">Email</TableHead>
                      <TableHead className="hidden md:table-cell">Phone</TableHead>
                      <TableHead>Position</TableHead>
                      <TableHead className="hidden lg:table-cell">Department</TableHead>
                      <TableHead>Salary</TableHead> {/* Added Salary Header */}
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEmployees.map((employee) => (
                      <TableRow key={employee.id} className="transition-all duration-200 hover:bg-gray-50">
                        <TableCell className="font-medium">{employee.name}</TableCell>
                        <TableCell className="hidden sm:table-cell text-gray-600">{employee.email}</TableCell>
                        <TableCell className="hidden md:table-cell text-gray-600">{employee.phone}</TableCell>
                        <TableCell>{employee.position}</TableCell>
                        <TableCell className="hidden lg:table-cell">{employee.department.name}</TableCell>
                        <TableCell>{employee.salary ? `${employee.salary.toFixed(2)}` : "N/A"}</TableCell>
                        {/* Added Salary Cell */}
                        <TableCell>
                          <Badge
                            variant={employee.status === "active" ? "default" : "secondary"}
                            className={employee.status === "active" ? "bg-green-100 text-green-800" : ""}
                          >
                            {employee.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(employee)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(employee.id)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <EmployeeForm open={showEmployeeForm} onOpenChange={handleFormClose} employee={editingEmployee} />
        </main>
      </div>
    </ProtectedRoute>
  )
}
