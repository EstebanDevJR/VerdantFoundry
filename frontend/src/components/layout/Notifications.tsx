import { useStore } from '@/store/useStore';
import { motion, AnimatePresence } from 'motion/react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

export function Notifications() {
  const { notifications, removeNotification } = useStore();

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 pointer-events-none">
      <AnimatePresence>
        {notifications.map((notification) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
            className="w-80 glass-panel rounded-2xl p-4 shadow-xl border border-white/40 pointer-events-auto flex items-start gap-3 relative overflow-hidden"
          >
            <div className={`absolute left-0 top-0 bottom-0 w-1 ${
              notification.type === 'success' ? 'bg-emerald-500' :
              notification.type === 'error' ? 'bg-red-500' :
              notification.type === 'warning' ? 'bg-amber-500' :
              'bg-blue-500'
            }`} />
            
            <div className="shrink-0 mt-0.5">
              {notification.type === 'success' && <CheckCircle className="w-5 h-5 text-emerald-500" />}
              {notification.type === 'error' && <AlertCircle className="w-5 h-5 text-red-500" />}
              {notification.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-500" />}
              {notification.type === 'info' && <Info className="w-5 h-5 text-blue-500" />}
            </div>
            
            <div className="flex-1 min-w-0 pr-6">
              <h4 className="text-sm font-semibold text-slate-900 truncate">{notification.title}</h4>
              <p className="text-sm text-slate-600 mt-1 line-clamp-2">{notification.message}</p>
            </div>
            
            <button
              onClick={() => removeNotification(notification.id)}
              className="absolute top-3 right-3 p-1 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
