'use client';

import { getStatusText, formatCurrency, formatDate } from './../utils/helpers';

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

interface ProjectCardProps {
  project: Project;
  onViewDetail: (project: Project) => void;
  onAction: (projectId: string, action: 'ACCEPT' | 'REJECT' | 'COMPLETE') => void;
}

export default function ProjectCard({ project, onViewDetail, onAction }: ProjectCardProps) {
  const isDeadlineSoon = () => {
    const deadline = new Date(project.deadline);
    const now = new Date();
    const diffDays = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays <= 3 && diffDays > 0;
  };

  const isOverdue = () => {
    const deadline = new Date(project.deadline);
    const now = new Date();
    return now > deadline;
  };

  // Get status color
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
    <div className="group bg-white rounded-xl sm:rounded-2xl border border-blue-100 shadow-md hover:shadow-xl sm:hover:shadow-2xl transition-all duration-300 overflow-hidden hover:-translate-y-0.5 sm:hover:-translate-y-1">
      {/* Header Section with Status */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-3 sm:px-6 sm:py-4 border-b border-blue-100">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-2 sm:mb-3">
          <span className={`inline-flex items-center px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-white font-semibold text-xs shadow-md w-fit ${getStatusColor()}`}>
            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full mr-1.5 sm:mr-2 animate-pulse"></div>
            {getStatusText(project.status)}
          </span>

          {(isDeadlineSoon() || isOverdue()) && (
            <span className={`inline-flex items-center px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full text-xs font-bold shadow-md w-fit ${
              isOverdue()
                ? 'bg-gradient-to-r from-red-500 to-red-600 text-white'
                : 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white'
            }`}>
              {isOverdue() ? '⚠️ Overdue' : '⏰ Deadline Soon'}
            </span>
          )}
        </div>

        <h3 className="text-blue-900 font-bold text-base sm:text-lg lg:text-xl group-hover:text-blue-700 transition-colors line-clamp-2">
          {project.title}
        </h3>
      </div>

      {/* Content Section */}
      <div className="p-4 sm:p-5 lg:p-6 space-y-3 sm:space-y-4 lg:space-y-5">
        {/* Project Value */}
        <div className="flex items-center justify-between p-3 sm:p-4 bg-gradient-to-r from-emerald-50 to-green-50 rounded-lg sm:rounded-xl border border-emerald-200">
          <span className="text-emerald-700 font-semibold text-xs sm:text-sm">Nilai Project</span>
          <span className="text-emerald-900 font-bold text-base sm:text-lg lg:text-xl">{formatCurrency(project.project_value)}</span>
        </div>

        {/* Description */}
        <p className="text-gray-600 text-xs sm:text-sm leading-relaxed line-clamp-2">
          {project.description}
        </p>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          <div className="p-2.5 sm:p-3 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg sm:rounded-xl border border-blue-200">
            <div className="flex items-center mb-1 sm:mb-1.5">
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 sm:mr-1.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-xs font-semibold uppercase text-blue-600">Deadline</span>
            </div>
            <div className={`font-bold text-xs sm:text-sm ${
              isOverdue() ? 'text-red-600' : isDeadlineSoon() ? 'text-orange-600' : 'text-blue-900'
            }`}>
              {formatDate(project.deadline)}
            </div>
          </div>

          <div className="p-2.5 sm:p-3 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg sm:rounded-xl border border-purple-200">
            <div className="flex items-center mb-1 sm:mb-1.5">
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 sm:mr-1.5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-xs font-semibold uppercase text-purple-600">Diterima</span>
            </div>
            <div className="text-purple-900 font-bold text-xs sm:text-sm">
              {formatDate(project.created_at)}
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="px-4 pb-4 sm:px-6 sm:pb-6">
        <div className="flex flex-col gap-2 sm:gap-3">
          <button
            onClick={() => onViewDetail(project)}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-4 py-2.5 sm:px-5 sm:py-3 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 flex items-center justify-center gap-1.5 sm:gap-2 shadow-md hover:shadow-lg"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <span>Detail SPK</span>
          </button>

          {project.status === 'WAITING_WORKER_APPROVAL' && (
            <>
              <button
                onClick={() => onAction(project.id, 'ACCEPT')}
                className="w-full bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white px-4 py-2.5 sm:px-5 sm:py-3 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 flex items-center justify-center gap-1.5 sm:gap-2 shadow-md hover:shadow-lg"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Terima SPK</span>
              </button>
              <button
                onClick={() => onAction(project.id, 'REJECT')}
                className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-4 py-2.5 sm:px-5 sm:py-3 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 flex items-center justify-center gap-1.5 sm:gap-2 shadow-md hover:shadow-lg"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span>Tolak SPK</span>
              </button>
            </>
          )}

          {project.status === 'ACTIVE' && (
            <button
              onClick={() => onAction(project.id, 'COMPLETE')}
              className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-4 py-2.5 sm:px-5 sm:py-3 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 flex items-center justify-center gap-1.5 sm:gap-2 shadow-md hover:shadow-lg"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Request Selesai</span>
            </button>
          )}

          {project.status === 'COMPLETION_REQUESTED' && (
            <div className="w-full bg-gradient-to-r from-purple-50 to-pink-50 text-purple-900 px-4 py-2.5 sm:px-5 sm:py-3 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 sm:gap-2 border-2 border-purple-200 shadow-md">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Menunggu Approval Admin</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}