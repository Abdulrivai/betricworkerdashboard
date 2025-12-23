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
    console.log('📋 Fetching recent projects...');

    // Get recent projects with worker info
    const { data: projects, error } = await supabaseAdmin
      .from('projects')
      .select(`
        id,
        title,
        status,
        project_value,
        deadline,
        created_at,
        worker:worker_id (
          full_name
        )
      `)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('❌ Recent projects fetch error:', error);
      throw error;
    }

    // Format projects untuk response
    const formattedProjects = projects?.map(project => ({
      id: project.id,
      title: project.title,
      status: project.status,
      project_value: project.project_value,
      current_deadline: project.deadline,
      worker: project.worker
    })) || [];

    console.log('✅ Recent projects fetched:', formattedProjects.length);

    return NextResponse.json({
      success: true,
      projects: formattedProjects
    });

  } catch (error: any) {
    console.error('💥 Recent projects error:', error);
    return NextResponse.json({
      error: 'Failed to fetch recent projects',
      details: error.message
    }, { status: 500 });
  }
}