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

// WORKER REQUEST COMPLETION
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const projectId = id;
    const body = await request.json();
    const { worker_id } = body;

    console.log('🎯 Worker requesting completion:', { projectId, worker_id });

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

    // Verify worker is assigned to this project
    if (project.worker_id !== worker_id) {
      return NextResponse.json({
        error: 'You are not assigned to this project'
      }, { status: 403 });
    }

    // Check if project is active
    if (project.status !== 'ACTIVE') {
      return NextResponse.json({
        error: 'Project must be active to request completion'
      }, { status: 400 });
    }

    // Update project status to COMPLETION_REQUESTED
    const { error: updateError } = await supabaseAdmin
      .from('projects')
      .update({
        status: 'COMPLETION_REQUESTED',
        updated_at: new Date().toISOString()
      })
      .eq('id', projectId);

    if (updateError) {
      console.error('❌ Failed to update project status:', updateError);
      return NextResponse.json({
        error: 'Failed to request completion',
        details: process.env.NODE_ENV === 'development' ? updateError.message : 'Database error'
      }, { status: 500 });
    }

    // Create notification for admin
    const { error: notifError } = await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: project.admin_id || null, // Assuming there's an admin_id field
        notification_type: 'COMPLETION_REQUESTED',
        title: 'Request Penyelesaian Project',
        message: `Worker telah meminta penyelesaian project "${project.title}". Silakan review dan approve.`,
        project_id: projectId,
        is_read: false
      });

    if (notifError) {
      console.error('❌ Failed to create notification:', notifError);
      // Don't return error, the main action was successful
    }

    console.log('✅ Completion requested successfully');

    return NextResponse.json({
      success: true,
      message: 'Request penyelesaian berhasil dikirim! Menunggu approval admin.'
    });

  } catch (error: any) {
    console.error('💥 Complete project error:', error);
    return NextResponse.json({
      error: 'Failed to request completion',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    }, { status: 500 });
  }
}