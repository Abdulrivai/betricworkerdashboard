import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdmin } from '@/lib/auth-middleware';
import { hashPassword, validatePasswordStrength } from '@/lib/password';

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

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// PATCH - Update worker (email and/or password)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const { id } = await params;
    const workerId = id;
    const body = await request.json();
    const { email, password } = body;

    // Check if worker exists and is not admin
    const { data: existingWorker, error: fetchError } = await supabaseAdmin
      .from('users')
      .select('id, email, full_name, role')
      .eq('id', workerId)
      .single();

    if (fetchError || !existingWorker) {
      return NextResponse.json(
        { error: 'Worker tidak ditemukan' },
        { status: 404 }
      );
    }

    if (existingWorker.role === 'admin') {
      return NextResponse.json(
        { error: 'Tidak dapat mengubah data admin melalui endpoint ini' },
        { status: 403 }
      );
    }

    const updateData: any = {};

    // Update email if provided
    if (email !== undefined) {
      if (!email || !email.trim()) {
        return NextResponse.json(
          { error: 'Email tidak boleh kosong' },
          { status: 400 }
        );
      }

      if (!EMAIL_REGEX.test(email)) {
        return NextResponse.json(
          { error: 'Format email tidak valid' },
          { status: 400 }
        );
      }

      // Check if new email already exists (exclude current worker)
      const { data: emailExists } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('email', email.toLowerCase().trim())
        .neq('id', workerId)
        .maybeSingle();

      if (emailExists) {
        return NextResponse.json(
          { error: 'Email sudah digunakan oleh user lain' },
          { status: 409 }
        );
      }

      updateData.email = email.toLowerCase().trim();
    }

    // Update password if provided
    if (password !== undefined && password.trim() !== '') {
      const passwordValidation = validatePasswordStrength(password);
      if (!passwordValidation.valid) {
        return NextResponse.json(
          { error: passwordValidation.error },
          { status: 400 }
        );
      }

      updateData.password = await hashPassword(password);
    }

    // If nothing to update
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'Tidak ada data yang diupdate' },
        { status: 400 }
      );
    }

    // Update worker
    const { data: updatedWorker, error: updateError } = await supabaseAdmin
      .from('users')
      .update(updateData)
      .eq('id', workerId)
      .select('id, email, full_name, role, created_at')
      .single();

    if (updateError) {
      console.error('Update worker error:', updateError);
      return NextResponse.json(
        {
          error: 'Gagal mengupdate worker',
          details: process.env.NODE_ENV === 'development' ? updateError.message : undefined
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Data worker ${updatedWorker.full_name} berhasil diupdate`,
      worker: updatedWorker
    });

  } catch (error: any) {
    console.error('Update worker error:', error);
    return NextResponse.json(
      {
        error: 'Terjadi kesalahan server',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

// DELETE - Delete worker (with safety checks)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const { id } = await params;
    const workerId = id;

    // Check if worker exists
    const { data: existingWorker, error: fetchError } = await supabaseAdmin
      .from('users')
      .select('id, email, full_name, role')
      .eq('id', workerId)
      .single();

    if (fetchError || !existingWorker) {
      return NextResponse.json(
        { error: 'Worker tidak ditemukan' },
        { status: 404 }
      );
    }

    if (existingWorker.role === 'admin') {
      return NextResponse.json(
        { error: 'Tidak dapat menghapus admin melalui endpoint ini' },
        { status: 403 }
      );
    }

    // SAFETY CHECK: Check for active projects
    const { data: activeProjects, error: projectError } = await supabaseAdmin
      .from('projects')
      .select('id, title, status')
      .eq('worker_id', workerId)
      .in('status', ['WAITING_WORKER_APPROVAL', 'ACTIVE', 'COMPLETION_REQUESTED']);

    if (projectError) {
      console.error('Project check error:', projectError);
      return NextResponse.json(
        { error: 'Gagal memeriksa project aktif' },
        { status: 500 }
      );
    }

    if (activeProjects && activeProjects.length > 0) {
      return NextResponse.json(
        {
          error: 'Tidak dapat menghapus worker yang memiliki project aktif',
          details: `Worker ini memiliki ${activeProjects.length} project aktif`,
          activeProjects: activeProjects.map(p => ({ id: p.id, title: p.title, status: p.status }))
        },
        { status: 409 }
      );
    }

    // Delete notifications first (foreign key constraint)
    await supabaseAdmin
      .from('notifications')
      .delete()
      .eq('user_id', workerId);

    // Hard delete worker
    const { error: deleteError } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', workerId);

    if (deleteError) {
      console.error('Delete worker error:', deleteError);
      return NextResponse.json(
        {
          error: 'Gagal menghapus worker',
          details: process.env.NODE_ENV === 'development' ? deleteError.message : undefined
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Worker ${existingWorker.full_name} berhasil dihapus`,
      deletedWorker: {
        id: existingWorker.id,
        email: existingWorker.email,
        full_name: existingWorker.full_name
      }
    });

  } catch (error: any) {
    console.error('Delete worker error:', error);
    return NextResponse.json(
      {
        error: 'Terjadi kesalahan server',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
