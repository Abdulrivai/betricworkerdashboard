import { useState, useEffect } from 'react';

interface WorkerInfo {
  id: string;
  full_name: string;
  email: string;
  role: string;
}

// FUNCTION - GET WORKER ID DARI SESSION
function getCurrentWorkerId(): string | null {
  if (typeof window === 'undefined') return null;

  console.log('🔍 Getting current worker ID...');

  // Option 1: Dari localStorage (PRIMARY - set by login page)
  const storedId = localStorage.getItem('current_worker_id');
  if (storedId) {
    console.log('✅ Found worker ID in localStorage:', storedId);
    return storedId;
  }

  // Option 2: Dari user object di localStorage
  const storedUser = localStorage.getItem('current_user');
  if (storedUser) {
    try {
      const user = JSON.parse(storedUser);
      if (user.id && user.role === 'worker') {
        console.log('✅ Found worker ID from user object:', user.id);
        return user.id;
      }
    } catch (e) {
      console.error('Failed to parse stored user:', e);
    }
  }

  // Option 3: Dari URL params (untuk testing)
  const urlParams = new URLSearchParams(window.location.search);
  const urlWorkerId = urlParams.get('worker_id');
  if (urlWorkerId) {
    console.log('✅ Found worker ID in URL:', urlWorkerId);
    return urlWorkerId;
  }

  console.error('❌ No worker ID found anywhere!');
  console.log('📋 localStorage keys:', Object.keys(localStorage));
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

  const handleLogout = async () => {
    try {
      // Call logout API to clear httpOnly cookie
      await fetch('/api/auth/logout', { method: 'POST' });

      // Clear session data
      if (typeof window !== 'undefined') {
        // Clear all user data from localStorage
        localStorage.removeItem('current_user');
        localStorage.removeItem('current_worker_id');
        localStorage.removeItem('worker_id');
        localStorage.removeItem('worker_token');
        sessionStorage.clear();

        // Clear cookies (backup, in case API call fails)
        document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        document.cookie = 'worker_id=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      }

      // Redirect to login
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout error:', error);
      // Still redirect even if API call fails
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