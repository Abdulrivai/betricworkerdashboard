'use client';

import { useState, useMemo } from 'react';

interface Project {
  id: string;
  title: string;
  status: string;
  worker: { 
    id: string;
    full_name: string; 
    email: string; 
  } | null;
  deadline: string;
  project_value: number;
  description: string;
  requirements: string[];
  created_at: string;
}

interface ProjectTableProps {
  projects: Project[];
  onEdit: (project: Project) => void;
  onExtend: (project: Project) => void;
  onDetail: (project: Project) => void;
  onDelete: (projectId: string, projectTitle: string) => void;
  onSendSPK: (projectId: string) => void;
}

export default function ProjectTable({ 
  projects, 
  onEdit, 
  onExtend, 
  onDetail, 
  onDelete, 
  onSendSPK 
}: ProjectTableProps) {
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const getStatusBadge = (status: string) => {
    const statusColors = {
      'DRAFT_SPK': 'bg-yellow-500/20 text-yellow-800 border-yellow-500/30',
      'WAITING_WORKER_APPROVAL': 'bg-blue-500/20 text-blue-800 border-blue-500/30',
      'ACTIVE': 'bg-green-500/20 text-green-800 border-green-500/30',
      'REJECTED_BY_WORKER': 'bg-red-500/20 text-red-800 border-red-500/30',
      'COMPLETION_REQUESTED': 'bg-purple-500/20 text-purple-800 border-purple-500/30',
      'DONE_ON_TIME': 'bg-emerald-500/20 text-emerald-800 border-emerald-500/30',
      'DONE_LATE': 'bg-orange-500/20 text-orange-800 border-orange-500/30'
    };
    return statusColors[status as keyof typeof statusColors] || 'bg-gray-500/20 text-gray-800 border-gray-500/30';
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'DRAFT_SPK': return 'Draft SPK';
      case 'WAITING_WORKER_APPROVAL': return 'Menunggu Approval';
      case 'ACTIVE': return 'Sedang Dikerjakan';
      case 'REJECTED_BY_WORKER': return 'Ditolak Worker';
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
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  // Filter dan search logic
  const filteredProjects = useMemo(() => {
    let filtered = projects;

    // Filter by status
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(project => project.status === statusFilter);
    }

    // Search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(project =>
        project.title.toLowerCase().includes(searchLower) ||
        project.description.toLowerCase().includes(searchLower) ||
        project.worker?.full_name?.toLowerCase().includes(searchLower) ||
        project.worker?.email?.toLowerCase().includes(searchLower) ||
        getStatusText(project.status).toLowerCase().includes(searchLower) ||
        formatCurrency(project.project_value).toLowerCase().includes(searchLower)
      );
    }

    return filtered;
  }, [projects, searchTerm, statusFilter]);

  const getSelectedProjectData = () => {
    return filteredProjects.find(p => p.id === selectedProject);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('ALL');
    setSelectedProject(null);
  };

  // Status options untuk filter
  const statusOptions = [
    { value: 'ALL', label: 'Semua Status', count: projects.length },
    { value: 'DRAFT_SPK', label: 'Draft SPK', count: projects.filter(p => p.status === 'DRAFT_SPK').length },
    { value: 'WAITING_WORKER_APPROVAL', label: 'Menunggu Approval', count: projects.filter(p => p.status === 'WAITING_WORKER_APPROVAL').length },
    { value: 'ACTIVE', label: 'Sedang Dikerjakan', count: projects.filter(p => p.status === 'ACTIVE').length },
    { value: 'REJECTED_BY_WORKER', label: 'Ditolak Worker', count: projects.filter(p => p.status === 'REJECTED_BY_WORKER').length },
    { value: 'COMPLETION_REQUESTED', label: 'Request Selesai', count: projects.filter(p => p.status === 'COMPLETION_REQUESTED').length },
    { value: 'DONE_ON_TIME', label: 'Selesai Tepat Waktu', count: projects.filter(p => p.status === 'DONE_ON_TIME').length },
    { value: 'DONE_LATE', label: 'Selesai Terlambat', count: projects.filter(p => p.status === 'DONE_LATE').length }
  ].filter(option => option.count > 0 || option.value === 'ALL');

  return (
    <div className="space-y-6">
      {/* Search & Filter Panel */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-blue-900/10 shadow-lg p-6">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-end">
          {/* Search Input */}
          <div className="flex-1 w-full md:w-auto">
            <label className="block text-blue-800 text-sm font-semibold mb-2">
            Cari Project
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari berdasarkan nama project, deskripsi, worker, atau status..."
                className="w-full bg-blue-50/50 border border-blue-200 rounded-xl px-4 py-3 pl-12 text-blue-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all"
              />
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-blue-500">
                🔍
              </div>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-500 hover:text-blue-700 text-xl"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Status Filter */}
          <div className="w-full md:w-64">
            <label className="block text-blue-800 text-sm font-semibold mb-2">
            Filter Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-blue-50/50 border border-blue-200 rounded-xl px-4 py-3 text-blue-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all"
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label} ({option.count})
                </option>
              ))}
            </select>
          </div>

          {/* Clear Filters Button */}
          {(searchTerm || statusFilter !== 'ALL') && (
            <button
              onClick={clearFilters}
              className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-md hover:shadow-lg flex items-center space-x-2 whitespace-nowrap"
            >
              <span>🔄</span>
              <span>Reset Filter</span>
            </button>
          )}
        </div>

        {/* Search Results Info */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
          <div className="text-blue-700/70 text-sm">
            {filteredProjects.length === projects.length ? (
              <span>Menampilkan <strong>{projects.length}</strong> project</span>
            ) : (
              <span>
                Menampilkan <strong>{filteredProjects.length}</strong> dari <strong>{projects.length}</strong> project
                {searchTerm && <span> dengan kata kunci "<strong>{searchTerm}</strong>"</span>}
                {statusFilter !== 'ALL' && <span> dengan status "<strong>{statusOptions.find(s => s.value === statusFilter)?.label}</strong>"</span>}
              </span>
            )}
          </div>
          
          {selectedProject && (
            <div className="text-blue-600 text-sm font-medium bg-blue-50 px-3 py-1 rounded-lg">
              ✓ 1 project dipilih
            </div>
          )}
        </div>
      </div>

      {/* Tabel */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-blue-900/10 shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-blue-900/5">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-blue-900 uppercase tracking-wider">
                  Select
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-blue-900 uppercase tracking-wider">
                  Project
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-blue-900 uppercase tracking-wider">
                  Worker
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-blue-900 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-blue-900 uppercase tracking-wider">
                  Nilai
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-blue-900 uppercase tracking-wider">
                  Deadline
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-blue-900/5">
              {filteredProjects.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="text-4xl mb-4">🔍</div>
                    <h3 className="text-lg font-semibold text-blue-900 mb-2">
                      {searchTerm || statusFilter !== 'ALL' ? 'Tidak ada project yang cocok' : 'Belum ada project'}
                    </h3>
                    <p className="text-blue-700/70 mb-4">
                      {searchTerm || statusFilter !== 'ALL' 
                        ? 'Coba ubah kata kunci pencarian atau filter status' 
                        : 'Mulai dengan membuat project pertama'
                      }
                    </p>
                    {(searchTerm || statusFilter !== 'ALL') && (
                      <button
                        onClick={clearFilters}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-all"
                      >
                        Reset Filter
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                filteredProjects.map((project) => (
                  <tr 
                    key={project.id} 
                    className={`cursor-pointer transition-colors ${
                      selectedProject === project.id 
                        ? 'bg-blue-100/50 border-l-4 border-l-blue-500' 
                        : 'hover:bg-blue-50/50'
                    }`}
                    onClick={() => setSelectedProject(selectedProject === project.id ? null : project.id)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <input
                          type="radio"
                          name="selectedProject"
                          checked={selectedProject === project.id}
                          onChange={() => setSelectedProject(project.id)}
                          className="w-4 h-4 text-blue-600 border-blue-300 focus:ring-blue-500"
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-blue-900 font-semibold">{project.title}</div>
                        <div className="text-blue-700/70 text-sm mt-1 max-w-xs truncate">
                          {project.description}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-blue-900">
                        {project.worker?.full_name || 'Belum ditugaskan'}
                      </div>
                      {project.worker?.email && (
                        <div className="text-blue-700/70 text-sm mt-1">
                          {project.worker.email}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full border ${getStatusBadge(project.status)}`}>
                        {getStatusText(project.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-blue-900 font-semibold">
                        {formatCurrency(project.project_value)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-blue-900">
                        {formatDate(project.deadline)}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Action Panel */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-blue-900/10 shadow-lg p-6">
        {selectedProject ? (
          <div className="space-y-4">
            {/* Selected Project Info */}
            <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100">
              <h3 className="font-semibold text-blue-900 mb-2 flex items-center space-x-2">
                <span>📋</span>
                <span>Project Terpilih:</span>
              </h3>
              <div className="text-blue-800">
                <div className="font-medium">{getSelectedProjectData()?.title}</div>
                <div className="text-sm text-blue-700/70 mt-1">
                  Status: {getStatusText(getSelectedProjectData()?.status || '')}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              {/* Kirim SPK - hanya jika status DRAFT_SPK */}
              {getSelectedProjectData()?.status === 'DRAFT_SPK' && (
                <button
                  onClick={() => {
                    onSendSPK(selectedProject);
                    setSelectedProject(null);
                  }}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-md hover:shadow-lg flex items-center space-x-2"
                >
                  <span>📤</span>
                  <span>Kirim SPK</span>
                </button>
              )}

              {/* Detail */}
              <button
                onClick={() => {
                  const project = getSelectedProjectData();
                  if (project) onDetail(project);
                }}
                className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-md hover:shadow-lg flex items-center space-x-2"
              >
                <span>👁️</span>
                <span>Lihat Detail</span>
              </button>

              {/* Edit */}
              <button
                onClick={() => {
                  const project = getSelectedProjectData();
                  if (project) onEdit(project);
                }}
                className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-md hover:shadow-lg flex items-center space-x-2"
              >
                <span>✏️</span>
                <span>Edit Project</span>
              </button>

              {/* Perpanjang Deadline */}
              <button
                onClick={() => {
                  const project = getSelectedProjectData();
                  if (project) onExtend(project);
                }}
                className="bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-md hover:shadow-lg flex items-center space-x-2"
              >
                <span>📅</span>
                <span>Perpanjang Deadline</span>
              </button>

              {/* Delete */}
              <button
                onClick={() => {
                  const project = getSelectedProjectData();
                  if (project) {
                    onDelete(project.id, project.title);
                    setSelectedProject(null);
                  }
                }}
                className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-md hover:shadow-lg flex items-center space-x-2"
              >
                <span>🗑️</span>
                <span>Hapus Project</span>
              </button>

              {/* Clear Selection */}
              <button
                onClick={() => setSelectedProject(null)}
                className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-md hover:shadow-lg flex items-center space-x-2"
              >
                <span>✕</span>
                <span>Batal Pilih</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">👆</div>
            <h3 className="text-lg font-semibold text-blue-900 mb-2">Pilih Project</h3>
            <p className="text-blue-700/70">
              Pilih salah satu project dari tabel di atas untuk melihat actions yang tersedia
            </p>
          </div>
        )}
      </div>
    </div>
  );
}