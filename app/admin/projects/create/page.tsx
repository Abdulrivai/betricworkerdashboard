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
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    project_value: '',
    worker_ids: [] as string[],
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
          ...formData,
          project_value: parseFloat(formData.project_value),
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
                  {formData.worker_ids.length} / {workers.length} dipilih
                </span>
              </label>

              {/* Worker Grid dengan Checkbox */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto p-4 bg-blue-50/30 rounded-xl border border-blue-200">
                {workers.map(worker => {
                  const isSelected = formData.worker_ids.includes(worker.id);
                  return (
                    <div
                      key={worker.id}
                      onClick={() => {
                        if (isSelected) {
                          setFormData(prev => ({
                            ...prev,
                            worker_ids: prev.worker_ids.filter(id => id !== worker.id)
                          }));
                        } else {
                          setFormData(prev => ({
                            ...prev,
                            worker_ids: [...prev.worker_ids, worker.id]
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
                })}
              </div>

              {/* Preview Workers Terpilih dengan Tag yang bisa dihapus */}
              {formData.worker_ids.length > 0 && (
                <div className="p-4 bg-linear-to-br from-green-50 to-blue-50 rounded-xl border-2 border-green-200">
                  <div className="flex items-center space-x-2 mb-3">
                    <span className="text-green-600 font-bold text-lg">✅</span>
                    <span className="font-bold text-green-900">
                      {formData.worker_ids.length} Worker{formData.worker_ids.length > 1 ? 's' : ''} Terpilih
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {formData.worker_ids.map((workerId) => {
                      const worker = workers.find(w => w.id === workerId);
                      if (!worker) return null;
                      return (
                        <div
                          key={workerId}
                          className="group flex items-center space-x-2 bg-white/80 hover:bg-white border-2 border-green-300 rounded-lg px-3 py-2 transition-all shadow-sm hover:shadow-md"
                        >
                          <div className="flex items-center space-x-2">
                            <span className="text-green-600">👤</span>
                            <div>
                              <div className="text-sm font-semibold text-blue-900">
                                {worker.full_name}
                              </div>
                              <div className="text-xs text-blue-600/70">
                                {worker.email}
                              </div>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setFormData(prev => ({
                                ...prev,
                                worker_ids: prev.worker_ids.filter(id => id !== workerId)
                              }));
                            }}
                            className="ml-2 shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-red-500 hover:bg-red-600 text-white transition-colors"
                            title="Hapus worker ini"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  {/* Tombol Clear All */}
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, worker_ids: [] }))}
                    className="mt-3 text-xs text-red-600 hover:text-red-700 font-medium bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors flex items-center space-x-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    <span>Hapus Semua</span>
                  </button>
                </div>
              )}
            </div>

            {/* Nilai Proyek & Deadline */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Spacer untuk layout consistency */}
              <div></div>

              {/* Nilai Proyek */}
              <div className="space-y-3">
                <label className="block text-blue-900 text-sm font-semibold mb-2 flex items-center space-x-2">
                  <span>💰</span>
                  <span>Nilai Proyek (Rp) *</span>
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={formData.project_value}
                  onChange={(e) => setFormData(prev => ({ ...prev, project_value: e.target.value }))}
                  className="w-full px-4 py-3 bg-blue-50/50 border border-blue-200 rounded-xl text-blue-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all placeholder-blue-400"
                  placeholder="Masukkan nilai project dalam Rupiah"
                />
                {formData.project_value && (
                  <div className="text-sm text-blue-700 bg-blue-100/50 px-3 py-2 rounded-lg">
                    💵 <strong>Preview:</strong> {formatCurrency(formData.project_value)}
                  </div>
                )}
              </div>
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