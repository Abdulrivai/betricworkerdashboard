'use client';

import { useRouter } from 'next/navigation';
import Sidebar from './components/Sidebar';
import Header from './components/Header';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });

      if (typeof window !== 'undefined') {
        localStorage.clear();
        sessionStorage.clear();
        document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      }

      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
      router.push('/login');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header di atas */}
      <Header onLogout={handleLogout} />

      {/* Container untuk Sidebar + Content */}
      <div className="flex pt-16">
        {/* Sidebar di kiri */}
        <Sidebar onLogout={handleLogout} />

        {/* Main Content di kanan - responsive padding */}
        <main className="flex-1 lg:ml-64 p-4 sm:p-6 lg:p-8 w-full">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
