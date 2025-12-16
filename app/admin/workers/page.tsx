'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Swal from 'sweetalert2';

interface WorkerHistory {
  id: string;
  title: string;
  status: string;
  project_value: number;
  deadline: string;
  completed_at?: string;
  created_at: string;
}

interface Worker {
  id: string;
  full_name: string;
  email: string;
  role: string;
  created_at: string;
  total_projects: number;
  completed_projects: number;
  active_projects: number;
  total_earnings: number;
  history: WorkerHistory[];
}

export default function WorkersPage() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [filteredWorkers, setFilteredWorkers] = useState<Worker[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchWorkers();
  }, []);

  useEffect(() => {
    filterWorkers();
  }, [workers, searchQuery]);

  const filterWorkers = () => {
    let filtered = workers;

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(worker =>
        worker.full_name.toLowerCase().includes(query) ||
        worker.email.toLowerCase().includes(query) ||
        worker.id.toLowerCase().includes(query)
      );
    }

    setFilteredWorkers(filtered);
  };

  const fetchWorkers = async () => {
    try {
      console.log('🔄 Fetching workers data...');
      const response = await fetch('/api/workers-detailed');
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Workers data received:', data);
        setWorkers(data.workers || []);
      } else {
        console.error('Failed to fetch workers:', response.status);
        const error = await response.json();
        console.error('Error details:', error);
        await Swal.fire({
          title: '❌ Gagal Memuat Data',
          text: 'Gagal memuat data workers',
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
      console.error('Error fetching workers:', error);
      await Swal.fire({
        title: '❌ Terjadi Kesalahan',
        text: 'Terjadi kesalahan saat memuat data',
        icon: 'error',
        confirmButtonColor: '#dc2626',
        confirmButtonText: 'OK',
        customClass: {
          popup: 'rounded-2xl',
          confirmButton: 'rounded-xl px-6 py-3'
        }
      });
    } finally {
      setIsLoading(false);
    }
  };

  const openHistoryModal = (worker: Worker) => {
    setSelectedWorker(worker);
    setShowHistoryModal(true);
  };

  const getStatusBadge = (status: string) => {
    const statusColors = {
      'DRAFT_SPK': 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
      'WAITING_WORKER_APPROVAL': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      'ACTIVE': 'bg-green-500/20 text-green-300 border-green-500/30',
      'REJECTED_BY_WORKER': 'bg-red-500/20 text-red-300 border-red-500/30',
      'COMPLETION_REQUESTED': 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      'DONE_ON_TIME': 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      'DONE_LATE': 'bg-orange-500/20 text-orange-300 border-orange-500/30'
    };

    return statusColors[status as keyof typeof statusColors] || 'bg-gray-500/20 text-gray-300 border-gray-500/30';
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'DRAFT_SPK': return 'Draft SPK';
      case 'WAITING_WORKER_APPROVAL': return 'Menunggu Approval';
      case 'ACTIVE': return 'Sedang Dikerjakan';
      case 'REJECTED_BY_WORKER': return 'Ditolak';
      case 'COMPLETION_REQUESTED': return 'Request Selesai';
      case 'DONE_ON_TIME': return 'Selesai Tepat Waktu';
      case 'DONE_LATE': return 'Selesai Terlambat';
      default: return status.replace(/_/g, ' ');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { 
      style: 'currency', 
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getPerformanceColor = (completedProjects: number, totalProjects: number) => {
    if (totalProjects === 0) return 'text-gray-400';
    const rate = completedProjects / totalProjects;
    if (rate >= 0.8) return 'text-green-400';
    if (rate >= 0.6) return 'text-yellow-400';
    return 'text-red-400';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-900/20 border-t-blue-900"></div>
          <p className="text-blue-900/70 font-medium">Memuat data workers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-blue-900/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/admin" className="text-blue-700 hover:text-blue-900 font-medium transition-colors">
                ← Dashboard
              </Link>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-purple-500 rounded-xl flex items-center justify-center shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-blue-900">Kelola Workers</h1>
                  <p className="text-blue-700/70 text-xs font-medium">Monitor Performa & History</p>
                </div>
              </div>
            </div>
            
            <div className="text-right">
              <p className="text-blue-900 text-sm font-semibold">
                {searchQuery ? `${filteredWorkers.length} dari ${workers.length}` : workers.length} Workers
              </p>
              <p className="text-blue-700/70 text-xs">
                {searchQuery ? 'Hasil pencarian' : 'Terdaftar di sistem'}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-blue-900/10 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-700/80 text-sm font-medium">Total Workers</p>
                <p className="text-2xl font-bold text-blue-900">{workers.length}</p>
              </div>
              <div className="bg-purple-500/10 p-3 rounded-xl">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-green-500/20 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-700/80 text-sm font-medium">Active Workers</p>
                <p className="text-2xl font-bold text-green-800">
                  {workers.filter(w => w.active_projects > 0).length}
                </p>
              </div>
              <div className="bg-green-500/10 p-3 rounded-xl">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-emerald-500/20 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-700/80 text-sm font-medium">Total Earnings</p>
                <p className="text-2xl font-bold text-emerald-800">
                  {formatCurrency(workers.reduce((sum, w) => sum + w.total_earnings, 0))}
                </p>
              </div>
              <div className="bg-emerald-500/10 p-3 rounded-xl">
                <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-blue-900/10 shadow-lg p-4 mb-6">
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

        {/* Workers Table */}
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-blue-900/10 shadow-lg overflow-hidden">
          <div className="p-6 border-b border-blue-900/10">
            <h2 className="text-xl font-bold text-blue-900">Daftar Workers</h2>
            <p className="text-blue-700/70 text-sm mt-1">Kelola dan monitor performa workers</p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-blue-900/5">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-blue-900/80 uppercase tracking-wider">
                    Worker Info
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-blue-900/80 uppercase tracking-wider">
                    Performance
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-blue-900/80 uppercase tracking-wider">
                    Earnings
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-blue-900/80 uppercase tracking-wider">
                    Bergabung
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-blue-900/80 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-blue-900/10">
                {filteredWorkers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center">
                        <div className="bg-blue-900/5 rounded-full w-16 h-16 flex items-center justify-center mb-4">
                          <svg className="w-8 h-8 text-blue-900/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                        </div>
                        <p className="text-blue-900/50 font-medium">
                          {searchQuery ? 'Tidak ada worker yang sesuai dengan pencarian' : 'Belum ada workers terdaftar'}
                        </p>
                        <p className="text-blue-700/40 text-sm mt-1">
                          {searchQuery ? 'Coba gunakan kata kunci yang berbeda' : 'Workers akan muncul setelah registrasi'}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredWorkers.map((worker) => (
                    <tr key={worker.id} className="hover:bg-blue-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                            {worker.full_name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-blue-900 font-medium">{worker.full_name}</div>
                            <div className="text-blue-700/60 text-sm">{worker.email}</div>
                            <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 border border-blue-200 mt-1">
                              {worker.role}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-blue-700/70 text-sm">Total Projects:</span>
                            <span className="text-blue-900 font-medium">{worker.total_projects}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-blue-700/70 text-sm">Completed:</span>
                            <span className={`font-medium ${getPerformanceColor(worker.completed_projects, worker.total_projects)}`}>
                              {worker.completed_projects}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-blue-700/70 text-sm">Active:</span>
                            <span className="text-green-600 font-medium">{worker.active_projects}</span>
                          </div>
                          {worker.total_projects > 0 && (
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${(worker.completed_projects / worker.total_projects) * 100}%` }}
                              ></div>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-emerald-700 font-semibold text-lg">
                          {formatCurrency(worker.total_earnings)}
                        </div>
                        <div className="text-blue-700/60 text-xs">
                          Total dari {worker.completed_projects} project
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-blue-900 text-sm font-medium">
                          {new Date(worker.created_at).toLocaleDateString('id-ID', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </div>
                        <div className="text-blue-700/60 text-xs">
                          {Math.floor((Date.now() - new Date(worker.created_at).getTime()) / (1000 * 60 * 60 * 24))} hari yang lalu
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col space-y-2">
                          <button
                            onClick={() => openHistoryModal(worker)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 text-sm rounded-lg transition-colors font-medium shadow-sm hover:shadow-md"
                          >
                            📊 Lihat History
                          </button>
                          <Link href={`/worker?worker_id=${worker.id}`} target="_blank">
                            <button className="w-full bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 text-sm rounded-lg transition-colors font-medium shadow-sm hover:shadow-md">
                              👁️ View Dashboard
                            </button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* History Modal */}
      {showHistoryModal && selectedWorker && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-blue-200 shadow-2xl p-6 w-full max-w-5xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-2xl font-bold text-blue-900">Project History</h3>
                <p className="text-blue-700/70 text-lg">{selectedWorker.full_name}</p>
                <p className="text-blue-600/60 text-sm">{selectedWorker.email}</p>
              </div>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="text-blue-400 hover:text-blue-600 text-2xl font-bold p-2 rounded-full hover:bg-blue-50 transition-all"
              >
                ✕
              </button>
            </div>
            
            {/* Worker Stats Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 p-4 bg-blue-50/50 rounded-xl">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-900">{selectedWorker.total_projects}</div>
                <div className="text-blue-700/70 text-sm">Total Projects</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{selectedWorker.completed_projects}</div>
                <div className="text-blue-700/70 text-sm">Completed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{selectedWorker.active_projects}</div>
                <div className="text-blue-700/70 text-sm">Active</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-emerald-600">{formatCurrency(selectedWorker.total_earnings)}</div>
                <div className="text-blue-700/70 text-sm">Total Earnings</div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-blue-900 border-b border-blue-200 pb-2">
                Riwayat Projects ({selectedWorker.history.length})
              </h4>
              
              {selectedWorker.history && selectedWorker.history.length > 0 ? (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {selectedWorker.history.map((project) => (
                    <div key={project.id} className="bg-white border border-blue-200 rounded-xl p-4 hover:shadow-md transition-all">
                      <div className="flex justify-between items-start mb-3">
                        <h5 className="text-blue-900 font-medium text-lg">{project.title}</h5>
                        <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full border ${getStatusBadge(project.status)}`}>
                          {getStatusText(project.status)}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-blue-600/70 font-medium">Nilai Project:</span>
                          <div className="text-emerald-600 font-semibold">
                            {formatCurrency(project.project_value)}
                          </div>
                        </div>
                        <div>
                          <span className="text-blue-600/70 font-medium">Deadline:</span>
                          <div className="text-blue-900">
                            {new Date(project.deadline).toLocaleDateString('id-ID')}
                          </div>
                        </div>
                        <div>
                          <span className="text-blue-600/70 font-medium">Mulai:</span>
                          <div className="text-blue-900">
                            {new Date(project.created_at).toLocaleDateString('id-ID')}
                          </div>
                        </div>
                        {project.completed_at && (
                          <div>
                            <span className="text-blue-600/70 font-medium">Selesai:</span>
                            <div className="text-blue-900">
                              {new Date(project.completed_at).toLocaleDateString('id-ID')}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <p className="text-blue-700/50 font-medium">Belum ada history project</p>
                  <p className="text-blue-600/40 text-sm mt-1">Project akan muncul setelah worker menerima SPK</p>
                </div>
              )}
            </div>
            
            <div className="flex justify-end mt-6 pt-4 border-t border-blue-200">
              <button
                onClick={() => setShowHistoryModal(false)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-all shadow-md hover:shadow-lg"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}