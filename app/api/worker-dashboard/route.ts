import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const workerId = searchParams.get('worker_id');

    if (!workerId) {
      return NextResponse.json({ error: 'Worker ID is required' }, { status: 400 });
    }

    console.log('📊 Fetching worker dashboard for:', workerId);

    // FETCH USER INFO FIRST
    const { data: workerInfo, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, full_name, email, role')
      .eq('id', workerId)
      .eq('role', 'worker')
      .single();

    if (userError || !workerInfo) {
      console.error('❌ Worker not found:', userError);
      return NextResponse.json({ 
        error: 'Worker not found or invalid role',
        details: userError?.message 
      }, { status: 404 });
    }

    console.log('👤 Worker info found:', workerInfo.full_name, workerInfo.email);

    // Fetch projects assigned to THIS specific worker
    const { data: projects, error: projectsError } = await supabaseAdmin
      .from('projects')
      .select(`
        id,
        title,
        description,
        project_value,
        status,
        deadline,
        created_at,
        updated_at
      `)
      .eq('worker_id', workerId)
      .order('updated_at', { ascending: false });

    if (projectsError) {
      console.error('❌ Error fetching projects:', projectsError);
    }

    const dashboardData = {
      worker: {
        id: workerInfo.id,
        full_name: workerInfo.full_name,
        email: workerInfo.email,
        role: workerInfo.role
      },
      projects: projects || [],
      stats: {
        total_projects: projects?.length || 0,
        active_projects: projects?.filter(p => p.status === 'WAITING_WORKER_APPROVAL').length || 0,
        completed_projects: projects?.filter(p => p.status === 'DONE_ON_TIME').length || 0
      }
    };

    console.log('✅ Worker dashboard data:', { 
      worker_name: workerInfo.full_name,
      projects: projects?.length || 0
    });

    return NextResponse.json(dashboardData);

  } catch (error: any) {
    console.error('💥 Dashboard API error:', error);
    return NextResponse.json({
      error: 'Failed to fetch dashboard data',
      details: error.message
    }, { status: 500 });
  }
}