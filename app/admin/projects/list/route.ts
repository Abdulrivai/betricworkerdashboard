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
    console.log('🔍 Fetching projects for admin list...');
    
    // Fetch all projects
    const { data: projects, error } = await supabaseAdmin
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });

    console.log('📊 Projects query result:', { 
      projects: projects?.length || 0, 
      error,
      sample: projects?.[0] || 'No projects found'
    });

    if (error) {
      console.error('❌ Fetch projects error:', error);
      return NextResponse.json({
        error: 'Failed to fetch projects',
        details: process.env.NODE_ENV === 'development' ? error.message : 'Database error'
      }, { status: 500 });
    }

    // Ambil worker data untuk setiap project
    if (projects && projects.length > 0) {
      for (let project of projects) {
        if (project.worker_id) {
          const { data: worker } = await supabaseAdmin
            .from('users')
            .select('id, email, full_name, role')
            .eq('id', project.worker_id)
            .single();
          
          project.worker = worker;
        }
        
        // Map field names untuk compatibility dengan frontend
        project.current_deadline = project.deadline;
      }
    }

    console.log('✅ Successfully fetched', projects?.length || 0, 'projects');

    return NextResponse.json({
      success: true,
      projects: projects || [],
      total: projects?.length || 0
    });

  } catch (error: any) {
    console.error('💥 Fetch projects error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    }, { status: 500 });
  }
}