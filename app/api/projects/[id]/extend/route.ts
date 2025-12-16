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

// EXTEND DEADLINE
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // PERBAIKAN: Await params karena Next.js 15
    const { id } = await params;
    const projectId = id;
    const body = await request.json();
    const { new_deadline } = body;

    console.log('📅 Extending deadline for project:', projectId, new_deadline);

    if (!new_deadline) {
      return NextResponse.json({
        error: 'New deadline is required'
      }, { status: 400 });
    }

    const newDeadlineDate = new Date(new_deadline);
    if (isNaN(newDeadlineDate.getTime())) {
      return NextResponse.json({
        error: 'Invalid deadline format'
      }, { status: 400 });
    }

    // Check if project exists
    const { data: existingProject, error: checkError } = await supabaseAdmin
      .from('projects')
      .select('id, title, deadline')
      .eq('id', projectId)
      .single();

    if (checkError || !existingProject) {
      return NextResponse.json({
        error: 'Project not found'
      }, { status: 404 });
    }

    // Validate new deadline is in the future
    const currentDeadline = new Date(existingProject.deadline);
    if (newDeadlineDate <= currentDeadline) {
      return NextResponse.json({
        error: 'New deadline must be later than current deadline'
      }, { status: 400 });
    }

    // Update deadline
    const { data: updatedProject, error: updateError } = await supabaseAdmin
      .from('projects')
      .update({
        deadline: newDeadlineDate.toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', projectId)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Extend deadline error:', updateError);
      return NextResponse.json({
        error: 'Failed to extend deadline',
        details: process.env.NODE_ENV === 'development' ? updateError.message : 'Database error'
      }, { status: 500 });
    }

    console.log('✅ Deadline extended successfully');

    return NextResponse.json({
      success: true,
      message: `Deadline berhasil diperpanjang sampai ${newDeadlineDate.toLocaleDateString('id-ID')}`,
      project: updatedProject
    });

  } catch (error: any) {
    console.error('💥 Extend deadline error:', error);
    return NextResponse.json({
      error: 'Failed to extend deadline',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    }, { status: 500 });
  }
}