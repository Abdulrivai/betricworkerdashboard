'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Worker {
  id: string;
  full_name: string;
  email: string;
  role: string;
}

function CreateProject() {
  const router = useRouter();
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    workers: [] as Array<{ worker_id: string; project_value: string }>,
    deadline: '',
    requirements: ['']
  });

  useEffect(() => {
    fetchWorkers();
  }, []);

  const fetchWorkers = async () => {
    try {
      const response = await fetch('/api/workers');

      if (response.ok) {
        const data = await response.json();
        setWorkers(data.workers || []);
      }
    } catch (error) {
      console.error('Error fetching workers:', error);
    }
  };

  const addRequirement = () => {
    setFormData(prev => ({
      ...prev,
      requirements: [...prev.requirements, '']
    }));
  };

  const removeRequirement = (index: number) => {
    setFormData(prev => ({
      ...prev,
      requirements: prev.requirements.filter((_, i) => i !== index)
    }));
  };

  const updateRequirement = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      requirements: prev.requirements.map((req, i) => i === index ? value : req)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          workers: formData.workers.map(w => ({
            worker_id: w.worker_id,
            project_value: parseFloat(w.project_value)
          })),
          deadline: formData.deadline,
          requirements: formData.requirements.filter(req => req.trim() !== '')
        }),
      });

      if (response.ok) {
        router.push('/admin/projects');
      } else {
        alert('Gagal membuat SPK');
      }
    } catch (error) {
      alert('Terjadi kesalahan');
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: string) => {
    if (!value) return '';
    const num = parseFloat(value);
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(num);
  };

  // Filter workers berdasarkan search query
  const filteredWorkers = workers.filter(worker => {
    const query = searchQuery.toLowerCase();
    return (
      worker.full_name.toLowerCase().includes(query) ||
      worker.email.toLowerCase().includes(query)
    );
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50">
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-md border-b border-blue-900/10 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link
                href="/admin"
                className="text-blue-700 hover:text-blue-900 font-medium transition-colors"
              >
                ← Dashboard
              </Link>
              <div className="h-6 w-px bg-blue-200"></div>
              <h1 className="text-xl font-bold text-blue-900">Buat SPK Baru</h1>
            </div>
            <img src="/betriclogoblue.png" alt="Betric" className="h-8 w-8 object-contain" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-blue-900 mb-2 flex items-center space-x-3">
            <span className="text-4xl">📝</span>
            <span>Buat Project Baru</span>
          </h2>
          <p className="text-blue-700/70">
            Lengkapi form berikut untuk membuat SPK (Surat Perintah Kerja) baru
          </p>
        </div>

        {/* Form Container */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-blue-900/10 shadow-lg">
          <form onSubmit={handleSubmit} className="space-y-8">

            {/* Judul Proyek */}
            <div className="space-y-3">
              <label className="block text-blue-900 text-sm font-semibold mb-2 flex items-center space-x-2">
                <span>🏷️</span>
                <span>Judul Proyek *</span>
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-4 py-3 bg-blue-50/50 border border-blue-200 rounded-xl text-blue-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all placeholder-blue-400"
                placeholder="Masukkan judul proyek yang akan dikerjakan"
              />
            </div>

            {/* Deskripsi */}
            <div className="space-y-3">
              <label className="block text-blue-900 text-sm font-semibold mb-2 flex items-center space-x-2">
                <span>📄</span>
                <span>Deskripsi Proyek *</span>
              </label>
              <textarea
                required
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-4 py-3 bg-blue-50/50 border border-blue-200 rounded-xl text-blue-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all placeholder-blue-400 resize-none"
                placeholder="Jelaskan detail proyek yang akan dikerjakan, termasuk scope pekerjaan dan deliverables yang diharapkan"
              />
            </div>

            {/* Worker Selection - Full Width */}
            <div className="space-y-4">
              <label className="flex items-center space-x-2 text-blue-900 text-sm font-semibold">
                <span>👨‍💼</span>
                <span>Pilih Worker *</span>
                <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                  {formData.workers.length} / {workers.length} dipilih
                </span>
              </label>

              {/* Search Input */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-white border-2 border-blue-200 rounded-xl text-blue-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all placeholder-blue-400"
                  placeholder="Cari worker berdasarkan nama atau email..."
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-blue-400 hover:text-blue-600 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Worker Grid dengan Checkbox */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto p-4 bg-blue-50/30 rounded-xl border border-blue-200">
                {filteredWorkers.length > 0 ? (
                  filteredWorkers.map(worker => {
                    const isSelected = formData.workers.some(w => w.worker_id === worker.id);
                    return (
                      <div
                        key={worker.id}
                        onClick={() => {
                          if (isSelected) {
                            setFormData(prev => ({
                              ...prev,
                              workers: prev.workers.filter(w => w.worker_id !== worker.id)
                            }));
                          } else {
                            setFormData(prev => ({
                              ...prev,
                              workers: [...prev.workers, { worker_id: worker.id, project_value: '' }]
                            }));
                          }
                        }}
                        className={`
                        relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-200
                        ${isSelected
                            ? 'border-blue-600 bg-blue-100/70 shadow-md'
                            : 'border-blue-200 bg-white hover:border-blue-400 hover:shadow-sm'
                          }
                      `}
                      >
                        <div className="flex items-start space-x-3">
                          <div className="shrink-0 mt-0.5">
                            <div className={`
                            w-5 h-5 rounded border-2 flex items-center justify-center transition-all
                            ${isSelected
                                ? 'bg-blue-600 border-blue-600'
                                : 'bg-white border-blue-300'
                              }
                          `}>
                              {isSelected && (
                                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className={`font-semibold text-sm truncate ${isSelected ? 'text-blue-900' : 'text-blue-800'}`}>
                              {worker.full_name}
                            </div>
                            <div className={`text-xs truncate mt-1 ${isSelected ? 'text-blue-700' : 'text-blue-600/70'}`}>
                              {worker.email}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="col-span-2 py-12 text-center">
                    <svg className="w-16 h-16 mx-auto text-blue-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-blue-600 font-semibold mb-1">Tidak ada worker ditemukan</p>
                    <p className="text-blue-500 text-sm">Coba gunakan kata kunci pencarian yang berbeda</p>
                  </div>
                )}
              </div>

              {/* Preview Workers Terpilih dengan Input Nilai */}
              {formData.workers.length > 0 && (
                <div className="relative overflow-hidden p-6 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 rounded-2xl border-2 border-green-300/60 shadow-lg">
                  {/* Decorative Elements */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-400/10 to-blue-400/10 rounded-full blur-3xl"></div>
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-emerald-400/10 to-teal-400/10 rounded-full blur-2xl"></div>

                  {/* Header */}
                  <div className="relative flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-bold text-green-900 text-lg">
                          {formData.workers.length} Worker{formData.workers.length > 1 ? 's' : ''} Terpilih
                        </h3>
                        <p className="text-xs text-green-700/70">
                          Setiap worker akan mendapat SPK terpisah dengan nilai berbeda
                        </p>
                      </div>
                    </div>

                    {/* Tombol Clear All - Moved to Header */}
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, workers: [] }))}
                      className="group flex items-center space-x-2 text-sm text-red-600 hover:text-red-700 font-semibold bg-white hover:bg-red-50 px-4 py-2 rounded-xl transition-all shadow-md hover:shadow-lg border border-red-200 hover:border-red-300"
                    >
                      <svg className="w-4 h-4 group-hover:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      <span>Hapus Semua</span>
                    </button>
                  </div>

                  {/* Worker Cards Grid */}
                  <div className="relative grid grid-cols-1 gap-4">
                    {formData.workers.map((workerData, index) => {
                      const worker = workers.find(w => w.id === workerData.worker_id);
                      if (!worker) return null;
                      return (
                        <div
                          key={workerData.worker_id}
                          className="group relative bg-white border-2 border-green-300/50 hover:border-green-400 rounded-xl p-5 transition-all duration-300 shadow-md hover:shadow-xl"
                        >
                          {/* Badge Number */}
                          <div className="absolute -top-2 -left-2 w-7 h-7 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg shadow-lg flex items-center justify-center">
                            <span className="text-white text-xs font-bold">{index + 1}</span>
                          </div>

                          <div className="flex items-start space-x-4">
                            {/* Avatar */}
                            <div className="shrink-0">
                              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
                                <span className="text-white font-bold text-lg">
                                  {worker.full_name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            </div>

                            {/* Worker Info & Value Input */}
                            <div className="flex-1 min-w-0 space-y-3">
                              <div>
                                <div className="font-bold text-blue-900 text-sm mb-1 truncate">
                                  {worker.full_name}
                                </div>
                                <div className="flex items-center space-x-1 text-xs text-blue-600/70">
                                  <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                  </svg>
                                  <span className="truncate">{worker.email}</span>
                                </div>
                              </div>

                              {/* Nilai Project Input */}
                              <div className="space-y-2">
                                <label className="flex items-center space-x-2 text-xs font-semibold text-blue-900">
                                  <span>💰</span>
                                  <span>Nilai Proyek (Rp) *</span>
                                </label>
                                <input
                                  type="number"
                                  required
                                  min="0"
                                  value={workerData.project_value}
                                  onChange={(e) => {
                                    setFormData(prev => ({
                                      ...prev,
                                      workers: prev.workers.map(w =>
                                        w.worker_id === workerData.worker_id
                                          ? { ...w, project_value: e.target.value }
                                          : w
                                      )
                                    }));
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                  className="w-full px-3 py-2 bg-blue-50/50 border border-blue-200 rounded-lg text-blue-900 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all placeholder-blue-400"
                                  placeholder="Masukkan nilai project"
                                />
                                {workerData.project_value && (
                                  <div className="text-xs text-blue-700 bg-blue-100/50 px-2 py-1.5 rounded-lg">
                                    💵 <strong>Preview:</strong> {formatCurrency(workerData.project_value)}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Remove Button */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setFormData(prev => ({
                                  ...prev,
                                  workers: prev.workers.filter(w => w.worker_id !== workerData.worker_id)
                                }));
                              }}
                              className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg bg-red-500 hover:bg-red-600 text-white transition-all shadow-md hover:shadow-lg hover:scale-110 group/btn"
                              title="Hapus worker ini"
                            >
                              <svg className="w-4 h-4 group-hover/btn:rotate-90 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Deadline */}
            <div className="space-y-3">
              <label className="block text-blue-900 text-sm font-semibold mb-2 flex items-center space-x-2">
                <span>📅</span>
                <span>Deadline Proyek *</span>
              </label>
              <input
                type="date"
                required
                value={formData.deadline}
                onChange={(e) => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
                className="w-full px-4 py-3 bg-blue-50/50 border border-blue-200 rounded-xl text-blue-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            {/* Requirements */}
            <div className="space-y-3">
              <label className="block text-blue-900 text-sm font-semibold mb-2 flex items-center space-x-2">
                <span>📋</span>
                <span>Requirements Proyek</span>
                <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                  Opsional
                </span>
              </label>

              <div className="space-y-3">
                {formData.requirements.map((req, index) => (
                  <div key={index} className="flex gap-3 items-center">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-sm font-semibold">
                      {index + 1}
                    </div>
                    <input
                      type="text"
                      value={req}
                      onChange={(e) => updateRequirement(index, e.target.value)}
                      className="flex-1 px-4 py-3 bg-blue-50/50 border border-blue-200 rounded-xl text-blue-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all placeholder-blue-400"
                      placeholder={`Requirement ${index + 1} (contoh: UI/UX Design, Database Setup, etc.)`}
                    />
                    {formData.requirements.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeRequirement(index)}
                        className="flex-shrink-0 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors"
                        title="Hapus requirement"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}

                <button
                  type="button"
                  onClick={addRequirement}
                  className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 font-medium transition-colors bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-lg border border-blue-200"
                >
                  <span>+</span>
                  <span>Tambah Requirement Baru</span>
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-blue-100">
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-4 px-6 rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:transform-none flex items-center justify-center space-x-2"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white"></div>
                    <span>Membuat SPK...</span>
                  </>
                ) : (
                  <>
                    <span>📝</span>
                    <span>Buat SPK Sekarang</span>
                  </>
                )}
              </button>

              <Link href="/admin/projects" className="sm:w-auto w-full">
                <button
                  type="button"
                  className="w-full sm:w-auto px-6 py-4 bg-gray-500 hover:bg-gray-600 text-white rounded-xl font-semibold transition-all shadow-md hover:shadow-lg flex items-center justify-center space-x-2"
                >
                  <span>❌</span>
                  <span>Batal</span>
                </button>
              </Link>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

export default CreateProject;