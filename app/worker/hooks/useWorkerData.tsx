import { useState, useEffect } from 'react';

interface WorkerInfo {
  id: string;
  full_name: string;
  email: string;
  role: string;
}

interface DashboardData {
  worker: WorkerInfo;
  projects: any[];
  notifications: any[];
  stats: {
    total_projects: number;
    active_projects: number;
    completed_projects: number;
    unread_notifications: number;
  };
}

// FUNCTION BARU - UNTUK GET WORKER ID DARI SESSION
function getCurrentWorkerId(): string | null {
  if (typeof window === 'undefined') return null;
  
  // Option 1: Dari localStorage
  const storedId = localStorage.getItem('current_worker_id');
  if (storedId) return storedId;
  
  // Option 2: Dari URL params (untuk testing)
  const urlParams = new URLSearchParams(window.location.search);
  const urlWorkerId = urlParams.get('worker_id');
  if (urlWorkerId) return urlWorkerId;
  
  // Option 3: Dari cookies
  const cookies = document.cookie.split('; ');
  for (let cookie of cookies) {
    if (cookie.startsWith('worker_id=')) {
      return cookie.split('=')[1];
    }
  }
  
  // Fallback untuk testing - nanti hapus ini
  return null;
}

export function useWorkerData() {
  const [projects, setProjects] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [workerInfo, setWorkerInfo] = useState<WorkerInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // GET WORKER ID DARI SESSION - BUKAN HARDCODE
      const workerId = getCurrentWorkerId();
      
      if (!workerId) {
        throw new Error('Worker ID tidak ditemukan. Silakan login ulang.');
      }
      
      console.log('🔍 Fetching dashboard for worker ID:', workerId);
      
      const response = await fetch(`/api/worker-dashboard?worker_id=${workerId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      // Set data dari API
      setWorkerInfo(data.worker || null);
      setProjects(data.projects || []);
      setNotifications(data.notifications || []);
      
      console.log('✅ Dashboard data loaded for:', data.worker?.full_name);
      
    } catch (error: any) {
      console.error('Dashboard fetch error:', error);
      setError(error.message);
      
      // Jika error karena no worker ID, redirect ke login
      if (error.message.includes('Worker ID tidak ditemukan')) {
        window.location.href = '/login';
        return;
      }
      
      // Set fallback data on other errors
      setWorkerInfo(null);
      setProjects([]);
      setNotifications([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // ...existing code...
const handleProjectAction = async (projectId: string, action: string) => {
  try {
    console.log('Project action:', action, 'for project:', projectId);

    // Jika aksi worker adalah "SELESAI" (misal: 'REQUEST_DONE'), ubah action jadi 'REQUEST_ADMIN_APPROVAL'
    let finalAction = action;
    if (action === 'REQUEST_DONE' || action === 'DONE') {
      finalAction = 'REQUEST_ADMIN_APPROVAL'; // pastikan backend mengenali action ini
    }

    const response = await fetch(`/api/projects/${projectId}/worker-response`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        action: finalAction,
        worker_id: workerInfo?.id 
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to update project');
    }

    // Refresh data after successful action
    await fetchDashboardData();
    
  } catch (error: any) {
    console.error('Project action error:', error);
    setError(error.message);
  }
};
// ...existing code...

  const handleLogout = () => {
    try {
      // Clear session data
      if (typeof window !== 'undefined') {
        localStorage.removeItem('worker_id');
        localStorage.removeItem('current_worker_id');
        localStorage.removeItem('worker_token');
        sessionStorage.clear();
        
        // Clear cookies
        document.cookie = 'worker_id=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      }
      
      // Redirect to login
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout error:', error);
      window.location.href = '/login';
    }
  };

  return {
    projects,
    notifications,
    workerInfo,
    isLoading,
    error,
    handleProjectAction,
    handleLogout,
    refreshData: fetchDashboardData
  };
}