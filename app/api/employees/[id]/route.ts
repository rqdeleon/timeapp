// app/api/employees/[id]/route.ts (for employee details)
import { NextRequest, NextResponse } from 'next/server'
import { getEmployeeById } from '@/lib/services/employee-services'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const employeeId = await params
    const employee = await getEmployeeById(employeeId.id)
    
    if (!employee) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(employee)

  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch employee' },
      { status: 500 }
    )
  }
}