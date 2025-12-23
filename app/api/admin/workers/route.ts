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

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// POST - Create new worker
export async function POST(request: NextRequest) {
  // Authenticate admin
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const body = await request.json();
    const { email, full_name, password } = body;

    // Validation
    if (!email || !email.trim()) {
      return NextResponse.json(
        { error: 'Email wajib diisi' },
        { status: 400 }
      );
    }

    if (!EMAIL_REGEX.test(email)) {
      return NextResponse.json(
        { error: 'Format email tidak valid' },
        { status: 400 }
      );
    }

    if (!full_name || !full_name.trim()) {
      return NextResponse.json(
        { error: 'Nama lengkap wajib diisi' },
        { status: 400 }
      );
    }

    if (!password || !password.trim()) {
      return NextResponse.json(
        { error: 'Password wajib diisi' },
        { status: 400 }
      );
    }

    // Password strength validation
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { error: passwordValidation.error },
        { status: 400 }
      );
    }

    // Check if email already exists
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id, email')
      .eq('email', email.toLowerCase().trim())
      .maybeSingle();

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email sudah terdaftar' },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create worker
    const { data: newWorker, error: createError } = await supabaseAdmin
      .from('users')
      .insert({
        email: email.toLowerCase().trim(),
        full_name: full_name.trim(),
        password: hashedPassword,
        role: 'worker',
        created_at: new Date().toISOString()
      })
      .select('id, email, full_name, role, created_at')
      .single();

    if (createError) {
      console.error('Create worker error:', createError);
      return NextResponse.json(
        {
          error: 'Gagal membuat worker',
          details: process.env.NODE_ENV === 'development' ? createError.message : undefined
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: `Worker ${newWorker.full_name} berhasil dibuat`,
        worker: newWorker
      },
      { status: 201 }
    );

  } catch (error: any) {
    console.error('Create worker error:', error);
    return NextResponse.json(
      {
        error: 'Terjadi kesalahan server',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
