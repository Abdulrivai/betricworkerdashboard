'use client';

import { getStatusText, formatCurrency, formatDate, formatDateTime } from './../utils/helpers';

interface Project {
  id: string;
  title: string;
  description: string;
  project_value: number;
  status: string;
  deadline: string;
  created_at: string;
  requirements?: string[];
}

interface ProjectModalProps {
  project: Project | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ProjectModal({ project, isOpen, onClose }: ProjectModalProps) {
  if (!isOpen || !project) return null;

  const getStatusColor = () => {
    switch(project.status) {
      case 'WAITING_WORKER_APPROVAL': return 'bg-gradient-to-r from-amber-500 to-orange-500';
      case 'ACTIVE': return 'bg-gradient-to-r from-blue-500 to-blue-600';
      case 'COMPLETION_REQUESTED': return 'bg-gradient-to-r from-purple-500 to-purple-600';
      case 'DONE_ON_TIME': return 'bg-gradient-to-r from-green-500 to-emerald-600';
      case 'DONE_LATE': return 'bg-gradient-to-r from-red-500 to-red-600';
      default: return 'bg-gradient-to-r from-gray-500 to-gray-600';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4">
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-3xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-4 sm:px-6 sm:py-5">
          <div className="flex justify-between items-start">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="text-lg sm:text-xl font-bold text-white">Detail SPK</h3>
              </div>
              <span className={`inline-flex items-center px-3 py-1 sm:px-4 sm:py-1.5 rounded-full text-white font-semibold text-xs shadow-md ${getStatusColor()}`}>
                <div className="w-1.5 h-1.5 bg-white rounded-full mr-1.5 animate-pulse"></div>
                {getStatusText(project.status)}
              </span>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-all flex-shrink-0 ml-2"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-5">
          {/* Project Title */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 sm:p-5 border border-blue-200">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-600 rounded-lg">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-blue-600 text-xs sm:text-sm font-bold uppercase tracking-wide mb-1">Judul Project</h4>
                <p className="text-blue-900 font-bold text-base sm:text-lg break-words">{project.title}</p>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 sm:p-5 border border-purple-200">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-purple-600 rounded-lg">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-purple-600 text-xs sm:text-sm font-bold uppercase tracking-wide mb-1">Deskripsi Project</h4>
                <p className="text-purple-900 leading-relaxed text-sm sm:text-base">{project.description}</p>
              </div>
            </div>
          </div>

          {/* Value & Deadline Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl p-4 border border-emerald-200">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h4 className="text-emerald-600 text-xs font-bold uppercase tracking-wide">Nilai Project</h4>
              </div>
              <p className="text-emerald-900 font-bold text-lg sm:text-xl">
                {formatCurrency(project.project_value)}
              </p>
            </div>
            <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-4 border border-orange-200">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <h4 className="text-orange-600 text-xs font-bold uppercase tracking-wide">Deadline</h4>
              </div>
              <p className="text-orange-900 font-bold text-base sm:text-lg">
                {formatDate(project.deadline)}
              </p>
            </div>
          </div>

          {/* Requirements */}
          {project.requirements && project.requirements.length > 0 && (
            <div className="bg-gradient-to-br from-slate-50 to-gray-50 rounded-xl p-4 sm:p-5 border border-gray-200">
              <div className="flex items-center gap-2 mb-3 sm:mb-4">
                <div className="p-2 bg-gray-700 rounded-lg">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                </div>
                <h4 className="text-gray-700 text-xs sm:text-sm font-bold uppercase tracking-wide">Requirements & Spesifikasi</h4>
              </div>
              <ul className="space-y-2 sm:space-y-3">
                {project.requirements.map((req, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <span className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 shadow-md">
                      {index + 1}
                    </span>
                    <span className="text-gray-700 leading-relaxed text-sm sm:text-base flex-1">{req}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Timestamps */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-xl p-4 border border-cyan-200">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h4 className="text-cyan-600 text-xs font-bold uppercase tracking-wide">SPK Diterima</h4>
              </div>
              <p className="text-cyan-900 font-semibold text-sm sm:text-base">
                {formatDateTime(project.created_at)}
              </p>
            </div>
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-4 border border-indigo-200">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h4 className="text-indigo-600 text-xs font-bold uppercase tracking-wide">Status Saat Ini</h4>
              </div>
              <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold text-white shadow-md ${getStatusColor()}`}>
                {getStatusText(project.status)}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:px-6 sm:py-4 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50">
          <button
            onClick={onClose}
            className="w-full sm:w-auto sm:ml-auto flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-5 py-2.5 sm:px-6 sm:py-3 rounded-lg sm:rounded-xl font-bold text-sm sm:text-base transition-all duration-200 shadow-md hover:shadow-lg"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span>Tutup Detail</span>
          </button>
        </div>
      </div>
    </div>
  );
}