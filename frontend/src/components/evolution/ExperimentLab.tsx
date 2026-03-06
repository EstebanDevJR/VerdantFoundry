import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useStore } from '@/store/useStore';
import { 
  Microscope, 
  BarChart3, 
  LineChart, 
  PieChart, 
  Activity, 
  Play, 
  Plus, 
  Settings2,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';

export function ExperimentLab() {
  const { addNotification } = useStore();
  const [activeExperiment, setActiveExperiment] = useState<string | null>(null);

  const handleNewExperiment = () => {
    addNotification({
      title: "New Experiment",
      message: "Opening experiment configuration wizard...",
      type: "info"
    });
  };

  const handleRunTrial = () => {
    addNotification({
      title: "Trial Started",
      message: "Running A/B Test: Search Depth trial...",
      type: "info"
    });
  };

  const handleConfigure = () => {
    addNotification({
      title: "Configure Experiment",
      message: "Opening experiment settings...",
      type: "info"
    });
  };

  const handleApplyConfig = () => {
    addNotification({
      title: "Configuration Applied",
      message: "v2.4 configuration applied successfully.",
      type: "success"
    });
  };

  return (
    <div className="flex h-full gap-6">
      {/* Sidebar Navigation */}
      <div className="w-72 flex-shrink-0 flex flex-col gap-4">
        <div className="glass-panel p-4 rounded-3xl border border-white/40 flex-1 flex flex-col">
          <div className="flex items-center justify-between mb-4 px-2">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
              <Microscope className="w-4 h-4" /> Lab Experiments
            </h3>
            <button 
              onClick={handleNewExperiment}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          
          <div className="space-y-2 overflow-y-auto custom-scrollbar pr-2">
            {[
              { id: 'exp-1', name: 'A/B Test: Search Depth', status: 'running', participants: 'Alpha-7 v2.4 vs v2.3' },
              { id: 'exp-2', name: 'Tool Efficacy: Vector DB', status: 'completed', participants: 'Beta-2 w/ vs w/o DB' },
              { id: 'exp-3', name: 'Reasoning Style Comparison', status: 'draft', participants: 'Gamma-1 (Chain vs Tree)' },
            ].map(exp => (
              <div 
                key={exp.id}
                onClick={() => setActiveExperiment(exp.id)}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${activeExperiment === exp.id ? 'bg-primary/5 border-primary/30 shadow-sm' : 'bg-white/60 border-slate-100 hover:bg-white hover:border-slate-200'}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold text-slate-900 truncate pr-2">{exp.name}</h4>
                  <div className={`w-2 h-2 rounded-full shrink-0 ${exp.status === 'running' ? 'bg-primary animate-pulse' : exp.status === 'completed' ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                </div>
                <p className="text-xs text-slate-500 truncate">{exp.participants}</p>
              </div>
            ))}
          </div>
          
          <button 
            onClick={handleNewExperiment}
            className="mt-4 w-full py-2.5 rounded-xl bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 transition-colors shadow-md shadow-slate-900/10 flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" /> New Experiment
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 glass-panel rounded-3xl border border-white/40 overflow-hidden flex flex-col relative">
        {activeExperiment ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col h-full">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Microscope className="w-5 h-5 text-primary" /> A/B Test: Search Depth
                </h2>
                <p className="text-sm text-slate-500 mt-1">Comparing Alpha-7 v2.4 (Depth 3) vs v2.3 (Depth 5) on latency and accuracy.</p>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={handleConfigure}
                  className="px-4 py-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors text-sm font-medium flex items-center gap-2 shadow-sm"
                >
                  <Settings2 className="w-4 h-4" /> Configure
                </button>
                <button 
                  onClick={handleRunTrial}
                  className="px-4 py-2 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors text-sm font-medium flex items-center gap-2 shadow-sm"
                >
                  <Play className="w-4 h-4" /> Run Trial
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-6">
              {/* Performance Comparison Graphs (Mocked with CSS) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm">
                  <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-primary" /> Latency Comparison (ms)
                  </h3>
                  <div className="flex items-end gap-8 h-48 mt-4">
                    <div className="flex-1 flex flex-col items-center gap-2">
                      <div className="w-full bg-slate-100 rounded-t-xl relative group">
                        <div className="absolute bottom-0 w-full bg-blue-400 rounded-t-xl transition-all duration-500" style={{ height: '80%' }} />
                        <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-bold text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity">1240ms</span>
                      </div>
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">v2.3 (Depth 5)</span>
                    </div>
                    <div className="flex-1 flex flex-col items-center gap-2">
                      <div className="w-full bg-slate-100 rounded-t-xl relative group">
                        <div className="absolute bottom-0 w-full bg-emerald-400 rounded-t-xl transition-all duration-500" style={{ height: '45%' }} />
                        <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-bold text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity">680ms</span>
                      </div>
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">v2.4 (Depth 3)</span>
                    </div>
                  </div>
                </div>

                <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm">
                  <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <LineChart className="w-4 h-4 text-primary" /> Accuracy Score (%)
                  </h3>
                  <div className="flex items-end gap-8 h-48 mt-4">
                    <div className="flex-1 flex flex-col items-center gap-2">
                      <div className="w-full bg-slate-100 rounded-t-xl relative group">
                        <div className="absolute bottom-0 w-full bg-blue-400 rounded-t-xl transition-all duration-500" style={{ height: '92%' }} />
                        <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-bold text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity">92%</span>
                      </div>
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">v2.3 (Depth 5)</span>
                    </div>
                    <div className="flex-1 flex flex-col items-center gap-2">
                      <div className="w-full bg-slate-100 rounded-t-xl relative group">
                        <div className="absolute bottom-0 w-full bg-emerald-400 rounded-t-xl transition-all duration-500" style={{ height: '89%' }} />
                        <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-bold text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity">89%</span>
                      </div>
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">v2.4 (Depth 3)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Experiment Results Summary */}
              <div className="p-6 bg-primary/5 border border-primary/20 rounded-2xl">
                <h3 className="text-lg font-bold text-primary-dark mb-2 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" /> Preliminary Conclusion
                </h3>
                <p className="text-sm text-slate-700 mb-4">
                  Reducing search depth from 5 to 3 resulted in a <strong className="text-emerald-600">45% decrease in latency</strong> (1240ms → 680ms) with only a marginal <strong className="text-red-500">3% drop in accuracy</strong> (92% → 89%). This tradeoff is highly favorable for real-time synthesis tasks.
                </p>
                <button 
                  onClick={handleApplyConfig}
                  className="px-4 py-2 rounded-xl bg-primary text-white font-medium hover:bg-primary-dark transition-colors text-sm flex items-center gap-2 shadow-md shadow-primary/20"
                >
                  Apply v2.4 Configuration <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-400">
            <Microscope className="w-16 h-16 mb-4 opacity-20" />
            <p className="text-lg font-medium text-slate-600 mb-2">Experimentation Lab</p>
            <p className="text-sm max-w-md text-center">Select an experiment from the sidebar or create a new one to run controlled A/B tests on agent configurations and tools.</p>
          </div>
        )}
      </div>
    </div>
  );
}
