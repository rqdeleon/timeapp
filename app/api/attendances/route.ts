// app/api/attendances/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/utils/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const employeeId = searchParams.get('employeeId')
    const departments = searchParams.get('departments')?.split(',')
    const status = searchParams.get('status')?.split(',')
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '50')

    const supabase = await createClient()
    
    let query = supabase
      .from('attendance_logs')
      .select(`
        *,
        employee:employee_id(
          *
        )
      `)
      .order('date', { ascending: false })

    // Apply filters
    if (startDate) query = query.gte('date', startDate)
    if (endDate) query = query.lte('date', endDate)
    if (employeeId) query = query.eq('employee_id', employeeId)
    if (status && status.length > 0) query = query.in('approval_status', status)

    // Get total count
    const { count } = await supabase
      .from('attendance_logs')
      .select('*', { count: 'exact', head: true })
    
    // Apply pagination
    // const offset = (page - 1) * pageSize
    // query = query.range(offset, offset + pageSize - 1)

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json({
      data: data || [],
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize)
    })

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch attendance records' },
      { status: 500 }
    )
  }
}
