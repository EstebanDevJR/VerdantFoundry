import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useStore } from '@/store/useStore';
import { evolution } from '@/lib/api';
import {
  Microscope,
  BarChart3,
  LineChart,
  Play,
  Plus,
  Settings2,
  CheckCircle2,
  ArrowRight,
  Loader2,
} from 'lucide-react';

interface Experiment {
  id: string;
  name: string;
  status: string;
  description?: string;
  configs?: object[];
  metricsJson?: Record<string, unknown> | string | null;
  conclusion?: string;
}

interface MetricPair {
  label: string;
  a: number;
  b: number;
}

function parseMetrics(exp: Experiment): MetricPair[] {
  let raw = exp.metricsJson;
  if (typeof raw === 'string') {
    try { raw = JSON.parse(raw); } catch { return []; }
  }
  if (!raw || typeof raw !== 'object') return [];
  const obj = raw as Record<string, unknown>;

  if (Array.isArray(obj.pairs)) return obj.pairs as MetricPair[];

  return Object.entries(obj).map(([key, val]) => {
    if (typeof val === 'object' && val && 'a' in val && 'b' in val) {
      const v = val as { a: number; b: number };
      return { label: key, a: v.a, b: v.b };
    }
    return { label: key, a: Number(val) || 0, b: 0 };
  });
}

export function ExperimentLab() {
  const { addNotification } = useStore();
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeExperiment, setActiveExperiment] = useState<string | null>(null);
  const [activeDetail, setActiveDetail] = useState<Experiment | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchExperiments = useCallback(async () => {
    try {
      setLoading(true);
      const data = (await evolution.getExperiments()) as Experiment[];
      setExperiments(data);
    } catch {
      setExperiments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchExperiments();
  }, [fetchExperiments]);

  useEffect(() => {
    if (!activeExperiment) { setActiveDetail(null); return; }
    let cancelled = false;
    (async () => {
      try {
        setDetailLoading(true);
        const detail = (await evolution.getExperiment(activeExperiment)) as Experiment;
        if (!cancelled) setActiveDetail(detail);
      } catch {
        if (!cancelled) setActiveDetail(null);
      } finally {
        if (!cancelled) setDetailLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [activeExperiment]);

  const handleNewExperiment = async () => {
    const name = prompt('Experiment name:');
    if (!name) return;
    try {
      await evolution.createExperiment({ name, configs: [] });
      addNotification({ title: 'Experiment Created', message: `"${name}" created.`, type: 'success' });
      await fetchExperiments();
    } catch (err) {
      addNotification({ title: 'Creation Failed', message: String(err), type: 'error' });
    }
  };

  const handleRunTrial = async () => {
    if (!activeExperiment) return;
    try {
      await evolution.runExperiment(activeExperiment);
      addNotification({ title: 'Trial Started', message: `Running trial for experiment.`, type: 'info' });
      const detail = (await evolution.getExperiment(activeExperiment)) as Experiment;
      setActiveDetail(detail);
      await fetchExperiments();
    } catch (err) {
      addNotification({ title: 'Run Failed', message: String(err), type: 'error' });
    }
  };

  const metrics = activeDetail ? parseMetrics(activeDetail) : [];
  const maxVal = Math.max(1, ...metrics.flatMap(m => [m.a, m.b]));

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
            {loading ? (
              <div className="flex items-center justify-center py-8 text-slate-400">
                <Loader2 className="w-5 h-5 animate-spin" />
              </div>
            ) : experiments.length === 0 ? (
              <div className="text-center py-8 text-sm text-slate-400">No experiments yet.</div>
            ) : (
              experiments.map(exp => (
                <div
                  key={exp.id}
                  onClick={() => setActiveExperiment(exp.id)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${activeExperiment === exp.id ? 'bg-primary/5 border-primary/30 shadow-sm' : 'bg-white/60 border-slate-100 hover:bg-white hover:border-slate-200'}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-semibold text-slate-900 truncate pr-2">{exp.name}</h4>
                    <div className={`w-2 h-2 rounded-full shrink-0 ${exp.status === 'running' ? 'bg-primary animate-pulse' : exp.status === 'completed' ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                  </div>
                  <p className="text-xs text-slate-500 truncate capitalize">{exp.status}</p>
                </div>
              ))
            )}
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
          detailLoading && !activeDetail ? (
            <div className="h-full flex items-center justify-center text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col h-full">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <Microscope className="w-5 h-5 text-primary" /> {activeDetail?.name ?? 'Experiment'}
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">
                    {activeDetail?.description ?? `Status: ${activeDetail?.status ?? '—'}`}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => addNotification({ title: 'Configure', message: 'Opening settings...', type: 'info' })}
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
                {/* Performance Comparison Graphs */}
                {metrics.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {metrics.map((m, idx) => (
                      <div key={idx} className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm">
                        <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                          {idx % 2 === 0 ? <BarChart3 className="w-4 h-4 text-primary" /> : <LineChart className="w-4 h-4 text-primary" />} {m.label}
                        </h3>
                        <div className="flex items-end gap-8 h-48 mt-4">
                          <div className="flex-1 flex flex-col items-center gap-2">
                            <div className="w-full bg-slate-100 rounded-t-xl relative group" style={{ height: '100%' }}>
                              <div className="absolute bottom-0 w-full bg-blue-400 rounded-t-xl transition-all duration-500" style={{ height: `${(m.a / maxVal) * 100}%` }} />
                              <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-bold text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity">{m.a}</span>
                            </div>
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Config A</span>
                          </div>
                          <div className="flex-1 flex flex-col items-center gap-2">
                            <div className="w-full bg-slate-100 rounded-t-xl relative group" style={{ height: '100%' }}>
                              <div className="absolute bottom-0 w-full bg-emerald-400 rounded-t-xl transition-all duration-500" style={{ height: `${(m.b / maxVal) * 100}%` }} />
                              <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-bold text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity">{m.b}</span>
                            </div>
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Config B</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col items-center justify-center h-64 text-slate-400">
                      <BarChart3 className="w-8 h-8 mb-2 opacity-30" />
                      <p className="text-sm">No metric data available yet. Run a trial to generate results.</p>
                    </div>
                    <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col items-center justify-center h-64 text-slate-400">
                      <LineChart className="w-8 h-8 mb-2 opacity-30" />
                      <p className="text-sm">Comparison charts will appear here after a trial.</p>
                    </div>
                  </div>
                )}

                {/* Experiment Results Summary */}
                {activeDetail?.conclusion ? (
                  <div className="p-6 bg-primary/5 border border-primary/20 rounded-2xl">
                    <h3 className="text-lg font-bold text-primary-dark mb-2 flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5" /> Conclusion
                    </h3>
                    <p className="text-sm text-slate-700 mb-4">{activeDetail.conclusion}</p>
                    <button
                      onClick={() => addNotification({ title: 'Applied', message: 'Configuration applied.', type: 'success' })}
                      className="px-4 py-2 rounded-xl bg-primary text-white font-medium hover:bg-primary-dark transition-colors text-sm flex items-center gap-2 shadow-md shadow-primary/20"
                    >
                      Apply Winning Config <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                ) : activeDetail?.status === 'completed' ? (
                  <div className="p-6 bg-primary/5 border border-primary/20 rounded-2xl">
                    <h3 className="text-lg font-bold text-primary-dark mb-2 flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5" /> Experiment Complete
                    </h3>
                    <p className="text-sm text-slate-700">Review the metrics above to compare configurations.</p>
                  </div>
                ) : null}
              </div>
            </motion.div>
          )
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
