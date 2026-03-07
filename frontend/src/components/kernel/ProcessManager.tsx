import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useStore } from '@/store/useStore';
import { kernel } from '@/lib/api';
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
  HardDrive,
  Loader2
} from 'lucide-react';

interface Process {
  id: string;
  name: string;
  role: string;
  status: string;
  cpu: number;
  mem: number;
  time: string;
  priority: string;
}

function mapProcess(raw: Record<string, unknown>): Process {
  return {
    id: String(raw.id ?? raw.pid ?? ''),
    name: String(raw.name ?? raw.agent ?? raw.id ?? ''),
    role: String(raw.role ?? raw.type ?? 'Unknown'),
    status: String(raw.status ?? 'unknown'),
    cpu: Number(raw.cpu ?? raw.cpuUsage ?? raw.cpu_usage ?? 0),
    mem: Number(raw.mem ?? raw.memory ?? raw.memoryGB ?? raw.memory_gb ?? 0),
    time: String(raw.time ?? raw.execTime ?? raw.exec_time ?? raw.uptime ?? '00:00:00'),
    priority: String(raw.priority ?? 'Normal'),
  };
}

export function ProcessManager() {
  const { addNotification } = useStore();
  const [viewMode, setViewMode] = useState<'list' | 'tree'>('list');
  const [processes, setProcesses] = useState<Process[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProcesses = useCallback(async () => {
    try {
      const data = await kernel.getProcesses();
      setProcesses(data.map(mapProcess));
    } catch {
      /* keep stale data */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProcesses();
  }, [fetchProcesses]);

  const handleAction = async (id: string, action: string) => {
    try {
      await kernel.processAction(id, action);
      const labelMap: Record<string, string> = { pause: 'paused', resume: 'running', terminate: 'terminated', restart: 'restarting' };
      const newStatus = labelMap[action] ?? action;

      if (action === 'terminate') {
        setProcesses((prev) => prev.filter((p) => p.id !== id));
      } else {
        setProcesses((prev) => prev.map((p) => (p.id === id ? { ...p, status: newStatus } : p)));
      }

      addNotification({
        title: `Process ${action.charAt(0).toUpperCase() + action.slice(1)}`,
        message: `Process ${id} action "${action}" succeeded.`,
        type: action === 'terminate' ? 'error' : action === 'pause' ? 'warning' : 'success',
      });
    } catch {
      addNotification({ title: 'Action Failed', message: `Failed to ${action} process ${id}.`, type: 'error' });
    }
  };

  const handleStartNew = () => {
    addNotification({ title: 'New Process', message: 'Opening new process configuration...', type: 'info' });
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
          {loading ? (
            <div className="flex items-center justify-center h-32 text-slate-400 gap-2">
              <Loader2 className="w-5 h-5 animate-spin" /> Loading processes…
            </div>
          ) : processes.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-slate-400">No processes found</div>
          ) : (
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
                      <button onClick={() => handleAction(process.id, 'pause')} className="p-1.5 rounded-md text-amber-600 hover:bg-amber-50 transition-colors" title="Pause">
                        <Pause className="w-4 h-4" />
                      </button>
                    ) : (
                      <button onClick={() => handleAction(process.id, 'resume')} className="p-1.5 rounded-md text-emerald-600 hover:bg-emerald-50 transition-colors" title="Resume">
                        <Play className="w-4 h-4" />
                      </button>
                    )}
                    <button 
                      onClick={() => handleAction(process.id, 'restart')}
                      className="p-1.5 rounded-md text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors" 
                      title="Restart"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleAction(process.id, 'terminate')}
                      className="p-1.5 rounded-md text-red-500 hover:bg-red-50 transition-colors" 
                      title="Terminate"
                    >
                      <Square className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  );
}
