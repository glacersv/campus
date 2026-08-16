import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, Check, CheckCheck, X } from 'lucide-react';
import { useNotifications } from '../../contexts/NotificationsContext';

export default function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, markAsRead, markAllAsRead, unreadCount } = useNotifications();

  const getTypeStyles = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'warning':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'error':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-blue-50 text-blue-700 border-blue-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'success':
        return '✅';
      case 'warning':
        return '⚠️';
      case 'error':
        return '❌';
      default:
        return 'ℹ️';
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl hover:bg-slate-100/80 transition-colors group dark:hover:bg-slate-700/60"
        aria-label="Notificaciones"
      >
        <Bell className="w-5 h-5 text-slate-600 transition-colors group-hover:text-slate-900 dark:text-slate-300 dark:group-hover:text-white" />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </motion.span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ type: 'spring', bounce: 0.1 }}
              className="absolute right-0 top-full mt-2 w-96 overflow-hidden rounded-2xl border border-white/60 bg-white/80 backdrop-blur-xl shadow-premium-lg z-50 dark:border-slate-700/60 dark:bg-slate-900/90"
            >
              {/* Header */}
              <div className="p-4 border-b border-slate-100 flex items-center justify-between dark:border-slate-700/60">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Notificaciones</h3>
                  <p className="text-xs text-slate-500">{unreadCount} sin leer</p>
                </div>
                <div className="flex items-center gap-1">
                  {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="p-1.5 rounded-lg hover:bg-slate-100/80 transition-colors dark:hover:bg-slate-700/60"
                        title="Marcar todas como leídas"
                      >
                        <CheckCheck className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                    </button>
                  )}
                      <button
                        onClick={() => setIsOpen(false)}
                        className="p-1.5 rounded-lg hover:bg-slate-100/80 transition-colors dark:hover:bg-slate-700/60"
                      >
                        <X className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                  </button>
                </div>
              </div>

              {/* Notifications List */}
              <div className="max-h-[400px] overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center">
                    <Bell className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="text-sm text-slate-500">No hay notificaciones</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
                    {notifications.map((notification, index) => (
                      <motion.div
                        key={notification.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`p-4 hover:bg-slate-50/80 transition-colors cursor-pointer dark:hover:bg-slate-700/60 ${
                          !notification.read ? 'bg-blue-50/30' : ''
                        }`}
                        onClick={() => markAsRead(notification.id)}
                      >
                        <div className="flex gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${getTypeStyles(notification.type)}`}>
                            <span className="text-sm">{getTypeIcon(notification.type)}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <h4 className="text-sm font-semibold text-slate-900 truncate dark:text-slate-100">
                                {notification.title}
                              </h4>
                              {!notification.read && (
                                <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1" />
                              )}
                            </div>
                            <p className="text-xs text-slate-600 mt-0.5 line-clamp-2 dark:text-slate-300">
                              {notification.message}
                            </p>
                            <p className="text-[10px] text-slate-400 mt-1">
                              {notification.createdAt.toLocaleTimeString('es-SV', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              {notifications.length > 0 && (
                <div className="p-3 border-t border-slate-100 bg-slate-50/80 dark:border-slate-700/60 dark:bg-slate-800/60">
                  <button className="w-full text-xs font-semibold text-primary hover:text-primary-dark transition-colors py-2">
                    Ver todas las notificaciones
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
