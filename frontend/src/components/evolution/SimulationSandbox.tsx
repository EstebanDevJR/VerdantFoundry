import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useStore } from '@/store/useStore';
import { 
  TestTube2, 
  Play, 
  Pause, 
  Square, 
  RefreshCw, 
  Activity, 
  Cpu, 
  BrainCircuit, 
  TerminalSquare,
  ChevronRight,
  ListFilter,
  BarChart3
} from 'lucide-react';

export function SimulationSandbox() {
  const { addNotification } = useStore();
  const [activeSim, setActiveSim] = useState<string | null>(null);
  const [simStatus, setSimStatus] = useState<'idle' | 'running' | 'paused' | 'completed'>('idle');
  const [logs, setLogs] = useState<string[]>([]);
  
  const handleRun = () => {
    setSimStatus('running');
    setLogs(['> Initializing Sandbox Environment...', '> Loading Agent: Alpha-7...', '> Injecting Test Parameters...']);
    addNotification({
      title: "Simulation Started",
      message: "Running Market Analysis Edge Case simulation.",
      type: "info"
    });
    
    setTimeout(() => {
      setLogs(prev => [...prev, '> Simulating Decision Tree...', '> Exploring Branch A (Confidence: 85%)...']);
    }, 1000);

    setTimeout(() => {
      setLogs(prev => [...prev, '> Exploring Branch B (Confidence: 92%)...', '> Selected Branch B.']);
    }, 2500);

    setTimeout(() => {
      setLogs(prev => [...prev, '> Simulation Complete.', '> Performance Score: 94/100']);
      setSimStatus('completed');
      addNotification({
        title: "Simulation Complete",
        message: "Market Analysis Edge Case simulation finished successfully.",
        type: "success"
      });
    }, 4000);
  };

  const handleNewSimulation = () => {
    addNotification({
      title: "New Simulation",
      message: "Opening simulation configuration wizard...",
      type: "info"
    });
  };

  const handleFilter = () => {
    addNotification({
      title: "Filter Simulations",
      message: "Opening simulation filter options...",
      type: "info"
    });
  };

  const handleRefresh = () => {
    addNotification({
      title: "Refreshing Data",
      message: "Fetching latest simulation metrics...",
      type: "info"
    });
  };

  return (
    <div className="flex h-full gap-6">
      {/* Sidebar: Active Simulations */}
      <div className="w-72 flex-shrink-0 flex flex-col gap-4">
        <div className="glass-panel p-4 rounded-3xl border border-white/40 flex-1 flex flex-col">
          <div className="flex items-center justify-between mb-4 px-2">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4" /> Active Simulations
            </h3>
            <button 
              onClick={handleFilter}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors"
            >
              <ListFilter className="w-4 h-4" />
            </button>
          </div>
          
          <div className="space-y-2 overflow-y-auto custom-scrollbar pr-2">
            {[
              { id: 'sim-1', name: 'Market Analysis Edge Case', agent: 'Alpha-7', status: 'running', progress: 45 },
              { id: 'sim-2', name: 'Data Synthesis Stress Test', agent: 'Beta-2', status: 'completed', progress: 100 },
              { id: 'sim-3', name: 'Fact Checking Accuracy', agent: 'Gamma-1', status: 'paused', progress: 12 },
            ].map(sim => (
              <div 
                key={sim.id}
                onClick={() => setActiveSim(sim.id)}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${activeSim === sim.id ? 'bg-primary/5 border-primary/30 shadow-sm' : 'bg-white/60 border-slate-100 hover:bg-white hover:border-slate-200'}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold text-slate-900 truncate pr-2">{sim.name}</h4>
                  <div className={`w-2 h-2 rounded-full shrink-0 ${sim.status === 'running' ? 'bg-primary animate-pulse' : sim.status === 'completed' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                  <span>{sim.agent}</span>
                  <span className="font-mono">{sim.progress}%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full ${sim.status === 'completed' ? 'bg-emerald-500' : 'bg-primary'}`} style={{ width: `${sim.progress}%` }} />
                </div>
              </div>
            ))}
          </div>
          
          <button 
            onClick={handleNewSimulation}
            className="mt-4 w-full py-2.5 rounded-xl bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 transition-colors shadow-md shadow-slate-900/10 flex items-center justify-center gap-2"
          >
            <TestTube2 className="w-4 h-4" /> New Simulation
          </button>
        </div>
      </div>

      {/* Main Sandbox Area */}
      <div className="flex-1 glass-panel rounded-3xl border border-white/40 overflow-hidden flex flex-col relative">
        {activeSim ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col h-full">
            {/* Header Controls */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <TestTube2 className="w-5 h-5 text-primary" /> Market Analysis Edge Case
                </h2>
                <p className="text-sm text-slate-500 mt-1">Testing Alpha-7's response to contradictory data sources.</p>
              </div>
              <div className="flex items-center gap-2 bg-white p-1.5 rounded-xl border border-slate-200 shadow-sm">
                <button 
                  onClick={handleRun}
                  disabled={simStatus === 'running'}
                  className="p-2 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors disabled:opacity-50"
                >
                  <Play className="w-5 h-5 fill-current" />
                </button>
                <button 
                  onClick={() => setSimStatus('paused')}
                  disabled={simStatus !== 'running'}
                  className="p-2 rounded-lg text-amber-600 hover:bg-amber-50 transition-colors disabled:opacity-50"
                >
                  <Pause className="w-5 h-5 fill-current" />
                </button>
                <button 
                  onClick={() => { setSimStatus('idle'); setLogs([]); }}
                  disabled={simStatus === 'idle'}
                  className="p-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                >
                  <Square className="w-5 h-5 fill-current" />
                </button>
                <div className="w-px h-6 bg-slate-200 mx-1" />
                <button 
                  onClick={handleRefresh}
                  className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
                >
                  <RefreshCw className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 flex min-h-0">
              {/* Left: Metrics & Parameters */}
              <div className="w-1/3 border-r border-slate-100 p-6 overflow-y-auto custom-scrollbar bg-white/30 space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <BrainCircuit className="w-4 h-4" /> Test Parameters
                  </h3>
                  <div className="space-y-3">
                    <div className="p-3 bg-white border border-slate-100 rounded-xl">
                      <div className="text-xs text-slate-500 mb-1">Input Query</div>
                      <div className="text-sm font-medium text-slate-900">"Analyze Q3 market adoption given conflicting reports from Source A and Source B."</div>
                    </div>
                    <div className="p-3 bg-white border border-slate-100 rounded-xl">
                      <div className="text-xs text-slate-500 mb-1">Expected Outcome</div>
                      <div className="text-sm font-medium text-slate-900">Agent should identify conflict, weight sources by authority, and synthesize a nuanced conclusion.</div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" /> Live Metrics
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-white border border-slate-100 rounded-xl">
                      <div className="text-xs text-slate-500 mb-1">Decisions Made</div>
                      <div className="text-lg font-bold text-slate-900">14</div>
                    </div>
                    <div className="p-3 bg-white border border-slate-100 rounded-xl">
                      <div className="text-xs text-slate-500 mb-1">Tools Called</div>
                      <div className="text-lg font-bold text-slate-900">3</div>
                    </div>
                    <div className="p-3 bg-white border border-slate-100 rounded-xl">
                      <div className="text-xs text-slate-500 mb-1">Avg Confidence</div>
                      <div className="text-lg font-bold text-emerald-600">89%</div>
                    </div>
                    <div className="p-3 bg-white border border-slate-100 rounded-xl">
                      <div className="text-xs text-slate-500 mb-1">Execution Time</div>
                      <div className="text-lg font-bold text-slate-900">2.4s</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Terminal & Output */}
              <div className="flex-1 flex flex-col bg-[#0A0F1C]">
                <div className="px-4 py-3 border-b border-slate-800 bg-[#111827] flex items-center gap-2 text-slate-400">
                  <TerminalSquare className="w-4 h-4" />
                  <span className="text-xs font-semibold uppercase tracking-wider">Simulation Console</span>
                  {simStatus === 'running' && (
                    <span className="ml-auto flex items-center gap-1.5 text-[10px] uppercase font-bold text-primary tracking-wider">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" /> Running
                    </span>
                  )}
                </div>
                <div className="flex-1 p-4 overflow-y-auto custom-scrollbar font-mono text-xs space-y-2 text-slate-300">
                  {logs.length === 0 ? (
                    <div className="text-slate-600 italic">Sandbox ready. Click Play to start simulation.</div>
                  ) : (
                    <AnimatePresence>
                      {logs.map((log, i) => (
                        <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className={log.includes('Complete') ? 'text-emerald-400 font-bold mt-4' : ''}>
                          {log}
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  )}
                  {simStatus === 'running' && <div className="animate-pulse text-slate-500">_</div>}
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-400">
            <TestTube2 className="w-16 h-16 mb-4 opacity-20" />
            <p className="text-lg font-medium text-slate-600 mb-2">Simulation Sandbox</p>
            <p className="text-sm max-w-md text-center">Select an active simulation from the sidebar or create a new one to test agent behavior in a controlled environment.</p>
          </div>
        )}
      </div>
    </div>
  );
}
