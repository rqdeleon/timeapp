"use client"

import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useRouter } from 'next/navigation'
import { Loader2, Save, ArrowLeft, Upload, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useToast } from '@/components/ui/use-toast'
import { Employee, Department, EmployeeFormData } from '@/types'

// Validation schema
const employeeSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  position: z.string().min(2, "Position is required"),
  department_id: z.string().min(1, "Department is required"),
  salary: z.number().min(0, "Salary must be a positive number"),
  hire_date: z.string().min(1, "Hire date is required"),
  birth_date: z.string().optional(),
  address: z.string().optional(),
  emergency_contact_name: z.string().optional(),
  emergency_contact_phone: z.string().optional(),
  tin_id: z.string().min(9, "TIN No. must be at least 9 digits").optional(),
  sss_id: z.string().min(10, "SSS No. must be at least 10 digits").optional(),
  pagibig_id: z.string().min(12, "Pag-IBIG ID No. must be at least 12 digits").optional(),
  hmo_id: z.string().optional(),
  philhealth_id: z.string().optional(),
  status: z.enum(['active', 'inactive', 'terminated', 'on_leave']),
  manager_id: z.string().optional(),
})

type EmployeeFormValues = z.infer<typeof employeeSchema>

interface EmployeeFormProps {
  initialData?: Employee
  departments: Department[]
  managers: Employee[]
  onSubmit: (data: EmployeeFormData) => Promise<void>
}

export const EmployeeForm: React.FC<EmployeeFormProps> = ({
  initialData,
  departments,
  managers,
  onSubmit
}) => {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(
    initialData?.avatar_url || null
  )

  const form = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeSchema),
    defaultValues: initialData ? {
      name: initialData.name,
      email: initialData.email,
      phone: initialData.phone,
      position: initialData.position,
      department_id: initialData.department_id,
      salary: initialData.salary,
      hire_date: initialData.hire_date.split('T')[0], // Format for date input
      birth_date: initialData.birth_date?.split('T')[0] || '',
      address: initialData.address || '',
      emergency_contact_name: initialData.emergency_contact_name || '',
      emergency_contact_phone: initialData.emergency_contact_phone || '',
      tin_id: initialData.tin_id || '',
      sss_id: initialData.sss_id || '',
      pagibig_id: initialData.pagibig_id || '',
      hmo_id: initialData.hmo_id || '',
      philhealth_id: initialData.philhealth_id || '',
      status: initialData.status,
      manager_id: initialData.manager_id || '',
    } : {
      name: '',
      email: '',
      phone: '',
      position: '',
      department_id: '',
      salary: 0,
      hire_date: new Date().toISOString().split('T')[0],
      birth_date: '',
      address: '',
      emergency_contact_name: '',
      emergency_contact_phone: '',
      tin_id: '',
      sss_id: '',
      pagibig_id: '',
      hmo_id: '',
      philhealth_id: '',
      status: 'active' as const,
      manager_id: '',
    }
  })

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setAvatarFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeAvatar = () => {
    setAvatarFile(null)
    setAvatarPreview(null)
  }

  const handleSubmit = async (values: EmployeeFormValues) => {
    try {
      setLoading(true)
      
      // TODO: Handle avatar upload to your storage service
      let avatar_url = avatarPreview
      if (avatarFile) {
        // Upload avatar and get URL
        // avatar_url = await uploadAvatar(avatarFile)
      }
      //@ts-ignore
      const formData: EmployeeFormData = {
        ...values,
        avatar_url,
        employee_id: initialData?.employee_id,
        user_id: initialData?.user_id,
      }

      await onSubmit(formData)
      
      toast({
        description: `Employee ${initialData ? 'updated' : 'created'} successfully.`
      })
      
      router.push('/dashboard/employees')
      
    } catch (error) {
      toast({
        variant: 'destructive',
        description: 'Something went wrong. Please try again.'
      })
    } finally {
      setLoading(false)
    }
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
            <h2 className="text-2xl font-bold tracking-tight">
              {initialData ? 'Edit Employee' : 'Add New Employee'}
            </h2>
            <p className="text-muted-foreground">
              {initialData 
                ? 'Update employee information and details.' 
                : 'Create a new employee record with all necessary information.'
              }
            </p>
          </div>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            
            {/* Avatar Upload */}
            <Card className="md:col-span-2 lg:col-span-1">
              <CardHeader>
                <CardTitle className="text-lg">Profile Photo</CardTitle>
                <CardDescription>
                  Upload a profile picture for the employee
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-center">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={avatarPreview || ''} />
                    <AvatarFallback className="text-lg">
                      {form.watch('name') 
                        ? form.watch('name').split(' ').map(n => n[0]).join('').toUpperCase()
                        : 'EMP'
                      }
                    </AvatarFallback>
                  </Avatar>
                </div>
                
                <div className="flex justify-center space-x-2">
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                      id="avatar-upload"
                    />
                    <Label
                      htmlFor="avatar-upload"
                      className="cursor-pointer inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload
                    </Label>
                  </div>
                  
                  {avatarPreview && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={removeAvatar}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Remove
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Personal Information */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg">Personal Information</CardTitle>
                <CardDescription>
                  Basic employee details and contact information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="John Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address *</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="john.doe@company.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number *</FormLabel>
                        <FormControl>
                          <Input placeholder="+1 (555) 123-4567" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="birth_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date of Birth</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="hire_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Hire Date *</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="123 Main Street, City, State, ZIP"
                          className="resize-none"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Job Information */}
            <Card className="md:col-span-2 lg:col-span-1">
              <CardHeader>
                <CardTitle className="text-lg">Job Information</CardTitle>
                <CardDescription>
                  Position, department and organizational details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="position"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Position *</FormLabel>
                      <FormControl>
                        <Input placeholder="Software Engineer" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="department_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Department</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select department" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {departments.map((dept) => (
                            <SelectItem key={dept.id} value={dept.id}>
                              {dept.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="manager_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Manager</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select manager" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value=" ">No Manager</SelectItem>
                          {managers.map((manager) => (
                            <SelectItem key={manager.id} value={manager.id}>
                              {manager.name} - {manager.position}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="salary"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Salary rate</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="50000" 
                          {...field}
                          onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormDescription>
                        Enter the annual salary in USD
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Employment Status *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                          <SelectItem value="on_leave">On Leave</SelectItem>
                          <SelectItem value="terminated">Terminated</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          
            <div className="md:col-span-2 flex flex-col gap-y-6">
              {/* Government & Benefits IDs */}
              <Card className="">
                <CardHeader>
                  <CardTitle className="text-lg">Government & Benefits IDs</CardTitle>
                  <CardDescription>
                    {/* Contact person in case of emergency */}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="tin_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tax Identification Number</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="sss_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>SSS No.</FormLabel>
                          <FormControl>
                            <Input  {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="pagibig_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Pag-IBIG No.</FormLabel>
                          <FormControl>
                            <Input  {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="philhealth_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>PhilHealth No.</FormLabel>
                          <FormControl>
                            <Input  {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    /> 
                    <FormField
                      control={form.control}
                      name="hmo_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>HMO ID No.</FormLabel>
                          <FormControl>
                            <Input  {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />                   
                  </div>
                </CardContent>
              </Card>

              {/* Emergency Contact */}
              <Card className="">
                <CardHeader>
                  <CardTitle className="text-lg">Emergency Contact</CardTitle>
                  <CardDescription>
                    Contact person in case of emergency
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="emergency_contact_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contact Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Spouse name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="emergency_contact_phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contact Phone</FormLabel>
                          <FormControl>
                            <Input placeholder="+639 123 4567" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Form Actions */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-end space-x-4">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Save className="mr-2 h-4 w-4" />
                  {initialData ? 'Update Employee' : 'Create Employee'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </Form>
    </div>
  )
}