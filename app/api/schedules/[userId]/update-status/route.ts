import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/utils/supabase/server';

export async function POST(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { status, adminPassword } = await request.json();
    const scheduleId = params.userId;

    // Validate admin password (server-side only)
    if (adminPassword !== process.env.SCHEDULE_ADMIN_PASSWORD) {
      return NextResponse.json(
        { error: 'Invalid admin password' }, 
        { status: 403 }
      );
    }

    // Validate status value
    const validStatuses = ['pending', 'checked-in', 'no-show', 'completed'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status value' }, 
        { status: 400 }
      );
    }

    // Update schedule status
    const { data, error } = await supabase
      .from('schedules')
      .update({ 
        status,
        status_updated_at: new Date().toISOString(),
        status_updated_by: session.user.id,
        auto_computed: false // Manual update
      })
      .eq('id', scheduleId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ schedule: data });

  } catch (error) {
    console.error('Failed to update schedule status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}