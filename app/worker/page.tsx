'use client';

import { useState } from 'react';
import Header from './components/Header';
import ProjectCard from './components/ProjectCard';
import ProjectModal from './components/ProjectModal';
import { useWorkerData } from './hooks/useWorkerData';

export default function WorkerDashboard() {
  const {
    projects = [],
    workerInfo,
    isLoading,
    handleProjectAction,
    handleLogout,
    refreshData
  } = useWorkerData();

  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [showProjectModal, setShowProjectModal] = useState(false);

  const openProjectDetail = (project: any) => {
    setSelectedProject(project);
    setShowProjectModal(true);
  };

  const closeProjectModal = () => {
    setShowProjectModal(false);
    setSelectedProject(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-900/20 border-t-blue-900"></div>
          <p className="text-blue-900/70 font-medium">Memuat dashboard worker...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50">
      <Header
        onLogout={handleLogout}
        workerInfo={workerInfo}
      />

      <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6">
        {/* Page Header */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 px-4 py-3 sm:px-6 sm:py-4 mb-4 sm:mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
              <button
                onClick={() => window.location.href = '/'}
                className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold text-sm sm:text-base transition-colors"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span className="hidden sm:inline">Kembali ke Dashboard</span>
                <span className="sm:hidden">Kembali</span>
              </button>
              <div className="h-6 w-px bg-gray-300 hidden sm:block"></div>
              <h1 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 truncate">
                Dashboard Worker
              </h1>
            </div>
            <div className="flex-shrink-0">
              <img src="/betriclogoblue.png" alt="BETRIC" className="h-6 sm:h-8 w-auto" />
            </div>
          </div>
        </div>

        {/* Welcome Section */}
        <div className="mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
            <div className="flex-1 min-w-0">
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-blue-900 mb-1">
                Selamat Datang, {workerInfo?.full_name || 'Worker'}! 👋
              </h2>
              <p className="text-blue-700/70 text-sm sm:text-base">
                Kelola SPK dan pantau progress project Anda
                {workerInfo?.email && (
                  <span className="font-medium text-blue-800 block sm:inline mt-1 sm:mt-0"> ({workerInfo.email})</span>
                )}
              </p>
            </div>
            <button
              onClick={() => refreshData(true)}
              className="bg-linear-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-4 py-2.5 sm:px-5 sm:py-3 rounded-xl font-semibold transition-all duration-300 shadow-md hover:shadow-lg hover:scale-105 flex items-center justify-center space-x-2 whitespace-nowrap shrink-0"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span className="text-sm sm:text-base">Refresh</span>
            </button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4 mb-4 sm:mb-6">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-blue-200 shadow-sm">
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-blue-900">{projects.length}</div>
              <div className="text-blue-700/70 text-xs sm:text-sm font-medium mt-1">Total SPK</div>
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-emerald-200 shadow-sm">
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-emerald-700">
                {projects.filter(p => p.status === 'ACTIVE').length}
              </div>
              <div className="text-emerald-600/70 text-xs sm:text-sm font-medium mt-1">Active</div>
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-amber-200 shadow-sm">
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-amber-700">
                {projects.filter(p => p.status === 'WAITING_WORKER_APPROVAL').length}
              </div>
              <div className="text-amber-600/70 text-xs sm:text-sm font-medium mt-1">Pending</div>
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-green-200 shadow-sm">
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-green-700">
                {projects.filter(p => p.status === 'DONE_ON_TIME' || p.status === 'DONE_LATE').length}
              </div>
              <div className="text-green-600/70 text-xs sm:text-sm font-medium mt-1">Completed</div>
            </div>
          </div>
        </div>

        {/* Projects Section */}
        <div className="w-full">
          <div className="bg-white/60 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-6 border border-blue-200 shadow-md">
            <h2 className="text-base sm:text-lg lg:text-xl font-bold text-blue-900 mb-3 sm:mb-4 lg:mb-6">
              SPK Diterima ({projects.length})
            </h2>

            <div className="space-y-3 sm:space-y-4">
              {projects.length === 0 ? (
                <div className="text-center py-8 sm:py-10 lg:py-12">
                  <div className="bg-blue-100 rounded-full w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center mx-auto mb-3 sm:mb-4">
                    <span className="text-2xl sm:text-3xl">📋</span>
                  </div>
                  <p className="text-blue-700/70 font-medium text-sm sm:text-base lg:text-lg">Belum ada SPK</p>
                  <p className="text-blue-600/50 text-xs sm:text-sm mt-1 px-4">SPK akan muncul di sini setelah admin mengirimkannya</p>
                </div>
              ) : (
                projects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    onViewDetail={openProjectDetail}
                    onAction={handleProjectAction}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </main>

      <ProjectModal
        project={selectedProject}
        isOpen={showProjectModal}
        onClose={closeProjectModal}
      />
    </div>
  );
}