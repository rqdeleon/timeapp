// app/api/attendances/bulk/delete/route.ts - Bulk delete

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/utils/supabase/server'
import { bulkDeleteAttendanceRecords } from '@/lib/services/attendance-services'

export async function POST(request: NextRequest) {
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

    const { recordIds } = await request.json()
    
    if (!recordIds || !Array.isArray(recordIds) || recordIds.length === 0) {
      return NextResponse.json(
        { error: 'Invalid record IDs provided' },
        { status: 400 }
      )
    }

    // Bulk delete records
    await bulkDeleteAttendanceRecords(recordIds)

    return NextResponse.json({
      success: true,
      message: `${recordIds.length} attendance records deleted`
    })

  } catch (error) {
    console.error('Bulk delete error:', error)
    return NextResponse.json(
      { error: 'Failed to delete attendance records' },
      { status: 500 }
    )
  }
}

