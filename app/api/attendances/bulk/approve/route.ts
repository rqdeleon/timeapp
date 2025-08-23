// app/api/attendances/bulk/approve/route.ts - Bulk overtime approval

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/utils/supabase/server'
import { bulkApproveOvertime } from '@/lib/services/attendance-services'

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

    const { recordIds, approvedHours } = await request.json()
    
    if (!recordIds || !Array.isArray(recordIds) || recordIds.length === 0) {
      return NextResponse.json(
        { error: 'Invalid record IDs provided' },
        { status: 400 }
      )
    }

    // Bulk approve overtime
    await bulkApproveOvertime(recordIds, approvedHours)

    return NextResponse.json({
      success: true,
      message: `Overtime approved for ${recordIds.length} records`
    })

  } catch (error) {
    console.error('Bulk approve overtime error:', error)
    return NextResponse.json(
      { error: 'Failed to approve overtime' },
      { status: 500 }
    )
  }
}

