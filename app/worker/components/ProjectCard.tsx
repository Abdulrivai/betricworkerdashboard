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

  return (
    <div className="bg-blue-800/10 rounded-2xl border-2 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
      {/* Status Header */}
      <div className="px-4 py-3 bg-blue-800">
        <div className="flex justify-between items-center">
          <span className="text-blue-100 font-semibold text-sm">
            {getStatusText(project.status)}
          </span>
          {(isDeadlineSoon() || isOverdue()) && (
            <span className={`text-xs font-medium px-2 py-1 rounded-full ${
              isOverdue() ? 'bg-red-700 text-red-100' : 'bg-yellow-700 text-yellow-100'
            }`}>
              {isOverdue() ? '⚠️ Overdue' : '⏰ Soon'}
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-blue-900 font-bold text-lg leading-tight">{project.title}</h3>
          <div className="ml-4 text-right flex-shrink-0">
            <div className="text-emerald-800 font-bold text-lg">
              {formatCurrency(project.project_value)}
            </div>
          </div>
        </div>
        
        <p className="text-blue-800 text-sm mb-4 line-clamp-2 leading-relaxed">
          {project.description}
        </p>
        
        {/* Project Info */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-blue-800/10 rounded-lg p-3">
            <div className="text-blue-800 text-xs font-medium uppercase tracking-wide">Deadline</div>
            <div className={`font-semibold text-sm mt-1 ${
              isOverdue() ? 'text-red-700' : isDeadlineSoon() ? 'text-yellow-700' : 'text-blue-900'
            }`}>
              {formatDate(project.deadline)}
            </div>
          </div>
          <div className="bg-blue-800/10 rounded-lg p-3">
            <div className="text-blue-800 text-xs font-medium uppercase tracking-wide">Diterima</div>
            <div className="text-blue-900 font-semibold text-sm mt-1">
              {formatDate(project.created_at)}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={() => onViewDetail(project)}
            className="flex-1 bg-blue-800 hover:bg-blue-900 text-blue-100 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 flex items-center justify-center space-x-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <span>Detail SPK</span>
          </button>
          
          {project.status === 'WAITING_WORKER_APPROVAL' && (
            <>
              <button
                onClick={() => onAction(project.id, 'ACCEPT')}
                className="flex-1 bg-emerald-800 hover:bg-emerald-900 text-emerald-100 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 flex items-center justify-center space-x-2 shadow-md hover:shadow-lg"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Terima SPK</span>
              </button>
              <button
                onClick={() => onAction(project.id, 'REJECT')}
                className="flex-1 bg-red-700 hover:bg-red-800 text-red-100 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 flex items-center justify-center space-x-2 shadow-md hover:shadow-lg"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span>Tolak SPK</span>
              </button>
            </>
          )}
          
          {project.status === 'ACTIVE' && (
            <button
              onClick={() => onAction(project.id, 'COMPLETE')}
              className="flex-1 bg-purple-800 hover:bg-purple-900 text-purple-100 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 flex items-center justify-center space-x-2 shadow-md hover:shadow-lg"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Request Selesai</span>
            </button>
          )}

          {project.status === 'COMPLETION_REQUESTED' && (
            <div className="flex-1 bg-purple-800/30 text-purple-900 px-4 py-2.5 rounded-xl text-sm font-medium flex items-center justify-center space-x-2 border-2 border-purple-800/50">
              <svg className="w-4 h-4 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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