import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useStore } from '@/store/useStore';
import { agents as agentsApi, tools as toolsApi } from '@/lib/api';
import {
  Bot,
  Wrench,
  Plus,
  Settings2,
  Save,
  History,
  ShieldAlert,
  BrainCircuit,
  GitBranch,
  CheckCircle2,
  ChevronRight,
  Loader2,
} from 'lucide-react';

interface Agent {
  id: string;
  name: string;
  role: string;
  status: string;
  tasks?: number;
  uptime?: string;
}

interface Tool {
  id: string;
  name: string;
  type: string;
  calls?: string;
  status?: string;
}

export function AgentStudio() {
  const [activeView, setActiveView] = useState<'agents' | 'tools' | 'create-agent' | 'create-tool'>('agents');

  return (
    <div className="flex h-full gap-6">
      {/* Sidebar Navigation */}
      <div className="w-64 flex-shrink-0 flex flex-col gap-4">
        <div className="glass-panel p-4 rounded-3xl border border-white/40">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 px-2">Studio Hub</h3>
          <div className="space-y-1">
            <button
              onClick={() => setActiveView('agents')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${activeView === 'agents' ? 'bg-primary/10 text-primary-dark' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <Bot className="w-4 h-4" /> Agent Engineering
            </button>
            <button
              onClick={() => setActiveView('tools')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${activeView === 'tools' ? 'bg-primary/10 text-primary-dark' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <Wrench className="w-4 h-4" /> Tool Development
            </button>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-3xl border border-white/40 flex-1 flex flex-col">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 px-2">Quick Actions</h3>
          <div className="space-y-2">
            <button
              onClick={() => setActiveView('create-agent')}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 transition-colors shadow-md shadow-slate-900/10"
            >
              <span className="flex items-center gap-2"><Plus className="w-4 h-4" /> New Agent</span>
            </button>
            <button
              onClick={() => setActiveView('create-tool')}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors shadow-sm"
            >
              <span className="flex items-center gap-2"><Plus className="w-4 h-4" /> New Tool</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 glass-panel rounded-3xl border border-white/40 overflow-hidden flex flex-col relative">
        <AnimatePresence mode="wait">
          {activeView === 'agents' && <AgentList key="agents" onEdit={() => setActiveView('create-agent')} />}
          {activeView === 'tools' && <ToolList key="tools" onEdit={() => setActiveView('create-tool')} />}
          {activeView === 'create-agent' && <AgentEditor key="create-agent" onCancel={() => setActiveView('agents')} />}
          {activeView === 'create-tool' && <ToolEditor key="create-tool" onCancel={() => setActiveView('tools')} />}
        </AnimatePresence>
      </div>
    </div>
  );
}

function AgentList({ onEdit }: { onEdit: () => void }) {
  const { addNotification } = useStore();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAgents = useCallback(async () => {
    try {
      setLoading(true);
      const data = await agentsApi.list();
      setAgents(data);
    } catch {
      setAgents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  const handleHistory = (agentName: string) => {
    addNotification({ title: 'Agent History', message: `Viewing version history for ${agentName}.`, type: 'info' });
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col h-full p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Bot className="w-6 h-6 text-primary" /> Agent Engineering
        </h2>
      </div>
      {loading ? (
        <div className="flex-1 flex items-center justify-center text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      ) : agents.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
          <Bot className="w-12 h-12 mb-3 opacity-20" />
          <p className="text-sm">No agents found. Create one to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {agents.map(agent => (
            <div key={agent.id} className="p-5 bg-white/60 border border-slate-200 rounded-2xl hover:border-primary/30 hover:shadow-md transition-all group">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary-dark">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 group-hover:text-primary-dark transition-colors">{agent.name}</h3>
                    <p className="text-xs text-slate-500">{agent.role}</p>
                  </div>
                </div>
                <span className="px-2 py-1 rounded-md bg-slate-100 text-slate-600 text-xs font-mono capitalize">{agent.status}</span>
              </div>
              <div className="flex gap-2">
                <button onClick={onEdit} className="flex-1 py-2 rounded-lg bg-slate-50 text-slate-600 text-sm font-medium hover:bg-slate-100 transition-colors flex items-center justify-center gap-2">
                  <Settings2 className="w-4 h-4" /> Edit Configuration
                </button>
                <button
                  onClick={() => handleHistory(agent.name)}
                  className="p-2 rounded-lg bg-slate-50 text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  <History className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

function ToolList({ onEdit }: { onEdit: () => void }) {
  const { addNotification } = useStore();
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTools = useCallback(async () => {
    try {
      setLoading(true);
      const data = await toolsApi.list();
      setTools(data);
    } catch {
      setTools([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTools();
  }, [fetchTools]);

  const handleHistory = (toolName: string) => {
    addNotification({ title: 'Tool History', message: `Viewing version history for ${toolName}.`, type: 'info' });
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col h-full p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Wrench className="w-6 h-6 text-primary" /> Tool Development
        </h2>
      </div>
      {loading ? (
        <div className="flex-1 flex items-center justify-center text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      ) : tools.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
          <Wrench className="w-12 h-12 mb-3 opacity-20" />
          <p className="text-sm">No tools found. Create one to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tools.map(tool => (
            <div key={tool.id} className="p-5 bg-white/60 border border-slate-200 rounded-2xl hover:border-primary/30 hover:shadow-md transition-all group">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                    <Wrench className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 group-hover:text-primary-dark transition-colors">{tool.name}</h3>
                    <p className="text-xs text-slate-500">{tool.type}</p>
                  </div>
                </div>
                <span className="px-2 py-1 rounded-md bg-slate-100 text-slate-600 text-xs font-mono capitalize">{tool.status ?? '—'}</span>
              </div>
              <div className="flex gap-2">
                <button onClick={onEdit} className="flex-1 py-2 rounded-lg bg-slate-50 text-slate-600 text-sm font-medium hover:bg-slate-100 transition-colors flex items-center justify-center gap-2">
                  <Settings2 className="w-4 h-4" /> Edit Code
                </button>
                <button
                  onClick={() => handleHistory(tool.name)}
                  className="p-2 rounded-lg bg-slate-50 text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  <History className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

function AgentEditor({ onCancel }: { onCancel: () => void }) {
  const { addNotification } = useStore();
  const [step, setStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [agentName, setAgentName] = useState('');
  const [agentRole, setAgentRole] = useState('');
  const [agentObjective, setAgentObjective] = useState('');
  const [availableTools, setAvailableTools] = useState<Tool[]>([]);
  const [selectedTools, setSelectedTools] = useState<Set<string>>(new Set());

  useEffect(() => {
    (async () => {
      try {
        const data = await toolsApi.list();
        setAvailableTools(data);
      } catch {
        setAvailableTools([]);
      }
    })();
  }, []);

  const toggleTool = (id: string) => {
    setSelectedTools(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleSave = async () => {
    if (!agentName.trim()) {
      addNotification({ title: 'Validation', message: 'Agent name is required.', type: 'warning' });
      return;
    }
    setIsSaving(true);
    try {
      await agentsApi.create({
        name: agentName.trim(),
        role: agentRole.trim() || 'General',
        objective: agentObjective.trim() || undefined,
      });
      addNotification({ title: 'Agent Saved', message: 'Agent configuration has been saved and deployed.', type: 'success' });
      onCancel();
    } catch (err) {
      addNotification({ title: 'Save Failed', message: String(err), type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} className="flex flex-col h-full">
      <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Agent Configuration Studio</h2>
          <p className="text-sm text-slate-500">Define capabilities, policies, and behavior.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={onCancel} className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors text-sm font-medium">Cancel</button>
          <button onClick={handleSave} disabled={isSaving} className="px-4 py-2 rounded-lg bg-primary text-primary-dark hover:bg-primary/90 transition-colors text-sm font-medium flex items-center gap-2 disabled:opacity-50">
            {isSaving ? <div className="w-4 h-4 border-2 border-primary-dark/30 border-t-primary-dark rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
            Save & Deploy
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar flex gap-8">
        <div className="w-64 flex-shrink-0 space-y-2">
          {[
            { id: 1, label: 'Identity & Role', icon: Bot },
            { id: 2, label: 'Capabilities & Tools', icon: Wrench },
            { id: 3, label: 'Decision Policies', icon: GitBranch },
            { id: 4, label: 'Reasoning Style', icon: BrainCircuit },
            { id: 5, label: 'Autonomy Level', icon: ShieldAlert },
          ].map(s => (
            <button
              key={s.id}
              onClick={() => setStep(s.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${step === s.id ? 'bg-white shadow-sm border border-slate-200 text-primary-dark' : 'text-slate-500 hover:bg-slate-50 border border-transparent'}`}
            >
              <s.icon className={`w-4 h-4 ${step === s.id ? 'text-primary' : 'text-slate-400'}`} />
              {s.label}
              {step > s.id && <CheckCircle2 className="w-4 h-4 ml-auto text-emerald-500" />}
            </button>
          ))}
        </div>

        <div className="flex-1 max-w-2xl bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
          {step === 1 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Identity & Role</h3>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Agent Name</label>
                <input
                  type="text"
                  value={agentName}
                  onChange={e => setAgentName(e.target.value)}
                  placeholder="e.g. Delta-X"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Primary Role</label>
                <input
                  type="text"
                  value={agentRole}
                  onChange={e => setAgentRole(e.target.value)}
                  placeholder="e.g. Data Synthesis"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Core Objective</label>
                <textarea
                  rows={4}
                  value={agentObjective}
                  onChange={e => setAgentObjective(e.target.value)}
                  placeholder="Describe the agent's primary objective..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-primary/50 outline-none transition-all resize-none"
                />
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Capabilities & Tools</h3>
              <div className="space-y-3">
                {availableTools.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-4">No tools available. Create tools first.</p>
                ) : (
                  availableTools.map(tool => (
                    <label key={tool.id} className="flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={selectedTools.has(tool.id)}
                          onChange={() => toggleTool(tool.id)}
                          className="w-4 h-4 rounded text-primary focus:ring-primary/50"
                        />
                        <span className="font-medium text-slate-700">{tool.name}</span>
                      </div>
                      <Wrench className="w-4 h-4 text-slate-400" />
                    </label>
                  ))
                )}
              </div>
            </motion.div>
          )}

          {step > 2 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex flex-col items-center justify-center text-slate-400">
              <Settings2 className="w-12 h-12 mb-4 opacity-20" />
              <p>Advanced configuration options available in production.</p>
            </motion.div>
          )}

          <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end">
            {step < 5 ? (
              <button onClick={() => setStep(s => s + 1)} className="px-6 py-2.5 rounded-xl bg-slate-900 text-white font-medium hover:bg-slate-800 transition-colors flex items-center gap-2">
                Next Step <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button onClick={handleSave} className="px-6 py-2.5 rounded-xl bg-primary text-primary-dark font-medium hover:bg-primary/90 transition-colors flex items-center gap-2">
                <Save className="w-4 h-4" /> Finish & Deploy
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function ToolEditor({ onCancel }: { onCancel: () => void }) {
  return (
    <div className="flex flex-col h-full items-center justify-center text-slate-400 p-6">
      <Wrench className="w-12 h-12 mb-4 opacity-20" />
      <h2 className="text-xl font-bold text-slate-900 mb-2">Tool Creation Studio</h2>
      <p className="text-center max-w-md mb-6">Write, test, and deploy custom tools directly from the frontend. This interfaces with the existing ToolEditor component.</p>
      <button onClick={onCancel} className="px-6 py-2.5 rounded-xl bg-slate-100 text-slate-600 font-medium hover:bg-slate-200 transition-colors">
        Go Back
      </button>
    </div>
  );
}
