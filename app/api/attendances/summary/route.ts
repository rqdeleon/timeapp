// app/api/attendances/summary/route.ts - Attendance summary

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/utils/supabase/server'
import { getAttendanceSummary } from '@/lib/services/attendance-summary'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    
    // Parse filters
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    
    let dateRange
    if (dateFrom && dateTo) {
      dateRange = {
        from: new Date(dateFrom),
        to: new Date(dateTo)
      }
    }
    
    const departments = searchParams.get('departments')?.split(',').filter(Boolean) || []
    const employees = searchParams.get('employees')?.split(',').filter(Boolean) || []
    
    const filters = {
      dateRange,
      employees
    }

    // Get summary data
    const summary = await getAttendanceSummary(filters)

    return NextResponse.json({
      success: true,
      data: summary
    })

  } catch (error) {
    console.error('GET attendance summary error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch attendance summary' },
      { status: 500 }
    )
  }
}
