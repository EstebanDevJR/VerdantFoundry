import { PageWrapper } from "@/components/layout/PageWrapper";
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useStore } from "@/store/useStore";
import { 
  Cpu, 
  Activity, 
  HardDrive, 
  Network, 
  TerminalSquare,
  ShieldAlert,
  Power,
  Pause,
  Play,
  RotateCcw
} from "lucide-react";
import { ProcessManager } from "@/components/kernel/ProcessManager";
import { FileSystem } from "@/components/kernel/FileSystem";
import { NetworkGraph } from "@/components/kernel/NetworkGraph";
import { KernelMonitor } from "@/components/kernel/KernelMonitor";

type Tab = 'processes' | 'filesystem' | 'network' | 'monitor';

export default function Kernel() {
  const { addNotification } = useStore();
  const [activeTab, setActiveTab] = useState<Tab>('monitor');
  const [systemState, setSystemState] = useState<'running' | 'paused' | 'stopped'>('running');

  const handleStateChange = (newState: 'running' | 'paused' | 'stopped') => {
    setSystemState(newState);
    addNotification({
      title: `System ${newState.charAt(0).toUpperCase() + newState.slice(1)}`,
      message: `Kernel state changed to ${newState}.`,
      type: newState === 'running' ? 'success' : newState === 'paused' ? 'warning' : 'error'
    });
  };

  const handleRestart = () => {
    addNotification({
      title: "System Restarting",
      message: "Initiating kernel restart sequence...",
      type: "info"
    });
    setSystemState('stopped');
    setTimeout(() => handleStateChange('running'), 2000);
  };

  const tabs = [
    { id: 'monitor', label: 'Kernel Monitor', icon: Activity },
    { id: 'processes', label: 'Process Manager', icon: Cpu },
    { id: 'network', label: 'Agent Network', icon: Network },
    { id: 'filesystem', label: 'File System', icon: HardDrive },
  ] as const;

  return (
    <PageWrapper className="max-w-7xl mx-auto h-[calc(100vh-140px)] flex flex-col">
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-2 flex items-center gap-3">
            <Cpu className="w-8 h-8 text-primary" />
            AI-OS Kernel
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
              systemState === 'running' ? 'bg-emerald-100 text-emerald-700' :
              systemState === 'paused' ? 'bg-amber-100 text-amber-700' :
              'bg-red-100 text-red-700'
            }`}>
              {systemState === 'running' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />}
              {systemState}
            </span>
          </h1>
          <p className="text-slate-500">
            System-level orchestration, resource allocation, and process management.
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex bg-white/50 border border-slate-200 rounded-xl p-1 shadow-sm">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab.id 
                    ? 'bg-white text-primary-dark shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span className="hidden md:inline">{tab.label}</span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl shadow-lg">
            <button 
              onClick={() => handleStateChange('running')}
              className={`p-2 rounded-lg transition-colors ${systemState === 'running' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
              title="Start System"
            >
              <Play className="w-4 h-4 fill-current" />
            </button>
            <button 
              onClick={() => handleStateChange('paused')}
              className={`p-2 rounded-lg transition-colors ${systemState === 'paused' ? 'bg-amber-500/20 text-amber-400' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
              title="Pause System"
            >
              <Pause className="w-4 h-4 fill-current" />
            </button>
            <button 
              onClick={() => handleStateChange('stopped')}
              className={`p-2 rounded-lg transition-colors ${systemState === 'stopped' ? 'bg-red-500/20 text-red-400' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
              title="Stop System"
            >
              <Power className="w-4 h-4" />
            </button>
            <div className="w-px h-4 bg-slate-700 mx-1" />
            <button 
              onClick={handleRestart}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors" 
              title="Restart System"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 relative">
        <AnimatePresence mode="wait">
          {activeTab === 'monitor' && (
            <motion.div key="monitor" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="h-full">
              <KernelMonitor systemState={systemState} />
            </motion.div>
          )}
          {activeTab === 'processes' && (
            <motion.div key="processes" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="h-full">
              <ProcessManager />
            </motion.div>
          )}
          {activeTab === 'network' && (
            <motion.div key="network" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="h-full">
              <NetworkGraph />
            </motion.div>
          )}
          {activeTab === 'filesystem' && (
            <motion.div key="filesystem" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="h-full">
              <FileSystem />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageWrapper>
  );
}
