import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Disable caching for real-time stats
export const dynamic = 'force-dynamic';
export const revalidate = 0;

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

export async function GET() {
  try {
    console.log('📊 Fetching admin dashboard stats...');

    // Get all projects with their status counts
    const { data: projects, error: projectsError } = await supabaseAdmin
      .from('projects')
      .select('id, status, project_value, worker_id');

    if (projectsError) {
      console.error('❌ Error fetching projects:', projectsError);
      return NextResponse.json({
        error: 'Failed to fetch projects',
        details: projectsError.message
      }, { status: 500 });
    }

    // Get total workers
    const { data: workers, error: workersError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('role', 'worker');

    if (workersError) {
      console.error('❌ Error fetching workers:', workersError);
      return NextResponse.json({
        error: 'Failed to fetch workers',
        details: workersError.message
      }, { status: 500 });
    }

    // Calculate statistics
    const totalProjects = projects?.length || 0;
    const draftSpk = projects?.filter(p => p.status === 'DRAFT_SPK').length || 0;
    const waitingApproval = projects?.filter(p => p.status === 'WAITING_WORKER_APPROVAL').length || 0;
    const activeProjects = projects?.filter(p => p.status === 'ACTIVE').length || 0;
    const completionRequests = projects?.filter(p => p.status === 'COMPLETION_REQUESTED').length || 0;
    const completedProjects = projects?.filter(p => 
      p.status === 'DONE_ON_TIME' || p.status === 'DONE_LATE'
    ).length || 0;
    const totalWorkers = workers?.length || 0;
    
    // Calculate pending payments (completed projects that may need payment)
    const pendingPayments = completedProjects;

    const stats = {
      totalProjects,
      draftSpk,
      waitingApproval,
      activeProjects,
      completionRequests,
      completedProjects,
      totalWorkers,
      pendingPayments
    };

    console.log('✅ Dashboard stats calculated:', stats);

    return NextResponse.json({
      success: true,
      stats,
      message: 'Dashboard stats fetched successfully'
    });

  } catch (error: any) {
    console.error('💥 Dashboard stats error:', error);
    return NextResponse.json({
      error: 'Failed to fetch dashboard stats',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    }, { status: 500 });
  }
}