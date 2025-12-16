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
    handleLogout
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

      <main className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-6">
        {/* Welcome Section */}
        <div className="mb-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-blue-900 mb-1">
            Selamat Datang, {workerInfo?.full_name || 'Worker'}! 👋
          </h2>
          <p className="text-blue-700/70 text-base sm:text-lg">
            Kelola SPK dan pantau progress project Anda
            {workerInfo?.email && (
              <span className="font-medium text-blue-800"> ({workerInfo.email})</span>
            )}
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-blue-200 shadow">
            <div className="text-center">
              <div className="text-xl sm:text-2xl font-bold text-blue-900">{projects.length}</div>
              <div className="text-blue-700/70 text-xs sm:text-sm font-medium">Total SPK</div>
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-emerald-200 shadow">
            <div className="text-center">
              <div className="text-xl sm:text-2xl font-bold text-emerald-700">
                {projects.filter(p => p.status === 'ACTIVE').length}
              </div>
              <div className="text-emerald-600/70 text-xs sm:text-sm font-medium">Active</div>
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-amber-200 shadow">
            <div className="text-center">
              <div className="text-xl sm:text-2xl font-bold text-amber-700">
                {projects.filter(p => p.status === 'WAITING_WORKER_APPROVAL').length}
              </div>
              <div className="text-amber-600/70 text-xs sm:text-sm font-medium">Pending</div>
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-green-200 shadow">
            <div className="text-center">
              <div className="text-xl sm:text-2xl font-bold text-green-700">
                {projects.filter(p => p.status === 'DONE_ON_TIME' || p.status === 'DONE_LATE').length}
              </div>
              <div className="text-green-600/70 text-xs sm:text-sm font-medium">Completed</div>
            </div>
          </div>
        </div>

        {/* Projects Section */}
        <div className="w-full flex flex-col gap-6">
          <div className="w-full">
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-blue-200 shadow">
              <h2 className="text-lg sm:text-xl font-bold text-blue-900 mb-4 sm:mb-6">
                SPK Diterima ({projects.length})
              </h2>
              
              <div className="space-y-4">
                {projects.length === 0 ? (
                  <div className="text-center py-10 sm:py-12">
                    <div className="bg-blue-100 rounded-full w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center mx-auto mb-3 sm:mb-4">
                      <span className="text-2xl sm:text-3xl">📋</span>
                    </div>
                    <p className="text-blue-700/70 font-medium text-base sm:text-lg">Belum ada SPK</p>
                    <p className="text-blue-600/50 text-xs sm:text-sm mt-1">SPK akan muncul di sini setelah admin mengirimkannya</p>
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