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

// SEND SPK TO WORKER
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const projectId = id;

    console.log('📤 Sending SPK for project:', projectId);

    // Get project details
    const { data: project, error: projectError } = await supabaseAdmin
      .from('projects')
      .select(`
        *,
        worker:users!projects_worker_id_fkey(id, full_name, email)
      `)
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      return NextResponse.json({
        error: 'Project not found'
      }, { status: 404 });
    }

    // Check if project is in DRAFT_SPK status
    if (project.status !== 'DRAFT_SPK') {
      return NextResponse.json({
        error: 'Project must be in DRAFT_SPK status to send SPK'
      }, { status: 400 });
    }

    // Check if worker exists
    if (!project.worker_id) {
      return NextResponse.json({
        error: 'No worker assigned to this project'
      }, { status: 400 });
    }

    // Update project status to WAITING_WORKER_APPROVAL
    const { error: updateError } = await supabaseAdmin
      .from('projects')
      .update({
        status: 'WAITING_WORKER_APPROVAL',
        updated_at: new Date().toISOString()
      })
      .eq('id', projectId);

    if (updateError) {
      console.error('❌ Failed to update project status:', updateError);
      return NextResponse.json({
        error: 'Failed to send SPK',
        details: process.env.NODE_ENV === 'development' ? updateError.message : 'Database error'
      }, { status: 500 });
    }

    // Create notification for worker
    const { error: notifError } = await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: project.worker_id,
        notification_type: 'SPK_RECEIVED',
        title: 'SPK Baru Diterima',
        message: `Anda mendapat SPK baru untuk project "${project.title}". Silakan review dan berikan persetujuan.`,
        project_id: projectId,
        is_read: false
      });

    if (notifError) {
      console.error('❌ Failed to create notification:', notifError);
      // Don't return error, SPK is already sent
    }

    console.log('✅ SPK sent successfully to worker:', project.worker?.full_name);

    return NextResponse.json({
      success: true,
      message: `SPK berhasil dikirim ke ${project.worker?.full_name || 'worker'}`
    });

  } catch (error: any) {
    console.error('💥 Send SPK error:', error);
    return NextResponse.json({
      error: 'Failed to send SPK',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    }, { status: 500 });
  }
}