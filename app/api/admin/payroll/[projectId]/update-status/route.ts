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
    const { worker_id, status } = await request.json();

    console.log('🔄 Updating payment status:', projectId, 'to', status);

    // Validate status
    if (!['paid', 'pending'].includes(status)) {
      return NextResponse.json({
        error: 'Invalid status',
        details: 'Status must be either "paid" or "pending"'
      }, { status: 400 });
    }

    // Get project details
    const { data: project, error: projectError } = await supabaseAdmin
      .from('projects')
      .select('title, project_value, worker_id')
      .eq('id', projectId)
      .single();

    if (projectError) throw projectError;

    // Check if payment record exists
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
          status: status,
          payment_date: status === 'paid' ? new Date().toISOString() : null,
          updated_at: new Date().toISOString()
        })
        .eq('project_id', projectId)
        .select();

      if (updateError) {
        console.error('❌ Update error:', updateError);
        throw updateError;
      }
      console.log('✅ Payment status updated:', updatedData);
    } else if (status === 'paid') {
      // Create new payment record only if marking as paid
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
      console.log('✅ Payment record created:', insertedData);
    } else {
      // If no payment record and status is pending, do nothing
      console.log('ℹ️ No payment record exists and status is pending, no action needed');
    }

    // Verify the final status
    const { data: verifyPayment } = await supabaseAdmin
      .from('worker_payments')
      .select('*')
      .eq('project_id', projectId)
      .single();

    console.log('✅ Payment status update completed');

    return NextResponse.json({
      success: true,
      message: `Status berhasil diubah menjadi ${status}`,
      payment: verifyPayment
    });

  } catch (error: any) {
    console.error('💥 Update status error:', error);
    return NextResponse.json({
      error: 'Failed to update payment status',
      details: error.message
    }, { status: 500 });
  }
}
