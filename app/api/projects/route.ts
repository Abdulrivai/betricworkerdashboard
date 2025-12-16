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

// UUID validation helper
const isValidUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, project_value, worker_id, deadline, requirements } = body;

    console.log('🔧 Creating project:', { title, worker_id, project_value });

    // Basic validation
    if (!title?.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    if (!description?.trim()) {
      return NextResponse.json({ error: 'Description is required' }, { status: 400 });
    }

    const numericValue = parseFloat(project_value);
    if (isNaN(numericValue) || numericValue <= 0) {
      return NextResponse.json({ error: 'Project value must be a positive number' }, { status: 400 });
    }

    if (!worker_id || !isValidUUID(worker_id)) {
      return NextResponse.json({ error: 'Invalid worker ID' }, { status: 400 });
    }

    const deadlineDate = new Date(deadline);
    if (isNaN(deadlineDate.getTime()) || deadlineDate <= new Date()) {
      return NextResponse.json({ error: 'Deadline must be a valid future date' }, { status: 400 });
    }

    // Check if worker exists
    const { data: worker, error: workerError } = await supabaseAdmin
      .from('users')
      .select('id, role')
      .eq('id', worker_id)
      .single();

    if (workerError || !worker || worker.role !== 'worker') {
      return NextResponse.json({ error: 'Worker not found or invalid' }, { status: 404 });
    }

    // Insert project
    const { data: project, error: projectError } = await supabaseAdmin
      .from('projects')
      .insert({
        title: title.trim(),
        description: description.trim(),
        project_value: numericValue,
        worker_id,
        deadline: deadlineDate.toISOString(),
        status: 'DRAFT_SPK',
        requirements: Array.isArray(requirements) ? requirements : []
      })
      .select()
      .single();

    if (projectError) {
      console.error('❌ Project creation error:', projectError);
      return NextResponse.json({
        error: 'Failed to create project',
        details: process.env.NODE_ENV === 'development' ? projectError.message : 'Database error'
      }, { status: 500 });
    }

    console.log('✅ Project created:', project);

    return NextResponse.json({
      success: true,
      message: 'SPK berhasil dibuat',
      project
    }, { status: 201 });

  } catch (error: any) {
    console.error('💥 Create project error:', error);
    return NextResponse.json({
      error: 'Failed to create project',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    console.log('🔍 Fetching all projects...');
    
    // Fetch all projects with worker info (dengan debugging)
    const { data: projects, error } = await supabaseAdmin
      .from('projects')
      .select(`
        *,
        worker:users!projects_worker_id_fkey(id, email, full_name, role)
      `)
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