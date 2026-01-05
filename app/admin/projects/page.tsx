'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Swal from 'sweetalert2';
import ProjectTable from './components/ProjectTable';
import ProjectModals, { EditData } from './components/ProjectModals';

interface Project {
  id: string;
  title: string;
  status: string;
  worker: {
    id: string;
    full_name: string;
    email: string;
  } | null;
  workers?: Array<{
    id: string;
    full_name: string;
    email: string;
  }>;
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

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Modal states
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  
  // Selected project
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [newDeadline, setNewDeadline] = useState('');
  
  // Edit form data dengan proper EditData type
  const [editData, setEditData] = useState<EditData>({
    title: '',
    description: '',
    project_value: '',
    worker_id: '',
    deadline: '',
    requirements: ['']
  });

  useEffect(() => {
    fetchProjects();
    fetchWorkers();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects');
      if (response.ok) {
        const data = await response.json();
        console.log('📊 Frontend received projects:', data);
        setProjects(data.projects || []);
      } else {
        console.error('Failed to fetch projects:', response.status);
        await Swal.fire({
          title: '❌ Gagal Memuat Data',
          text: 'Gagal memuat data projects',
          icon: 'error',
          confirmButtonColor: '#dc2626',
          confirmButtonText: 'OK',
          customClass: {
            popup: 'rounded-2xl',
            confirmButton: 'rounded-xl px-6 py-3'
          }
        });
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
      await Swal.fire({
        title: '❌ Terjadi Kesalahan',
        text: 'Terjadi kesalahan saat memuat data',
        icon: 'error',
        confirmButtonColor: '#dc2626',
        confirmButtonText: 'OK',
        customClass: {
          popup: 'rounded-2xl',
          confirmButton: 'rounded-xl px-6 py-3'
        }
      });
    } finally {
      setIsLoading(false);
    }
  };

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

  const deleteProject = async (projectId: string, projectTitle: string) => {
    const result = await Swal.fire({
      title: '🗑️ Hapus Project?',
      html: `
        <p class="text-lg mb-2">Apakah Anda yakin ingin menghapus project:</p>
        <p class="text-xl font-bold text-red-600 mb-2">"${projectTitle}"</p>
        <p class="text-sm text-gray-600">Project ini akan hilang dari sistem dan worker tidak dapat melihatnya lagi.</p>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: '🗑️ Ya, Hapus Project',
      cancelButtonText: '❌ Batal',
      customClass: {
        popup: 'rounded-2xl',
        confirmButton: 'rounded-xl px-6 py-3',
        cancelButton: 'rounded-xl px-6 py-3'
      }
    });

    if (!result.isConfirmed) return;

    // Show loading
    Swal.fire({
      title: 'Menghapus...',
      html: `Menghapus project "${projectTitle}"`,
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    try {
      console.log('🗑️ Deleting project:', projectId, projectTitle);

      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        await Swal.fire({
          title: '✅ Berhasil!',
          text: data.message,
          icon: 'success',
          confirmButtonColor: '#16a34a',
          confirmButtonText: 'OK',
          timer: 2000,
          customClass: {
            popup: 'rounded-2xl',
            confirmButton: 'rounded-xl px-6 py-3'
          }
        });
        await fetchProjects();
        console.log('✅ Project deleted and data refreshed');
      } else {
        console.error('❌ Delete failed:', data);
        await Swal.fire({
          title: '❌ Gagal Menghapus',
          text: `Gagal menghapus project: ${data.error || 'Unknown error'}`,
          icon: 'error',
          confirmButtonColor: '#dc2626',
          confirmButtonText: 'OK',
          customClass: {
            popup: 'rounded-2xl',
            confirmButton: 'rounded-xl px-6 py-3'
          }
        });
      }

    } catch (error) {
      console.error('💥 Error deleting project:', error);
      await Swal.fire({
        title: '❌ Terjadi Kesalahan',
        text: 'Terjadi kesalahan saat menghapus project. Silakan coba lagi.',
        icon: 'error',
        confirmButtonColor: '#dc2626',
        confirmButtonText: 'OK',
        customClass: {
          popup: 'rounded-2xl',
          confirmButton: 'rounded-xl px-6 py-3'
        }
      });
    } finally {
      setIsLoading(false);
    }
  };

  const extendDeadline = async () => {
    if (!selectedProject || !newDeadline) {
      await Swal.fire({
        title: '⚠️ Peringatan!',
        text: 'Pilih tanggal deadline baru!',
        icon: 'warning',
        confirmButtonColor: '#eab308',
        confirmButtonText: 'OK',
        customClass: {
          popup: 'rounded-2xl',
          confirmButton: 'rounded-xl px-6 py-3'
        }
      });
      return;
    }

    const newDeadlineDate = new Date(newDeadline);
    const currentDeadline = new Date(selectedProject.deadline);

    if (newDeadlineDate <= currentDeadline) {
      await Swal.fire({
        title: '⚠️ Tanggal Tidak Valid!',
        text: 'Deadline baru harus lebih dari deadline saat ini!',
        icon: 'warning',
        confirmButtonColor: '#eab308',
        confirmButtonText: 'OK',
        customClass: {
          popup: 'rounded-2xl',
          confirmButton: 'rounded-xl px-6 py-3'
        }
      });
      return;
    }

    try {
      const response = await fetch(`/api/projects/${selectedProject.id}/extend`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ new_deadline: newDeadline }),
      });

      const result = await response.json();

      if (response.ok) {
        await Swal.fire({
          title: '✅ Berhasil!',
          text: 'Deadline berhasil diperpanjang!',
          icon: 'success',
          confirmButtonColor: '#16a34a',
          confirmButtonText: 'OK',
          timer: 2000,
          customClass: {
            popup: 'rounded-2xl',
            confirmButton: 'rounded-xl px-6 py-3'
          }
        });
        setShowExtendModal(false);
        setSelectedProject(null);
        setNewDeadline('');
        fetchProjects();
      } else {
        await Swal.fire({
          title: '❌ Gagal!',
          text: `Gagal memperpanjang deadline: ${result.message || result.error}`,
          icon: 'error',
          confirmButtonColor: '#dc2626',
          confirmButtonText: 'OK',
          customClass: {
            popup: 'rounded-2xl',
            confirmButton: 'rounded-xl px-6 py-3'
          }
        });
      }
    } catch (error) {
      console.error('Error extending deadline:', error);
      await Swal.fire({
        title: '❌ Terjadi Kesalahan',
        text: 'Terjadi kesalahan saat memperpanjang deadline',
        icon: 'error',
        confirmButtonColor: '#dc2626',
        confirmButtonText: 'OK',
        customClass: {
          popup: 'rounded-2xl',
          confirmButton: 'rounded-xl px-6 py-3'
        }
      });
    }
  };

  const updateProject = async () => {
  console.log('🔧 Starting updateProject...');
  console.log('📋 Selected project:', selectedProject);
  console.log('📝 Edit data:', editData);

  if (!selectedProject || !editData.title.trim() || !editData.description.trim()) {
    console.error('❌ Validation failed:', {
      selectedProject: !!selectedProject,
      title: editData.title.trim(),
      description: editData.description.trim()
    });
    await Swal.fire({
      title: '⚠️ Data Tidak Lengkap',
      text: 'Title dan description harus diisi!',
      icon: 'warning',
      confirmButtonColor: '#eab308',
      confirmButtonText: 'OK',
      customClass: {
        popup: 'rounded-2xl',
        confirmButton: 'rounded-xl px-6 py-3'
      }
    });
    return;
  }

  const requestBody = {
    title: editData.title,
    description: editData.description,
    project_value: parseFloat(editData.project_value),
    worker_id: editData.worker_id,
    deadline: editData.deadline,
    requirements: editData.requirements.filter(req => req.trim() !== '')
  };

  console.log('📤 Request body:', requestBody);

  try {
    console.log('🌐 Making PATCH request to:', `/api/projects/${selectedProject.id}`);

    const response = await fetch(`/api/projects/${selectedProject.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    console.log('📥 Response status:', response.status);

    const result = await response.json();
    console.log('📊 Response data:', result);

    if (response.ok) {
      await Swal.fire({
        title: '✅ Berhasil!',
        text: 'Project berhasil diupdate!',
        icon: 'success',
        confirmButtonColor: '#16a34a',
        confirmButtonText: 'OK',
        timer: 2000,
        customClass: {
          popup: 'rounded-2xl',
          confirmButton: 'rounded-xl px-6 py-3'
        }
      });
      setShowEditModal(false);
      setSelectedProject(null);
      fetchProjects();
    } else {
      console.error('❌ Server error:', result);
      await Swal.fire({
        title: '❌ Gagal Update',
        text: `Gagal update project: ${result.message || result.error}`,
        icon: 'error',
        confirmButtonColor: '#dc2626',
        confirmButtonText: 'OK',
        customClass: {
          popup: 'rounded-2xl',
          confirmButton: 'rounded-xl px-6 py-3'
        }
      });
    }
  } catch (error) {
    console.error('💥 Network error:', error);
    await Swal.fire({
      title: '❌ Terjadi Kesalahan',
      text: 'Terjadi kesalahan saat update project',
      icon: 'error',
      confirmButtonColor: '#dc2626',
      confirmButtonText: 'OK',
      customClass: {
        popup: 'rounded-2xl',
        confirmButton: 'rounded-xl px-6 py-3'
      }
    });
  }
};

  const sendSPK = async (projectId: string) => {
    const result = await Swal.fire({
      title: '📧 Kirim SPK ke Worker?',
      text: 'SPK akan dikirim ke worker untuk persetujuan',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#16a34a',
      cancelButtonColor: '#6b7280',
      confirmButtonText: '📧 Ya, Kirim SPK',
      cancelButtonText: '❌ Batal',
      customClass: {
        popup: 'rounded-2xl',
        confirmButton: 'rounded-xl px-6 py-3',
        cancelButton: 'rounded-xl px-6 py-3'
      }
    });

    if (!result.isConfirmed) return;

    try {
      const response = await fetch(`/api/projects/${projectId}/send-spk`, {
        method: 'POST'
      });

      const apiResult = await response.json();

      if (response.ok) {
        await Swal.fire({
          title: '✅ Berhasil!',
          text: 'SPK berhasil dikirim ke worker!',
          icon: 'success',
          confirmButtonColor: '#16a34a',
          confirmButtonText: 'OK',
          timer: 2000,
          customClass: {
            popup: 'rounded-2xl',
            confirmButton: 'rounded-xl px-6 py-3'
          }
        });
        fetchProjects();
      } else {
        await Swal.fire({
          title: '❌ Gagal Mengirim',
          text: `Gagal mengirim SPK: ${apiResult.message || apiResult.error}`,
          icon: 'error',
          confirmButtonColor: '#dc2626',
          confirmButtonText: 'OK',
          customClass: {
            popup: 'rounded-2xl',
            confirmButton: 'rounded-xl px-6 py-3'
          }
        });
      }
    } catch (error) {
      console.error('Error sending SPK:', error);
      await Swal.fire({
        title: '❌ Terjadi Kesalahan',
        text: 'Terjadi kesalahan saat mengirim SPK',
        icon: 'error',
        confirmButtonColor: '#dc2626',
        confirmButtonText: 'OK',
        customClass: {
          popup: 'rounded-2xl',
          confirmButton: 'rounded-xl px-6 py-3'
        }
      });
    }
  };

  const approveCompletion = async (projectId: string) => {
    const result = await Swal.fire({
      title: '✅ Setujui Penyelesaian?',
      text: 'Project akan ditandai sebagai selesai',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#16a34a',
      cancelButtonColor: '#6b7280',
      confirmButtonText: '✅ Ya, Setujui',
      cancelButtonText: '❌ Batal',
      customClass: {
        popup: 'rounded-2xl',
        confirmButton: 'rounded-xl px-6 py-3',
        cancelButton: 'rounded-xl px-6 py-3'
      }
    });

    if (!result.isConfirmed) return;

    try {
      const response = await fetch(`/api/projects/${projectId}/approve-completion`, {
        method: 'POST'
      });

      const apiResult = await response.json();

      if (response.ok) {
        await Swal.fire({
          title: '✅ Berhasil!',
          text: apiResult.message,
          icon: 'success',
          confirmButtonColor: '#16a34a',
          confirmButtonText: 'OK',
          timer: 2000,
          customClass: {
            popup: 'rounded-2xl',
            confirmButton: 'rounded-xl px-6 py-3'
          }
        });
        setShowDetailModal(false);
        fetchProjects();
      } else {
        await Swal.fire({
          title: '❌ Gagal Menyetujui',
          text: `Gagal menyetujui penyelesaian: ${apiResult.message || apiResult.error}`,
          icon: 'error',
          confirmButtonColor: '#dc2626',
          confirmButtonText: 'OK',
          customClass: {
            popup: 'rounded-2xl',
            confirmButton: 'rounded-xl px-6 py-3'
          }
        });
      }
    } catch (error) {
      console.error('Error approving completion:', error);
      await Swal.fire({
        title: '❌ Terjadi Kesalahan',
        text: 'Terjadi kesalahan saat menyetujui penyelesaian',
        icon: 'error',
        confirmButtonColor: '#dc2626',
        confirmButtonText: 'OK',
        customClass: {
          popup: 'rounded-2xl',
          confirmButton: 'rounded-xl px-6 py-3'
        }
      });
    }
  };

  // Modal handlers
  const openExtendModal = (project: Project) => {
    setSelectedProject(project);
    setShowExtendModal(true);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setNewDeadline(tomorrow.toISOString().split('T')[0]);
  };

  const openDetailModal = (project: Project) => {
    setSelectedProject(project);
    setShowDetailModal(true);
  };

  const openEditModal = (project: Project) => {
    setSelectedProject(project);
    setEditData({
      title: project.title,
      description: project.description,
      project_value: project.project_value.toString(),
      worker_id: project.worker?.id || '',
      deadline: new Date(project.deadline).toISOString().split('T')[0],
      requirements: project.requirements?.length > 0 ? project.requirements : ['']
    });
    setShowEditModal(true);
  };

  // Requirements handlers
  const addRequirement = () => {
    setEditData(prev => ({
      ...prev,
      requirements: [...prev.requirements, '']
    }));
  };

  const removeRequirement = (index: number) => {
    setEditData(prev => ({
      ...prev,
      requirements: prev.requirements.filter((_, i) => i !== index)
    }));
  };

  const updateRequirement = (index: number, value: string) => {
    setEditData(prev => ({
      ...prev,
      requirements: prev.requirements.map((req, i) => i === index ? value : req)
    }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-16 h-16 relative animate-pulse">
            <img src="/betriclogoblue.png" alt="Betric Logo" className="w-full h-full object-contain" />
          </div>
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-900/20 border-t-blue-900"></div>
          <p className="text-blue-900/70 font-medium">Memuat data projects...</p>
        </div>
      </div>
    );
  }

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
              <div className="w-px h-6 bg-blue-200"></div>
              <h1 className="text-xl font-bold text-blue-900">📋 Kelola Projects</h1>
            </div>
            <Link 
              href="/admin/projects/create"
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-2 rounded-xl font-medium transition-all shadow-md hover:shadow-lg flex items-center space-x-2"
            >
              <span>+</span>
              <span>Buat Project Baru</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-blue-900 mb-2">Daftar Projects 📂</h2>
          <p className="text-blue-700/70">Kelola semua project dan tugaskan ke worker</p>
        </div>

        {projects.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-blue-900/10 shadow-lg p-12 text-center">
            <div className="text-6xl mb-4">📂</div>
            <h3 className="text-xl font-bold text-blue-900 mb-2">Belum ada project</h3>
            <p className="text-blue-700/70 mb-6">Mulai dengan membuat project pertama Anda</p>
            <Link 
              href="/admin/projects/create"
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-3 rounded-xl font-semibold transition-all shadow-md hover:shadow-lg inline-flex items-center space-x-2"
            >
              <span>+</span>
              <span>Buat Project Pertama</span>
            </Link>
          </div>
        ) : (
          <ProjectTable
            projects={projects}
            onEdit={openEditModal}
            onExtend={openExtendModal}
            onDetail={openDetailModal}
            onDelete={deleteProject}
            onSendSPK={sendSPK}
          />
        )}
      </main>

      {/* Modals */}
      <ProjectModals
        showDetailModal={showDetailModal}
        setShowDetailModal={setShowDetailModal}
        showEditModal={showEditModal}
        setShowEditModal={setShowEditModal}
        showExtendModal={showExtendModal}
        setShowExtendModal={setShowExtendModal}
        selectedProject={selectedProject}
        setSelectedProject={setSelectedProject}
        editData={editData}
        setEditData={setEditData}
        workers={workers}
        newDeadline={newDeadline}
        setNewDeadline={setNewDeadline}
        onUpdateProject={updateProject}
        onExtendDeadline={extendDeadline}
        onApproveCompletion={approveCompletion}
        addRequirement={addRequirement}
        removeRequirement={removeRequirement}
        updateRequirement={updateRequirement}
      />
    </div>
  );
}