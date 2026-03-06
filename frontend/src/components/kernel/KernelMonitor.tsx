import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useStore } from '@/store/useStore';
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
  Zap
} from 'lucide-react';

export function KernelMonitor({ systemState }: { systemState: 'running' | 'paused' | 'stopped' }) {
  const { addNotification } = useStore();
  const [logs] = useState([
    { time: '10:00:01', level: 'INFO', source: 'Kernel', message: 'System initialized. 3 agents loaded.' },
    { time: '10:00:05', level: 'INFO', source: 'Scheduler', message: 'Assigned task [T-492] to Alpha-7.' },
    { time: '10:01:12', level: 'WARN', source: 'ResourceMgr', message: 'Memory usage approaching 80% threshold.' },
    { time: '10:02:45', level: 'INFO', source: 'Network', message: 'Inter-agent channel established: Alpha-7 <-> Beta-2.' },
    { time: '10:05:30', level: 'ERROR', source: 'ToolRegistry', message: 'API timeout on Vector DB Query.' },
    { time: '10:05:32', level: 'INFO', source: 'Kernel', message: 'Auto-recovering task [T-492]. Retrying...' },
  ]);

  const handleFilter = () => {
    addNotification({
      title: "Log Filter",
      message: "Opening log filter options...",
      type: "info"
    });
  };

  const handleExport = () => {
    addNotification({
      title: "Exporting Logs",
      message: "System logs are being exported to CSV.",
      type: "success"
    });
  };

  const handleAutonomyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    addNotification({
      title: "Autonomy Level Changed",
      message: `Global autonomy level set to ${e.target.value}.`,
      type: "warning"
    });
  };

  const handleApprovalToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    addNotification({
      title: "Approval Requirement Updated",
      message: `Critical action approval is now ${e.target.checked ? 'required' : 'disabled'}.`,
      type: "info"
    });
  };

  return (
    <div className="flex flex-col h-full gap-6">
      {/* Top Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 flex-shrink-0">
        <MetricCard 
          title="Active Executions" 
          value="12" 
          trend="+2" 
          icon={Activity} 
          color="text-emerald-500" 
          bg="bg-emerald-50" 
        />
        <MetricCard 
          title="Queued Tasks" 
          value="45" 
          trend="-5" 
          icon={Clock} 
          color="text-amber-500" 
          bg="bg-amber-50" 
        />
        <MetricCard 
          title="System Load" 
          value="78%" 
          trend="+12%" 
          icon={Cpu} 
          color="text-primary" 
          bg="bg-primary/10" 
        />
        <MetricCard 
          title="Throughput" 
          value="240 ops/s" 
          trend="+15" 
          icon={Zap} 
          color="text-blue-500" 
          bg="bg-blue-50" 
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
              <ResourceBar label="Compute Budget" used={78} total={100} unit="%" color="bg-primary" />
              <ResourceBar label="Memory Budget" used={4.2} total={8.0} unit="GB" color="bg-blue-500" />
              <ResourceBar label="Concurrency Limit" used={12} total={20} unit="threads" color="bg-emerald-500" />
              <ResourceBar label="API Quota" used={8500} total={10000} unit="reqs" color="bg-amber-500" />
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
            {logs.map((log, i) => (
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
            ))}
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

function MetricCard({ title, value, trend, icon: Icon, color, bg }: any) {
  return (
    <div className="glass-panel p-5 rounded-3xl border border-white/40 flex items-center justify-between">
      <div>
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{title}</h3>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-slate-900">{value}</span>
          <span className={`text-xs font-bold ${trend.startsWith('+') ? 'text-emerald-500' : 'text-red-500'}`}>{trend}</span>
        </div>
      </div>
      <div className={`w-12 h-12 rounded-2xl ${bg} ${color} flex items-center justify-center`}>
        <Icon className="w-6 h-6" />
      </div>
    </div>
  );
}

function ResourceBar({ label, used, total, unit, color }: any) {
  const percentage = (used / total) * 100;
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
