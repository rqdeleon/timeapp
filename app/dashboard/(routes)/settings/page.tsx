"use client"

import { ProtectedRoute } from "@/components/auth/protected-route"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ShiftTypeManagement } from "./components/shift-type-management"
import { DepartmentManagement } from "./components/department-management"
import { EmployeeSalaryManagement } from "./components/employee-salary-management"
import { ReportGenerator } from "@/components/reports/report-generator"
import NewReportPage from "./components/new-report"
import { SettingsIcon, LayoutDashboard, Users, DollarSign, FileText } from "lucide-react"

export default function SettingsPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">

        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-4 mb-8">
            <SettingsIcon className="w-8 h-8 text-gray-700" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
              <p className="text-gray-600 mt-1">Manage application configurations and generate reports</p>
            </div>
          </div>

          <Tabs defaultValue="shifts" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 md:grid-cols-4 lg:grid-cols-4">
              <TabsTrigger value="reports" className="flex items-center gap-2">
                <FileText className="w-4 h-4" /> Reports
              </TabsTrigger>
              <TabsTrigger value="shifts" className="flex items-center gap-2">
                <LayoutDashboard className="w-4 h-4" /> Shifts
              </TabsTrigger>
              <TabsTrigger value="departments" className="flex items-center gap-2">
                <Users className="w-4 h-4" /> Departments
              </TabsTrigger>
              <TabsTrigger value="salaries" className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" /> Salaries
              </TabsTrigger>
            </TabsList>

            <TabsContent value="shifts">
              <Card>
                <CardHeader>
                  <CardTitle>Shift Type Management</CardTitle>
                  <CardDescription>
                    Add, edit, or delete predefined shift types and their default times.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ShiftTypeManagement />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="departments">
              <Card>
                <CardHeader>
                  <CardTitle>Department Management</CardTitle>
                  <CardDescription>Add, edit, or delete departments within your organization.</CardDescription>
                </CardHeader>
                <CardContent>
                  <DepartmentManagement />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="salaries">
              <Card>
                <CardHeader>
                  <CardTitle>Employee Salary Management</CardTitle>
                  <CardDescription>View and update employee salary information.</CardDescription>
                </CardHeader>
                <CardContent>
                  <EmployeeSalaryManagement />
                </CardContent>
              </Card>
            </TabsContent>


            <TabsContent value="reports">
              <Card>
                <CardHeader>
                  <CardTitle>Report Generation</CardTitle>
                  <CardDescription>Generate various reports based on employee and schedule data.</CardDescription>
                </CardHeader>
                <CardContent>
                  <ReportGenerator />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </ProtectedRoute>
  )
}
