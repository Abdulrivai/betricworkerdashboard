import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/app/lib/supabaseserver';
import { comparePassword } from '@/lib/password';
import { signToken } from '@/lib/jwt';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email dan password wajib diisi' },
        { status: 400 }
      );
    }

    // SKIP Supabase Auth - langsung cek table users
    const { data: userData, error: userError } = await supabaseServer
      .from('users')
      .select('id, email, role, full_name, password')
      .eq('email', email)
      .maybeSingle();

    console.log('User data:', userData);
    console.log('User error:', userError);

    if (userError) {
      console.error('Database error:', userError.message);
      return NextResponse.json(
        { error: 'Database error occurred' },
        { status: 500 }
      );
    }

    if (!userData) {
      return NextResponse.json(
        { error: 'Email tidak ditemukan' },
        { status: 404 }
      );
    }

    // Check password with bcrypt
    const isPasswordValid = await comparePassword(password, userData.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Password salah' },
        { status: 401 }
      );
    }

    // Validasi role
    if (!['admin', 'worker'].includes(userData.role)) {
      return NextResponse.json(
        { error: 'Role tidak valid' },
        { status: 403 }
      );
    }

    // Buat JWT token
    const token = signToken({
      id: userData.id,
      email: userData.email,
      role: userData.role,
      full_name: userData.full_name,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: userData.id,
        email: userData.email,
        role: userData.role,
        full_name: userData.full_name,
      },
      redirect: userData.role === 'admin' ? '/admin' : '/worker'
    });

    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}