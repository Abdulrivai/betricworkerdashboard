'use client';

import Link from 'next/link';

export default function QuickActions() {
  const actions = [
    {
      title: "Buat SPK Baru",
      description: "Tambah proyek dan kirim ke worker",
      href: "/admin/projects/create",
      color: "from-blue-900 to-blue-700 hover:from-blue-800 hover:to-blue-600",
      icon: "📝"
    },
    {
      title: "Kelola Proyek",
      description: "Monitor status dan deadline",
      href: "/admin/projects",
      color: "from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400",
      icon: "📋"
    },
    {
      title: "Kelola Worker",
      description: "Lihat performa dan tugas",
      href: "/admin/workers",
      color: "from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400",
      icon: "👥"
    },
    {
      title: "Informasi Pembayaran",
      description: "Rekap pembayaran tanggal 14",
      href: "/admin/payments",
      color: "from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400",
      icon: "💰"
    }
  ];

  return (
    <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-blue-900/10 shadow-lg">
      <div className="flex items-center space-x-2 mb-6">
        <span className="text-xl">🚀</span>
        <h3 className="text-xl font-bold text-blue-900">Aksi Cepat</h3>
      </div>
      <div className="space-y-4">
        {actions.map((action, index) => (
          <Link key={index} href={action.href}>
            <button className={`w-full bg-gradient-to-r ${action.color} text-white p-4 rounded-xl transition-all duration-200 text-left flex items-center space-x-4 shadow-md hover:shadow-lg group`}>
              <div className="bg-white/20 p-2 rounded-lg group-hover:bg-white/30 transition-colors">
                <span className="text-lg">{action.icon}</span>
              </div>
              <div>
                <p className="font-semibold">{action.title}</p>
                <p className="text-sm opacity-90">{action.description}</p>
              </div>
            </button>
          </Link>
        ))}
      </div>
    </div>
  );
}