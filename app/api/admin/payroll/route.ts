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

// Disable caching for this API route
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Helper function to calculate penalty for late completion
function calculateLatePenalty(completionDate: string, deadline: string, projectValue: number) {
  const completion = new Date(completionDate);
  const deadlineDate = new Date(deadline);
  
  // Calculate days late (only if completion is after deadline)
  const diffTime = completion.getTime() - deadlineDate.getTime();
  const daysLate = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  
  if (daysLate > 0) {
    // 3% penalty per day
    const penaltyPercentage = daysLate * 0.03;
    const penaltyAmount = projectValue * penaltyPercentage;
    const finalValue = projectValue - penaltyAmount;
    
    return {
      days_late: daysLate,
      penalty_percentage: penaltyPercentage * 100, // Convert to percentage
      penalty_amount: penaltyAmount,
      original_value: projectValue,
      final_value: Math.max(0, finalValue) // Tidak boleh negatif
    };
  }
  
  return {
    days_late: 0,
    penalty_percentage: 0,
    penalty_amount: 0,
    original_value: projectValue,
    final_value: projectValue
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '10');
    const cycle = searchParams.get('cycle') || '14th';

    console.log('🔍 Fetching payroll data for last', days, 'days, cycle:', cycle);

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    console.log('📅 Date range:', startDate.toISOString(), 'to', endDate.toISOString());

    // Test database connection first
    const { data: testData, error: testError } = await supabaseAdmin
      .from('projects')
      .select('id')
      .limit(1);

    if (testError) {
      console.error('❌ Database connection failed:', testError);
      throw new Error(`Database connection failed: ${testError.message}`);
    }

    console.log('✅ Database connection OK');

    // Fetch completed projects with worker info (both on-time and late)
    const { data: projects, error: projectsError } = await supabaseAdmin
      .from('projects')
      .select(`
        id,
        title,
        project_value,
        status,
        updated_at,
        completion_date,
        created_at,
        worker_id,
        deadline,
        description,
        requirements,
        users!projects_worker_id_fkey (
          id,
          full_name,
          email,
          role
        )
      `)
      .in('status', ['DONE_ON_TIME', 'DONE_LATE'])
      .gte('updated_at', startDate.toISOString())
      .lte('updated_at', endDate.toISOString())
      .not('worker_id', 'is', null)
      .order('updated_at', { ascending: false });

    if (projectsError) {
      console.error('❌ Projects query failed:', projectsError);
      throw projectsError;
    }

    console.log('📋 Found projects:', projects?.length || 0);

    // Check if worker_payments table exists and fetch payment records
    let payments: any[] = []; // ← TAMBAHKAN TYPE ANNOTATION
    if (projects && projects.length > 0) {
      const projectIds = projects.map(p => p.id);
      
      try {
        const { data: paymentData, error: paymentsError } = await supabaseAdmin
          .from('worker_payments')
          .select('*')
          .in('project_id', projectIds);

        if (paymentsError) {
          console.warn('⚠️ Worker payments table might not exist:', paymentsError.message);
          // Continue without payments data
        } else {
          payments = paymentData || [];
          console.log('💰 Found payments:', payments.length);
        }
      } catch (err) {
        console.warn('⚠️ Worker payments query failed, continuing without payment data');
      }
    }

    // Create payment lookup map
    const paymentMap = new Map<string, any>(); // ← TAMBAHKAN TYPE
    payments.forEach((payment: any) => { // ← TAMBAHKAN TYPE
      paymentMap.set(payment.project_id, payment);
    });

    // Group projects by worker
    const workerMap = new Map<string, any>(); // ← TAMBAHKAN TYPE
    
    projects?.forEach((project: any) => { // ← TAMBAHKAN TYPE
      if (!project.users || project.users.role !== 'worker') {
        console.log('⚠️ Skipping project - no worker or invalid role:', project.id);
        return;
      }
      
      const workerId = project.worker_id;
      const worker = project.users;
      const payment = paymentMap.get(project.id);
      
      // Determine payment status
      let paymentStatus = 'pending';
      let paymentDate = null;

      if (payment) {
        paymentStatus = payment.status;
        paymentDate = payment.payment_date;
      }
      // No overdue status, everything unpaid is just 'pending'

      // Calculate late penalty if applicable
      const completionDate = project.completion_date || project.updated_at;
      const penaltyInfo = project.deadline 
        ? calculateLatePenalty(completionDate, project.deadline, project.project_value)
        : {
            days_late: 0,
            penalty_percentage: 0,
            penalty_amount: 0,
            original_value: project.project_value,
            final_value: project.project_value
          };

      const projectData = {
        id: project.id,
        title: project.title,
        project_value: project.project_value,
        completion_date: completionDate,
        worker_id: workerId,
        worker_name: worker.full_name,
        worker_email: worker.email,
        payment_status: paymentStatus,
        payment_date: paymentDate,
        payment_cycle: cycle,
        // Project details
        deadline: project.deadline,
        description: project.description,
        requirements: project.requirements,
        status: project.status,
        // Penalty information
        days_late: penaltyInfo.days_late,
        penalty_percentage: penaltyInfo.penalty_percentage,
        penalty_amount: penaltyInfo.penalty_amount,
        original_value: penaltyInfo.original_value,
        final_value: penaltyInfo.final_value
      };

      if (!workerMap.has(workerId)) {
        workerMap.set(workerId, {
          worker_id: workerId,
          worker_name: worker.full_name,
          worker_email: worker.email,
          total_projects: 0,
          total_amount: 0,
          paid_projects: 0,
          paid_amount: 0,
          pending_projects: 0,
          pending_amount: 0,
          projects: []
        });
      }

      const workerData = workerMap.get(workerId);
      if (workerData) {
        workerData.projects.push(projectData);
        workerData.total_projects++;
        workerData.total_amount += penaltyInfo.final_value; // Use final value after penalty

        // Update status-specific counters
        if (paymentStatus === 'paid') {
          workerData.paid_projects++;
          workerData.paid_amount += penaltyInfo.final_value; // Use final value after penalty
        } else {
          workerData.pending_projects++;
          workerData.pending_amount += penaltyInfo.final_value; // Use final value after penalty
        }
      }
    });

    const workers = Array.from(workerMap.values())
      .sort((a, b) => b.total_amount - a.total_amount);

    console.log('✅ Payroll data processed:', workers.length, 'workers');

    return NextResponse.json({
      success: true,
      workers,
      summary: {
        total_workers: workers.length,
        total_projects: workers.reduce((sum, w) => sum + w.total_projects, 0),
        total_amount: workers.reduce((sum, w) => sum + w.total_amount, 0),
        period: {
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          days
        }
      }
    });

  } catch (error: any) {
    console.error('💥 Payroll API error:', error);
    return NextResponse.json({
      error: 'Failed to fetch payroll data',
      details: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}