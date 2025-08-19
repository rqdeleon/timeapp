"use server"
// lib/services/employee-services.ts - Employee API functions
import { createClient } from '@/lib/utils/supabase/server'
import { Employee, EmployeeFormData, EmployeeColumnProps, Department } from '@/types'

// Get all employees with department information
export async function getAllEmployees(): Promise<Employee[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('employees')
    .select(`
      *,
      department:department_id(id,name)
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching employees:', error)
    throw new Error('Failed to fetch employees')
  }

  return data;
}

// Get single employee by ID with all relations
export async function getEmployeeById(id: string): Promise<Employee | null> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('employees')
    .select(`
      *,
      department:department_id(*)
    `)
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching employee:', error)
    return null
  }

  return data
}

// Create new employee
export async function createEmployee(employeeData: EmployeeFormData): Promise<Employee> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('employees')
    .insert([employeeData])
    .select(`
      *,
      department:departments(*),
      manager:employees!manager_id(id, name, position)
    `)
    .single()

  if (error) {
    console.error('Error creating employee:', error)
    throw new Error('Failed to create employee')
  }

  return data
}

// Update existing employee
export async function updateEmployee(id: string, employeeData: Partial<EmployeeFormData>) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('employees')
    .update({
      ...employeeData,
      updated_at: new Date().toISOString()
    })
    .eq('id', id);

  if (error) {
    console.error('Error updating employee:', error)
    throw new Error('Failed to update employee')
  }

}

// Delete employee
export async function deleteEmployee(id: string): Promise<void> {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('employees')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting employee:', error)
    throw new Error('Failed to delete employee')
  }
}

// Update employee status
export async function updateEmployeeStatus(id: string, status: Employee['status']): Promise<void> {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('employees')
    .update({ 
      status,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)

  if (error) {
    console.error('Error updating employee status:', error)
    throw new Error('Failed to update employee status')
  }
}

// Get all departments for dropdown
export async function getAllDepartments(): Promise<Department[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('departments')
    .select('*')
    .order('name')

  if (error) {
    console.error('Error fetching departments:', error)
    throw new Error('Failed to fetch departments')
  }

  return data
}

// Get all employees who can be managers (active employees)
export async function getPotentialManagers(): Promise<Employee[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('employees')
    .select('id, name, position')
    .eq('status', 'active')
    .order('name')

  if (error) {
    console.error('Error fetching potential managers:', error)
    throw new Error('Failed to fetch potential managers')
  }
  //@ts-ignore
  return data
}

// Get employee statistics
export async function getEmployeeStats() {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('employees')
    .select('status')

  if (error) {
    console.error('Error fetching employee stats:', error)
    throw new Error('Failed to fetch employee statistics')
  }

  const stats = {
    total: data.length,
    active: data.filter(emp => emp.status === 'active').length,
    inactive: data.filter(emp => emp.status === 'inactive').length,
    on_leave: data.filter(emp => emp.status === 'on_leave').length,
    terminated: data.filter(emp => emp.status === 'terminated').length,
  }

  return stats
}

// Search employees
export async function searchEmployees(query: string): Promise<EmployeeColumnProps[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('employees')
    .select(`
      *,
      department:departments(name)
    `)
    .or(`name.ilike.%${query}%,email.ilike.%${query}%,employee_code.ilike.%${query}%`)
    .order('name')

  if (error) {
    console.error('Error searching employees:', error)
    throw new Error('Failed to search employees')
  }

  return data.map(employee => ({
    id: employee.id,
    employee_id: employee.employee_id,
    name: employee.name,
    email: employee.email,
    phone: employee.phone,
    position: employee.position,
    department: employee.department?.name || 'N/A',
    salary: employee.salary,
    hire_date: employee.hire_date,
    status: employee.status,
    avatar_url: employee.avatar_url
  }))
}