import { useStore } from '@/store/useStore';
import { motion, AnimatePresence } from 'motion/react';
import { Bot, Activity, Bell, X, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function Sidebar() {
  const { isSidebarOpen, setSidebarOpen, addNotification } = useStore();
  const navigate = useNavigate();

  const handleAgentClick = (agentName: string) => {
    setSidebarOpen(false);
    navigate('/agents');
    addNotification({
      title: "Agent Selected",
      message: `Viewing details for ${agentName}.`,
      type: "info"
    });
  };

  return (
    <AnimatePresence>
      {isSidebarOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40"
            onClick={() => setSidebarOpen(false)}
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 bottom-0 w-80 bg-white/80 backdrop-blur-3xl border-l border-white/40 shadow-2xl z-50 flex flex-col"
          >
            <div className="flex items-center justify-between p-6 border-b border-slate-200/50">
              <h2 className="text-lg font-semibold text-slate-900">System Activity</h2>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
              {/* Active Agents */}
              <div>
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Bot className="w-4 h-4" />
                  Active Agents
                </h3>
                <div className="space-y-3">
                  {['Alpha-7', 'Beta-2', 'Gamma-1'].map((agent, i) => (
                    <div 
                      key={i} 
                      onClick={() => handleAgentClick(agent)}
                      className="flex items-center justify-between group cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-sm font-medium text-slate-700 group-hover:text-primary-dark transition-colors">{agent}</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-primary-dark transition-colors" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Notifications */}
              <div>
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Bell className="w-4 h-4" />
                  Notifications
                </h3>
                <div className="space-y-4">
                  {[
                    { title: 'Research Completed', time: '2m ago', type: 'success' },
                    { title: 'Tool Error: Database', time: '15m ago', type: 'error' },
                    { title: 'New Agent Deployed', time: '1h ago', type: 'info' },
                  ].map((notif, i) => (
                    <div key={i} className="flex gap-3">
                      <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${
                        notif.type === 'success' ? 'bg-emerald-500' :
                        notif.type === 'error' ? 'bg-red-500' :
                        'bg-blue-500'
                      }`} />
                      <div>
                        <div className="text-sm font-medium text-slate-800">{notif.title}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{notif.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* System Load */}
              <div>
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  System Load
                </h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-slate-600 font-medium">CPU</span>
                      <span className="text-slate-900 font-mono">24%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-primary w-[24%]" />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-slate-600 font-medium">Memory</span>
                      <span className="text-slate-900 font-mono">4.2 GB</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 w-[45%]" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
