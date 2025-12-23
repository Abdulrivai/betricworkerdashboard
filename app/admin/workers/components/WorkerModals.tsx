'use client';

import { useState } from 'react';

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

interface WorkerModalsProps {
  // Create Modal
  showCreateModal: boolean;
  setShowCreateModal: (show: boolean) => void;

  // Edit Modal
  showEditModal: boolean;
  setShowEditModal: (show: boolean) => void;

  // Selected worker for edit
  selectedWorker: Worker | null;
  setSelectedWorker: (worker: Worker | null) => void;

  // Callbacks
  onCreateWorker: (email: string, fullName: string, password: string) => void;
  onUpdateWorker: (workerId: string, email?: string, password?: string) => void;
}

export default function WorkerModals({
  showCreateModal,
  setShowCreateModal,
  showEditModal,
  setShowEditModal,
  selectedWorker,
  setSelectedWorker,
  onCreateWorker,
  onUpdateWorker,
}: WorkerModalsProps) {
  // Create form state
  const [createEmail, setCreateEmail] = useState('');
  const [createFullName, setCreateFullName] = useState('');
  const [createPassword, setCreatePassword] = useState('');
  const [showCreatePassword, setShowCreatePassword] = useState(false);

  // Edit form state
  const [editEmail, setEditEmail] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [showEditPassword, setShowEditPassword] = useState(false);

  // Password validation
  const validatePassword = (password: string) => {
    if (password.length < 8) return 'Min 8 karakter';
    if (!/[a-z]/.test(password)) return 'Perlu huruf kecil';
    if (!/[A-Z]/.test(password)) return 'Perlu huruf besar';
    if (!/\d/.test(password)) return 'Perlu angka';
    if (!/[@$!%*?&#]/.test(password)) return 'Perlu simbol (@$!%*?&#)';
    return '';
  };

  const handleCreateSubmit = () => {
    if (!createEmail.trim() || !createFullName.trim() || !createPassword.trim()) {
      alert('Semua field wajib diisi');
      return;
    }

    const passwordError = validatePassword(createPassword);
    if (passwordError) {
      alert(passwordError);
      return;
    }

    onCreateWorker(createEmail, createFullName, createPassword);

    // Reset form
    setCreateEmail('');
    setCreateFullName('');
    setCreatePassword('');
    setShowCreatePassword(false);
  };

  const handleEditSubmit = () => {
    if (!selectedWorker) return;

    // Check if at least one field is being updated
    if (!editEmail.trim() && !editPassword.trim()) {
      alert('Minimal satu field harus diisi');
      return;
    }

    // Only validate password if it's being changed
    if (editPassword && editPassword.trim() !== '') {
      const passwordError = validatePassword(editPassword);
      if (passwordError) {
        alert(passwordError);
        return;
      }
    }

    onUpdateWorker(
      selectedWorker.id,
      editEmail.trim() || undefined,
      editPassword.trim() || undefined
    );

    // Reset form
    setEditEmail('');
    setEditPassword('');
    setShowEditPassword(false);
  };

  const handleCloseCreateModal = () => {
    setShowCreateModal(false);
    setCreateEmail('');
    setCreateFullName('');
    setCreatePassword('');
    setShowCreatePassword(false);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setSelectedWorker(null);
    setEditEmail('');
    setEditPassword('');
    setShowEditPassword(false);
  };

  return (
    <>
      {/* Create Worker Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-blue-900/10 shadow-2xl p-6 w-full max-w-md">
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-2xl font-bold text-blue-900">Tambah Worker Baru</h3>
              <button
                onClick={handleCloseCreateModal}
                className="text-blue-700/70 hover:text-blue-900 text-xl p-2 hover:bg-blue-50 rounded-lg transition-all"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-blue-800 text-sm font-semibold mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={createEmail}
                  onChange={(e) => setCreateEmail(e.target.value)}
                  placeholder="worker@example.com"
                  className="w-full bg-blue-50/50 border border-blue-200 rounded-xl px-4 py-3 text-blue-900 placeholder-blue-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all"
                />
              </div>

              <div>
                <label className="block text-blue-800 text-sm font-semibold mb-2">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  value={createFullName}
                  onChange={(e) => setCreateFullName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full bg-blue-50/50 border border-blue-200 rounded-xl px-4 py-3 text-blue-900 placeholder-blue-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all"
                />
              </div>

              <div>
                <label className="block text-blue-800 text-sm font-semibold mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showCreatePassword ? "text" : "password"}
                    value={createPassword}
                    onChange={(e) => setCreatePassword(e.target.value)}
                    placeholder="Min 8 karakter, uppercase, lowercase, angka, simbol"
                    className="w-full bg-blue-50/50 border border-blue-200 rounded-xl px-4 py-3 pr-12 text-blue-900 placeholder-blue-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCreatePassword(!showCreatePassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-400 hover:text-blue-600"
                  >
                    {showCreatePassword ? '🙈' : '👁️'}
                  </button>
                </div>
                {createPassword && (
                  <p className={`text-xs mt-1 ${validatePassword(createPassword) ? 'text-red-500' : 'text-green-500'}`}>
                    {validatePassword(createPassword) || '✓ Password valid'}
                  </p>
                )}
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleCreateSubmit}
                className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white py-3 rounded-xl font-bold transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 flex items-center justify-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Buat Worker</span>
              </button>
              <button
                onClick={handleCloseCreateModal}
                className="flex-1 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white py-3 rounded-xl font-bold transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 flex items-center justify-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span>Batal</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Worker Modal */}
      {showEditModal && selectedWorker && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-blue-900/10 shadow-2xl p-6 w-full max-w-md">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-2xl font-bold text-blue-900">Edit Worker</h3>
                <p className="text-blue-700/70 text-sm mt-1">{selectedWorker.full_name}</p>
              </div>
              <button
                onClick={handleCloseEditModal}
                className="text-blue-700/70 hover:text-blue-900 text-xl p-2 hover:bg-blue-50 rounded-lg transition-all"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-blue-800 text-sm font-semibold mb-2">
                  Email Baru (opsional)
                </label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  placeholder={selectedWorker.email}
                  className="w-full bg-blue-50/50 border border-blue-200 rounded-xl px-4 py-3 text-blue-900 placeholder-blue-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all"
                />
                <p className="text-xs text-blue-600/60 mt-1">Kosongkan jika tidak ingin mengubah email</p>
              </div>

              <div>
                <label className="block text-blue-800 text-sm font-semibold mb-2">
                  Password Baru (opsional)
                </label>
                <div className="relative">
                  <input
                    type={showEditPassword ? "text" : "password"}
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    placeholder="Masukkan password baru..."
                    className="w-full bg-blue-50/50 border border-blue-200 rounded-xl px-4 py-3 pr-12 text-blue-900 placeholder-blue-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowEditPassword(!showEditPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-400 hover:text-blue-600"
                  >
                    {showEditPassword ? '🙈' : '👁️'}
                  </button>
                </div>
                <p className="text-xs text-blue-600/60 mt-1">Kosongkan jika tidak ingin mengubah password</p>
                {editPassword && (
                  <p className={`text-xs mt-1 ${validatePassword(editPassword) ? 'text-red-500' : 'text-green-500'}`}>
                    {validatePassword(editPassword) || '✓ Password valid'}
                  </p>
                )}
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleEditSubmit}
                className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white py-3 rounded-xl font-bold transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 flex items-center justify-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
                <span>Update</span>
              </button>
              <button
                onClick={handleCloseEditModal}
                className="flex-1 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white py-3 rounded-xl font-bold transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 flex items-center justify-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span>Batal</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
