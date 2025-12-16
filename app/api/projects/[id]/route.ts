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

// DELETE PROJECT
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const projectId = id;

    console.log('🗑️ Deleting project:', projectId);

    // Check if project exists
    const { data: existingProject, error: checkError } = await supabaseAdmin
      .from('projects')
      .select('id, title, status')
      .eq('id', projectId)
      .single();

    if (checkError || !existingProject) {
      console.error('❌ Project not found:', checkError);
      return NextResponse.json({
        error: 'Project not found'
      }, { status: 404 });
    }

    // HAPUS NOTIFIKASI TERKAIT PROJECT DULU
    console.log('🧹 Cleaning up related notifications...');
    const { error: notifError } = await supabaseAdmin
      .from('notifications')
      .delete()
      .eq('project_id', projectId);

    if (notifError) {
      console.warn('⚠️ Failed to delete notifications:', notifError);
      // Lanjut hapus project meski notif gagal dihapus
    }

    // Delete project
    const { error: deleteError } = await supabaseAdmin
      .from('projects')
      .delete()
      .eq('id', projectId);

    if (deleteError) {
      console.error('❌ Delete project error:', deleteError);
      return NextResponse.json({
        error: 'Failed to delete project',
        details: process.env.NODE_ENV === 'development' ? deleteError.message : 'Database error'
      }, { status: 500 });
    }

    console.log('✅ Project deleted successfully:', existingProject.title);

    return NextResponse.json({
      success: true,
      message: `Project "${existingProject.title}" berhasil dihapus`,
      deletedProject: {
        id: existingProject.id,
        title: existingProject.title,
        status: existingProject.status
      }
    });

  } catch (error: any) {
    console.error('💥 Delete project error:', error);
    return NextResponse.json({
      error: 'Failed to delete project',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    }, { status: 500 });
  }
}

// GET SINGLE PROJECT (for edit form)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const projectId = id;

    console.log('🔍 Fetching project:', projectId);

    // Get project with full details
    const { data: project, error } = await supabaseAdmin
      .from('projects')
      .select(`
        *,
        worker:worker_id (
          id,
          email,
          full_name,
          role
        )
      `)
      .eq('id', projectId)
      .single();

    if (error || !project) {
      console.error('❌ Project not found:', error);
      return NextResponse.json({
        error: 'Project not found'
      }, { status: 404 });
    }

    // Format requirements jika string
    if (typeof project.requirements === 'string') {
      try {
        project.requirements = JSON.parse(project.requirements);
      } catch {
        project.requirements = [];
      }
    }

    console.log('✅ Project fetched successfully:', project.title);

    return NextResponse.json({
      success: true,
      project
    });

  } catch (error: any) {
    console.error('💥 Fetch project error:', error);
    return NextResponse.json({
      error: 'Failed to fetch project',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    }, { status: 500 });
  }
}

// UPDATE PROJECT
// UPDATE PROJECT - PERBAIKAN untuk match dengan database schema
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const projectId = id;

    console.log('🔧 PATCH endpoint hit for project:', projectId);

    // Get request body
    let body;
    try {
      body = await request.json();
      console.log('📥 Request body received:', body);
    } catch (jsonError: any) {
      console.error('❌ Invalid JSON in request body:', jsonError);
      return NextResponse.json({
        error: 'Invalid JSON in request body',
        details: jsonError.message
      }, { status: 400 });
    }

    const { title, description, project_value, worker_id, deadline, requirements, status } = body;

    // Validasi project exists
    console.log('🔍 Checking if project exists...');
    const { data: existingProject, error: existError } = await supabaseAdmin
      .from('projects')
      .select('id, title, status, worker_id')
      .eq('id', projectId)
      .single();

    if (existError || !existingProject) {
      console.error('❌ Project not found:', existError);
      return NextResponse.json({ 
        error: 'Project not found',
        details: existError?.message || 'Project does not exist'
      }, { status: 404 });
    }

    console.log('✅ Existing project found:', existingProject);

    // Basic validation
    if (title !== undefined && (!title || title.trim().length === 0)) {
      return NextResponse.json({ error: 'Title cannot be empty' }, { status: 400 });
    }

    if (description !== undefined && (!description || description.trim().length === 0)) {
      return NextResponse.json({ error: 'Description cannot be empty' }, { status: 400 });
    }

    if (project_value !== undefined && (isNaN(parseFloat(project_value)) || parseFloat(project_value) <= 0)) {
      return NextResponse.json({ error: 'Project value must be a positive number' }, { status: 400 });
    }

    // Worker validation jika ada
    if (worker_id && worker_id !== '' && worker_id !== null) {
      console.log('🔍 Validating worker_id:', worker_id);
      
      const { data: worker, error: workerError } = await supabaseAdmin
        .from('users')
        .select('id, role')
        .eq('id', worker_id)
        .eq('role', 'worker')
        .single();

      if (workerError || !worker) {
        console.error('❌ Worker validation failed:', { worker_id, workerError });
        return NextResponse.json({ 
          error: 'Worker not found or invalid'
        }, { status: 400 });
      }
      
      console.log('✅ Worker validation passed:', worker);
    }

    // PERBAIKAN: Prepare update data - HANYA kolom yang ada di database
    const updateData: any = {};

    // Kolom yang PASTI ada berdasarkan schema
    if (title !== undefined) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description.trim();
    if (project_value !== undefined) updateData.project_value = parseFloat(project_value);
    if (status !== undefined) updateData.status = status;
    
    // Handle worker_id
    if (worker_id !== undefined) {
      updateData.worker_id = (worker_id === '' || worker_id === null) ? null : worker_id;
    }
    
    // Handle deadline - gunakan kolom yang ada
    if (deadline !== undefined) {
      if (deadline) {
        try {
          const deadlineDate = new Date(deadline);
          if (isNaN(deadlineDate.getTime())) {
            throw new Error('Invalid date');
          }
          // HANYA update kolom deadline yang ada
          updateData.deadline = deadlineDate.toISOString();
        } catch (dateError) {
          console.error('❌ Invalid deadline format:', deadline);
          return NextResponse.json({ 
            error: 'Invalid deadline format' 
          }, { status: 400 });
        }
      } else {
        updateData.deadline = null;
      }
    }
    
    // Handle requirements (jsonb)
    if (requirements !== undefined) {
      if (Array.isArray(requirements)) {
        updateData.requirements = requirements.filter(req => req && req.trim() !== '');
      } else {
        updateData.requirements = [];
      }
    }

    // PERBAIKAN: Selalu set updated_at
    updateData.updated_at = new Date().toISOString();

    console.log('📝 Final update data (matching DB schema):', updateData);

    // PERBAIKAN: Update tanpa JOIN dulu untuk menghindari masalah
    console.log('💾 Updating project in database...');
    const { data: updatedProjectBasic, error: updateError } = await supabaseAdmin
      .from('projects')
      .update(updateData)
      .eq('id', projectId)
      .select('*')
      .single();

    if (updateError) {
      console.error('❌ Database update error:', updateError);
      console.error('❌ Error code:', updateError.code);
      console.error('❌ Error details:', updateError.details);
      console.error('❌ Error hint:', updateError.hint);
      return NextResponse.json({
        error: 'Failed to update project in database',
        details: updateError.message,
        code: updateError.code,
        hint: updateError.hint
      }, { status: 500 });
    }

    if (!updatedProjectBasic) {
      console.error('❌ No project returned after update');
      return NextResponse.json({
        error: 'Project update failed - no data returned'
      }, { status: 500 });
    }

    console.log('✅ Project updated successfully:', updatedProjectBasic.title);

    // Ambil worker data terpisah jika ada
    let finalProject = updatedProjectBasic;
    if (updatedProjectBasic.worker_id) {
      console.log('👤 Fetching worker data...');
      const { data: workerData, error: workerFetchError } = await supabaseAdmin
        .from('users')
        .select('id, email, full_name, role')
        .eq('id', updatedProjectBasic.worker_id)
        .single();

      if (!workerFetchError && workerData) {
        finalProject = {
          ...updatedProjectBasic,
          worker: workerData
        };
        console.log('✅ Worker data added:', workerData.full_name);
      }
    }

    // Buat notifikasi jika worker berubah
    try {
      if (worker_id !== undefined && updatedProjectBasic.worker_id && 
          worker_id !== existingProject.worker_id) {
        
        console.log('📱 Creating assignment notification...');
        
        await supabaseAdmin
          .from('notifications')
          .insert({
            user_id: updatedProjectBasic.worker_id,
            title: 'Project Assignment',
            message: `Anda telah ditugaskan pada project "${updatedProjectBasic.title}".`,
            notification_type: 'ASSIGNMENT',
            project_id: projectId,
            is_read: false,
            created_at: new Date().toISOString()
          });
        
        console.log('✅ Assignment notification created');
      }
    } catch (notifError) {
      console.warn('⚠️ Failed to create notification:', notifError);
      // Jangan gagalkan update jika notifikasi gagal
    }

    return NextResponse.json({
      success: true,
      message: `Project "${finalProject.title}" berhasil diupdate`,
      project: finalProject
    });

  } catch (error: any) {
    console.error('💥 Unexpected error in PATCH:', error);
    console.error('💥 Error message:', error.message);
    console.error('💥 Error stack:', error.stack);
    
    return NextResponse.json({
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    }, { status: 500 });
  }
}