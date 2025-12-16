import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

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
    console.log('📊 Fetching detailed workers data...');

    // Get all workers
    const { data: workers, error: workersError } = await supabaseAdmin
      .from('users')
      .select('id, full_name, email, role, created_at')
      .eq('role', 'worker')
      .order('created_at', { ascending: false });

    if (workersError) {
      console.error('❌ Error fetching workers:', workersError);
      return NextResponse.json({
        error: 'Failed to fetch workers'
      }, { status: 500 });
    }

    console.log(`✅ Found ${workers.length} workers`);

    // Get statistics and history for each worker
    const workersWithStats = await Promise.all(
      workers.map(async (worker) => {
        console.log(`📋 Processing worker: ${worker.full_name}`);
        
        // PERBAIKAN: Get ALL projects for worker (tidak hanya yang DRAFT_SPK saja)
        const { data: projects, error: projectsError } = await supabaseAdmin
          .from('projects')
          .select(`
            id, 
            title, 
            status, 
            project_value, 
            deadline, 
            created_at, 
            completed_at,
            updated_at
          `)
          .eq('worker_id', worker.id)
          .order('created_at', { ascending: false });

        if (projectsError) {
          console.error(`❌ Error fetching projects for ${worker.full_name}:`, projectsError);
        }

        // PERBAIKAN: Filter hanya project yang sudah dikirim SPK (bukan DRAFT_SPK)
        const visibleProjects = projects?.filter(p => p.status !== 'DRAFT_SPK') || [];
        
        const totalProjects = visibleProjects.length;
        const completedProjects = visibleProjects.filter(p => 
          p.status === 'DONE_ON_TIME' || p.status === 'DONE_LATE'
        ).length;
        const activeProjects = visibleProjects.filter(p => 
          p.status === 'ACTIVE' || 
          p.status === 'COMPLETION_REQUESTED' || 
          p.status === 'WAITING_WORKER_APPROVAL'
        ).length;
        const totalEarnings = visibleProjects.filter(p => 
          p.status === 'DONE_ON_TIME' || p.status === 'DONE_LATE'
        ).reduce((sum, p) => sum + (p.project_value || 0), 0);

        console.log(`✅ ${worker.full_name}: ${totalProjects} projects, ${completedProjects} completed, ${activeProjects} active`);

        return {
          ...worker,
          total_projects: totalProjects,
          completed_projects: completedProjects,
          active_projects: activeProjects,
          total_earnings: totalEarnings,
          history: visibleProjects || []
        };
      })
    );

    console.log('✅ Successfully fetched workers with statistics');

    return NextResponse.json({
      success: true,
      workers: workersWithStats,
      message: `Found ${workersWithStats.length} workers with complete statistics`
    });

  } catch (error: any) {
    console.error('💥 Workers detailed error:', error);
    return NextResponse.json({
      error: 'Failed to fetch workers data',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    }, { status: 500 });
  }
}