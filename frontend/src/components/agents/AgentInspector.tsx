import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Activity, Cpu, Database, Network, Bug, Play, Pause, Square, RefreshCw } from 'lucide-react';
import { useStore } from '@/store/useStore';

interface AgentInspectorProps {
  agent: any;
  onClose: () => void;
}

export function AgentInspector({ agent, onClose }: AgentInspectorProps) {
  const { addNotification } = useStore();
  const [activeTab, setActiveTab] = useState<'state' | 'decisions' | 'debug'>('state');
  const [isDebugRunning, setIsDebugRunning] = useState(false);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);

  const runDebugStep = () => {
    setIsDebugRunning(true);
    setDebugLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] DEBUG: Inspecting memory state...`]);
    setTimeout(() => {
      setDebugLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] DEBUG: Memory state OK. 1.2M vectors.`]);
      setIsDebugRunning(false);
    }, 800);
  };

  const pauseDebug = () => {
    setIsDebugRunning(false);
    addNotification({
      title: "Debug Paused",
      message: "Agent execution paused for inspection.",
      type: "warning"
    });
  };

  const stopDebug = () => {
    setIsDebugRunning(false);
    setDebugLogs([]);
    addNotification({
      title: "Debug Stopped",
      message: "Agent execution stopped and logs cleared.",
      type: "info"
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 300 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 300 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-y-0 right-0 z-50 w-[500px] bg-white/90 backdrop-blur-xl border-l border-white/40 shadow-2xl flex flex-col"
    >
      <div className="p-6 border-b border-slate-200/60 flex items-center justify-between bg-white/40">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary text-primary-dark flex items-center justify-center shadow-md shadow-primary/20">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900">{agent.name}</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{agent.role}</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex border-b border-slate-200/60 px-6 pt-4 gap-6 bg-white/20">
        <button 
          onClick={() => setActiveTab('state')}
          className={`pb-3 text-xs font-bold uppercase tracking-widest transition-all border-b-2 ${activeTab === 'state' ? 'border-primary text-primary-dark' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
        >
          System State
        </button>
        <button 
          onClick={() => setActiveTab('decisions')}
          className={`pb-3 text-xs font-bold uppercase tracking-widest transition-all border-b-2 ${activeTab === 'decisions' ? 'border-primary text-primary-dark' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
        >
          Decision Log
        </button>
        <button 
          onClick={() => setActiveTab('debug')}
          className={`pb-3 text-xs font-bold uppercase tracking-widest transition-all border-b-2 ${activeTab === 'debug' ? 'border-amber-500 text-amber-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
        >
          Debug Mode
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-slate-50/30">
        <AnimatePresence mode="wait">
          {activeTab === 'state' && (
            <motion.div key="state" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-2xl p-4 border border-slate-200/60 shadow-sm">
                  <div className="text-[10px] text-slate-400 mb-1.5 font-bold uppercase tracking-widest">Status</div>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full shadow-sm ${agent.status === 'Active' ? 'bg-emerald-500 animate-pulse shadow-emerald-500/20' : agent.status === 'Error' ? 'bg-red-500 shadow-red-500/20' : 'bg-blue-500 shadow-blue-500/20'}`} />
                    <span className="font-bold text-slate-900 text-lg">{agent.status}</span>
                  </div>
                </div>
                <div className="bg-white rounded-2xl p-4 border border-slate-200/60 shadow-sm">
                  <div className="text-[10px] text-slate-400 mb-1.5 font-bold uppercase tracking-widest">Uptime</div>
                  <div className="font-mono font-bold text-slate-900 text-lg">{agent.uptime}</div>
                </div>
                <div className="bg-white rounded-2xl p-4 border border-slate-200/60 shadow-sm">
                  <div className="text-[10px] text-slate-400 mb-1.5 font-bold uppercase tracking-widest">Tasks Completed</div>
                  <div className="font-mono font-bold text-slate-900 text-lg">{agent.tasks}</div>
                </div>
                <div className="bg-white rounded-2xl p-4 border border-slate-200/60 shadow-sm">
                  <div className="text-[10px] text-slate-400 mb-1.5 font-bold uppercase tracking-widest">Cognitive Load</div>
                  <div className="font-mono font-bold text-slate-900 text-lg">42%</div>
                </div>
              </div>

              <div>
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Active Connections</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 bg-white border border-slate-200/60 rounded-2xl shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                        <Database className="w-4 h-4 text-slate-500" />
                      </div>
                      <span className="text-sm font-bold text-slate-700">Vector Store</span>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-500 bg-emerald-50 px-2 py-1 rounded-md">Connected</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-white border border-slate-200/60 rounded-2xl shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                        <Network className="w-4 h-4 text-slate-500" />
                      </div>
                      <span className="text-sm font-bold text-slate-700">Tool Registry</span>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-500 bg-emerald-50 px-2 py-1 rounded-md">Connected</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'decisions' && (
            <motion.div key="decisions" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
              {[
                { id: 1, time: '10:42:15 AM', action: 'Tool Selected', detail: 'Web Search API chosen due to lack of internal data on "Q3 Market Trends".', confidence: '98%' },
                { id: 2, time: '10:42:12 AM', action: 'Query Parsed', detail: 'Extracted entities: [Q3, Market Trends, Renewable Energy].', confidence: '99%' },
                { id: 3, time: '10:41:50 AM', action: 'Task Accepted', detail: 'Assigned priority HIGH based on user context.', confidence: '100%' },
              ].map(decision => (
                <div key={decision.id} className="p-5 bg-white border border-slate-200/60 rounded-2xl shadow-sm relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-primary/30 group-hover:bg-primary transition-colors" />
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">{decision.time}</span>
                    <span className="text-[10px] font-bold text-primary-dark bg-primary/10 px-2.5 py-1 rounded-md uppercase tracking-widest">Conf: {decision.confidence}</span>
                  </div>
                  <h4 className="font-bold text-slate-900 mb-1.5">{decision.action}</h4>
                  <p className="text-sm text-slate-600 font-medium leading-relaxed">{decision.detail}</p>
                </div>
              ))}
            </motion.div>
          )}

          {activeTab === 'debug' && (
            <motion.div key="debug" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="h-full flex flex-col">
              <div className="flex gap-2 mb-4">
                <button onClick={runDebugStep} disabled={isDebugRunning} className="flex-1 py-2 bg-amber-100 text-amber-700 hover:bg-amber-200 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50">
                  {isDebugRunning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Bug className="w-4 h-4" />}
                  Step Execution
                </button>
                <button 
                  onClick={pauseDebug}
                  className="p-2 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
                >
                  <Pause className="w-4 h-4" />
                </button>
                <button 
                  onClick={stopDebug}
                  className="p-2 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
                >
                  <Square className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 bg-[#0A0F1C] rounded-2xl border border-slate-800 p-4 font-mono text-xs text-slate-300 overflow-y-auto custom-scrollbar space-y-2">
                <div className="text-amber-500 font-bold mb-4">=== DEBUG MODE ENGAGED ===</div>
                {debugLogs.map((log, i) => (
                  <div key={i} className="whitespace-pre-wrap">{log}</div>
                ))}
                {isDebugRunning && <div className="animate-pulse">_</div>}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
