'use client';

interface DashboardStats {
  totalProjects: number;
  draftSpk: number;
  waitingApproval: number;
  activeProjects: number;
  completionRequests: number;
  completedProjects: number;
  totalWorkers: number;
  pendingPayments: number;
}

interface StatsGridProps {
  stats: DashboardStats;
}

export default function StatsGrid({ stats }: StatsGridProps) {
  const statsCards = [
    {
      title: "Total Proyek",
      value: stats.totalProjects,
      color: "blue",
      icon: "📊"
    },
    {
      title: "Menunggu Respon",
      value: stats.waitingApproval,
      color: "amber",
      icon: "⏳"
    },
    {
      title: "Proyek Aktif",
      value: stats.activeProjects,
      color: "emerald", 
      icon: "⚡"
    },
    {
      title: "Pengajuan Selesai",
      value: stats.completionRequests,
      color: "purple",
      icon: "🎯"
    }
  ];

  const getCardColors = (color: string) => {
    switch (color) {
      case 'blue':
        return {
          bg: 'bg-white/60',
          border: 'border-blue-900/10',
          textPrimary: 'text-blue-900',
          textSecondary: 'text-blue-700/80',
          iconBg: 'bg-blue-900/10',
          iconColor: 'text-blue-900'
        };
      case 'amber':
        return {
          bg: 'bg-white/60',
          border: 'border-amber-500/20',
          textPrimary: 'text-amber-800',
          textSecondary: 'text-amber-700/80',
          iconBg: 'bg-amber-500/10',
          iconColor: 'text-amber-700'
        };
      case 'emerald':
        return {
          bg: 'bg-white/60',
          border: 'border-emerald-500/20',
          textPrimary: 'text-emerald-800',
          textSecondary: 'text-emerald-700/80',
          iconBg: 'bg-emerald-500/10',
          iconColor: 'text-emerald-700'
        };
      case 'purple':
        return {
          bg: 'bg-white/60',
          border: 'border-purple-500/20',
          textPrimary: 'text-purple-800',
          textSecondary: 'text-purple-700/80',
          iconBg: 'bg-purple-500/10',
          iconColor: 'text-purple-700'
        };
      default:
        return {
          bg: 'bg-white/60',
          border: 'border-gray-200',
          textPrimary: 'text-gray-800',
          textSecondary: 'text-gray-600',
          iconBg: 'bg-gray-100',
          iconColor: 'text-gray-600'
        };
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {statsCards.map((card, index) => {
        const colors = getCardColors(card.color);
        return (
          <div
            key={index}
            className={`${colors.bg} backdrop-blur-sm rounded-2xl p-6 border ${colors.border} shadow-lg hover:shadow-xl transition-all duration-300`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className={`${colors.textSecondary} text-sm font-medium`}>{card.title}</p>
                <p className={`text-2xl font-bold ${colors.textPrimary}`}>{card.value}</p>
              </div>
              <div className={`${colors.iconBg} p-3 rounded-xl`}>
                <span className="text-2xl">{card.icon}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}