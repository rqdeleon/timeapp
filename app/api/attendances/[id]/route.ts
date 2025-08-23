import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/utils/supabase/server'
import { calculateAttendanceMetrics } from '@/lib/services/attendance-calculations'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('attendance_logs')
      .select(`
        *,
        employee:employee_id(
          id,
          name,
          employee_id,
          department:department_id(name)
        )
      `)
      .eq('id', params.id)
      .single()

    if (error) throw error

    return NextResponse.json(data)

  } catch (error) {
    return NextResponse.json(
      { error: 'Record not found' },
      { status: 404 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const updates = await request.json()
    const supabase = await createClient()

    // If time changes, recalculate metrics
    if (updates.time_in || updates.time_out !== undefined) {
      // Get current record to get the date
      const { data: currentRecord } = await supabase
        .from('attendance_logs')
        .select('date, time_in, time_out')
        .eq('id', params.id)
        .single()

      if (currentRecord) {
        const timeIn = updates.time_in || currentRecord.time_in
        const timeOut = updates.time_out !== undefined ? updates.time_out : currentRecord.time_out
        
        const metrics = calculateAttendanceMetrics(timeIn, timeOut, currentRecord.date)
        
        Object.assign(updates, {
          total_hours: metrics.totalHours,
          regular_hours: metrics.regularHours,
          overtime_hours_raw: metrics.overtimeHours,
          sunday_hours: metrics.sundayHours,
          overnight_hours: metrics.overnightHours,
          is_sunday: metrics.isSunday,
          is_overnight: metrics.isOvernight,
          is_incomplete: metrics.isIncomplete
        })
      }
    }

    const { data, error } = await supabase
      .from('attendance_records')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .select()

    if (error) throw error

    return NextResponse.json({ success: true, data })

  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update record' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    
    const { error } = await supabase
      .from('attendance_logs')
      .delete()
      .eq('id', params.id)

    if (error) throw error

    return NextResponse.json({ success: true })

  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete record' },
      { status: 500 }
    )
  }
}
