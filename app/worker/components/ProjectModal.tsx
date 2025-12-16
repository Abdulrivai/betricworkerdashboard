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

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl border-2 border-blue-800 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-blue-800 px-6 py-4 rounded-t-2xl">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-xl font-bold text-white">Detail SPK</h3>
              <p className="text-white/90 text-sm mt-1">{getStatusText(project.status)}</p>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white text-2xl font-bold p-2 rounded-full hover:bg-white/10 transition-all"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Project Title */}
          <div>
            <label className="block text-blue-800 text-sm font-bold mb-2 uppercase tracking-wide">
              Judul Project
            </label>
            <div className="bg-white border-2 border-blue-800 rounded-xl p-4">
              <p className="text-blue-900 font-semibold text-lg">{project.title}</p>
            </div>
          </div>
          
          {/* Description */}
          <div>
            <label className="block text-blue-800 text-sm font-bold mb-2 uppercase tracking-wide">
              Deskripsi Project
            </label>
            <div className="bg-white border-2 border-blue-800 rounded-xl p-4">
              <p className="text-blue-900 leading-relaxed">{project.description}</p>
            </div>
          </div>
          
          {/* Value & Deadline Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-blue-800 text-sm font-bold mb-2 uppercase tracking-wide">
                Nilai Project
              </label>
              <div className="bg-white border-2 border-blue-800 rounded-xl p-4">
                <p className="text-blue-900 font-bold text-xl">
                  {formatCurrency(project.project_value)}
                </p>
              </div>
            </div>
            <div>
              <label className="block text-blue-800 text-sm font-bold mb-2 uppercase tracking-wide">
                Deadline
              </label>
              <div className="bg-white border-2 border-blue-800 rounded-xl p-4">
                <p className="text-blue-900 font-bold">
                  {formatDate(project.deadline)}
                </p>
              </div>
            </div>
          </div>
          
          {/* Requirements */}
          {project.requirements && project.requirements.length > 0 && (
            <div>
              <label className="block text-blue-800 text-sm font-bold mb-2 uppercase tracking-wide">
                Requirements & Spesifikasi
              </label>
              <div className="bg-white border-2 border-blue-800 rounded-xl p-4">
                <ul className="space-y-2">
                  {project.requirements.map((req, index) => (
                    <li key={index} className="flex items-start space-x-3">
                      <span className="bg-blue-800 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                        {index + 1}
                      </span>
                      <span className="text-blue-900 leading-relaxed">{req}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Timestamps */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-blue-800 text-sm font-bold mb-2 uppercase tracking-wide">
                SPK Diterima
              </label>
              <div className="bg-white border-2 border-blue-800 rounded-xl p-4">
                <p className="text-blue-900 font-medium">
                  {formatDateTime(project.created_at)}
                </p>
              </div>
            </div>
            <div>
              <label className="block text-blue-800 text-sm font-bold mb-2 uppercase tracking-wide">
                Status Saat Ini
              </label>
              <div className="bg-white border-2 border-blue-800 rounded-xl p-4">
                <span className="inline-flex px-4 py-2 rounded-full text-sm font-bold text-white bg-blue-800">
                  {getStatusText(project.status)}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="px-6 py-4 border-t-2 border-blue-800 bg-white">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="bg-blue-800 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-md hover:shadow-lg"
            >
              Tutup Detail
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}