'use client';

import Link from 'next/link';
import { getStatusBadge, getStatusText, formatCurrency, formatDate } from '../utils/helpers';

interface RecentProject {
  id: string;
  title: string;
  worker: { full_name: string } | null;
  workers?: Array<{
    id: string;
    full_name: string;
    email: string;
  }>;
  status: string;
  current_deadline: string;
  project_value: number;
}

interface RecentProjectsProps {
  projects: RecentProject[];
}

export default function RecentProjects({ projects }: RecentProjectsProps) {
  const recentProjects = projects.slice(0, 2);

  return (
    <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-blue-900/10 shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-2">
          <span className="text-xl">📁</span>
          <h3 className="text-xl font-bold text-blue-900">2 Proyek Terbaru</h3>
        </div>
        <Link 
          href="/admin/projects" 
          className="text-blue-700 hover:text-blue-900 text-sm font-medium transition-colors bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-lg border border-blue-200"
        >
          Lihat Semua ({projects.length}) →
        </Link>
      </div>
      
      <div className="space-y-4">
        {recentProjects.length > 0 ? (
          recentProjects.map((project, index) => (
            <div key={project.id} className="bg-white/50 rounded-xl p-4 border border-blue-900/5 hover:bg-white/70 transition-all duration-200 relative">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h4 className="text-blue-900 font-semibold truncate text-sm pr-4">
                    {project.title}
                  </h4>
                  <div className="text-xs text-blue-600/60 mt-1">
                    Project #{index + 1}
                  </div>
                </div>
                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${getStatusBadge(project.status)} flex-shrink-0`}>
                  {getStatusText(project.status)}
                </span>
              </div>
              
              <div className="text-sm text-blue-700/70 space-y-1">
                <div className="flex items-center justify-between">
                  <span>🧑‍💼 Worker:</span>
                  {project.workers && project.workers.length > 0 ? (
                    <span className="text-right">
                      {project.workers.length === 1
                        ? project.workers[0].full_name
                        : `${project.workers.length} workers`
                      }
                    </span>
                  ) : (
                    <span className="text-right">{project.worker?.full_name || 'Belum ditugaskan'}</span>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span>📅 Deadline:</span>
                  <span className="text-right">{formatDate(project.current_deadline)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>💰 Nilai:</span>
                  <span className="text-right font-semibold text-blue-800">{formatCurrency(project.project_value)}</span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">📋</div>
            <p className="text-blue-700/50 font-medium">Belum ada proyek</p>
            <p className="text-blue-600/40 text-sm mt-1">Proyek akan muncul setelah dibuat</p>
            <Link 
              href="/admin/projects/create"
              className="inline-block mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-all"
            >
              + Buat Project Pertama
            </Link>
          </div>
        )}
      </div>

      {projects.length > 2 && (
        <div className="mt-4 pt-4 border-t border-blue-100">
          <div className="text-center text-sm text-blue-600/70">
            Dan <strong>{projects.length - 2}</strong> proyek lainnya
          </div>
        </div>
      )}
    </div>
  );
}