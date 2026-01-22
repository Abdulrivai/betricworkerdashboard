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
    const { title, description, workers, deadline, requirements } = body;

    console.log('🔧 Creating project:', { title, workers });

    // Basic validation
    if (!title?.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    if (!description?.trim()) {
      return NextResponse.json({ error: 'Description is required' }, { status: 400 });
    }

    // Validate workers array
    if (!Array.isArray(workers) || workers.length === 0) {
      return NextResponse.json({ error: 'At least one worker must be selected' }, { status: 400 });
    }

    // Validate each worker object
    for (const worker of workers) {
      if (!worker.worker_id || !isValidUUID(worker.worker_id)) {
        return NextResponse.json({ error: 'Invalid worker ID format' }, { status: 400 });
      }

      const numericValue = parseFloat(worker.project_value);
      if (isNaN(numericValue) || numericValue <= 0) {
        return NextResponse.json({
          error: `Project value for worker ${worker.worker_id} must be a positive number`
        }, { status: 400 });
      }
    }

    const deadlineDate = new Date(deadline);
    if (isNaN(deadlineDate.getTime()) || deadlineDate <= new Date()) {
      return NextResponse.json({ error: 'Deadline must be a valid future date' }, { status: 400 });
    }

    // Extract worker IDs for validation
    const worker_ids = workers.map(w => w.worker_id);

    // Check if all workers exist and are valid
    const { data: workersData, error: workersError } = await supabaseAdmin
      .from('users')
      .select('id, role')
      .in('id', worker_ids);

    if (workersError) {
      return NextResponse.json({ error: 'Failed to verify workers' }, { status: 500 });
    }

    if (!workersData || workersData.length !== worker_ids.length) {
      return NextResponse.json({ error: 'One or more workers not found' }, { status: 404 });
    }

    const invalidWorkers = workersData.filter(w => w.role !== 'worker');
    if (invalidWorkers.length > 0) {
      return NextResponse.json({ error: 'One or more selected users are not workers' }, { status: 400 });
    }

    // Create separate projects for each worker with their individual project values
    const projectsToInsert = workers.map(worker => ({
      title: title.trim(),
      description: description.trim(),
      project_value: parseFloat(worker.project_value),
      worker_id: worker.worker_id,
      deadline: deadlineDate.toISOString(),
      status: 'DRAFT_SPK',
      requirements: Array.isArray(requirements) ? requirements : []
    }));

    const { data: projects, error: projectError } = await supabaseAdmin
      .from('projects')
      .insert(projectsToInsert)
      .select();

    if (projectError) {
      console.error('❌ Project creation error:', projectError);
      return NextResponse.json({
        error: 'Failed to create projects',
        details: process.env.NODE_ENV === 'development' ? projectError.message : 'Database error'
      }, { status: 500 });
    }

    // Insert workers into project_workers junction table (each project gets only its assigned worker)
    const projectWorkers = projects.map(project => ({
      project_id: project.id,
      worker_id: project.worker_id
    }));

    const { error: junctionError } = await supabaseAdmin
      .from('project_workers')
      .insert(projectWorkers);

    if (junctionError) {
      console.error('❌ Project workers junction error:', junctionError);
      // Rollback: delete all created projects if junction insert fails
      const projectIds = projects.map(p => p.id);
      await supabaseAdmin.from('projects').delete().in('id', projectIds);
      return NextResponse.json({
        error: 'Failed to assign workers to projects',
        details: process.env.NODE_ENV === 'development' ? junctionError.message : 'Database error'
      }, { status: 500 });
    }

    console.log('✅ Created', projects.length, 'separate projects for', worker_ids.length, 'workers');

    return NextResponse.json({
      success: true,
      message: `${projects.length} SPK terpisah berhasil dibuat untuk ${worker_ids.length} worker${worker_ids.length > 1 ? 's' : ''} dengan nilai berbeda`,
      projects,
      project_count: projects.length
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

    // Fetch all projects with primary worker info
    const { data: projects, error } = await supabaseAdmin
      .from('projects')
      .select(`
        *,
        worker:users!projects_worker_id_fkey(id, email, full_name, role)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Fetch projects error:', error);
      return NextResponse.json({
        error: 'Failed to fetch projects',
        details: process.env.NODE_ENV === 'development' ? error.message : 'Database error'
      }, { status: 500 });
    }

    // Fetch all workers for each project from junction table
    const projectIds = projects?.map(p => p.id) || [];

    let projectWorkersMap: Record<string, any[]> = {};

    if (projectIds.length > 0) {
      const { data: projectWorkers, error: pwError } = await supabaseAdmin
        .from('project_workers')
        .select(`
          project_id,
          worker:users!project_workers_worker_id_fkey(id, email, full_name, role)
        `)
        .in('project_id', projectIds);

      if (!pwError && projectWorkers) {
        // Group workers by project_id
        projectWorkers.forEach(pw => {
          if (!projectWorkersMap[pw.project_id]) {
            projectWorkersMap[pw.project_id] = [];
          }
          projectWorkersMap[pw.project_id].push(pw.worker);
        });
      }
    }

    // Attach workers array to each project
    const projectsWithWorkers = projects?.map(project => ({
      ...project,
      workers: projectWorkersMap[project.id] || []
    })) || [];

    console.log('✅ Successfully fetched', projectsWithWorkers.length, 'projects with workers');

    return NextResponse.json({
      success: true,
      projects: projectsWithWorkers,
      total: projectsWithWorkers.length
    });

  } catch (error: any) {
    console.error('💥 Fetch projects error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    }, { status: 500 });
  }
}