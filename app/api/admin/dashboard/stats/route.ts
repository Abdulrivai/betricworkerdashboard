import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Disable caching for real-time data
export const dynamic = 'force-dynamic';
export const revalidate = 0;

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

export async function GET() {
  try {
    console.log('📊 Fetching dashboard stats...');

    // Get all projects with basic info
    const { data: projects, error: projectsError } = await supabaseAdmin
      .from('projects')
      .select('status, project_value');

    if (projectsError) {
      console.error('❌ Projects fetch error:', projectsError);
      throw projectsError;
    }

    // Get all workers count
    const { data: workers, error: workersError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('role', 'worker');

    if (workersError) {
      console.error('❌ Workers fetch error:', workersError);
      throw workersError;
    }

    // Calculate stats
    const totalProjects = projects?.length || 0;
    const activeProjects = projects?.filter(p => p.status === 'ACTIVE').length || 0;
    const completedProjects = projects?.filter(p => 
      p.status === 'DONE_ON_TIME' || p.status === 'DONE_LATE'
    ).length || 0;
    const pendingApprovals = projects?.filter(p => 
      p.status === 'WAITING_WORKER_APPROVAL' || p.status === 'COMPLETION_REQUESTED'
    ).length || 0;
    const onTimeCompletion = projects?.filter(p => p.status === 'DONE_ON_TIME').length || 0;
    const lateCompletion = projects?.filter(p => p.status === 'DONE_LATE').length || 0;
    const totalValue = projects?.reduce((sum, project) => sum + (project.project_value || 0), 0) || 0;
    const totalWorkers = workers?.length || 0;

    const stats = {
      totalProjects,
      activeProjects,
      completedProjects,
      totalWorkers,
      pendingApprovals,
      totalValue,
      onTimeCompletion,
      lateCompletion
    };

    console.log('✅ Dashboard stats calculated:', stats);

    return NextResponse.json({
      success: true,
      stats
    });

  } catch (error: any) {
    console.error('💥 Dashboard stats error:', error);
    return NextResponse.json({
      error: 'Failed to fetch dashboard stats',
      details: error.message
    }, { status: 500 });
  }
}