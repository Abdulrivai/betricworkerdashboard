export const getStatusBadge = (status: string) => {
  const statusColors = {
    'DRAFT_SPK': 'bg-yellow-500/20 text-yellow-800 border-yellow-500/30',
    'WAITING_WORKER_APPROVAL': 'bg-blue-500/20 text-blue-800 border-blue-500/30',
    'ACTIVE': 'bg-green-500/20 text-green-800 border-green-500/30',
    'REJECTED_BY_WORKER': 'bg-red-500/20 text-red-800 border-red-500/30',
    'COMPLETION_REQUESTED': 'bg-purple-500/20 text-purple-800 border-purple-500/30',
    'DONE_ON_TIME': 'bg-emerald-500/20 text-emerald-800 border-emerald-500/30',
    'DONE_LATE': 'bg-orange-500/20 text-orange-800 border-orange-500/30'
  };
  return statusColors[status as keyof typeof statusColors] || 'bg-gray-500/20 text-gray-800 border-gray-500/30';
};

export const getStatusText = (status: string) => {
  switch (status) {
    case 'DRAFT_SPK': return 'Draft SPK';
    case 'WAITING_WORKER_APPROVAL': return 'Menunggu Approval';
    case 'ACTIVE': return 'Sedang Dikerjakan';
    case 'REJECTED_BY_WORKER': return 'Ditolak Worker';
    case 'COMPLETION_REQUESTED': return 'Request Selesai';
    case 'DONE_ON_TIME': return 'Selesai Tepat Waktu';
    case 'DONE_LATE': return 'Selesai Terlambat';
    default: return status.replace(/_/g, ' ');
  }
};

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(amount);
};

export const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};