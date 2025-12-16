'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatCurrency, formatDate } from '../utils/helpers';
import * as XLSX from 'xlsx';
import Swal from 'sweetalert2';

interface PayrollProject {
  id: string;
  title: string;
  project_value: number;
  completion_date: string;
  worker_id: string;
  worker_name: string;
  worker_email: string;
  payment_status: 'paid' | 'pending';
  payment_date?: string;
  payment_cycle: string; // '14th' for tanggal 14
}

interface WorkerPayrollSummary {
  worker_id: string;
  worker_name: string;
  worker_email: string;
  total_projects: number;
  total_amount: number;
  paid_projects: number;
  paid_amount: number;
  pending_projects: number;
  pending_amount: number;
  projects: PayrollProject[];
}

export default function ReportsPage() {
  const [payrollData, setPayrollData] = useState<WorkerPayrollSummary[]>([]);
  const [filteredData, setFilteredData] = useState<WorkerPayrollSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedWorker, setSelectedWorker] = useState<string | null>(null);
  const [selectedProjects, setSelectedProjects] = useState<Set<string>>(new Set());
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Filters
  const [dateRange, setDateRange] = useState('10'); // days
  const [paymentStatus, setPaymentStatus] = useState<string>('all');
  const [paymentCycle, setPaymentCycle] = useState<string>('14th');

  useEffect(() => {
    fetchPayrollData();
  }, [dateRange, paymentCycle]);

  useEffect(() => {
    filterData();
  }, [payrollData, paymentStatus, searchQuery]);

  const fetchPayrollData = async () => {
    try {
      setIsLoading(true);
      // Add timestamp to prevent caching
      const timestamp = new Date().getTime();
      const response = await fetch(
        `/api/admin/payroll?days=${dateRange}&cycle=${paymentCycle}&_t=${timestamp}`,
        {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache'
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log('Fetched payroll data:', data);
        setPayrollData(data.workers || []);
      } else {
        console.error('Failed to fetch payroll data:', response.status);
      }
    } catch (error) {
      console.error('Error fetching payroll data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterData = () => {
    let filtered = payrollData;

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(worker =>
        worker.worker_name.toLowerCase().includes(query) ||
        worker.worker_email.toLowerCase().includes(query) ||
        worker.worker_id.toLowerCase().includes(query)
      );
    }

    // Filter by payment status
    if (paymentStatus !== 'all') {
      filtered = filtered.map(worker => ({
        ...worker,
        projects: worker.projects.filter(project => project.payment_status === paymentStatus)
      })).filter(worker => worker.projects.length > 0);
    }

    setFilteredData(filtered);
  };

  const handleTogglePaymentStatus = async (projectId: string, workerId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'paid' ? 'pending' : 'paid';
    const confirmText = newStatus === 'paid'
      ? 'Tandai project ini sebagai sudah dibayar?'
      : 'Ubah status project menjadi belum dibayar?';

    const result = await Swal.fire({
      title: newStatus === 'paid' ? '💰 Tandai Sudah Dibayar?' : '⏳ Ubah ke Pending?',
      text: confirmText,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: newStatus === 'paid' ? '#16a34a' : '#eab308',
      cancelButtonColor: '#6b7280',
      confirmButtonText: newStatus === 'paid' ? '✅ Ya, Tandai Dibayar' : '⏳ Ya, Ubah ke Pending',
      cancelButtonText: '❌ Batal',
      backdrop: true,
      customClass: {
        popup: 'rounded-2xl',
        confirmButton: 'rounded-xl px-6 py-3',
        cancelButton: 'rounded-xl px-6 py-3'
      }
    });

    if (!result.isConfirmed) return;

    try {
      setIsProcessing(true);
      const response = await fetch(`/api/admin/payroll/${projectId}/update-status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ worker_id: workerId, status: newStatus })
      });

      const apiResult = await response.json();
      console.log('Payment status update response:', apiResult);

      if (response.ok) {
        await new Promise(resolve => setTimeout(resolve, 500));
        await fetchPayrollData();

        await Swal.fire({
          title: '✅ Berhasil!',
          text: `Status berhasil diubah menjadi ${newStatus === 'paid' ? 'sudah dibayar' : 'belum dibayar'}`,
          icon: 'success',
          confirmButtonColor: '#1e40af',
          confirmButtonText: 'OK',
          timer: 2000,
          customClass: {
            popup: 'rounded-2xl',
            confirmButton: 'rounded-xl px-6 py-3'
          }
        });
      } else {
        await Swal.fire({
          title: '❌ Gagal!',
          text: `Gagal: ${apiResult.error || 'Unknown error'}`,
          icon: 'error',
          confirmButtonColor: '#dc2626',
          confirmButtonText: 'OK',
          customClass: {
            popup: 'rounded-2xl',
            confirmButton: 'rounded-xl px-6 py-3'
          }
        });
      }
    } catch (error) {
      console.error('Payment status update error:', error);
      await Swal.fire({
        title: '❌ Error!',
        text: 'Gagal mengupdate status pembayaran',
        icon: 'error',
        confirmButtonColor: '#dc2626',
        confirmButtonText: 'OK',
        customClass: {
          popup: 'rounded-2xl',
          confirmButton: 'rounded-xl px-6 py-3'
        }
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleToggleProject = (projectId: string, isPaid: boolean) => {
    if (isPaid) return; // Don't allow selecting already paid projects

    setSelectedProjects(prev => {
      const newSet = new Set(prev);
      if (newSet.has(projectId)) {
        newSet.delete(projectId);
      } else {
        newSet.add(projectId);
      }
      return newSet;
    });
  };

  const handleToggleAll = (worker: WorkerPayrollSummary) => {
    const unpaidProjects = worker.projects.filter(p => p.payment_status !== 'paid');
    const unpaidIds = unpaidProjects.map(p => p.id);
    const allSelected = unpaidIds.every(id => selectedProjects.has(id));

    setSelectedProjects(prev => {
      const newSet = new Set(prev);
      if (allSelected) {
        unpaidIds.forEach(id => newSet.delete(id));
      } else {
        unpaidIds.forEach(id => newSet.add(id));
      }
      return newSet;
    });
  };

  const handleBulkMarkAsPaid = async () => {
    if (selectedProjects.size === 0) {
      await Swal.fire({
        title: '⚠️ Peringatan!',
        text: 'Pilih minimal 1 project untuk ditandai sebagai sudah dibayar',
        icon: 'warning',
        confirmButtonColor: '#eab308',
        confirmButtonText: 'OK',
        customClass: {
          popup: 'rounded-2xl',
          confirmButton: 'rounded-xl px-6 py-3'
        }
      });
      return;
    }

    const totalSelected = selectedProjects.size;
    const totalAmount = getTotalSelectedAmount();

    const result = await Swal.fire({
      title: '💰 Konfirmasi Pembayaran',
      html: `
        <p class="text-lg mb-2">Tandai <strong>${totalSelected} project</strong> sebagai sudah dibayar?</p>
        <p class="text-2xl font-bold text-green-600">${formatCurrency(totalAmount)}</p>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#16a34a',
      cancelButtonColor: '#6b7280',
      confirmButtonText: '✅ Ya, Tandai Dibayar',
      cancelButtonText: '❌ Batal',
      customClass: {
        popup: 'rounded-2xl',
        confirmButton: 'rounded-xl px-6 py-3',
        cancelButton: 'rounded-xl px-6 py-3'
      }
    });

    if (!result.isConfirmed) return;

    try {
      setIsProcessing(true);

      // Show loading
      Swal.fire({
        title: 'Memproses...',
        html: `Menandai ${totalSelected} project sebagai sudah dibayar`,
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      const promises = Array.from(selectedProjects).map(async projectId => {
        // Find worker_id for each project
        const project = filteredData
          .flatMap(w => w.projects)
          .find(p => p.id === projectId);

        if (!project) return null;

        const response = await fetch(`/api/admin/payroll/${projectId}/mark-paid`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ worker_id: project.worker_id })
        });

        const result = await response.json();
        console.log(`Payment result for ${projectId}:`, result);
        return result;
      });

      const results = await Promise.all(promises);
      console.log('All payment results:', results);

      // Wait a bit for database to update
      await new Promise(resolve => setTimeout(resolve, 800));

      setSelectedProjects(new Set());
      await fetchPayrollData();

      await Swal.fire({
        title: '🎉 Berhasil!',
        html: `<strong>${totalSelected} project</strong> berhasil ditandai sebagai sudah dibayar<br/><span class="text-2xl font-bold text-green-600">${formatCurrency(totalAmount)}</span>`,
        icon: 'success',
        confirmButtonColor: '#16a34a',
        confirmButtonText: 'OK',
        timer: 3000,
        customClass: {
          popup: 'rounded-2xl',
          confirmButton: 'rounded-xl px-6 py-3'
        }
      });
    } catch (error) {
      console.error('Bulk payment error:', error);
      await Swal.fire({
        title: '❌ Error!',
        text: 'Gagal mengupdate status pembayaran',
        icon: 'error',
        confirmButtonColor: '#dc2626',
        confirmButtonText: 'OK',
        customClass: {
          popup: 'rounded-2xl',
          confirmButton: 'rounded-xl px-6 py-3'
        }
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getTotalSelectedAmount = () => {
    return filteredData
      .flatMap(w => w.projects)
      .filter(p => selectedProjects.has(p.id))
      .reduce((sum, p) => sum + p.project_value, 0);
  };

  const handleExportToExcel = async () => {
    try {
      // Prepare data for Excel
      const excelData: any[] = [];

      // Add header row
      excelData.push([
        'Worker Name',
        'Worker Email',
        'Project Title',
        'Project Value (IDR)',
        'Completion Date',
        'Payment Status',
        'Payment Date'
      ]);

      // Add data rows
      filteredData.forEach(worker => {
        worker.projects.forEach(project => {
          excelData.push([
            worker.worker_name,
            worker.worker_email,
            project.title,
            project.project_value,
            formatDate(project.completion_date),
            project.payment_status === 'paid' ? 'Sudah Dibayar' : 'Belum Dibayar',
            project.payment_date ? formatDate(project.payment_date) : '-'
          ]);
        });
      });

      // Create worksheet
      const ws = XLSX.utils.aoa_to_sheet(excelData);

      // Set column widths
      ws['!cols'] = [
        { wch: 20 }, // Worker Name
        { wch: 30 }, // Worker Email
        { wch: 35 }, // Project Title
        { wch: 18 }, // Project Value
        { wch: 18 }, // Completion Date
        { wch: 18 }, // Payment Status
        { wch: 18 }  // Payment Date
      ];

      // Style header row
      const headerStyle = {
        font: { bold: true, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "1E40AF" } },
        alignment: { horizontal: "center", vertical: "center" }
      };

      // Apply header style
      const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellRef = XLSX.utils.encode_cell({ r: 0, c: col });
        if (!ws[cellRef]) continue;
        ws[cellRef].s = headerStyle;
      }

      // Format currency columns
      for (let row = 1; row <= range.e.r; row++) {
        const cellRef = XLSX.utils.encode_cell({ r: row, c: 3 }); // Column D (Project Value)
        if (ws[cellRef]) {
          ws[cellRef].z = '#,##0'; // Number format
        }
      }

      // Create workbook
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Payroll Report');

      // Generate filename with date
      const filename = `Payroll_Report_${new Date().toISOString().split('T')[0]}.xlsx`;

      // Download file
      XLSX.writeFile(wb, filename);

      await Swal.fire({
        title: '📊 Export Berhasil!',
        text: 'Report berhasil di-export ke Excel!',
        icon: 'success',
        confirmButtonColor: '#16a34a',
        confirmButtonText: 'OK',
        timer: 2000,
        customClass: {
          popup: 'rounded-2xl',
          confirmButton: 'rounded-xl px-6 py-3'
        }
      });
    } catch (error) {
      console.error('Export to Excel error:', error);
      await Swal.fire({
        title: '❌ Export Gagal!',
        text: 'Gagal export ke Excel',
        icon: 'error',
        confirmButtonColor: '#dc2626',
        confirmButtonText: 'OK',
        customClass: {
          popup: 'rounded-2xl',
          confirmButton: 'rounded-xl px-6 py-3'
        }
      });
    }
  };

  const handleExportToPDF = async () => {
    try {
      await Swal.fire({
        title: '📄 Export ke PDF',
        text: 'Silakan pilih "Save as PDF" di dialog print',
        icon: 'info',
        confirmButtonColor: '#1e40af',
        confirmButtonText: 'OK, Lanjutkan',
        timer: 2000,
        customClass: {
          popup: 'rounded-2xl',
          confirmButton: 'rounded-xl px-6 py-3'
        }
      });
      window.print();
    } catch (error) {
      console.error('Export to PDF error:', error);
      await Swal.fire({
        title: '❌ Export Gagal!',
        text: 'Gagal export ke PDF',
        icon: 'error',
        confirmButtonColor: '#dc2626',
        confirmButtonText: 'OK',
        customClass: {
          popup: 'rounded-2xl',
          confirmButton: 'rounded-xl px-6 py-3'
        }
      });
    }
  };

  const getTotalSummary = () => {
    const totals = filteredData.reduce((acc, worker) => ({
      total_projects: acc.total_projects + worker.total_projects,
      total_amount: acc.total_amount + worker.total_amount,
      paid_projects: acc.paid_projects + worker.paid_projects,
      paid_amount: acc.paid_amount + worker.paid_amount,
      pending_projects: acc.pending_projects + worker.pending_projects,
      pending_amount: acc.pending_amount + worker.pending_amount
    }), {
      total_projects: 0, total_amount: 0,
      paid_projects: 0, paid_amount: 0,
      pending_projects: 0, pending_amount: 0
    });

    return totals;
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      'paid': 'bg-green-500/20 text-green-800 border-green-500/30',
      'pending': 'bg-yellow-500/20 text-yellow-800 border-yellow-500/30'
    };
    return badges[status as keyof typeof badges] || badges.pending;
  };

  const getStatusText = (status: string) => {
    const texts = {
      'paid': '✅ Sudah Dibayar',
      'pending': '⏳ Belum Dibayar'
    };
    return texts[status as keyof typeof texts] || texts.pending;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50">
        <header className="bg-white/95 backdrop-blur-md border-b border-blue-900/10 sticky top-0 z-40 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-4">
                <Link href="/admin" className="text-blue-700 hover:text-blue-900 font-medium transition-colors bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-lg flex items-center space-x-2">
                  <span>←</span>
                  <span>Dashboard</span>
                </Link>
                <div className="h-6 w-px bg-blue-200"></div>
                <img src="/betriclogoblue.png" alt="Betric" className="h-8 w-8 object-contain" />
                <h1 className="text-xl font-bold text-blue-900">Laporan Payroll</h1>
              </div>
            </div>
          </div>
        </header>

        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-900/20 border-t-blue-900"></div>
            <p className="text-blue-900/70 font-medium">Memuat data payroll...</p>
          </div>
        </div>
      </div>
    );
  }

  const totalSummary = getTotalSummary();

  return (
    <>
      {/* Print Styles for PDF Export */}
      <style jsx global>{`
        @media print {
          @page {
            margin: 1cm;
          }
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          header, .no-print {
            display: none !important;
          }
          .print-break {
            page-break-inside: avoid;
          }
        }
      `}</style>

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50">
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-md border-b border-blue-900/10 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/admin" className="text-blue-700 hover:text-blue-900 font-medium transition-colors bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-lg flex items-center space-x-2">
                <span>←</span>
                <span>Dashboard</span>
              </Link>
              <div className="h-6 w-px bg-blue-200"></div>
              <img src="/betriclogoblue.png" alt="Betric" className="h-8 w-8 object-contain" />
              <h1 className="text-xl font-bold text-blue-900">Laporan Payroll</h1>
            </div>
            <div className="text-right">
              <p className="text-blue-900 text-sm font-semibold">{filteredData.length} Workers</p>
              <p className="text-blue-700/70 text-xs">Siklus: Tanggal 14</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-blue-900 mb-2 flex items-center space-x-3">
            <span className="text-4xl">📊</span>
            <span>Laporan Payroll Workers</span>
          </h2>
          <p className="text-blue-700/70">
            Monitor pembayaran project workers dengan siklus tanggal 14 setiap bulan
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-blue-900/10 shadow-lg">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center text-white text-xl shadow-lg">
                📋
              </div>
              <div>
                <h4 className="text-blue-900 font-semibold text-sm">Total Projects</h4>
                <p className="text-2xl font-bold text-blue-800">{totalSummary.total_projects}</p>
                <p className="text-xs text-blue-600/60">{formatCurrency(totalSummary.total_amount)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-blue-900/10 shadow-lg">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-green-500 to-green-600 flex items-center justify-center text-white text-xl shadow-lg">
                ✅
              </div>
              <div>
                <h4 className="text-blue-900 font-semibold text-sm">Sudah Dibayar</h4>
                <p className="text-2xl font-bold text-green-800">{totalSummary.paid_projects}</p>
                <p className="text-xs text-green-600/60">{formatCurrency(totalSummary.paid_amount)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-blue-900/10 shadow-lg">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-yellow-500 to-yellow-600 flex items-center justify-center text-white text-xl shadow-lg">
                ⏳
              </div>
              <div>
                <h4 className="text-blue-900 font-semibold text-sm">Belum Dibayar</h4>
                <p className="text-2xl font-bold text-yellow-800">{totalSummary.pending_projects}</p>
                <p className="text-xs text-yellow-600/60">{formatCurrency(totalSummary.pending_amount)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-blue-900/10 shadow-lg p-4 mb-6 no-print">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari worker (nama, email, atau ID)..."
              className="w-full bg-blue-50/50 border border-blue-200 rounded-xl px-5 py-3 pl-12 text-blue-900 placeholder-blue-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all"
            />
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-400 text-xl">🔍</span>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-400 hover:text-blue-600 font-bold"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-blue-900/10 shadow-lg p-6 mb-6 no-print">
          <h3 className="text-lg font-bold text-blue-900 mb-4 flex items-center space-x-2">
            <span>⚙️</span>
            <span>Filter Laporan</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Date Range Filter */}
            <div>
              <label className="block text-blue-800 text-sm font-semibold mb-2">📅 Periode Waktu</label>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="w-full bg-blue-50/50 border border-blue-200 rounded-xl px-4 py-3 text-blue-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all"
              >
                <option value="7">7 hari terakhir</option>
                <option value="10">10 hari terakhir</option>
                <option value="14">14 hari terakhir</option>
                <option value="30">30 hari terakhir</option>
                <option value="60">60 hari terakhir</option>
              </select>
            </div>

            {/* Payment Status Filter */}
            <div>
              <label className="block text-blue-800 text-sm font-semibold mb-2">💳 Status Pembayaran</label>
              <select
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value)}
                className="w-full bg-blue-50/50 border border-blue-200 rounded-xl px-4 py-3 text-blue-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all"
              >
                <option value="all">Semua Status</option>
                <option value="pending">Belum Dibayar</option>
                <option value="paid">Sudah Dibayar</option>
              </select>
            </div>

            {/* Payment Cycle Filter */}
            <div>
              <label className="block text-blue-800 text-sm font-semibold mb-2">🔄 Siklus Pembayaran</label>
              <select
                value={paymentCycle}
                onChange={(e) => setPaymentCycle(e.target.value)}
                className="w-full bg-blue-50/50 border border-blue-200 rounded-xl px-4 py-3 text-blue-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all"
              >
                <option value="14th">Tanggal 14 (Utama)</option>
                <option value="monthly">Bulanan</option>
                <option value="weekly">Mingguan</option>
              </select>
            </div>
          </div>

          {/* Filter Results Info */}
          <div className="mt-4 text-blue-700/70 text-sm bg-blue-50/50 rounded-lg p-3">
            Menampilkan <strong>{filteredData.length}</strong> workers dengan <strong>{totalSummary.total_projects}</strong> projects 
            dalam <strong>{dateRange} hari</strong> terakhir
            {paymentStatus !== 'all' && <span> dengan status <strong>{paymentStatus}</strong></span>}
          </div>
        </div>

        {/* Bulk Action Bar */}
        {selectedProjects.size > 0 && (
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl shadow-2xl p-6 mb-6 sticky top-20 z-30 no-print">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <div className="bg-white/20 rounded-full px-4 py-2 font-bold text-lg">
                  {selectedProjects.size} Project Dipilih
                </div>
                <div className="bg-white/20 rounded-full px-4 py-2 font-bold">
                  Total: {formatCurrency(getTotalSelectedAmount())}
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setSelectedProjects(new Set())}
                  className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg font-medium transition-all"
                >
                  ❌ Batal
                </button>
                <button
                  onClick={handleBulkMarkAsPaid}
                  disabled={isProcessing}
                  className="bg-white text-blue-600 hover:bg-blue-50 px-6 py-2 rounded-lg font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {isProcessing ? (
                    <>
                      <span className="animate-spin">⏳</span>
                      <span>Memproses...</span>
                    </>
                  ) : (
                    <>
                      <span>✅</span>
                      <span>Tandai Semua Dibayar</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Workers Payroll List */}
        <div className="space-y-6">
          {filteredData.length === 0 ? (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-blue-900/10 shadow-lg p-12 text-center">
              <div className="text-6xl mb-4">📊</div>
              <h3 className="text-xl font-semibold text-blue-900 mb-2">Tidak ada data payroll</h3>
              <p className="text-blue-700/70">
                {paymentStatus !== 'all'
                  ? `Tidak ada project dengan status "${paymentStatus}" dalam periode ini`
                  : 'Belum ada project yang selesai dalam periode ini'
                }
              </p>
            </div>
          ) : (
            filteredData.map((worker) => (
              <div key={worker.worker_id} className="bg-white/80 backdrop-blur-sm rounded-2xl border border-blue-900/10 shadow-lg overflow-hidden">
                {/* Worker Header */}
                <div className="p-6 border-b border-blue-100 bg-gradient-to-r from-blue-50/50 to-purple-50/30">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                        {worker.worker_name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="text-xl font-bold text-blue-900">{worker.worker_name}</h4>
                        <p className="text-blue-700/70 text-sm">{worker.worker_email}</p>
                        <p className="text-blue-600/60 text-xs font-mono">ID: {worker.worker_id.slice(0, 8)}...</p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-2xl font-bold text-blue-800">{formatCurrency(worker.total_amount)}</p>
                      <p className="text-blue-700/70 text-sm">{worker.total_projects} projects selesai</p>
                    </div>
                  </div>
                  
                  {/* Worker Summary Stats */}
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="bg-green-100/50 rounded-lg p-3 text-center border border-green-200">
                      <div className="text-lg font-bold text-green-800">{worker.paid_projects}</div>
                      <div className="text-xs text-green-600">Sudah Dibayar</div>
                      <div className="text-xs font-semibold text-green-700">{formatCurrency(worker.paid_amount)}</div>
                    </div>
                    <div className="bg-yellow-100/50 rounded-lg p-3 text-center border border-yellow-200">
                      <div className="text-lg font-bold text-yellow-800">{worker.pending_projects}</div>
                      <div className="text-xs text-yellow-600">Belum Dibayar</div>
                      <div className="text-xs font-semibold text-yellow-700">{formatCurrency(worker.pending_amount)}</div>
                    </div>
                  </div>
                </div>

                {/* Projects List */}
                <div className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center space-x-3">
                      <h5 className="font-semibold text-blue-900">Detail Projects ({worker.projects.length})</h5>
                      {worker.projects.filter(p => p.payment_status !== 'paid').length > 0 && (
                        <button
                          onClick={() => handleToggleAll(worker)}
                          className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-800 px-3 py-1 rounded-lg font-medium transition-colors no-print"
                        >
                          {worker.projects.filter(p => p.payment_status !== 'paid').every(p => selectedProjects.has(p.id))
                            ? '☑️ Batalkan Semua'
                            : '☑️ Pilih Semua'}
                        </button>
                      )}
                    </div>
                    <button
                      onClick={() => setSelectedWorker(selectedWorker === worker.worker_id ? null : worker.worker_id)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors no-print"
                    >
                      {selectedWorker === worker.worker_id ? '🔼 Tutup' : '🔽 Lihat Detail'}
                    </button>
                  </div>

                  {selectedWorker === worker.worker_id && (
                    <div className="space-y-3">
                      {worker.projects.map((project) => (
                        <div
                          key={project.id}
                          className={`bg-blue-50/50 rounded-xl p-4 border transition-all ${
                            selectedProjects.has(project.id)
                              ? 'border-blue-500 bg-blue-100/50 shadow-md'
                              : 'border-blue-100'
                          }`}
                        >
                          <div className="flex items-start space-x-3">
                            {/* Checkbox */}
                            {project.payment_status !== 'paid' && (
                              <input
                                type="checkbox"
                                checked={selectedProjects.has(project.id)}
                                onChange={() => handleToggleProject(project.id, project.payment_status === 'paid')}
                                className="mt-1 w-5 h-5 text-blue-600 border-blue-300 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer no-print"
                              />
                            )}

                            <div className="flex-1">
                              <div className="flex justify-between items-start mb-3">
                                <div className="flex-1">
                                  <h6 className="font-semibold text-blue-900 mb-1">{project.title}</h6>
                                  <div className="text-sm text-blue-700/70">
                                    Selesai: {formatDate(project.completion_date)}
                                  </div>
                                </div>
                                <div className="flex flex-col items-end space-y-2">
                                  <div className="text-lg font-bold text-blue-800">{formatCurrency(project.project_value)}</div>
                                  <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full border ${getStatusBadge(project.payment_status)}`}>
                                    {getStatusText(project.payment_status)}
                                  </span>
                                </div>
                              </div>

                              <div className="flex justify-between items-center">
                                <div className="text-xs text-blue-600/60">
                                  {project.payment_date && (
                                    <span>Dibayar: {formatDate(project.payment_date)}</span>
                                  )}
                                </div>

                                <div className="flex items-center space-x-2 no-print">
                                  {/* Toggle Status Button - Always visible */}
                                  <button
                                    onClick={() => handleTogglePaymentStatus(project.id, worker.worker_id, project.payment_status)}
                                    disabled={isProcessing || selectedProjects.has(project.id)}
                                    className={`px-4 py-2 text-sm rounded-lg font-medium transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                                      project.payment_status === 'paid'
                                        ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                                        : 'bg-green-600 hover:bg-green-700 text-white'
                                    }`}
                                  >
                                    {project.payment_status === 'paid' ? (
                                      <>
                                        <span>⏳</span>
                                        <span>Ubah Jadi Pending</span>
                                      </>
                                    ) : (
                                      <>
                                        <span>✅</span>
                                        <span>Tandai Dibayar</span>
                                      </>
                                    )}
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Export Options */}
        <div className="mt-8 bg-white/80 backdrop-blur-sm rounded-2xl border border-blue-900/10 shadow-lg p-6 no-print">
          <h3 className="text-lg font-bold text-blue-900 mb-4 flex items-center space-x-2">
            <span>📤</span>
            <span>Export Laporan</span>
          </h3>

          <div className="flex flex-wrap gap-4">
            <button
              onClick={handleExportToExcel}
              disabled={filteredData.length === 0}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-semibold transition-all flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>📊</span>
              <span>Export ke Excel</span>
            </button>

            <button
              onClick={handleExportToPDF}
              disabled={filteredData.length === 0}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-semibold transition-all flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>📄</span>
              <span>Export ke PDF</span>
            </button>
          </div>
        </div>
      </main>
    </div>
    </>
  );
}