import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useStore } from '@/store/useStore';
import { 
  Cpu, 
  Play, 
  Pause, 
  Square, 
  RotateCcw, 
  Clock, 
  Activity, 
  ListTree, 
  AlignLeft, 
  MoreVertical,
  Zap,
  HardDrive
} from 'lucide-react';

export function ProcessManager() {
  const { addNotification } = useStore();
  const [viewMode, setViewMode] = useState<'list' | 'tree'>('list');
  const [processes, setProcesses] = useState([
    { id: 'P-101', name: 'Alpha-7', role: 'Deep Search', status: 'running', cpu: 45, mem: 1.2, time: '02:15:30', priority: 'High' },
    { id: 'P-102', name: 'Beta-2', role: 'Synthesis', status: 'paused', cpu: 0, mem: 0.8, time: '00:45:12', priority: 'Normal' },
    { id: 'P-103', name: 'Gamma-9', role: 'Data Extraction', status: 'queued', cpu: 0, mem: 0, time: '00:00:00', priority: 'Low' },
    { id: 'P-104', name: 'Delta-X', role: 'System Monitor', status: 'running', cpu: 12, mem: 0.4, time: '14:20:05', priority: 'Critical' },
  ]);

  const toggleStatus = (id: string, newStatus: string) => {
    setProcesses(processes.map(p => p.id === id ? { ...p, status: newStatus } : p));
    addNotification({
      title: `Process ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}`,
      message: `Process ${id} is now ${newStatus}.`,
      type: newStatus === 'running' ? 'success' : 'warning'
    });
  };

  const handleRestart = (id: string) => {
    addNotification({
      title: "Process Restarting",
      message: `Restarting process ${id}...`,
      type: "info"
    });
  };

  const handleTerminate = (id: string) => {
    addNotification({
      title: "Process Terminated",
      message: `Process ${id} has been terminated.`,
      type: "error"
    });
    setProcesses(processes.filter(p => p.id !== id));
  };

  const handleStartNew = () => {
    addNotification({
      title: "New Process",
      message: "Opening new process configuration...",
      type: "info"
    });
  };

  return (
    <div className="flex flex-col h-full gap-6">
      <div className="flex items-center justify-between glass-panel p-4 rounded-3xl border border-white/40 flex-shrink-0">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Cpu className="w-5 h-5 text-primary" /> Agent Process Manager
          </h2>
          <div className="h-6 w-px bg-slate-200 mx-2" />
          <div className="flex gap-2">
            <button 
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-primary/10 text-primary-dark' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              <AlignLeft className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setViewMode('tree')}
              className={`p-2 rounded-lg transition-colors ${viewMode === 'tree' ? 'bg-primary/10 text-primary-dark' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              <ListTree className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={handleStartNew}
            className="px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 transition-colors shadow-md shadow-slate-900/10 flex items-center gap-2"
          >
            <Play className="w-4 h-4" /> Start New Process
          </button>
        </div>
      </div>

      <div className="flex-1 glass-panel rounded-3xl border border-white/40 overflow-hidden flex flex-col min-h-0">
        <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-slate-100 bg-slate-50/50 text-xs font-semibold text-slate-500 uppercase tracking-wider">
          <div className="col-span-3">Process Name</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-2">CPU (Eq)</div>
          <div className="col-span-2">Memory (Eq)</div>
          <div className="col-span-2">Exec Time</div>
          <div className="col-span-1 text-right">Actions</div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 custom-scrollbar space-y-2">
          <AnimatePresence>
            {processes.map((process, i) => (
              <motion.div 
                key={process.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.05 }}
                className="grid grid-cols-12 gap-4 px-4 py-3 items-center bg-white/60 border border-slate-200 rounded-2xl hover:border-primary/30 hover:shadow-sm transition-all group"
              >
                <div className="col-span-3 flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    process.status === 'running' ? 'bg-emerald-50 text-emerald-600' :
                    process.status === 'paused' ? 'bg-amber-50 text-amber-600' :
                    'bg-slate-100 text-slate-500'
                  }`}>
                    <Cpu className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900 flex items-center gap-2">
                      {process.name}
                      <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">{process.id}</span>
                    </div>
                    <div className="text-xs text-slate-500">{process.role}</div>
                  </div>
                </div>

                <div className="col-span-2 flex items-center gap-2">
                  <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${
                    process.status === 'running' ? 'bg-emerald-100 text-emerald-700' :
                    process.status === 'paused' ? 'bg-amber-100 text-amber-700' :
                    'bg-slate-100 text-slate-600'
                  }`}>
                    {process.status === 'running' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />}
                    {process.status}
                  </span>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                    process.priority === 'Critical' ? 'bg-red-50 text-red-600 border border-red-200' :
                    process.priority === 'High' ? 'bg-orange-50 text-orange-600 border border-orange-200' :
                    'bg-slate-50 text-slate-500 border border-slate-200'
                  }`}>
                    {process.priority}
                  </span>
                </div>

                <div className="col-span-2 flex items-center gap-3">
                  <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full ${process.cpu > 80 ? 'bg-red-500' : process.cpu > 50 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${process.cpu}%` }} />
                  </div>
                  <span className="text-xs font-mono font-medium text-slate-700 w-8">{process.cpu}%</span>
                </div>

                <div className="col-span-2 flex items-center gap-3">
                  <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500" style={{ width: `${(process.mem / 4) * 100}%` }} />
                  </div>
                  <span className="text-xs font-mono font-medium text-slate-700 w-12">{process.mem}GB</span>
                </div>

                <div className="col-span-2 flex items-center gap-2 text-slate-600 font-mono text-xs">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  {process.time}
                </div>

                <div className="col-span-1 flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {process.status === 'running' ? (
                    <button onClick={() => toggleStatus(process.id, 'paused')} className="p-1.5 rounded-md text-amber-600 hover:bg-amber-50 transition-colors" title="Pause">
                      <Pause className="w-4 h-4" />
                    </button>
                  ) : (
                    <button onClick={() => toggleStatus(process.id, 'running')} className="p-1.5 rounded-md text-emerald-600 hover:bg-emerald-50 transition-colors" title="Resume">
                      <Play className="w-4 h-4" />
                    </button>
                  )}
                  <button 
                    onClick={() => handleRestart(process.id)}
                    className="p-1.5 rounded-md text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors" 
                    title="Restart"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleTerminate(process.id)}
                    className="p-1.5 rounded-md text-red-500 hover:bg-red-50 transition-colors" 
                    title="Terminate"
                  >
                    <Square className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
