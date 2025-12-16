'use client';

import { formatDateTime } from './../utils/helpers';

interface Notification {
  id: string;
  title: string;
  message: string;
  notification_type: string;
  is_read: boolean;
  created_at: string;
  project_id?: string;
}

interface NotificationListProps {
  notifications: Notification[];
}

export default function NotificationList({ notifications }: NotificationListProps) {
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'NEW_SPK':
        return '📋';
      case 'COMPLETION_APPROVED':
        return '✅';
      case 'PROJECT_REMINDER':
        return '⏰';
      default:
        return '🔔';
    }
  };

  const getNotificationColor = (type: string, isRead: boolean) => {
    if (isRead) return 'bg-gray-50 border-gray-200';
    
    switch (type) {
      case 'NEW_SPK':
        return 'bg-blue-50 border-blue-200';
      case 'COMPLETION_APPROVED':
        return 'bg-emerald-50 border-emerald-200';
      case 'PROJECT_REMINDER':
        return 'bg-amber-50 border-amber-200';
      default:
        return 'bg-purple-50 border-purple-200';
    }
  };

  return (
    <div className="bg-white rounded-2xl border-2 border-blue-200 shadow-lg">
      <div className="p-6 border-b-2 border-blue-100">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-blue-900">Notifications</h2>
          <div className="flex items-center space-x-2">
            <div className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-bold">
              {notifications.filter(n => !n.is_read).length} baru
            </div>
          </div>
        </div>
      </div>
      
      <div className="max-h-96 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="p-8 text-center">
            <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🔔</span>
            </div>
            <p className="text-blue-700/70 font-medium">Belum ada notifikasi</p>
            <p className="text-blue-600/50 text-sm mt-1">Notifikasi akan muncul di sini</p>
          </div>
        ) : (
          <div className="divide-y-2 divide-blue-100">
            {notifications.map((notif) => (
              <div key={notif.id} className={`p-4 transition-all hover:bg-blue-50/50 ${getNotificationColor(notif.notification_type, notif.is_read)}`}>
                <div className="flex items-start space-x-4">
                  {/* Icon */}
                  <div className="flex-shrink-0 w-10 h-10 bg-white rounded-xl border-2 border-blue-200 flex items-center justify-center text-lg">
                    {getNotificationIcon(notif.notification_type)}
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="text-blue-900 font-semibold text-sm leading-tight">
                        {notif.title}
                      </h4>
                      {!notif.is_read && (
                        <div className="flex-shrink-0 w-3 h-3 bg-red-500 rounded-full ml-2 animate-pulse"></div>
                      )}
                    </div>
                    
                    <p className="text-blue-700/80 text-sm mb-3 leading-relaxed">
                      {notif.message}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <div className="text-blue-600/60 text-xs font-medium">
                        {formatDateTime(notif.created_at)}
                      </div>
                      {notif.project_id && (
                        <div className="bg-blue-200 text-blue-800 px-2 py-1 rounded-lg text-xs font-medium">
                          Project Terkait
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}