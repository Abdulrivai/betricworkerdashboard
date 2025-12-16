'use client';

interface Stats {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  totalWorkers: number;
  pendingApprovals: number;
  totalValue: number;
  onTimeCompletion: number;
  lateCompletion: number;
}

interface StatsCardsProps {
  stats: Stats;
}

export default function StatsCards({ stats }: StatsCardsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <span className="text-xl">📊</span>
        <h3 className="text-xl font-bold text-blue-900">Statistik Overview</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Projects */}
        <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 border border-blue-100 shadow-lg hover:shadow-xl transition-all">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center text-white text-xl shadow-lg">
              📋
            </div>
            <div>
              <h4 className="text-blue-900 font-semibold text-sm">Total Projects</h4>
              <p className="text-2xl font-bold text-blue-800">{stats.totalProjects}</p>
              <p className="text-xs text-blue-600/60">Semua project</p>
            </div>
          </div>
        </div>

        {/* Active Projects */}
        <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 border border-blue-100 shadow-lg hover:shadow-xl transition-all">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-green-500 to-green-600 flex items-center justify-center text-white text-xl shadow-lg">
              🔥
            </div>
            <div>
              <h4 className="text-blue-900 font-semibold text-sm">Projects Aktif</h4>
              <p className="text-2xl font-bold text-blue-800">{stats.activeProjects}</p>
              <p className="text-xs text-blue-600/60">Sedang dikerjakan</p>
            </div>
          </div>
        </div>

        {/* Completed Projects */}
        <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 border border-blue-100 shadow-lg hover:shadow-xl transition-all">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 flex items-center justify-center text-white text-xl shadow-lg">
              ✅
            </div>
            <div>
              <h4 className="text-blue-900 font-semibold text-sm">Projects Selesai</h4>
              <p className="text-2xl font-bold text-blue-800">{stats.completedProjects}</p>
              <p className="text-xs text-blue-600/60">Sudah completed</p>
            </div>
          </div>
        </div>

        {/* Total Workers */}
        <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 border border-blue-100 shadow-lg hover:shadow-xl transition-all">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 flex items-center justify-center text-white text-xl shadow-lg">
              👥
            </div>
            <div>
              <h4 className="text-blue-900 font-semibold text-sm">Total Workers</h4>
              <p className="text-2xl font-bold text-blue-800">{stats.totalWorkers}</p>
              <p className="text-xs text-blue-600/60">Worker terdaftar</p>
            </div>
          </div>
        </div>

        {/* Pending Approvals */}
        <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 border border-blue-100 shadow-lg hover:shadow-xl transition-all">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 flex items-center justify-center text-white text-xl shadow-lg">
              ⏳
            </div>
            <div>
              <h4 className="text-blue-900 font-semibold text-sm">Pending Approval</h4>
              <p className="text-2xl font-bold text-blue-800">{stats.pendingApprovals}</p>
              <p className="text-xs text-blue-600/60">Menunggu approval</p>
            </div>
          </div>
        </div>

        {/* Total Value - Span 2 columns */}
        <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 border border-blue-100 shadow-lg hover:shadow-xl transition-all lg:col-span-2">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 flex items-center justify-center text-white text-xl shadow-lg">
              💰
            </div>
            <div>
              <h4 className="text-blue-900 font-semibold text-sm">Total Nilai Project</h4>
              <p className="text-3xl font-bold text-blue-800">{formatCurrency(stats.totalValue)}</p>
              <p className="text-xs text-blue-600/60">Nilai keseluruhan project</p>
            </div>
          </div>
        </div>

        {/* On Time Completion */}
        <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 border border-blue-100 shadow-lg hover:shadow-xl transition-all">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-teal-500 to-teal-600 flex items-center justify-center text-white text-xl shadow-lg">
              📈
            </div>
            <div>
              <h4 className="text-blue-900 font-semibold text-sm">Tepat Waktu</h4>
              <p className="text-2xl font-bold text-blue-800">{stats.onTimeCompletion}</p>
              <p className="text-xs text-blue-600/60">Selesai on time</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}