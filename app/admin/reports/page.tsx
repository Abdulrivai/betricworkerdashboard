'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { formatCurrency, formatDate } from '../utils/helpers';
import * as XLSX from 'xlsx';
import Swal from 'sweetalert2';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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
  // Project Details
  deadline?: string;
  description?: string;
  requirements?: string[];
  status?: string;
  // Penalty Information
  days_late?: number;
  penalty_percentage?: number;
  penalty_amount?: number;
  original_value?: number;
  final_value?: number;
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

// Custom debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default function ReportsPage() {
  const [payrollData, setPayrollData] = useState<WorkerPayrollSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedWorker, setSelectedWorker] = useState<string | null>(null);
  const [selectedProjects, setSelectedProjects] = useState<Set<string>>(new Set());
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProjectDetail, setSelectedProjectDetail] = useState<PayrollProject | null>(null);

  const [dateRange, setDateRange] = useState('10'); // days
  const [paymentStatus, setPaymentStatus] = useState<string>('all');
  const [paymentCycle, setPaymentCycle] = useState<string>('14th');

  // Debounce search query to reduce filtering operations
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Memoize filtered data to avoid unnecessary recalculations
  const filteredData = useMemo(() => {
    let filtered = payrollData;

    // Filter by search query
    if (debouncedSearchQuery.trim()) {
      const query = debouncedSearchQuery.toLowerCase();
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

    return filtered;
  }, [payrollData, paymentStatus, debouncedSearchQuery]);

  // Memoize fetch function to prevent unnecessary re-creation
  const fetchPayrollData = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `/api/admin/payroll?days=${dateRange}&cycle=${paymentCycle}`,
        {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate'
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Fetched payroll data:', data.workers?.length, 'workers');
        setPayrollData(data.workers || []);
      } else {
        console.error('Failed to fetch payroll data:', response.status);
      }
    } catch (error) {
      console.error('Error fetching payroll data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [dateRange, paymentCycle]);

  useEffect(() => {
    fetchPayrollData();
  }, [fetchPayrollData]);

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
      const excelData: any[] = [];
      const currentDate = new Date().toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      });

      // Company Header (rows 1-4)
      excelData.push(['LAPORAN PAYROLL WORKERS - PT BETRIC']);
      excelData.push([`Periode: ${dateRange} Hari Terakhir`]);
      excelData.push([`Tanggal Export: ${currentDate}`]);
      excelData.push([`Siklus Pembayaran: Tanggal 14 Setiap Bulan`]);
      excelData.push([]); // Empty row

      // Summary Section (rows 6-9)
      excelData.push(['RINGKASAN PAYROLL']);
      excelData.push(['Total Workers:', filteredData.length]);
      excelData.push(['Total Projects:', totalSummary.total_projects, 'Total Nilai:', totalSummary.total_amount]);
      excelData.push(['Sudah Dibayar:', totalSummary.paid_projects, 'Nilai Dibayar:', totalSummary.paid_amount]);
      excelData.push(['Belum Dibayar:', totalSummary.pending_projects, 'Nilai Pending:', totalSummary.pending_amount]);
      excelData.push([]); // Empty row

      // Table Header (row 12)
      excelData.push([
        'No',
        'Nama Worker',
        'Email Worker',
        'Judul Project',
        'Nilai Project (Rp)',
        'Tanggal Selesai',
        'Status Pembayaran',
        'Tanggal Dibayar'
      ]);

      // Data rows
      let rowNumber = 1;
      filteredData.forEach(worker => {
        worker.projects.forEach(project => {
          excelData.push([
            rowNumber++,
            worker.worker_name,
            worker.worker_email,
            project.title,
            project.project_value,
            formatDate(project.completion_date),
            project.payment_status === 'paid' ? 'SUDAH DIBAYAR' : 'BELUM DIBAYAR',
            project.payment_date ? formatDate(project.payment_date) : '-'
          ]);
        });
      });

      excelData.push([]); // Empty row before footer

      // Footer Section
      excelData.push(['']);
      excelData.push(['Dicetak oleh:', 'Admin BETRIC']);
      excelData.push(['Tanggal Cetak:', currentDate]);
      excelData.push(['']);
      excelData.push(['© PT BETRIC - Laporan ini bersifat rahasia dan hanya untuk penggunaan internal']);

      // Create worksheet
      const ws = XLSX.utils.aoa_to_sheet(excelData);

      // Set column widths (optimized for better readability)
      ws['!cols'] = [
        { wch: 6 },  // No
        { wch: 20 }, // Worker Name
        { wch: 28 }, // Worker Email
        { wch: 55 }, // Project Title (wider untuk judul panjang)
        { wch: 18 }, // Project Value
        { wch: 15 }, // Completion Date
        { wch: 18 }, // Payment Status
        { wch: 15 }  // Payment Date
      ];

      // Set row heights for better spacing
      if (!ws['!rows']) ws['!rows'] = [];
      ws['!rows'][0] = { hpt: 35 }; // Company header - lebih tinggi
      ws['!rows'][1] = { hpt: 22 }; // Period
      ws['!rows'][2] = { hpt: 22 }; // Export date
      ws['!rows'][3] = { hpt: 22 }; // Payment cycle
      ws['!rows'][4] = { hpt: 8 };  // Empty row - spacing
      ws['!rows'][5] = { hpt: 28 }; // Summary title - lebih tinggi
      ws['!rows'][6] = { hpt: 24 }; // Summary row 1
      ws['!rows'][7] = { hpt: 24 }; // Summary row 2
      ws['!rows'][8] = { hpt: 24 }; // Summary row 3
      ws['!rows'][9] = { hpt: 24 }; // Summary row 4
      ws['!rows'][10] = { hpt: 8 }; // Empty row - spacing
      ws['!rows'][11] = { hpt: 30 }; // Table header - lebih tinggi

      // Set default row height for data rows - lebih tinggi untuk wrap text
      for (let i = 12; i < excelData.length; i++) {
        if (!ws['!rows'][i]) ws['!rows'][i] = {};
        ws['!rows'][i].hpt = 28; // Increased dari 22 ke 28
      }

      // Add auto-filter to table headers (row 12, columns A-H)
      ws['!autofilter'] = { ref: `A12:H${11 + rowNumber}` };

      // Freeze panes: Freeze rows 1-12 (headers) and column A
      ws['!freeze'] = { xSplit: 1, ySplit: 12, activePane: 'bottomRight' };

      // Merge cells for header and summary
      ws['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 7 } }, // Company name
        { s: { r: 1, c: 0 }, e: { r: 1, c: 7 } }, // Period
        { s: { r: 2, c: 0 }, e: { r: 2, c: 7 } }, // Export date
        { s: { r: 3, c: 0 }, e: { r: 3, c: 7 } }, // Payment cycle
        { s: { r: 5, c: 0 }, e: { r: 5, c: 7 } }, // Summary title
        { s: { r: 6, c: 0 }, e: { r: 6, c: 1 } }, // Total Workers label + value
        { s: { r: 7, c: 0 }, e: { r: 7, c: 1 } }, // Total Projects label + value
        { s: { r: 8, c: 0 }, e: { r: 8, c: 1 } }, // Projects Dibayar label + value
        { s: { r: 9, c: 0 }, e: { r: 9, c: 1 } }  // Projects Pending label + value
      ];

      // Style company header (row 1) - SUPER VIBRANT Purple-Blue Gradient
      // Apply to all merged cells
      const companyHeaderStyle = {
        font: { bold: true, sz: 20, color: { rgb: "FFFFFF" }, name: "Arial Black" },
        fill: { fgColor: { rgb: "6366F1" }, patternType: "solid" }, // Vibrant Indigo
        alignment: { horizontal: "center", vertical: "center" },
        border: {
          top: { style: "thick", color: { rgb: "000000" } },
          bottom: { style: "thick", color: { rgb: "000000" } },
          left: { style: "thick", color: { rgb: "000000" } },
          right: { style: "thick", color: { rgb: "000000" } }
        }
      };
      for (let col = 0; col < 8; col++) {
        const cellRef = XLSX.utils.encode_cell({ r: 0, c: col });
        if (!ws[cellRef]) ws[cellRef] = { v: '', t: 's' };
        ws[cellRef].s = companyHeaderStyle;
      }

      // Style period, export date, payment cycle (rows 2-4) - Vibrant Gradient
      const colors = ["93C5FD", "60A5FA", "3B82F6"]; // Vibrant blue gradient
      for (let row = 1; row <= 3; row++) {
        const rowStyle = {
          font: { bold: true, sz: 11, color: { rgb: "FFFFFF" }, name: "Calibri" },
          alignment: { horizontal: "center", vertical: "center" },
          fill: { fgColor: { rgb: colors[row - 1] }, patternType: "solid" },
          border: {
            top: { style: "medium", color: { rgb: "000000" } },
            bottom: { style: "medium", color: { rgb: "000000" } },
            left: { style: "medium", color: { rgb: "000000" } },
            right: { style: "medium", color: { rgb: "000000" } }
          }
        };
        // Apply to all merged cells
        for (let col = 0; col < 8; col++) {
          const cellRef = XLSX.utils.encode_cell({ r: row, c: col });
          if (!ws[cellRef]) ws[cellRef] = { v: '', t: 's' };
          ws[cellRef].s = rowStyle;
        }
      }

      // Style summary title (row 6) - SUPER VIBRANT Pink/Magenta
      const summaryTitleStyle = {
        font: { bold: true, sz: 16, color: { rgb: "FFFFFF" }, name: "Arial Black" },
        fill: { fgColor: { rgb: "EC4899" }, patternType: "solid" }, // Vibrant Pink
        alignment: { horizontal: "center", vertical: "center" },
        border: {
          top: { style: "thick", color: { rgb: "000000" } },
          bottom: { style: "thick", color: { rgb: "000000" } },
          left: { style: "thick", color: { rgb: "000000" } },
          right: { style: "thick", color: { rgb: "000000" } }
        }
      };
      // Apply to all merged cells
      for (let col = 0; col < 8; col++) {
        const cellRef = XLSX.utils.encode_cell({ r: 5, c: col });
        if (!ws[cellRef]) ws[cellRef] = { v: '', t: 's' };
        ws[cellRef].s = summaryTitleStyle;
      }

      // Style summary data (rows 7-10) - Vibrant colorful boxes with gradients
      const summaryColors = [
        { label: "DBEAFE", value: "3B82F6", text: "1E3A8A" },  // Vibrant Blue - Total Workers
        { label: "BBF7D0", value: "22C55E", text: "065F46" },  // Vibrant Green - Total Projects
        { label: "D1FAE5", value: "10B981", text: "047857" },  // Emerald - Projects Dibayar
        { label: "FED7AA", value: "F97316", text: "9A3412" }   // Vibrant Orange - Projects Pending
      ];

      for (let row = 6; row <= 10; row++) {
        const colorIndex = row - 7;

        if (colorIndex >= 0) {
          // Style first merged cell (A-B) with label and value - VIBRANT!
          const cellARef = XLSX.utils.encode_cell({ r: row, c: 0 });
          const cellBRef = XLSX.utils.encode_cell({ r: row, c: 1 });
          const mergedStyle = {
            font: {
              bold: true,
              sz: 12,
              color: { rgb: "FFFFFF" },
              name: "Calibri"
            },
            fill: { fgColor: { rgb: summaryColors[colorIndex].value }, patternType: "solid" },
            alignment: { horizontal: "center", vertical: "center" },
            border: {
              top: { style: "thick", color: { rgb: "000000" } },
              bottom: { style: "thick", color: { rgb: "000000" } },
              left: { style: "thick", color: { rgb: "000000" } },
              right: { style: "thick", color: { rgb: "000000" } }
            }
          };
          if (!ws[cellARef]) ws[cellARef] = { v: '', t: 's' };
          if (!ws[cellBRef]) ws[cellBRef] = { v: '', t: 's' };
          ws[cellARef].s = mergedStyle;
          ws[cellBRef].s = mergedStyle;

          // Style columns C and D (Total Nilai / Nilai Dibayar / Nilai Pending)
          for (let col = 2; col < 4; col++) {
            const cellRef = XLSX.utils.encode_cell({ r: row, c: col });
            const isLabel = col === 2;

            if (!ws[cellRef]) ws[cellRef] = { v: '', t: 's' };

            ws[cellRef].s = {
              font: {
                bold: true,
                sz: isLabel ? 11 : 13,
                color: { rgb: isLabel ? summaryColors[colorIndex].text : "FFFFFF" },
                name: "Calibri"
              },
              fill: {
                fgColor: { rgb: isLabel ? summaryColors[colorIndex].label : summaryColors[colorIndex].value },
                patternType: "solid"
              },
              alignment: { horizontal: isLabel ? "left" : "center", vertical: "center" },
              border: {
                top: { style: "thick", color: { rgb: "000000" } },
                bottom: { style: "thick", color: { rgb: "000000" } },
                left: { style: "thick", color: { rgb: "000000" } },
                right: { style: "thick", color: { rgb: "000000" } }
              }
            };

            // Format currency values in summary
            if (typeof ws[cellRef].v === 'number' && col === 3) {
              ws[cellRef].z = '"Rp "#,##0';
            }
          }
        }
      }

      // Style table header (row 12) - Rainbow Gradient with better borders
      const headerRow = 11;
      const headerColors = [
        "EF4444", // Red - No
        "F97316", // Orange - Worker Name
        "EAB308", // Yellow - Email
        "22C55E", // Green - Project Title
        "10B981", // Emerald - Value
        "06B6D4", // Cyan - Completion Date
        "3B82F6", // Blue - Payment Status
        "8B5CF6"  // Purple - Payment Date
      ];
      for (let col = 0; col < 8; col++) {
        const cellRef = XLSX.utils.encode_cell({ r: headerRow, c: col });
        if (!ws[cellRef]) ws[cellRef] = { v: '', t: 's' };

        ws[cellRef].s = {
          font: { bold: true, sz: 12, color: { rgb: "FFFFFF" }, name: "Calibri" },
          fill: { fgColor: { rgb: headerColors[col] }, patternType: "solid" },
          alignment: { horizontal: "center", vertical: "center", wrapText: true },
          border: {
            top: { style: "thick", color: { rgb: "000000" } },
            bottom: { style: "thick", color: { rgb: "000000" } },
            left: { style: "medium", color: { rgb: "FFFFFF" } },
            right: { style: "medium", color: { rgb: "FFFFFF" } }
          }
        };
      }

      // Style data rows with vibrant alternating colors and gradient effect
      const dataStartRow = 12;
      const dataEndRow = dataStartRow + (rowNumber - 1);

      // Define more vibrant color schemes for alternating rows
      const rowColorSchemes = [
        { bg: "E0F2FE", border: "0EA5E9" }, // Sky blue
        { bg: "DBEAFE", border: "3B82F6" }, // Blue
        { bg: "DDD6FE", border: "8B5CF6" }, // Purple
        { bg: "FCE7F3", border: "EC4899" }, // Pink
        { bg: "FEE2E2", border: "EF4444" }, // Red
        { bg: "FED7AA", border: "F97316" }, // Orange
        { bg: "FEF08A", border: "EAB308" }, // Yellow
        { bg: "D9F99D", border: "84CC16" }, // Lime
        { bg: "BBF7D0", border: "22C55E" }, // Green
        { bg: "A7F3D0", border: "10B981" }  // Emerald
      ];

      for (let row = dataStartRow; row < dataEndRow; row++) {
        const rowIndex = row - dataStartRow;
        const colorScheme = rowColorSchemes[rowIndex % rowColorSchemes.length];

        for (let col = 0; col < 8; col++) {
          const cellRef = XLSX.utils.encode_cell({ r: row, c: col });
          if (ws[cellRef]) {
            ws[cellRef].s = {
              font: {
                sz: col === 4 ? 11 : 10,
                color: { rgb: "1E293B" },
                name: "Calibri"
              },
              fill: { fgColor: { rgb: colorScheme.bg }, patternType: "solid" },
              alignment: {
                horizontal: col === 0 || col === 4 || col === 5 || col === 6 || col === 7 ? "center" : "left",
                vertical: "top",
                wrapText: col === 3
              },
              border: {
                top: { style: "medium", color: { rgb: colorScheme.border } },
                bottom: { style: "medium", color: { rgb: colorScheme.border } },
                left: { style: "thin", color: { rgb: colorScheme.border } },
                right: { style: "thin", color: { rgb: colorScheme.border } }
              }
            };

            // Format currency with Rp prefix and thousand separator
            if (col === 4 && typeof ws[cellRef].v === 'number') {
              ws[cellRef].z = '"Rp "#,##0';
              ws[cellRef].s.font = { sz: 12, bold: true, color: { rgb: "047857" }, name: "Calibri" };
              // Keep the row's background color for currency column
            }

            // Color code payment status with vibrant colors
            if (col === 6) {
              const isPaid = ws[cellRef].v === 'SUDAH DIBAYAR';
              ws[cellRef].s.font = {
                bold: true,
                sz: 10,
                color: { rgb: "FFFFFF" },
                name: "Calibri"
              };
              ws[cellRef].s.fill = {
                fgColor: { rgb: isPaid ? "10B981" : "F59E0B" },
                patternType: "solid"
              };
              ws[cellRef].s.alignment = { horizontal: "center", vertical: "center" };
              ws[cellRef].s.border = {
                top: { style: "medium", color: { rgb: isPaid ? "059669" : "D97706" } },
                bottom: { style: "medium", color: { rgb: isPaid ? "059669" : "D97706" } },
                left: { style: "medium", color: { rgb: isPaid ? "059669" : "D97706" } },
                right: { style: "medium", color: { rgb: isPaid ? "059669" : "D97706" } }
              };
            }

            // Highlight nomor with gradient color matching the row scheme
            if (col === 0) {
              ws[cellRef].s.font = { sz: 11, bold: true, color: { rgb: "1E40AF" }, name: "Calibri" };
              // Keep the gradient background from colorScheme
            }

            // Format date columns
            if ((col === 5 || col === 7) && ws[cellRef].v && ws[cellRef].v !== '-') {
              ws[cellRef].s.font = { sz: 10, color: { rgb: "475569" }, name: "Calibri" };
            }

            // Worker name and email styling
            if (col === 1 || col === 2) {
              ws[cellRef].s.font = {
                sz: col === 1 ? 10 : 10,
                bold: col === 1,
                color: { rgb: col === 1 ? "1E40AF" : "475569" },
                name: "Calibri"
              };
              ws[cellRef].s.alignment = {
                horizontal: "left",
                vertical: "top",
                wrapText: false
              };
            }

            // Project title styling
            if (col === 3) {
              ws[cellRef].s.font = { sz: 10, color: { rgb: "0F172A" }, name: "Calibri" };
              ws[cellRef].s.alignment = {
                horizontal: "left",
                vertical: "top",
                wrapText: true
              };
            }
          }
        }
      }

      // Add total row at the bottom of the table
      const totalRow = dataEndRow;
      const totalValueRef = XLSX.utils.encode_cell({ r: totalRow, c: 4 });

      // Calculate total value
      let totalValue = 0;
      for (let row = dataStartRow; row < dataEndRow; row++) {
        const cellRef = XLSX.utils.encode_cell({ r: row, c: 4 });
        if (ws[cellRef] && typeof ws[cellRef].v === 'number') {
          totalValue += ws[cellRef].v;
        }
      }

      // Style and populate total row
      for (let col = 0; col < 8; col++) {
        const cellRef = XLSX.utils.encode_cell({ r: totalRow, c: col });

        if (col === 0) {
          // Merge cells A-D for "TOTAL" label - VIBRANT RED
          if (!ws['!merges']) ws['!merges'] = [];
          ws['!merges'].push({ s: { r: totalRow, c: 0 }, e: { r: totalRow, c: 3 } });

          const totalLabelStyle = {
            font: { bold: true, sz: 14, color: { rgb: "FFFFFF" }, name: "Calibri" },
            fill: { fgColor: { rgb: "DC2626" }, patternType: "solid" }, // Vibrant Red
            alignment: { horizontal: "center", vertical: "center" },
            border: {
              top: { style: "thick", color: { rgb: "000000" } },
              bottom: { style: "thick", color: { rgb: "000000" } },
              left: { style: "thick", color: { rgb: "000000" } },
              right: { style: "thick", color: { rgb: "000000" } }
            }
          };

          // Apply to all merged cells (A-D)
          for (let mergeCol = 0; mergeCol <= 3; mergeCol++) {
            const mergeCellRef = XLSX.utils.encode_cell({ r: totalRow, c: mergeCol });
            if (!ws[mergeCellRef]) ws[mergeCellRef] = { v: '', t: 's' };
            ws[mergeCellRef].s = totalLabelStyle;
          }
          ws[cellRef].v = '💰 TOTAL KESELURUHAN 💰';
        } else if (col === 4) {
          // Total value column - VIBRANT GREEN/GOLD
          ws[cellRef] = { v: totalValue, t: 'n' };
          ws[cellRef].z = '"Rp "#,##0';
          ws[cellRef].s = {
            font: { bold: true, sz: 16, color: { rgb: "FFFFFF" }, name: "Calibri" },
            fill: { fgColor: { rgb: "16A34A" }, patternType: "solid" }, // Vibrant Green
            alignment: { horizontal: "center", vertical: "center" },
            border: {
              top: { style: "thick", color: { rgb: "000000" } },
              bottom: { style: "thick", color: { rgb: "000000" } },
              left: { style: "thick", color: { rgb: "000000" } },
              right: { style: "thick", color: { rgb: "000000" } }
            }
          };
        } else if (col > 4) {
          // Empty cells after total value - match red theme
          if (!ws[cellRef]) ws[cellRef] = { v: '', t: 's' };
          ws[cellRef].s = {
            fill: { fgColor: { rgb: "FEE2E2" }, patternType: "solid" }, // Light red
            border: {
              top: { style: "thick", color: { rgb: "000000" } },
              bottom: { style: "thick", color: { rgb: "000000" } },
              left: { style: "thin", color: { rgb: "000000" } },
              right: { style: "thick", color: { rgb: "000000" } }
            }
          };
        }
      }

      // Set total row height
      if (!ws['!rows'][totalRow]) ws['!rows'][totalRow] = {};
      ws['!rows'][totalRow].hpt = 32; // Lebih tinggi untuk total row

      // Add spacing after total row
      const footerStartRow = totalRow + 1;
      if (!ws['!rows'][footerStartRow]) ws['!rows'][footerStartRow] = {};
      ws['!rows'][footerStartRow].hpt = 8; // Empty row spacing

      // Create workbook
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Laporan Payroll');

      // Add workbook properties
      wb.Props = {
        Title: "Laporan Payroll Workers BETRIC",
        Subject: "Payroll Report",
        Author: "PT BETRIC",
        CreatedDate: new Date()
      };

      // Generate filename
      const filename = `BETRIC_Payroll_Report_${new Date().toISOString().split('T')[0]}.xlsx`;

      // Download file with cellStyles enabled
      XLSX.writeFile(wb, filename, {
        cellStyles: true,
        bookType: 'xlsx',
        type: 'binary'
      });

      await Swal.fire({
        title: '📊 Export Berhasil!',
        html: `Laporan berhasil di-export ke Excel!<br/><small>${filename}</small>`,
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
      const doc = new jsPDF('l', 'mm', 'a4'); // Landscape, millimeters, A4
      const currentDate = new Date().toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      });

      // Colors - RGB format for jsPDF (as tuples)
      const colors = {
        primary: [99, 102, 241] as [number, number, number],      // Indigo
        primaryDark: [67, 56, 202] as [number, number, number],   // Dark Indigo
        blue: [59, 130, 246] as [number, number, number],          // Blue
        blueLight: [147, 197, 253] as [number, number, number],    // Light Blue
        pink: [236, 72, 153] as [number, number, number],          // Pink
        pinkDark: [219, 39, 119] as [number, number, number],      // Dark Pink
        green: [16, 185, 129] as [number, number, number],         // Green
        greenDark: [5, 150, 105] as [number, number, number],      // Dark Green
        red: [239, 68, 68] as [number, number, number],            // Red
        redDark: [220, 38, 38] as [number, number, number],        // Dark Red
        orange: [249, 115, 22] as [number, number, number],        // Orange
        orangeDark: [234, 88, 12] as [number, number, number],     // Dark Orange
        white: [255, 255, 255] as [number, number, number],
        black: [0, 0, 0] as [number, number, number],
        gray: [156, 163, 175] as [number, number, number],
        grayLight: [243, 244, 246] as [number, number, number],
        text: [30, 41, 59] as [number, number, number]             // Dark slate
      };

      // Page setup
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 15;
      let currentY = margin + 5;

      // ========== BACKGROUND PATTERN ==========
      // Add subtle background color
      doc.setFillColor(...colors.grayLight);
      doc.rect(0, 0, pageWidth, pageHeight, 'F');

      // ========== HEADER SECTION WITH SHADOW ==========
      // Shadow effect
      doc.setFillColor(200, 200, 200);
      doc.rect(margin + 1, currentY + 1, pageWidth - (margin * 2), 25, 'F');

      // Main header background with gradient effect
      doc.setFillColor(...colors.primaryDark);
      doc.rect(margin, currentY, pageWidth - (margin * 2), 25, 'F');

      // Add border
      doc.setDrawColor(...colors.black);
      doc.setLineWidth(0.5);
      doc.rect(margin, currentY, pageWidth - (margin * 2), 25, 'S');

      // Company name
      doc.setTextColor(...colors.white);
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text('LAPORAN PAYROLL WORKERS', pageWidth / 2, currentY + 12, { align: 'center' });

      doc.setFontSize(16);
      doc.setFont('helvetica', 'normal');
      doc.text('PT BETRIC', pageWidth / 2, currentY + 20, { align: 'center' });

      currentY += 30;

      // ========== INFO HEADER WITH SHADOW ==========
      // Shadow effect
      doc.setFillColor(220, 220, 220);
      doc.rect(margin + 0.5, currentY + 0.5, pageWidth - (margin * 2), 10, 'F');

      // Gradient background - Blue gradient effect
      doc.setFillColor(...colors.blueLight);
      doc.rect(margin, currentY, pageWidth - (margin * 2), 10, 'F');

      // Border
      doc.setDrawColor(...colors.blue);
      doc.setLineWidth(0.3);
      doc.rect(margin, currentY, pageWidth - (margin * 2), 10, 'S');

      // Text with decorative bullets
      doc.setTextColor(...colors.primaryDark);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(`Periode: ${dateRange} Hari Terakhir  |  Export: ${currentDate}  |  Siklus: Tanggal 14`, pageWidth / 2, currentY + 6.5, { align: 'center' });

      currentY += 16;

      // ========== SUMMARY SECTION ==========
      // Summary Title with shadow
      // Shadow effect
      doc.setFillColor(200, 200, 200);
      doc.rect(margin + 0.5, currentY + 0.5, pageWidth - (margin * 2), 12, 'F');

      // Main background - Pink to Dark Pink gradient effect
      doc.setFillColor(...colors.pinkDark);
      doc.rect(margin, currentY, pageWidth - (margin * 2), 12, 'F');

      // Border
      doc.setDrawColor(...colors.white);
      doc.setLineWidth(0.5);
      doc.rect(margin, currentY, pageWidth - (margin * 2), 12, 'S');

      // Decorative lines on sides of title
      doc.setDrawColor(...colors.white);
      doc.setLineWidth(1.5);
      const titleTextWidth = 90; // approximate width of text
      doc.line(pageWidth / 2 - titleTextWidth / 2 - 15, currentY + 6, pageWidth / 2 - titleTextWidth / 2 - 5, currentY + 6);
      doc.line(pageWidth / 2 + titleTextWidth / 2 + 5, currentY + 6, pageWidth / 2 + titleTextWidth / 2 + 15, currentY + 6);

      // Title text
      doc.setTextColor(...colors.white);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('RINGKASAN PAYROLL', pageWidth / 2, currentY + 8, { align: 'center' });

      currentY += 15;

      // Summary Boxes with shadow effects
      const summaryData = [
        { label: 'Total Projects', value: totalSummary.total_projects, amount: totalSummary.total_amount, color: colors.blue, darkColor: [29, 78, 216] as [number, number, number] },
        { label: 'Sudah Dibayar', value: totalSummary.paid_projects, amount: totalSummary.paid_amount, color: colors.green, darkColor: [4, 120, 87] as [number, number, number] },
        { label: 'Belum Dibayar', value: totalSummary.pending_projects, amount: totalSummary.pending_amount, color: colors.orange, darkColor: [194, 65, 12] as [number, number, number] }
      ];

      const boxWidth = (pageWidth - (margin * 2)) / 3 - 2;
      const boxHeight = 22;
      let boxX = margin;

      summaryData.forEach((item) => {
        // Shadow effect for depth
        doc.setFillColor(180, 180, 180);
        doc.rect(boxX + 1, currentY + 1, boxWidth, boxHeight, 'F');

        // Darker gradient at bottom (simulating gradient)
        doc.setFillColor(...item.darkColor);
        doc.rect(boxX, currentY + boxHeight - 5, boxWidth, 5, 'F');

        // Main box background
        doc.setFillColor(...item.color);
        doc.rect(boxX, currentY, boxWidth, boxHeight - 5, 'F');

        // Border with contrasting color
        doc.setDrawColor(...colors.white);
        doc.setLineWidth(1);
        doc.rect(boxX, currentY, boxWidth, boxHeight, 'S');

        // Inner glow effect (lighter rectangle inside)
        doc.setFillColor(255, 255, 255, 0.2);
        doc.rect(boxX + 2, currentY + 2, boxWidth - 4, 6, 'F');

        // Decorative bullet point
        doc.setFillColor(255, 255, 255);
        doc.circle(boxX + 5, currentY + 5, 1.5, 'F');

        // Text - Label
        doc.setTextColor(...colors.white);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text(item.label, boxX + boxWidth / 2, currentY + 7, { align: 'center' });

        // Value
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text(`${item.value} Projects`, boxX + boxWidth / 2, currentY + 13, { align: 'center' });

        // Amount with smaller font
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(formatCurrency(item.amount), boxX + boxWidth / 2, currentY + 19, { align: 'center' });

        boxX += boxWidth + 2;
      });

      currentY += 28;

      // ========== TABLE SECTION ==========
      // Prepare table data
      const tableData: any[] = [];
      let rowNumber = 1;

      filteredData.forEach(worker => {
        worker.projects.forEach(project => {
          tableData.push([
            rowNumber++,
            worker.worker_name,
            worker.worker_email,
            project.title,
            formatCurrency(project.project_value),
            formatDate(project.completion_date),
            project.payment_status === 'paid' ? 'SUDAH DIBAYAR' : 'BELUM DIBAYAR',
            project.payment_date ? formatDate(project.payment_date) : '-'
          ]);
        });
      });

      // Table with autoTable and enhanced styling
      autoTable(doc, {
        startY: currentY,
        head: [[
          'No',
          'Nama Worker',
          'Email Worker',
          'Judul Project',
          'Nilai Project',
          'Tgl Selesai',
          'Status',
          'Tgl Bayar'
        ]],
        body: tableData,
        theme: 'grid',
        styles: {
          fontSize: 8,
          cellPadding: 3.5,
          lineColor: [220, 220, 220],
          lineWidth: 0.2,
          textColor: colors.text,
          font: 'helvetica',
          minCellHeight: 8
        },
        headStyles: {
          fillColor: colors.primaryDark as any,
          textColor: colors.white as any,
          fontSize: 10,
          fontStyle: 'bold',
          halign: 'center',
          valign: 'middle',
          cellPadding: 4,
          lineWidth: 0.3,
          lineColor: colors.white as any
        },
        columnStyles: {
          0: { halign: 'center', cellWidth: 10, fontStyle: 'bold' },  // No
          1: { cellWidth: 30 },                                        // Name
          2: { cellWidth: 40, fontSize: 7 },                          // Email
          3: { cellWidth: 60 },                                        // Project
          4: { halign: 'right', cellWidth: 25 },                      // Value
          5: { halign: 'center', cellWidth: 22 },                     // Date
          6: { halign: 'center', cellWidth: 25 },                     // Status
          7: { halign: 'center', cellWidth: 22 }                      // Payment Date
        },
        alternateRowStyles: {
          fillColor: [245, 247, 250] // Very light gray-blue
        },
        didParseCell: function(data: any) {
          // Enhanced status cells with better colors
          if (data.column.index === 6 && data.section === 'body') {
            const isPaid = data.cell.raw === 'SUDAH DIBAYAR';
            if (isPaid) {
              data.cell.styles.fillColor = [16, 185, 129]; // Vibrant green
              data.cell.styles.textColor = [255, 255, 255]; // White text
            } else {
              data.cell.styles.fillColor = [249, 115, 22]; // Vibrant orange
              data.cell.styles.textColor = [255, 255, 255]; // White text
            }
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.fontSize = 8;
          }
          // Bold and colored currency values
          if (data.column.index === 4 && data.section === 'body') {
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.textColor = [5, 150, 105]; // Dark green
            data.cell.styles.fontSize = 8;
          }
          // Highlight worker names
          if (data.column.index === 1 && data.section === 'body') {
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.textColor = [67, 56, 202]; // Indigo
          }
        }
      });

      // ========== TOTAL ROW WITH ENHANCED STYLING ==========
      const finalY = (doc as any).lastAutoTable.finalY + 4;

      // Calculate total
      let totalValue = 0;
      filteredData.forEach(worker => {
        worker.projects.forEach(project => {
          totalValue += project.project_value;
        });
      });

      // Shadow effect for entire total row
      doc.setFillColor(190, 190, 190);
      doc.rect(margin + 1, finalY + 1, pageWidth - (margin * 2), 14, 'F');

      // Total label section with gradient effect
      const labelWidth = (pageWidth - (margin * 2)) * 0.7;
      const valueWidth = (pageWidth - (margin * 2)) * 0.3;

      // Dark red gradient at bottom
      doc.setFillColor(...colors.redDark);
      doc.rect(margin, finalY + 10, labelWidth, 4, 'F');

      // Main red background
      doc.setFillColor(...colors.red);
      doc.rect(margin, finalY, labelWidth, 10, 'F');

      // Border for label
      doc.setDrawColor(...colors.white);
      doc.setLineWidth(1);
      doc.rect(margin, finalY, labelWidth, 14, 'S');

      // Decorative stars/bullets for total
      doc.setFillColor(...colors.white);
      doc.circle(margin + 15, finalY + 7, 1.2, 'F');
      doc.circle(margin + labelWidth - 15, finalY + 7, 1.2, 'F');

      // Label text
      doc.setTextColor(...colors.white);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('TOTAL KESELURUHAN', margin + labelWidth / 2, finalY + 9, { align: 'center' });

      // Total value section with gradient
      // Dark green gradient at bottom
      doc.setFillColor(...colors.greenDark);
      doc.rect(margin + labelWidth, finalY + 10, valueWidth, 4, 'F');

      // Main green background
      doc.setFillColor(...colors.green);
      doc.rect(margin + labelWidth, finalY, valueWidth, 10, 'F');

      // Border for value
      doc.setDrawColor(...colors.white);
      doc.setLineWidth(1);
      doc.rect(margin + labelWidth, finalY, valueWidth, 14, 'S');

      // Value text
      doc.setFontSize(15);
      doc.setFont('helvetica', 'bold');
      doc.text(formatCurrency(totalValue), margin + labelWidth + valueWidth / 2, finalY + 9, { align: 'center' });

      // ========== ENHANCED FOOTER ==========
      const footerY = pageHeight - 18;

      // Footer background with subtle color
      doc.setFillColor(250, 250, 250);
      doc.rect(0, footerY - 5, pageWidth, 25, 'F');

      // Top border line
      doc.setDrawColor(...colors.primary);
      doc.setLineWidth(0.5);
      doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);

      // Footer text
      doc.setTextColor(...colors.gray);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text(`Dicetak oleh: Admin BETRIC  |  Tanggal: ${currentDate}`, pageWidth / 2, footerY, { align: 'center' });

      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...colors.text);
      doc.text('© PT BETRIC - Laporan ini bersifat rahasia dan dilindungi undang-undang', pageWidth / 2, footerY + 5, { align: 'center' });

      // Decorative elements (small diamonds)
      doc.setFillColor(...colors.primary);
      doc.circle(pageWidth / 2 - 3, footerY + 9, 0.8, 'F');
      doc.circle(pageWidth / 2, footerY + 9, 0.8, 'F');
      doc.circle(pageWidth / 2 + 3, footerY + 9, 0.8, 'F');

      // ========== SAVE PDF ==========
      const filename = `BETRIC_Payroll_Report_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(filename);

      await Swal.fire({
        title: '📄 Export PDF Berhasil!',
        html: `Laporan berhasil di-export ke PDF!<br/><small>${filename}</small>`,
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
      console.error('Export to PDF error:', error);
      await Swal.fire({
        title: '❌ Export PDF Gagal!',
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
                <Link href="/admin" className="text-blue-700 hover:text-blue-900 font-medium transition-colors">
                  ← Dashboard
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
        /* Print-only content hidden by default */
        .print-only-content {
          display: none;
        }

        @media print {
          @page {
            margin: 1.5cm;
            size: A4;
          }

          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
            color-adjust: exact;
          }

          /* Hide screen elements */
          header, .no-print {
            display: none !important;
          }

          /* Show print-only content */
          .print-only-content {
            display: block !important;
          }

          /* PDF Header Styling */
          .pdf-header {
            background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
            color: white;
            padding: 20px;
            margin-bottom: 20px;
            border-radius: 8px;
          }

          .pdf-header-content {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
          }

          .pdf-logo-section {
            display: flex;
            align-items: center;
            gap: 15px;
          }

          .pdf-logo {
            width: 60px;
            height: 60px;
            background: white;
            padding: 8px;
            border-radius: 8px;
          }

          .pdf-company-info h1 {
            font-size: 24px;
            font-weight: bold;
            margin: 0 0 5px 0;
          }

          .pdf-company-info p {
            margin: 2px 0;
            font-size: 12px;
            opacity: 0.95;
          }

          .pdf-doc-info {
            text-align: right;
          }

          .pdf-doc-info h2 {
            font-size: 20px;
            font-weight: bold;
            margin: 0 0 8px 0;
            background: rgba(255,255,255,0.2);
            padding: 8px 16px;
            border-radius: 6px;
          }

          .pdf-doc-info p {
            margin: 3px 0;
            font-size: 11px;
          }

          /* Summary Section */
          .pdf-summary {
            background: #f8fafc;
            border: 2px solid #e2e8f0;
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 20px;
          }

          .pdf-summary h3 {
            font-size: 16px;
            font-weight: bold;
            color: #1e40af;
            margin: 0 0 12px 0;
            text-align: center;
            border-bottom: 2px solid #1e40af;
            padding-bottom: 8px;
          }

          .summary-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
          }

          .summary-item {
            display: flex;
            justify-content: space-between;
            padding: 10px;
            background: white;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
          }

          .summary-item.success {
            background: #d1fae5;
            border-color: #10b981;
          }

          .summary-item.warning {
            background: #fef3c7;
            border-color: #f59e0b;
          }

          .summary-item .label {
            font-weight: 600;
            color: #475569;
            font-size: 11px;
          }

          .summary-item .value {
            font-weight: bold;
            color: #1e293b;
            font-size: 12px;
          }

          .summary-item.success .value {
            color: #059669;
          }

          .summary-item.warning .value {
            color: #d97706;
          }

          /* Table Styling */
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
            font-size: 10px;
          }

          table thead {
            background: linear-gradient(135deg, #059669 0%, #10b981 100%);
            color: white;
          }

          table thead th {
            padding: 12px 8px;
            text-align: left;
            font-weight: bold;
            border: 1px solid #047857;
          }

          table tbody tr {
            page-break-inside: avoid;
          }

          table tbody tr:nth-child(even) {
            background: #f0fdf4;
          }

          table tbody tr:nth-child(odd) {
            background: white;
          }

          table tbody td {
            padding: 10px 8px;
            border: 1px solid #e5e7eb;
          }

          /* Payment Status Styling */
          .status-paid {
            background: #d1fae5 !important;
            color: #059669 !important;
            font-weight: bold;
            padding: 4px 8px;
            border-radius: 4px;
            display: inline-block;
          }

          .status-pending {
            background: #fef3c7 !important;
            color: #d97706 !important;
            font-weight: bold;
            padding: 4px 8px;
            border-radius: 4px;
            display: inline-block;
          }

          /* Footer */
          .pdf-footer {
            display: block !important;
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            padding: 15px 30px;
            background: #f8fafc;
            border-top: 3px solid #1e40af;
            text-align: center;
            font-size: 9px;
            color: #64748b;
          }

          .pdf-footer p {
            margin: 3px 0;
            line-height: 1.4;
          }

          .pdf-footer strong {
            color: #1e40af;
            font-size: 11px;
          }

          /* Page breaks */
          .print-break {
            page-break-inside: avoid;
          }

          /* Worker sections */
          .bg-white\\/80 {
            background: white !important;
            border: 1px solid #e2e8f0 !important;
            margin-bottom: 15px;
            page-break-inside: avoid;
          }

          /* Ensure colors are printed */
          * {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
        }
      `}</style>

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50">
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-md border-b border-blue-900/10 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/admin" className="text-blue-700 hover:text-blue-900 font-medium transition-colors">
                ← Dashboard
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
                                  {project.deadline && (
                                    <div className="text-xs text-blue-600/60 mt-1">
                                      Deadline: {formatDate(project.deadline)}
                                    </div>
                                  )}
                                </div>
                                <div className="flex flex-col items-end space-y-2">
                                  {/* Show penalty warning if late */}
                                  {project.days_late && project.days_late > 0 ? (
                                    <>
                                      <div className="text-right">
                                        <div className="text-xs text-red-600 line-through">{formatCurrency(project.original_value || project.project_value)}</div>
                                        <div className="text-lg font-bold text-red-700">{formatCurrency(project.final_value || project.project_value)}</div>
                                        <div className="text-xs text-red-600 font-semibold">
                                          Potongan: {project.days_late} hari × 3% = {project.penalty_percentage?.toFixed(0)}%
                                        </div>
                                        <div className="text-xs text-red-700 font-bold">
                                          -{formatCurrency(project.penalty_amount || 0)}
                                        </div>
                                      </div>
                                    </>
                                  ) : (
                                    <div className="text-lg font-bold text-blue-800">{formatCurrency(project.final_value || project.project_value)}</div>
                                  )}
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
                                  {/* Detail Button */}
                                  <button
                                    onClick={() => setSelectedProjectDetail(project)}
                                    className="relative px-4 py-2.5 text-sm rounded-xl font-bold transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white border-2 border-blue-300/50"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span>Detail SPK</span>
                                  </button>

                                  {/* Toggle Status Button - Enhanced Design */}
                                  <button
                                    onClick={() => handleTogglePaymentStatus(project.id, worker.worker_id, project.payment_status)}
                                    disabled={isProcessing || selectedProjects.has(project.id)}
                                    className={`relative px-5 py-2.5 text-sm rounded-xl font-bold transition-all duration-200 flex items-center space-x-2.5 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 ${
                                      project.payment_status === 'paid'
                                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-2 border-amber-300/50'
                                        : 'bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white border-2 border-emerald-300/50'
                                    }`}
                                  >
                                    {/* Icon Container with animation */}
                                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-white/20">
                                      {project.payment_status === 'paid' ? (
                                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                        </svg>
                                      ) : (
                                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                      )}
                                    </span>

                                    {/* Text */}
                                    <span className="tracking-wide">
                                      {project.payment_status === 'paid' ? 'Ubah Jadi Pending' : 'Tandai Dibayar'}
                                    </span>

                                    {/* Shine effect */}
                                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-500" style={{
                                      backgroundSize: '200% 100%',
                                      animation: 'shine 2s infinite'
                                    }}></div>
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
            {/* PDF Export Button */}
            <button
              onClick={handleExportToPDF}
              disabled={filteredData.length === 0}
              className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all flex items-center space-x-3 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              <span>Download Laporan PDF</span>
            </button>

            {/* Excel Export Button */}
            <button
              onClick={handleExportToExcel}
              disabled={filteredData.length === 0}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all flex items-center space-x-3 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Download Laporan Excel</span>
            </button>
          </div>

          <div className="mt-4 text-sm text-gray-600 bg-blue-50 rounded-lg p-4 border border-blue-200">
            <p className="font-semibold text-blue-900 mb-2">ℹ️ Informasi Export:</p>
            <ul className="space-y-1 list-disc list-inside text-blue-800">
              <li><strong>PDF:</strong> Langsung bisa dibuka tanpa edit, cocok untuk print dan share</li>
              <li><strong>Excel:</strong> Bisa diedit dan difilter, cocok untuk analisis lebih lanjut</li>
              <li>Kedua format sudah include header perusahaan, ringkasan payroll, dan styling profesional berwarna</li>
              <li>File akan ter-download otomatis dengan format: <strong>BETRIC_Payroll_Report_[tanggal]</strong></li>
            </ul>
          </div>
        </div>
      </main>

      {/* Modal Detail SPK */}
      {selectedProjectDetail && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setSelectedProjectDetail(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-t-2xl">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-2xl font-bold mb-2">📄 Detail SPK Project</h3>
                  <p className="text-blue-100 text-sm">{selectedProjectDetail.title}</p>
                </div>
                <button
                  onClick={() => setSelectedProjectDetail(null)}
                  className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Informasi Umum */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 border-2 border-blue-200">
                <h4 className="font-bold text-blue-900 mb-4 flex items-center text-lg">
                  <span className="mr-2">📋</span> Informasi Umum
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-blue-600 font-semibold mb-1">Judul Project</p>
                    <p className="text-blue-900 font-bold">{selectedProjectDetail.title}</p>
                  </div>
                  <div>
                    <p className="text-sm text-blue-600 font-semibold mb-1">Nilai Project</p>
                    {selectedProjectDetail.days_late && selectedProjectDetail.days_late > 0 ? (
                      <div>
                        <p className="text-blue-900/50 line-through text-sm">{formatCurrency(selectedProjectDetail.original_value || selectedProjectDetail.project_value)}</p>
                        <p className="text-red-700 font-bold text-xl">{formatCurrency(selectedProjectDetail.final_value || selectedProjectDetail.project_value)}</p>
                        <p className="text-red-600 text-xs font-semibold">Potongan {selectedProjectDetail.penalty_percentage?.toFixed(0)}%</p>
                      </div>
                    ) : (
                      <p className="text-blue-900 font-bold text-xl">{formatCurrency(selectedProjectDetail.project_value)}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-blue-600 font-semibold mb-1">Status</p>
                    <span className={`inline-flex px-3 py-1 text-xs font-bold rounded-full ${
                      selectedProjectDetail.payment_status === 'paid' 
                        ? 'bg-green-100 text-green-800 border border-green-300' 
                        : 'bg-yellow-100 text-yellow-800 border border-yellow-300'
                    }`}>
                      {selectedProjectDetail.payment_status === 'paid' ? '✅ Sudah Dibayar' : '⏳ Belum Dibayar'}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-blue-600 font-semibold mb-1">Status Project</p>
                    <p className="text-blue-900">{selectedProjectDetail.status || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Penalty Information - Only show if there's a penalty */}
              {selectedProjectDetail.days_late && selectedProjectDetail.days_late > 0 && (
                <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-xl p-5 border-2 border-red-300">
                  <h4 className="font-bold text-red-900 mb-4 flex items-center text-lg">
                    <span className="mr-2">⚠️</span> Informasi Keterlambatan & Potongan
                  </h4>
                  <div className="space-y-3">
                    <div className="bg-white/70 rounded-lg p-4 border border-red-200">
                      <p className="text-sm text-red-700 font-semibold mb-2">🚨 Project ini diselesaikan melewati deadline</p>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-red-600 font-medium">Terlambat</p>
                          <p className="text-red-900 font-bold text-lg">{selectedProjectDetail.days_late} Hari</p>
                        </div>
                        <div>
                          <p className="text-red-600 font-medium">Persentase Potongan</p>
                          <p className="text-red-900 font-bold text-lg">{selectedProjectDetail.penalty_percentage?.toFixed(1)}%</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white/70 rounded-lg p-4 border border-red-200">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-red-700 font-semibold">Nilai Original:</span>
                        <span className="text-red-900 font-bold">{formatCurrency(selectedProjectDetail.original_value || selectedProjectDetail.project_value)}</span>
                      </div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-red-700 font-semibold">Potongan (3% × {selectedProjectDetail.days_late} hari):</span>
                        <span className="text-red-600 font-bold">-{formatCurrency(selectedProjectDetail.penalty_amount || 0)}</span>
                      </div>
                      <div className="border-t-2 border-red-300 pt-2 mt-2">
                        <div className="flex justify-between items-center">
                          <span className="text-red-900 font-bold text-lg">Nilai Akhir:</span>
                          <span className="text-red-900 font-bold text-2xl">{formatCurrency(selectedProjectDetail.final_value || selectedProjectDetail.project_value)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Informasi Tanggal */}
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-5 border-2 border-purple-200">
                <h4 className="font-bold text-purple-900 mb-4 flex items-center text-lg">
                  <span className="mr-2">📅</span> Informasi Waktu
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-purple-600 font-semibold mb-1">Deadline</p>
                    <p className="text-purple-900 font-semibold">{selectedProjectDetail.deadline ? formatDate(selectedProjectDetail.deadline) : '—'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-purple-600 font-semibold mb-1">Tanggal Selesai</p>
                    <p className="text-purple-900">{formatDate(selectedProjectDetail.completion_date)}</p>
                  </div>
                </div>
              </div>

              {/* Worker Info */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-5 border-2 border-green-200">
                <h4 className="font-bold text-green-900 mb-4 flex items-center text-lg">
                  <span className="mr-2">👷</span> Informasi Worker
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-green-600 font-semibold mb-1">Nama Worker</p>
                    <p className="text-green-900 font-bold">{selectedProjectDetail.worker_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-green-600 font-semibold mb-1">Email</p>
                    <p className="text-green-900">{selectedProjectDetail.worker_email}</p>
                  </div>
                </div>
              </div>

              {/* Payment Info */}
              {selectedProjectDetail.payment_date && (
                <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl p-5 border-2 border-amber-200">
                  <h4 className="font-bold text-amber-900 mb-4 flex items-center text-lg">
                    <span className="mr-2">💰</span> Informasi Pembayaran
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-amber-600 font-semibold mb-1">Tanggal Bayar</p>
                      <p className="text-amber-900 font-bold">{formatDate(selectedProjectDetail.payment_date)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-amber-600 font-semibold mb-1">Siklus Pembayaran</p>
                      <p className="text-amber-900">{selectedProjectDetail.payment_cycle}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Deskripsi */}
              {selectedProjectDetail.description && (
                <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl p-5 border-2 border-gray-200">
                  <h4 className="font-bold text-gray-900 mb-3 flex items-center text-lg">
                    <span className="mr-2">📖</span> Deskripsi Project
                  </h4>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{selectedProjectDetail.description}</p>
                </div>
              )}

              {/* Requirements */}
              {selectedProjectDetail.requirements && selectedProjectDetail.requirements.length > 0 && (
                <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-xl p-5 border-2 border-red-200">
                  <h4 className="font-bold text-red-900 mb-3 flex items-center text-lg">
                    <span className="mr-2">✅</span> Requirements
                  </h4>
                  <ul className="space-y-2">
                    {selectedProjectDetail.requirements.map((req, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-red-600 font-bold mr-2">•</span>
                        <span className="text-red-900">{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-6 py-4 rounded-b-2xl border-t border-gray-200">
              <button
                onClick={() => setSelectedProjectDetail(null)}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
}