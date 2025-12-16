'use client';

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

interface Worker {
  id: string;
  full_name: string;
  email: string;
}

// PERBAIKAN: Buat proper interface untuk editData
interface EditData {
  title: string;
  description: string;
  project_value: string; // string karena dari input number
  worker_id: string;
  deadline: string;
  requirements: string[];
}

interface ProjectModalsProps {
  // Detail Modal
  showDetailModal: boolean;
  setShowDetailModal: (show: boolean) => void;
  
  // Edit Modal
  showEditModal: boolean;
  setShowEditModal: (show: boolean) => void;
  
  // Extend Modal
  showExtendModal: boolean;
  setShowExtendModal: (show: boolean) => void;
  
  selectedProject: Project | null;
  setSelectedProject: (project: Project | null) => void;
  
  // Edit data - PERBAIKAN: Ganti 'any' jadi 'EditData'
  editData: EditData;
  setEditData: (data: EditData | ((prev: EditData) => EditData)) => void;
  workers: Worker[];
  
  // Extend data
  newDeadline: string;
  setNewDeadline: (date: string) => void;
  
  // Actions
  onUpdateProject: () => void;
  onExtendDeadline: () => void;
  onApproveCompletion: (projectId: string) => void;
  
  // Requirements handlers
  addRequirement: () => void;
  removeRequirement: (index: number) => void;
  updateRequirement: (index: number, value: string) => void;
}

export default function ProjectModals({
  showDetailModal,
  setShowDetailModal,
  showEditModal,
  setShowEditModal,
  showExtendModal,
  setShowExtendModal,
  selectedProject,
  setSelectedProject,
  editData,
  setEditData,
  workers,
  newDeadline,
  setNewDeadline,
  onUpdateProject,
  onExtendDeadline,
  onApproveCompletion,
  addRequirement,
  removeRequirement,
  updateRequirement
}: ProjectModalsProps) {

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

  return (
    <>
      {/* Modal Detail Project */}
      {showDetailModal && selectedProject && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-blue-900/10 shadow-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-2xl font-bold text-blue-900">📋 Detail Project</h3>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-blue-700/70 hover:text-blue-900 text-xl p-2 hover:bg-blue-50 rounded-lg transition-all"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-blue-800 text-sm font-semibold mb-2">📝 Judul Project</label>
                  <div className="text-blue-900 bg-blue-50/50 p-3 rounded-xl border border-blue-100">{selectedProject.title}</div>
                </div>
                <div>
                  <label className="block text-blue-800 text-sm font-semibold mb-2">🏷️ Status</label>
                  <span className={`inline-flex px-3 py-2 text-sm font-medium rounded-xl border ${getStatusBadge(selectedProject.status)}`}>
                    {getStatusText(selectedProject.status)}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-blue-800 text-sm font-semibold mb-2">📄 Deskripsi</label>
                <div className="text-blue-900 bg-blue-50/50 p-4 rounded-xl border border-blue-100 leading-relaxed">{selectedProject.description}</div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-blue-800 text-sm font-semibold mb-2">💰 Nilai Project</label>
                  <div className="text-blue-900 bg-blue-50/50 p-3 rounded-xl border border-blue-100 font-bold">{formatCurrency(selectedProject.project_value)}</div>
                </div>
                <div>
                  <label className="block text-blue-800 text-sm font-semibold mb-2">📅 Deadline</label>
                  <div className="text-blue-900 bg-blue-50/50 p-3 rounded-xl border border-blue-100">{formatDate(selectedProject.deadline)}</div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-blue-800 text-sm font-semibold mb-2">👤 Worker</label>
                  <div className="text-blue-900 bg-blue-50/50 p-3 rounded-xl border border-blue-100">
                    {selectedProject.worker ? (
                      <>
                        <div className="font-semibold">{selectedProject.worker.full_name}</div>
                        <div className="text-sm text-blue-700/70">{selectedProject.worker.email}</div>
                      </>
                    ) : (
                      <span className="text-blue-700/70 italic">Belum ditugaskan</span>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-blue-800 text-sm font-semibold mb-2">📅 Dibuat</label>
                  <div className="text-blue-900 bg-blue-50/50 p-3 rounded-xl border border-blue-100">{formatDate(selectedProject.created_at)}</div>
                </div>
              </div>
              
              {selectedProject.requirements && selectedProject.requirements.length > 0 && (
                <div>
                  <label className="block text-blue-800 text-sm font-semibold mb-2">📋 Requirements</label>
                  <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                    <ul className="text-blue-900 space-y-2">
                      {selectedProject.requirements.map((req, index) => (
                        <li key={index} className="flex items-start space-x-3">
                          <span className="text-blue-600 mt-1 font-bold">•</span>
                          <span>{req}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex justify-end mt-8 space-x-3">
              {selectedProject.status === 'COMPLETION_REQUESTED' && (
                <button
                  onClick={() => onApproveCompletion(selectedProject.id)}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-md hover:shadow-lg flex items-center space-x-2"
                >
                  <span>✓</span>
                  <span>Setujui Selesai</span>
                </button>
              )}
              <button
                onClick={() => setShowDetailModal(false)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-md hover:shadow-lg"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Edit Project */}
      {showEditModal && selectedProject && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-blue-900/10 shadow-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-2xl font-bold text-blue-900">✏️ Edit Project</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-blue-700/70 hover:text-blue-900 text-xl p-2 hover:bg-blue-50 rounded-lg transition-all"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-blue-800 text-sm font-semibold mb-2">📝 Judul Project</label>
                <input
                  type="text"
                  value={editData.title}
                  onChange={(e) => setEditData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full bg-blue-50/50 border border-blue-200 rounded-xl px-4 py-3 text-blue-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all"
                  placeholder="Masukkan judul project..."
                />
              </div>
              
              <div>
                <label className="block text-blue-800 text-sm font-semibold mb-2">📄 Deskripsi</label>
                <textarea
                  value={editData.description}
                  onChange={(e) => setEditData(prev => ({ ...prev, description: e.target.value }))}
                  rows={4}
                  className="w-full bg-blue-50/50 border border-blue-200 rounded-xl px-4 py-3 text-blue-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all"
                  placeholder="Deskripsi project..."
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-blue-800 text-sm font-semibold mb-2">💰 Nilai Project</label>
                  <input
                    type="number"
                    value={editData.project_value}
                    onChange={(e) => setEditData(prev => ({ ...prev, project_value: e.target.value }))}
                    className="w-full bg-blue-50/50 border border-blue-200 rounded-xl px-4 py-3 text-blue-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-blue-800 text-sm font-semibold mb-2">📅 Deadline</label>
                  <input
                    type="date"
                    value={editData.deadline}
                    onChange={(e) => setEditData(prev => ({ ...prev, deadline: e.target.value }))}
                    className="w-full bg-blue-50/50 border border-blue-200 rounded-xl px-4 py-3 text-blue-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-blue-800 text-sm font-semibold mb-2">👤 Worker</label>
                <select
                  value={editData.worker_id}
                  onChange={(e) => setEditData(prev => ({ ...prev, worker_id: e.target.value }))}
                  className="w-full bg-blue-50/50 border border-blue-200 rounded-xl px-4 py-3 text-blue-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all"
                >
                  <option value="">Pilih Worker</option>
                  {workers.map((worker) => (
                    <option key={worker.id} value={worker.id}>
                      {worker.full_name} ({worker.email})
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-3">
                  <label className="block text-blue-800 text-sm font-semibold">📋 Requirements</label>
                  <button
                    type="button"
                    onClick={addRequirement}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-sm rounded-lg transition-all shadow-sm flex items-center space-x-2"
                  >
                    <span>+</span>
                    <span>Tambah</span>
                  </button>
                </div>
                <div className="space-y-3">
                  {editData.requirements?.map((req, index) => (
                    <div key={index} className="flex space-x-3">
                      <input
                        type="text"
                        value={req}
                        onChange={(e) => updateRequirement(index, e.target.value)}
                        placeholder={`Requirement ${index + 1}`}
                        className="flex-1 bg-blue-50/50 border border-blue-200 rounded-xl px-4 py-3 text-blue-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all"
                      />
                      {editData.requirements && editData.requirements.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeRequirement(index)}
                          className="bg-red-500 hover:bg-red-600 text-white px-4 py-3 rounded-xl transition-all shadow-sm"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex space-x-3 mt-8">
              <button
                onClick={onUpdateProject}
                className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-3 rounded-xl font-semibold transition-all shadow-md hover:shadow-lg"
              >
                💾 Update Project
              </button>
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-3 rounded-xl font-semibold transition-all shadow-md"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Perpanjang Deadline */}
      {showExtendModal && selectedProject && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-blue-900/10 shadow-2xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-blue-900 mb-6 flex items-center space-x-2">
              <span>📅</span>
              <span>Perpanjang Deadline</span>
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-blue-800 text-sm font-semibold mb-2">
                  📝 Project: {selectedProject.title}
                </label>
                <p className="text-blue-700/70 text-sm bg-blue-50 p-3 rounded-lg">
                  <span className="font-medium">Deadline saat ini:</span> {formatDate(selectedProject.deadline)}
                </p>
              </div>
              
              <div>
                <label className="block text-blue-800 text-sm font-semibold mb-2">
                  📅 Deadline Baru
                </label>
                <input
                  type="date"
                  value={newDeadline}
                  onChange={(e) => setNewDeadline(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full bg-blue-50/50 border border-blue-200 rounded-xl px-4 py-3 text-blue-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all"
                />
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={onExtendDeadline}
                className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-3 rounded-xl font-semibold transition-all shadow-md hover:shadow-lg"
              >
                📅 Perpanjang
              </button>
              <button
                onClick={() => {
                  setShowExtendModal(false);
                  setSelectedProject(null);
                  setNewDeadline('');
                }}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-3 rounded-xl font-semibold transition-all shadow-md"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// EXPORT interface EditData untuk dipakai di file parent
export type { EditData };