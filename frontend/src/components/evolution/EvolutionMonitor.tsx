import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useStore } from '@/store/useStore';
import { evolution, versions } from '@/lib/api';
import {
  Dna,
  Lightbulb,
  Check,
  X,
  GitMerge,
  Activity,
  BrainCircuit,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Bot,
  Wrench,
  Loader2,
} from 'lucide-react';

export function EvolutionMonitor() {
  const [activeTab, setActiveTab] = useState<'suggestions' | 'training' | 'history'>('suggestions');
  const [suggestionCount, setSuggestionCount] = useState<number | null>(null);

  return (
    <div className="flex h-full gap-6">
      {/* Sidebar Navigation */}
      <div className="w-64 flex-shrink-0 flex flex-col gap-4">
        <div className="glass-panel p-4 rounded-3xl border border-white/40">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 px-2">Evolution Hub</h3>
          <div className="space-y-1">
            <button
              onClick={() => setActiveTab('suggestions')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${activeTab === 'suggestions' ? 'bg-primary/10 text-primary-dark' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <span className="flex items-center gap-3"><Lightbulb className="w-4 h-4" /> Suggestions</span>
              {suggestionCount !== null && suggestionCount > 0 && (
                <span className="bg-primary text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{suggestionCount}</span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('training')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${activeTab === 'training' ? 'bg-primary/10 text-primary-dark' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <BrainCircuit className="w-4 h-4" /> Training Feedback
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${activeTab === 'history' ? 'bg-primary/10 text-primary-dark' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <GitMerge className="w-4 h-4" /> Version History
            </button>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-3xl border border-white/40 flex-1 flex flex-col">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 px-2">System Health</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-slate-600 font-medium">Evolution Rate</span>
                <span className="text-emerald-600 font-bold">+12%</span>
              </div>
              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 w-[65%]" />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-slate-600 font-medium">Optimization Score</span>
                <span className="text-primary-dark font-bold">94/100</span>
              </div>
              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-primary w-[94%]" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 glass-panel rounded-3xl border border-white/40 overflow-hidden flex flex-col relative">
        <AnimatePresence mode="wait">
          {activeTab === 'suggestions' && <SuggestionsView key="suggestions" onCountChange={setSuggestionCount} />}
          {activeTab === 'training' && <TrainingView key="training" />}
          {activeTab === 'history' && <HistoryView key="history" />}
        </AnimatePresence>
      </div>
    </div>
  );
}

interface Suggestion {
  id: number;
  type: string;
  target: string;
  title: string;
  description: string;
  impact: string;
}

function SuggestionsView({ onCountChange }: { onCountChange: (n: number) => void }) {
  const { addNotification } = useStore();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState<Set<number>>(new Set());

  const fetchSuggestions = useCallback(async () => {
    try {
      setLoading(true);
      const data = await evolution.getSuggestions();
      setSuggestions(data);
      onCountChange(data.length);
    } catch {
      setSuggestions([]);
      onCountChange(0);
    } finally {
      setLoading(false);
    }
  }, [onCountChange]);

  useEffect(() => {
    fetchSuggestions();
  }, [fetchSuggestions]);

  const handleApprove = async (s: Suggestion) => {
    try {
      await evolution.createFeedback({ entityType: s.type, entityId: String(s.id), thumbsUp: true });
      addNotification({ title: 'Suggestion Approved', message: `Applying changes for: ${s.title}`, type: 'success' });
      setDismissed(prev => new Set(prev).add(s.id));
    } catch (err) {
      addNotification({ title: 'Feedback Failed', message: String(err), type: 'error' });
    }
  };

  const handleReject = async (s: Suggestion) => {
    try {
      await evolution.createFeedback({ entityType: s.type, entityId: String(s.id), thumbsUp: false });
      addNotification({ title: 'Suggestion Rejected', message: `Dismissed suggestion: ${s.title}`, type: 'info' });
      setDismissed(prev => new Set(prev).add(s.id));
    } catch (err) {
      addNotification({ title: 'Feedback Failed', message: String(err), type: 'error' });
    }
  };

  const visible = suggestions.filter(s => !dismissed.has(s.id));

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col h-full p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Lightbulb className="w-6 h-6 text-amber-500" /> Autonomous Improvement Suggestions
        </h2>
        <span className="px-3 py-1 bg-amber-100 text-amber-700 text-xs font-bold uppercase tracking-wider rounded-full">
          {visible.length} Pending
        </span>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      ) : visible.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
          <Lightbulb className="w-12 h-12 mb-3 opacity-20" />
          <p className="text-sm">No pending suggestions.</p>
        </div>
      ) : (
        <div className="space-y-4 overflow-y-auto custom-scrollbar pr-2">
          {visible.map(s => (
            <div key={s.id} className="p-5 bg-white/60 border border-slate-200 rounded-2xl hover:border-primary/30 transition-all group">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    s.type === 'agent' ? 'bg-primary/10 text-primary-dark' :
                    s.type === 'tool' ? 'bg-blue-50 text-blue-600' :
                    'bg-purple-50 text-purple-600'
                  }`}>
                    {s.type === 'agent' ? <Bot className="w-5 h-5" /> : s.type === 'tool' ? <Wrench className="w-5 h-5" /> : <Activity className="w-5 h-5" />}
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">{s.title}</h3>
                    <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">Target: {s.target}</p>
                  </div>
                </div>
                <span className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${
                  s.impact === 'High' ? 'bg-red-50 text-red-600' :
                  s.impact === 'Medium' ? 'bg-amber-50 text-amber-600' :
                  'bg-emerald-50 text-emerald-600'
                }`}>
                  {s.impact} Impact
                </span>
              </div>
              <p className="text-sm text-slate-600 mb-4">{s.description}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => handleApprove(s)}
                  className="flex-1 py-2 rounded-xl bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 shadow-md shadow-slate-900/10"
                >
                  <Check className="w-4 h-4" /> Approve & Apply
                </button>
                <button
                  onClick={() => handleReject(s)}
                  className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors flex items-center justify-center gap-2 shadow-sm"
                >
                  <X className="w-4 h-4" /> Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

function TrainingView() {
  const { addNotification } = useStore();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIdx, setCurrentIdx] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data = await evolution.getSuggestions();
        setSuggestions(data);
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const current = suggestions[currentIdx] ?? null;

  const handleFeedback = async (thumbsUp: boolean) => {
    if (!current) return;
    try {
      await evolution.createFeedback({ entityType: current.type, entityId: String(current.id), thumbsUp });
      addNotification({
        title: 'Feedback Submitted',
        message: `Thank you. Your ${thumbsUp ? 'positive' : 'negative'} feedback has been recorded.`,
        type: 'success',
      });
      setCurrentIdx(i => i + 1);
    } catch (err) {
      addNotification({ title: 'Feedback Failed', message: String(err), type: 'error' });
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col h-full p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <BrainCircuit className="w-6 h-6 text-primary" /> Agent Training Interface
        </h2>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
        {loading ? (
          <Loader2 className="w-8 h-8 animate-spin" />
        ) : !current ? (
          <>
            <MessageSquare className="w-12 h-12 mb-4 opacity-20" />
            <p className="text-lg font-medium text-slate-600 mb-2">All Caught Up</p>
            <p className="text-sm max-w-md text-center">No more items to review. Check back later for new agent decisions.</p>
          </>
        ) : (
          <>
            <MessageSquare className="w-12 h-12 mb-4 opacity-20" />
            <p className="text-lg font-medium text-slate-600 mb-2">Awaiting Feedback</p>
            <p className="text-sm max-w-md text-center">Review recent agent decisions and provide positive or negative reinforcement to guide future behavior.</p>

            <div className="mt-8 p-6 bg-white border border-slate-200 rounded-2xl shadow-sm max-w-lg w-full">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Decision ({currentIdx + 1}/{suggestions.length})</span>
                <span className="text-xs text-slate-400 capitalize">{current.type} · {current.target}</span>
              </div>
              <p className="text-sm text-slate-900 font-medium mb-2">{current.title}</p>
              <p className="text-sm text-slate-600 mb-4">{current.description}</p>
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => handleFeedback(true)}
                  className="flex-1 py-2 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors flex items-center justify-center gap-2 font-medium text-sm"
                >
                  <ThumbsUp className="w-4 h-4" /> Good Choice
                </button>
                <button
                  onClick={() => handleFeedback(false)}
                  className="flex-1 py-2 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 transition-colors flex items-center justify-center gap-2 font-medium text-sm"
                >
                  <ThumbsDown className="w-4 h-4" /> Needs Correction
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
}

interface VersionEntry {
  id: string;
  version?: string | number;
  label?: string;
  entityType?: string;
  entityId?: string;
  date?: string;
  createdAt?: string;
  author?: string;
  changes?: string;
  changeSummary?: string;
}

function HistoryView() {
  const [history, setHistory] = useState<VersionEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        let data: VersionEntry[];
        try {
          data = (await versions.getHistory(20)) as unknown as VersionEntry[];
        } catch {
          data = (await evolution.getVersions()) as unknown as VersionEntry[];
        }
        setHistory(data);
      } catch {
        setHistory([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const versionLabel = (v: VersionEntry) =>
    v.version ? (typeof v.version === 'number' ? `v${v.version}` : v.version) : v.label ?? v.id;

  const dateLabel = (v: VersionEntry) => {
    const raw = v.date ?? v.createdAt;
    if (!raw) return '';
    try { return new Date(raw).toLocaleString(); } catch { return raw; }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col h-full p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <GitMerge className="w-6 h-6 text-primary" /> Version History
        </h2>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      ) : history.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
          <GitMerge className="w-12 h-12 mb-3 opacity-20" />
          <p className="text-sm">No version history available.</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto custom-scrollbar relative pl-4">
          <div className="absolute left-[23px] top-4 bottom-4 w-0.5 bg-slate-200" />

          <div className="space-y-6 relative">
            {history.map((v, i) => (
              <div key={v.id ?? i} className="flex gap-4 relative">
                <div className="relative z-10 flex flex-col items-center mt-1">
                  <div className="w-4 h-4 rounded-full bg-primary border-4 border-white shadow-sm" />
                </div>
                <div className="flex-1 p-4 bg-white/60 border border-slate-200 rounded-2xl hover:border-primary/30 transition-all">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-bold text-slate-900">{versionLabel(v)}</h4>
                    <span className="text-xs text-slate-500">{dateLabel(v)}</span>
                  </div>
                  {v.author && <p className="text-xs font-medium text-primary-dark mb-2">By {v.author}</p>}
                  {v.entityType && <p className="text-xs font-medium text-primary-dark mb-2">{v.entityType}{v.entityId ? ` / ${v.entityId}` : ''}</p>}
                  <p className="text-sm text-slate-600">{v.changes ?? v.changeSummary ?? '—'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
