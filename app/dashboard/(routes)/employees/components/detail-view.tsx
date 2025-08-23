"use client"

import React from 'react'
import { useRouter } from 'next/navigation'
import { 
  ArrowLeft, 
  Edit, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  Building2,
  User,
  DollarSign,
  Users
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Employee, EmployeeStatus } from '@/types'

interface EmployeeDetailProps {
  employee: Employee
}

const getStatusColor = (status: EmployeeStatus) => {
  switch (status) {
    case 'active':
      return 'bg-green-100 text-green-800 hover:bg-green-200'
    case 'inactive':
      return 'bg-gray-100 text-gray-800 hover:bg-gray-200'
    case 'terminated':
      return 'bg-red-100 text-red-800 hover:bg-red-200'
    case 'on_leave':
      return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
    default:
      return 'bg-gray-100 text-gray-800 hover:bg-gray-200'
  }
}

const getStatusLabel = (status: EmployeeStatus) => {
  switch (status) {
    case 'active':
      return 'Active'
    case 'inactive':
      return 'Inactive'
    case 'terminated':
      return 'Terminated'
    case 'on_leave':
      return 'On Leave'
    default:
      return status
  }
}

export const EmployeeDetailView: React.FC<EmployeeDetailProps> = ({ employee }) => {
  const router = useRouter()

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div className="space-y-6 min-h-screen bg-gray-50 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Employee Details</h2>
            <p className="text-muted-foreground">
              View and manage employee information
            </p>
          </div>
        </div>
        <Button
          onClick={() => router.push(`/dashboard/employees/${employee.id}/edit`)}
          className="gap-2"
        >
          <Edit className="h-4 w-4" />
          Edit Employee
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Profile Card */}
        <Card className="md:col-span-1">
          <CardHeader className="text-center">
            <Avatar className="h-24 w-24 mx-auto mb-4">
              <AvatarImage src={employee.avatar_url || ''} alt={employee.name} />
              <AvatarFallback className="text-2xl">
                {employee.name.split(' ').map(n => n[0]).join('').toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <CardTitle className="text-xl">{employee.name}</CardTitle>
            <CardDescription className="text-base">
              {employee.position}
            </CardDescription>
            <Badge 
              variant="secondary" 
              className={`${getStatusColor(employee.status)} border-none mt-2`}
            >
              {getStatusLabel(employee.status)}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-3 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span>{employee.email ? employee.email : "N/A"}</span>
            </div>
            <div className="flex items-center space-x-3 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>{employee.phone ? employee.phone : '000-000-000'}</span>
            </div>
            {employee.address && (
              <div className="flex items-start space-x-3 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                <span className="flex-1">{employee.address}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Details Cards */}
        <div className="md:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Employee ID
                  </label>
                  <p className="text-sm font-mono mt-1">{employee.employee_id ? employee.employee_id : employee.user_id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Full Name
                  </label>
                  <p className="text-sm mt-1">{employee.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Email Address
                  </label>
                  <p className="text-sm mt-1">{employee.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Phone Number
                  </label>
                  <p className="text-sm mt-1">{employee.phone}</p>
                </div>
                {employee.birth_date && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Date of Birth
                    </label>
                    <p className="text-sm mt-1">{formatDate(employee.birth_date)}</p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Hire Date
                  </label>
                  <p className="text-sm mt-1 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {formatDate(employee.hire_date)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Job Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Job Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Position
                  </label>
                  <p className="text-sm mt-1">{employee.position}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Department
                  </label>
                  <p className="text-sm mt-1">{employee.department?.name || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Annual Salary
                  </label>
                  <p className="text-sm mt-1 flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    {formatCurrency(employee.salary || 0)}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Employment Status
                  </label>
                  <div className="mt-1">
                    <Badge 
                      variant="secondary" 
                      className={`${getStatusColor(employee.status)} border-none`}
                    >
                      {getStatusLabel(employee.status)}
                    </Badge>
                  </div>
                </div>
                {employee.manager && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Reports To
                    </label>
                    <p className="text-sm mt-1 flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      {employee.manager.name} - {employee.manager.position}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Emergency Contact */}
          {(employee.emergency_contact_name || employee.emergency_contact_phone) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Emergency Contact</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {employee.emergency_contact_name && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Contact Name
                      </label>
                      <p className="text-sm mt-1">{employee.emergency_contact_name}</p>
                    </div>
                  )}
                  {employee.emergency_contact_phone && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Contact Phone
                      </label>
                      <p className="text-sm mt-1">{employee.emergency_contact_phone}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* System Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">System Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Created At
                  </label>
                  <p className="text-sm mt-1">{formatDate(employee.created_at)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Last Updated
                  </label>
                  <p className="text-sm mt-1">{formatDate(employee.updated_at)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}