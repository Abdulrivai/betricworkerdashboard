import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing Supabase environment variables');
}

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await context.params;
    const body = await request.json();
    const { action, worker_id } = body;

    if (!['ACCEPT', 'REJECT', 'COMPLETE'].includes(action)) {
      return NextResponse.json({
        error: 'Invalid action. Must be ACCEPT, REJECT, or COMPLETE'
      }, { status: 400 });
    }

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

    if (project.worker_id !== worker_id) {
      return NextResponse.json({
        error: 'You are not assigned to this project'
      }, { status: 403 });
    }

    // Status logic
    let newStatus = '';
    if (action === 'ACCEPT') {
      if (project.status !== 'WAITING_WORKER_APPROVAL') {
        return NextResponse.json({
          error: 'Project is not waiting for worker approval'
        }, { status: 400 });
      }
      newStatus = 'ACTIVE';
    } else if (action === 'REJECT') {
      if (project.status !== 'WAITING_WORKER_APPROVAL') {
        return NextResponse.json({
          error: 'Project is not waiting for worker approval'
        }, { status: 400 });
      }
      newStatus = 'CANCELLED';
    } else if (action === 'COMPLETE') {
      if (project.status !== 'ACTIVE') {
        return NextResponse.json({
          error: 'Project is not active'
        }, { status: 400 });
      }
      // Set status to COMPLETION_REQUESTED, admin will approve later
      newStatus = 'COMPLETION_REQUESTED';
    }

    const updateData: any = {
      status: newStatus,
      updated_at: new Date().toISOString()
    };

    const { error: updateError } = await supabaseAdmin
      .from('projects')
      .update(updateData)
      .eq('id', projectId);

    if (updateError) {
      console.error('❌ Supabase update error:', updateError);
      return NextResponse.json({
        error: 'Failed to update project status',
        details: updateError.message
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message:
        action === 'ACCEPT'
          ? 'SPK berhasil diterima! Project sekarang aktif.'
          : action === 'REJECT'
          ? 'SPK berhasil ditolak.'
          : 'Request penyelesaian berhasil dikirim! Menunggu approval admin.'
    });

  } catch (error: any) {
    return NextResponse.json({
      error: 'Failed to process worker response',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    }, { status: 500 });
  }
}