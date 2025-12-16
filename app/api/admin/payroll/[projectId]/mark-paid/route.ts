import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const { worker_id } = await request.json();

    console.log('💰 Marking project as paid:', projectId);

    // Get project details
    const { data: project, error: projectError } = await supabaseAdmin
      .from('projects')
      .select('title, project_value, worker_id')
      .eq('id', projectId)
      .single();

    if (projectError) throw projectError;

    // Check if payment record already exists
    const { data: existingPayment } = await supabaseAdmin
      .from('worker_payments')
      .select('*')
      .eq('project_id', projectId)
      .single();

    if (existingPayment) {
      // Update existing payment
      const { data: updatedData, error: updateError } = await supabaseAdmin
        .from('worker_payments')
        .update({
          status: 'paid',
          payment_date: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('project_id', projectId)
        .select();

      if (updateError) {
        console.error('❌ Update error:', updateError);
        throw updateError;
      }
      console.log('✅ Payment updated:', updatedData);
    } else {
      // Create new payment record
      const { data: insertedData, error: insertError } = await supabaseAdmin
        .from('worker_payments')
        .insert({
          project_id: projectId,
          worker_id: project.worker_id,
          amount: project.project_value,
          status: 'paid',
          payment_date: new Date().toISOString(),
          payment_method: 'manual',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select();

      if (insertError) {
        console.error('❌ Insert error:', insertError);
        throw insertError;
      }
      console.log('✅ Payment created:', insertedData);
    }

    // Verify the payment was saved
    const { data: verifyPayment, error: verifyError } = await supabaseAdmin
      .from('worker_payments')
      .select('*')
      .eq('project_id', projectId)
      .single();

    if (verifyError) {
      console.error('❌ Verification failed:', verifyError);
    } else {
      console.log('✅ Verified payment status:', verifyPayment.status);
    }

    console.log('✅ Project marked as paid successfully');

    return NextResponse.json({
      success: true,
      message: 'Project berhasil ditandai sebagai sudah dibayar',
      payment: verifyPayment
    });

  } catch (error: any) {
    console.error('💥 Mark as paid error:', error);
    return NextResponse.json({
      error: 'Failed to mark project as paid',
      details: error.message
    }, { status: 500 });
  }
}