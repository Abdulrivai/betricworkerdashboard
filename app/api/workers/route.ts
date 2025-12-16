import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

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
    console.log('🔍 API: Starting to fetch workers from users table...');

    const { data: workers, error } = await supabaseAdmin
      .from('users')
      .select('id, full_name, email, role')
      .eq('role', 'worker')
      .order('email');

    console.log('📊 Workers query result:', { workers, error });

    if (error) {
      console.error('❌ API: Database error:', error);
      return NextResponse.json({
        error: 'Failed to fetch workers',
        details: process.env.NODE_ENV === 'development' ? error.message : 'Database error'
      }, { status: 500 });
    }
    
    console.log('✅ API: Successfully fetched', workers?.length || 0, 'workers');
    
    return NextResponse.json({ 
      success: true,
      workers: workers || [],
      total: workers?.length || 0
    });

  } catch (error: any) {
    console.error('💥 API: Workers fetch error:', error);
    return NextResponse.json({ 
      error: 'Internal Server Error',
      details: process.env.NODE_ENV === 'development' ? error?.message : 'Something went wrong'
    }, { status: 500 });
  }
}