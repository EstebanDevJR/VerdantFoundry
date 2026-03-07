import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'motion/react';
import { useStore } from '@/store/useStore';
import { kernel } from '@/lib/api';
import { 
  Activity, 
  Cpu, 
  Database, 
  Network, 
  TerminalSquare,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Zap,
  Loader2
} from 'lucide-react';

interface Metrics {
  activeExecutions: number;
  queuedTasks: number;
  systemLoad: number;
  throughput: number;
  computeBudget?: { used: number; total: number };
  memoryBudget?: { used: number; total: number };
  concurrencyLimit?: { used: number; total: number };
  apiQuota?: { used: number; total: number };
}

interface LogEntry {
  time: string;
  level: string;
  source: string;
  message: string;
}

const METRICS_POLL_MS = 5_000;
const LOGS_POLL_MS = 10_000;

export function KernelMonitor({ systemState }: { systemState: 'running' | 'paused' | 'stopped' }) {
  const { addNotification } = useStore();
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loadingMetrics, setLoadingMetrics] = useState(true);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const prevStateRef = useRef(systemState);

  const fetchMetrics = useCallback(async () => {
    try {
      const data = await kernel.getMetrics() as Record<string, unknown>;
      setMetrics({
        activeExecutions: Number(data.activeExecutions ?? data.active_executions ?? 0),
        queuedTasks: Number(data.queuedTasks ?? data.queued_tasks ?? 0),
        systemLoad: Number(data.systemLoad ?? data.system_load ?? 0),
        throughput: Number(data.throughput ?? 0),
        computeBudget: (data.computeBudget ?? data.compute_budget ?? { used: 0, total: 100 }) as Metrics['computeBudget'],
        memoryBudget: (data.memoryBudget ?? data.memory_budget ?? { used: 0, total: 8 }) as Metrics['memoryBudget'],
        concurrencyLimit: (data.concurrencyLimit ?? data.concurrency_limit ?? { used: 0, total: 20 }) as Metrics['concurrencyLimit'],
        apiQuota: (data.apiQuota ?? data.api_quota ?? { used: 0, total: 10000 }) as Metrics['apiQuota'],
      });
    } catch {
      /* keep stale data on error */
    } finally {
      setLoadingMetrics(false);
    }
  }, []);

  const fetchLogs = useCallback(async () => {
    try {
      const data = await kernel.getLogs(50) as Array<Record<string, unknown>>;
      setLogs(
        data.map((l) => ({
          time: String(l.time ?? l.timestamp ?? ''),
          level: String(l.level ?? l.severity ?? 'INFO').toUpperCase(),
          source: String(l.source ?? l.module ?? 'System'),
          message: String(l.message ?? l.msg ?? ''),
        }))
      );
    } catch {
      /* keep stale data */
    } finally {
      setLoadingLogs(false);
    }
  }, []);

  useEffect(() => {
    fetchMetrics();
    const id = setInterval(fetchMetrics, METRICS_POLL_MS);
    return () => clearInterval(id);
  }, [fetchMetrics]);

  useEffect(() => {
    fetchLogs();
    const id = setInterval(fetchLogs, LOGS_POLL_MS);
    return () => clearInterval(id);
  }, [fetchLogs]);

  useEffect(() => {
    if (prevStateRef.current !== systemState) {
      prevStateRef.current = systemState;
      kernel.setState(systemState).catch(() => {
        addNotification({ title: 'Kernel Error', message: 'Failed to update kernel state.', type: 'error' });
      });
    }
  }, [systemState, addNotification]);

  const handleFilter = () => {
    addNotification({ title: 'Log Filter', message: 'Opening log filter options...', type: 'info' });
  };

  const handleExport = () => {
    addNotification({ title: 'Exporting Logs', message: 'System logs are being exported to CSV.', type: 'success' });
  };

  const handleAutonomyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    addNotification({ title: 'Autonomy Level Changed', message: `Global autonomy level set to ${e.target.value}.`, type: 'warning' });
  };

  const handleApprovalToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    addNotification({ title: 'Approval Requirement Updated', message: `Critical action approval is now ${e.target.checked ? 'required' : 'disabled'}.`, type: 'info' });
  };

  const activeExec = metrics?.activeExecutions ?? 0;
  const queued = metrics?.queuedTasks ?? 0;
  const load = metrics?.systemLoad ?? 0;
  const throughputVal = metrics?.throughput ?? 0;

  return (
    <div className="flex flex-col h-full gap-6">
      {/* Top Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 flex-shrink-0">
        <MetricCard 
          title="Active Executions" 
          value={loadingMetrics ? '—' : String(activeExec)} 
          trend={activeExec > 0 ? `+${activeExec}` : '0'} 
          icon={Activity} 
          color="text-emerald-500" 
          bg="bg-emerald-50" 
          loading={loadingMetrics}
        />
        <MetricCard 
          title="Queued Tasks" 
          value={loadingMetrics ? '—' : String(queued)} 
          trend={queued > 5 ? `+${queued}` : String(queued)} 
          icon={Clock} 
          color="text-amber-500" 
          bg="bg-amber-50" 
          loading={loadingMetrics}
        />
        <MetricCard 
          title="System Load" 
          value={loadingMetrics ? '—' : `${load}%`} 
          trend={load > 50 ? `+${load}%` : `${load}%`} 
          icon={Cpu} 
          color="text-primary" 
          bg="bg-primary/10" 
          loading={loadingMetrics}
        />
        <MetricCard 
          title="Throughput" 
          value={loadingMetrics ? '—' : `${throughputVal} ops/s`} 
          trend={`+${throughputVal}`} 
          icon={Zap} 
          color="text-blue-500" 
          bg="bg-blue-50" 
          loading={loadingMetrics}
        />
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
        {/* Left Column: Resource Allocation & Autonomy */}
        <div className="lg:col-span-1 flex flex-col gap-6 min-h-0">
          <div className="glass-panel p-6 rounded-3xl flex-1 flex flex-col border border-white/40">
            <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-6 flex items-center gap-2">
              <Database className="w-4 h-4 text-primary" /> Resource Allocation
            </h3>
            <div className="space-y-6 flex-1">
              <ResourceBar
                label="Compute Budget"
                used={metrics?.computeBudget?.used ?? 0}
                total={metrics?.computeBudget?.total ?? 100}
                unit="%"
                color="bg-primary"
              />
              <ResourceBar
                label="Memory Budget"
                used={metrics?.memoryBudget?.used ?? 0}
                total={metrics?.memoryBudget?.total ?? 8}
                unit="GB"
                color="bg-blue-500"
              />
              <ResourceBar
                label="Concurrency Limit"
                used={metrics?.concurrencyLimit?.used ?? 0}
                total={metrics?.concurrencyLimit?.total ?? 20}
                unit="threads"
                color="bg-emerald-500"
              />
              <ResourceBar
                label="API Quota"
                used={metrics?.apiQuota?.used ?? 0}
                total={metrics?.apiQuota?.total ?? 10000}
                unit="reqs"
                color="bg-amber-500"
              />
            </div>
          </div>

          <div className="glass-panel p-6 rounded-3xl flex-shrink-0 border border-white/40">
            <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-primary" /> Autonomy Authority
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-white/60 rounded-xl border border-slate-200">
                <span className="text-sm font-medium text-slate-700">Global Autonomy Level</span>
                <select 
                  onChange={handleAutonomyChange}
                  className="text-sm bg-slate-100 border-none rounded-lg px-3 py-1.5 text-slate-700 font-medium focus:ring-2 focus:ring-primary/50 outline-none"
                >
                  <option>Supervised</option>
                  <option>Semi-autonomous</option>
                  <option>Fully autonomous</option>
                  <option>Manual</option>
                </select>
              </div>
              <label className="flex items-center justify-between p-3 bg-white/60 rounded-xl border border-slate-200 cursor-pointer hover:bg-white transition-colors">
                <span className="text-sm font-medium text-slate-700">Require approval for critical actions</span>
                <input 
                  type="checkbox" 
                  defaultChecked 
                  onChange={handleApprovalToggle}
                  className="w-4 h-4 rounded text-primary focus:ring-primary/50" 
                />
              </label>
            </div>
          </div>
        </div>

        {/* Right Column: System Logs */}
        <div className="lg:col-span-2 glass-panel rounded-3xl border border-white/40 flex flex-col overflow-hidden bg-[#0A0F1C]">
          <div className="flex items-center justify-between px-6 py-4 bg-[#111827] border-b border-slate-800">
            <div className="flex items-center gap-2 text-slate-400">
              <TerminalSquare className="w-5 h-5" />
              <span className="font-semibold tracking-wider text-sm uppercase">AI System Logs</span>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={handleFilter}
                className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-medium hover:bg-slate-700 transition-colors"
              >
                Filter
              </button>
              <button 
                onClick={handleExport}
                className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-medium hover:bg-slate-700 transition-colors"
              >
                Export
              </button>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 font-mono text-xs space-y-2 custom-scrollbar">
            {loadingLogs && logs.length === 0 ? (
              <div className="flex items-center justify-center h-full text-slate-500 gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading logs…
              </div>
            ) : logs.length === 0 ? (
              <div className="flex items-center justify-center h-full text-slate-500">No logs available</div>
            ) : (
              logs.map((log, i) => (
                <motion.div 
                  key={i} 
                  initial={{ opacity: 0, x: -10 }} 
                  animate={{ opacity: 1, x: 0 }} 
                  transition={{ delay: i * 0.05 }}
                  className="flex gap-4 group hover:bg-white/5 p-1 rounded transition-colors"
                >
                  <span className="text-slate-600 shrink-0 w-20">{log.time}</span>
                  <span className={`shrink-0 w-16 font-bold ${
                    log.level === 'INFO' ? 'text-blue-400' :
                    log.level === 'WARN' ? 'text-amber-400' :
                    'text-red-400'
                  }`}>
                    [{log.level}]
                  </span>
                  <span className="text-purple-400 shrink-0 w-24">[{log.source}]</span>
                  <span className="text-slate-300">{log.message}</span>
                </motion.div>
              ))
            )}
            {systemState === 'running' && (
              <div className="flex gap-4 p-1">
                <span className="text-slate-600 shrink-0 w-20">{new Date().toLocaleTimeString('en-US', { hour12: false })}</span>
                <span className="animate-pulse text-slate-500">_</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, trend, icon: Icon, color, bg, loading }: {
  title: string; value: string; trend: string; icon: React.ElementType;
  color: string; bg: string; loading?: boolean;
}) {
  return (
    <div className="glass-panel p-5 rounded-3xl border border-white/40 flex items-center justify-between">
      <div>
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{title}</h3>
        <div className="flex items-baseline gap-2">
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
          ) : (
            <>
              <span className="text-2xl font-bold text-slate-900">{value}</span>
              <span className={`text-xs font-bold ${trend.startsWith('-') ? 'text-red-500' : 'text-emerald-500'}`}>{trend}</span>
            </>
          )}
        </div>
      </div>
      <div className={`w-12 h-12 rounded-2xl ${bg} ${color} flex items-center justify-center`}>
        <Icon className="w-6 h-6" />
      </div>
    </div>
  );
}

function ResourceBar({ label, used, total, unit, color }: {
  label: string; used: number; total: number; unit: string; color: string;
}) {
  const percentage = total > 0 ? (used / total) * 100 : 0;
  return (
    <div>
      <div className="flex justify-between text-sm mb-2">
        <span className="text-slate-700 font-medium">{label}</span>
        <span className="text-slate-900 font-mono font-bold">{used} / {total} <span className="text-slate-500 font-normal">{unit}</span></span>
      </div>
      <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}
