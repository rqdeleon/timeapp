import { NextRequest, NextResponse } from 'next/server';
import { ScheduleService } from '@/lib/services/schedule-service';
import { createClient } from '@/lib/utils/supabase/server';


export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const employeeIds = searchParams.get('employeeIds')?.split(',');
    const departmentId = searchParams.get('departmentId');

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'startDate and endDate are required' }, 
        { status: 400 }
      );
    }

    const schedules = await ScheduleService.getSchedulesByDateRange(
      startDate,
      endDate,
      employeeIds,
      departmentId
    );

    return NextResponse.json({ schedules });
  } catch (error) {
    console.error('Failed to fetch schedules:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const schedule = await request.json();
    const result = await ScheduleService.upsertSchedule(schedule);

    if (!result.success) {
      return NextResponse.json(
        { 
          error: result.error,
          conflicts: result.conflicts 
        }, 
        { status: 400 }
      );
    }

    return NextResponse.json({ 
      schedule: result.schedule,
      conflicts: result.conflicts 
    });
  } catch (error) {
    console.error('Failed to create/update schedule:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  return POST(request); // Same logic for updates
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const scheduleId = searchParams.get('id');

    if (!scheduleId) {
      return NextResponse.json(
        { error: 'Schedule ID is required' }, 
        { status: 400 }
      );
    }

    const result = await ScheduleService.deleteSchedule(scheduleId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error }, 
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete schedule:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}