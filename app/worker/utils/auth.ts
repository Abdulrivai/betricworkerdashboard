export function setCurrentWorker(workerId: string, workerData?: any) {
  if (typeof window === 'undefined') return;
  
  // Save to localStorage
  localStorage.setItem('current_worker_id', workerId);
  
  // Save additional data if provided
  if (workerData) {
    localStorage.setItem('worker_data', JSON.stringify(workerData));
  }
  
  // Set cookie with expiration
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + 7); // 7 days
  document.cookie = `worker_id=${workerId}; expires=${expiryDate.toUTCString()}; path=/`;
}

export function getCurrentWorker(): string | null {
  if (typeof window === 'undefined') return null;
  
  return localStorage.getItem('current_worker_id');
}

export function clearCurrentWorker() {
  if (typeof window === 'undefined') return;
  
  localStorage.removeItem('current_worker_id');
  localStorage.removeItem('worker_data');
  document.cookie = 'worker_id=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
}

// Helper function untuk get all user IDs untuk testing
export function getAllWorkerIds() {
  return {
    akbar: 'e94c5b0c-f23a-4bb5-8e3d-b976a22a872a',
    lutfi: '24f7b330-b02a-4595-878f-fb39fc5359df'
  };
}

// Admin helper functions
export function setCurrentAdmin(adminId: string, adminData?: any) {
  if (typeof window === 'undefined') return;
  
  localStorage.setItem('current_admin_id', adminId);
  
  if (adminData) {
    localStorage.setItem('admin_data', JSON.stringify(adminData));
  }
  
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + 7);
  document.cookie = `admin_id=${adminId}; expires=${expiryDate.toUTCString()}; path=/`;
}

export function getCurrentAdmin(): string | null {
  if (typeof window === 'undefined') return null;
  
  return localStorage.getItem('current_admin_id');
}

export function clearCurrentAdmin() {
  if (typeof window === 'undefined') return;
  
  localStorage.removeItem('current_admin_id');
  localStorage.removeItem('admin_data');
  document.cookie = 'admin_id=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
}