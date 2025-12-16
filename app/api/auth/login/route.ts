import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { supabaseServer } from '../../../lib/supabaseserver';

const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email dan password wajib diisi' },
        { status: 400 }
      );
    }

    console.log('Login attempt for:', email);
    console.log('Password from form:', password);
    console.log('Password length:', password.length);

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

    // DEBUG PASSWORD COMPARISON
    console.log('=== PASSWORD DEBUG ===');
    console.log('Database password:', userData.password);
    console.log('Database password length:', userData.password?.length);
    console.log('Form password:', password);
    console.log('Form password length:', password.length);
    console.log('Passwords match:', userData.password === password);
    console.log('Password types:', typeof userData.password, typeof password);

    // Check password manual
    // Check password manual dengan trim
if (userData.password?.trim() !== password.trim()) {
  console.log('❌ Password mismatch!');
  return NextResponse.json(
    { error: 'Password salah' },
    { status: 401 }
  );
}

    console.log('✅ Password match!');

    // Validasi role
    if (!['admin', 'worker'].includes(userData.role)) {
      return NextResponse.json(
        { error: 'Role tidak valid' },
        { status: 403 }
      );
    }

    // Buat JWT token
    const token = jwt.sign(
      {
        id: userData.id,
        email: userData.email,
        role: userData.role,
        full_name: userData.full_name,
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

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