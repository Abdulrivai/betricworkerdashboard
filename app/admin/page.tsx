'use client';

import Link from 'next/link';
import StatsCards from './components/StatsCards';
import RecentProjects from './components/RecentProjects';
import { useDashboardData } from './hooks/useDashboardData';

export default function AdminDashboard() {
  const { stats, recentProjects, isLoading, error } = useDashboardData();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-16 h-16 relative animate-pulse">
            <img src="/betriclogoblue.png" alt="Betric Logo" className="w-full h-full object-contain" />
          </div>
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-900/20 border-t-blue-900"></div>
          <p className="text-blue-900/70 font-medium">Memuat dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-red-800 mb-2">Error Loading Dashboard</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Welcome Section */}
      <div className="mb-6 sm:mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-blue-900 mb-2">Selamat Datang! 👋</h2>
        <p className="text-sm sm:text-base text-blue-700/70">Kelola proyek dan pantau aktivitas worker dari dashboard ini</p>
      </div>

      <div className="space-y-6 sm:space-y-8">
        {/* Stats Cards */}
        <StatsCards stats={stats} />

        {/* Aksi Cepat */}
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-blue-900/10 shadow-lg">
          <div className="flex items-center space-x-2 mb-4 sm:mb-6">
            <span className="text-lg sm:text-xl">⚡</span>
            <h3 className="text-lg sm:text-xl font-bold text-blue-900">Aksi Cepat</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <Link
              href="/admin/projects/create"
              className="group bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white p-4 sm:p-6 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-1"
            >
              <div className="flex items-center space-x-3">
                <div className="text-xl sm:text-2xl group-hover:scale-110 transition-transform">📝</div>
                <div>
                  <h4 className="font-semibold text-sm sm:text-base">Buat Project</h4>
                  <p className="text-blue-100 text-xs sm:text-sm">Tambah project baru</p>
                </div>
              </div>
            </Link>

            <Link
              href="/admin/projects"
              className="group bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white p-4 sm:p-6 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-1"
            >
              <div className="flex items-center space-x-3">
                <div className="text-xl sm:text-2xl group-hover:scale-110 transition-transform">📋</div>
                <div>
                  <h4 className="font-semibold text-sm sm:text-base">Kelola Project</h4>
                  <p className="text-green-100 text-xs sm:text-sm">Edit & monitor project</p>
                </div>
              </div>
            </Link>

            <Link
              href="/admin/workers"
              className="group bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white p-4 sm:p-6 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-1"
            >
              <div className="flex items-center space-x-3">
                <div className="text-xl sm:text-2xl group-hover:scale-110 transition-transform">👥</div>
                <div>
                  <h4 className="font-semibold text-sm sm:text-base">Kelola Workers</h4>
                  <p className="text-purple-100 text-xs sm:text-sm">Monitor performa & history</p>
                </div>
              </div>
            </Link>

            <Link
              href="/admin/reports"
              className="group bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white p-4 sm:p-6 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-1"
            >
              <div className="flex items-center space-x-3">
                <div className="text-xl sm:text-2xl group-hover:scale-110 transition-transform">📊</div>
                <div>
                  <h4 className="font-semibold text-sm sm:text-base">Lihat Laporan</h4>
                  <p className="text-amber-100 text-xs sm:text-sm">Analytics & insights</p>
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* Recent Projects */}
        <RecentProjects projects={recentProjects} />
      </div>
    </div>
  );
}