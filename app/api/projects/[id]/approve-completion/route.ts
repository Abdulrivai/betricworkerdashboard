import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Environment variables validation
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing Supabase environment variables');
}

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// ADMIN APPROVE COMPLETION
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const projectId = id;

    console.log('✅ Admin approving completion for project:', projectId);

    // Get project details
    const { data: project, error: projectError } = await supabaseAdmin
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      return NextResponse.json({
        error: 'Project not found'
      }, { status: 404 });
    }

    // Check if project is in COMPLETION_REQUESTED status
    if (project.status !== 'COMPLETION_REQUESTED') {
      return NextResponse.json({
        error: 'Project is not requesting completion'
      }, { status: 400 });
    }

    // Check if completed on time or late
    const deadlineDate = new Date(project.deadline);
    const now = new Date();
    const isOnTime = now <= deadlineDate;
    const newStatus = isOnTime ? 'DONE_ON_TIME' : 'DONE_LATE';

    // Update project status
    const { error: updateError } = await supabaseAdmin
      .from('projects')
      .update({
        status: newStatus,
        completed_at: now.toISOString(),
        updated_at: now.toISOString()
      })
      .eq('id', projectId);

    if (updateError) {
      console.error('❌ Failed to approve completion:', updateError);
      return NextResponse.json({
        error: 'Failed to approve completion',
        details: process.env.NODE_ENV === 'development' ? updateError.message : 'Database error'
      }, { status: 500 });
    }

    console.log(`✅ Completion approved successfully - Status: ${newStatus}`);

    return NextResponse.json({
      success: true,
      message: `Project berhasil disetujui sebagai selesai${isOnTime ? ' tepat waktu' : ' (terlambat)'}!`,
      status: newStatus
    });

  } catch (error: any) {
    console.error('💥 Approve completion error:', error);
    return NextResponse.json({
      error: 'Failed to approve completion',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    }, { status: 500 });
  }
}