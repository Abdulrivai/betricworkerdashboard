export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

export const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const formatDateRange = (startDate: string, endDate: string): string => {
  const start = formatDate(startDate);
  const end = formatDate(endDate);
  return `${start} - ${end}`;
};

export const getStatusColor = (status: string) => {
  const statusColors: Record<string, string> = {
    'WAITING_WORKER_APPROVAL': 'bg-yellow-500/20 text-yellow-800 border-yellow-500/30',
    'COMPLETION_REQUESTED': 'bg-purple-500/20 text-purple-800 border-purple-500/30',
    'DONE_ON_TIME': 'bg-green-500/20 text-green-800 border-green-500/30',
    'DONE_LATE': 'bg-orange-500/20 text-orange-800 border-orange-500/30',
    'ACTIVE': 'bg-blue-500/20 text-blue-800 border-blue-500/30',
    'CANCELLED': 'bg-red-500/20 text-red-800 border-red-500/30',
    'DRAFT_SPK': 'bg-gray-500/20 text-gray-800 border-gray-500/30',
    'pending': 'bg-yellow-500/20 text-yellow-800 border-yellow-500/30',
    'paid': 'bg-green-500/20 text-green-800 border-green-500/30',
    'overdue': 'bg-red-500/20 text-red-800 border-red-500/30'
  };

  return statusColors[status] || 'bg-gray-500/20 text-gray-800 border-gray-500/30';
};

export const getStatusText = (status: string): string => {
  const statusTexts: Record<string, string> = {
    'WAITING_WORKER_APPROVAL': '⏳ Menunggu Approval',
    'COMPLETION_REQUESTED': '🔔 Request Selesai',
    'DONE_ON_TIME': '✅ Selesai Tepat Waktu',
    'DONE_LATE': '⚠️ Selesai Terlambat',
    'ACTIVE': '🔄 Sedang Berjalan',
    'CANCELLED': '❌ Dibatalkan',
    'DRAFT_SPK': '📝 Draft SPK',
    'pending': '⏳ Menunggu Pembayaran',
    'paid': '✅ Sudah Dibayar',
    'overdue': '🚨 Terlambat Bayar'
  };
  return statusTexts[status] || status;
};

// ...existing code...

export const getStatusBgColor = (status: string): string => {
  const bgColors: Record<string, string> = {
    'WAITING_WORKER_APPROVAL': 'bg-yellow-500/20',
    'COMPLETION_REQUESTED': 'bg-purple-500/20',
    'DONE_ON_TIME': 'bg-green-500/20',
    'DONE_LATE': 'bg-orange-500/20',
    'ACTIVE': 'bg-blue-500/20',
    'CANCELLED': 'bg-red-500/20',
    'DRAFT_SPK': 'bg-gray-500/20',
    'pending': 'bg-yellow-500/20',
    'paid': 'bg-green-500/20',
    'overdue': 'bg-red-500/20'
  };
  return bgColors[status] || 'bg-gray-500/20';
};

// ...existing code...

export const calculateDaysFromNow = (dateString: string): number => {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

export const isOverdue = (deadlineString: string): boolean => {
  return calculateDaysFromNow(deadlineString) < 0;
};

export const getDeadlineStatus = (deadlineString: string) => {
  const daysLeft = calculateDaysFromNow(deadlineString);
  
  if (daysLeft < 0) {
    return {
      text: `Terlambat ${Math.abs(daysLeft)} hari`,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200'
    };
  } else if (daysLeft === 0) {
    return {
      text: 'Deadline hari ini',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200'
    };
  } else if (daysLeft <= 3) {
    return {
      text: `${daysLeft} hari lagi`,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200'
    };
  } else {
    return {
      text: `${daysLeft} hari lagi`,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    };
  }
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

export const generateProjectId = (): string => {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 8);
  return `PRJ-${timestamp}-${randomStr}`.toUpperCase();
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};